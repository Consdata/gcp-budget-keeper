const {CloudBillingClient} = require('@google-cloud/billing');

const billingClient = new CloudBillingClient();
const TelegramBot = require('node-telegram-bot-api');

const nodemailer = require('nodemailer');

const {WebClient} = require('@slack/web-api');
const {SecretManagerServiceClient} = require('@google-cloud/secret-manager');

console.log(`Starting closeBillingOnExceededQuota`);

exports.closeBillingOnExceededQuota = async ev => {
    console.log('Received Pub/Sub notification:', JSON.stringify(ev));
    const eventData = JSON.parse(Buffer.from(ev.data, 'base64').toString());
    const {billingAccountId} = ev.attributes;
    const billingConfig = JSON.parse(process.env.CONFIG_JSON)[billingAccountId];
    if (billingConfig) {
        console.log(`Pub/Sub notification data: ${JSON.stringify(eventData)}`);
        const budgetUtilizationRatio = eventData.costAmount / eventData.budgetAmount;
        if (billingConfig.cutOff && budgetUtilizationRatio >= (billingConfig.cutOff.threshold || 0.8)) {
            await onCutOffThresholdExceeded(billingConfig, billingAccountId, eventData);
        } else if (billingConfig.notifications && budgetUtilizationRatio >= (billingConfig.notifications.threshold || 0.5)) {
            await onNotifyThresholdExceeded(billingConfig, eventData);
        }
    } else {
        console.log(`Unknown billing account id ${billingAccountId}`);
    }
};

async function onNotifyThresholdExceeded(config, {
    budgetDisplayName,
    costAmount,
    budgetAmount,
    currencyCode
}) {
    console.log(`Notify threshold exceeded [budgetDisplayName=${budgetDisplayName}, costAmount=${costAmount}, budgetAmount=${budgetAmount}${currencyCode}]`);
    if (config.notifications?.configSecretManagerPath) {
        let [notificationsConfig] = await new SecretManagerServiceClient().accessSecretVersion({name: config.notifications.configSecretManagerPath})
        let notifications = JSON.parse(notificationsConfig.payload.data.toString())
        await sendNotifications(
            notifications.endpoints,
            `Budget ${budgetDisplayName} exceeded warning threshold (${createThresholdExceededMessage(costAmount, budgetAmount, currencyCode)})`
        );
    }
}

async function onCutOffThresholdExceeded(config, billingAccountId, {
    budgetDisplayName,
    costAmount,
    budgetAmount,
    currencyCode
}) {
    console.log(`Cut off threshold exceeded [budgetDisplayName=${budgetDisplayName}, costAmount=${costAmount}, budgetAmount=${budgetAmount}${currencyCode}]`);

    const projects = await listProjectBillingInfo(`billingAccounts/${billingAccountId}`);
    const projectsString = projects.map(project => `(${project.projectId}:billing:${project.billingEnabled})    `).join(', ');
    console.log(`found projects for billing account: ${projectsString}`);

    if (config.notifications?.configSecretManagerPath) {
        const disableForProjects = projects
            .filter(project => config.cutOff.all || config.cutOff.projects.includes(project.projectId))
            .map(project => project.projectId)
            .join(',');
        const message =
            `Budget ${budgetDisplayName} exceeded emergency cut off threshold (${createThresholdExceededMessage(costAmount, budgetAmount, currencyCode)})\n`
            + `Disabling billing for projects: ${disableForProjects}!`
        let [notificationsConfig] = await new SecretManagerServiceClient().accessSecretVersion({name: config.notifications.configSecretManagerPath})
        let notifications = JSON.parse(notificationsConfig.payload.data.toString())
        await sendNotifications(
            notifications.endpoints,
            message
        );
    }

    await Promise.all(
        projects
            .filter(project => project.billingEnabled)
            .filter(project => config.cutOff.all || config.cutOff.projects.includes(project.projectId))
            .map(async project => {
                console.log(`disabling billing for project: ${project.projectId}`);
                return await billingClient.updateProjectBillingInfo({
                    name: `projects/${project.projectId}`,
                    projectBillingInfo: null
                });
            })
    );
}

async function sendNotifications(endpoints, message) {
    await Promise.all(endpoints.map(async endpoint => {
        if (endpoint.type === 'telegram') {
            console.log(`Sending notification via ${endpoint.type} [chatId=${endpoint.chatId}]: ${message}`);
            await new TelegramBot(endpoint.botToken).sendMessage(
                endpoint.chatId,
                message
            );
        } else if (endpoint.type === 'slack') {
            console.log(`Sending notification via ${endpoint.type} [channelId=${endpoint.channelId}]: ${message}`);
            await new WebClient(endpoint.botToken).chat.postMessage(
                {channel: endpoint.channelId, text: message}
            );
        } else if (endpoint.type === 'email') {
            console.log(`Sending notification via ${endpoint.type} [recipients=${endpoint.recipients}]: ${message}`);
            let transporter = nodemailer.createTransport(endpoint.smtpConfig);
            await transporter.sendMail({
                from: `Cloud Alert ${endpoint.from}`,
                to: endpoint.recipients,
                subject: endpoint.subject,
                text: message
            });

        }
    }));
}

async function listProjectBillingInfo(name) {
    const result = [];
    const billingInfoResult = await billingClient.listProjectBillingInfo({
        name
    });
    billingInfoResult
        .filter(billing => Array.isArray(billing))
        .forEach(projects => result.push(...projects))
    return result;
}

function createThresholdExceededMessage(costAmount, budgetAmount, currencyCode) {
    return `${((costAmount / budgetAmount) * 100).toFixed(2)}% - ${costAmount}/${budgetAmount}${currencyCode}`;
}