1. Create project for billing tools (or use existing one)
```
gcloud projects create PROJECT_ID
```

2. Use service account for authentication: https://cloud.google.com/sdk/docs/authorizing
```
 gcloud iam service-accounts create terraform-manager --project PROJECT_ID
```
Generate key for service account and save it to file
```
gcloud iam service-accounts keys create key.json --iam-account terraform-manager@PROJECT_ID.iam.gserviceaccount.com --project PROJECT_ID
```

