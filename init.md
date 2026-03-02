1. Create project for billing tools (or use existing one)
```sh
export PROJECT_ID= # set your project id here
gcloud projects create ${PROJECT_ID}
```

2. Create billing account (via GUI console.google.com) and link it to project (or use existing one)

3. Export BILLING_ACCOUNT_ID
```sh
export BILLING_ACCOUNT_ID= # set your billing account id here
````

4. Enable Cloud Resource Manager API
```sh
gcloud services enable cloudresourcemanager.googleapis.com --project=${PROJECT_ID}
```

5. Use service account for authentication: https://cloud.google.com/sdk/docs/authorizing
```sh
gcloud iam service-accounts create terraform-manager --project ${PROJECT_ID}
```
Generate key for service account and save it to file
```sh
gcloud iam service-accounts keys create secrets/key.json --iam-account terraform-manager@${PROJECT_ID}.iam.gserviceaccount.com --project ${PROJECT_ID}
```

6. Create terraform bucket for state storage (assign billing account before)
```sh
gsutil mb -p ${PROJECT_ID} gs://${PROJECT_ID}-budget-keeper-infrastructure
```

7. Add permissions to service account for project and billing account:
```sh
gcloud storage buckets add-iam-policy-binding gs://${PROJECT_ID}-budget-keeper-infrastructure \
  --member="serviceAccount:terraform-manager@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/storage.objectAdmin"

gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:terraform-manager@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/serviceusage.serviceUsageAdmin"
  
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:terraform-manager@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/storage.admin"


gcloud beta billing accounts add-iam-policy-binding ${BILLING_ACCOUNT_ID} \
  --member="serviceAccount:terraform-manager@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/billing.user"
  
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:terraform-manager@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountAdmin"
  
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:terraform-manager@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/secretmanager.admin"
  
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:terraform-manager@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/pubsub.admin"
```

8. Init terraform with `terraform init` and provide created bucket name for `Google Cloud Storage bucket`
```sh
cd infrastructure
GOOGLE_APPLICATION_CREDENTIALS=../secrets/key.json terraform init \
-backend-config="bucket=${PROJECT_ID}-budget-keeper-infrastructure"
```

9. Create env tfvars based on env.tfvars.template

10. Run apply command with params 
```sh
GOOGLE_APPLICATION_CREDENTIALS=../secrets/key.json terraform apply --var-file ./env.tfvars
```


> ⚠️ **Warning:** When google apis first enabled it may take up to 10 min to propagate permissions.
