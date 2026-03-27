# GCP Budget Keeper 🪓

A Terraform-based automated solution to prevent cloud overspending. This project implements a "kill switch" mechanism that monitors your Google Cloud Platform (GCP) budgets and automatically severs billing when defined thresholds are exceeded.

## Overview

The **GCP Budget Keeper** works by integrating Cloud Budgets, Pub/Sub, and Cloud Functions. When a budget alert is triggered, the system executes a pre-defined strategy to stop the "bleeding" of costs.

### Key Features
* **Real-time Monitoring:** Reacts instantly to budget notifications.
* **Automated Enforcement:** Disables billing to stop resource consumption.
* **Terraform Managed:** Fully automated infrastructure as code (IaC) deployment.
* **Granular Control:** Configure different thresholds for notifications and final "axe" execution.

## Project Structure

* `./infrastructure`: Contains all `.tf` files to deploy the infrastructure.
* `./function-close-billing-on-exceeded-quota`: Source code for the Cloud Function (the "Axe").
* `init.md`: **Crucial setup and deployment instructions.**

### ⚠️ Important
Before you begin, please refer to the deployment documentation:

👉 **[Read the Initialization Guide (init.md)](./init.md)**

## Prerequisites
* Google Cloud Project with Billing Account access.
* Terraform (v1.0.0+) installed locally.