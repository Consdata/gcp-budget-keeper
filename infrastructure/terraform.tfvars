gcp-region = "europe-west3"
gcp-zone = "europe-west3-a"
gcp-location = "eu"
dir-build = "build"
budget-amount = "5"
budget-currency = "USD"
pubsub-budget-topic = "budget-keeper-budgets"
bucket-function-source-archives = "functions-source-archive"
gcp_service_list = [
  "cloudbilling.googleapis.com",
  "pubsub.googleapis.com",
  "iam.googleapis.com",
  "billingbudgets.googleapis.com",
  "eventarc.googleapis.com",
  "run.googleapis.com"
]
