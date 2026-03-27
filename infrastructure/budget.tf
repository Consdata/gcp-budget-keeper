data "google_billing_account" "account" {
  depends_on = [google_project_service.gcp_services]

  billing_account = var.billing-account
}

resource "google_billing_budget" "budget" {
  depends_on = [google_project_service.gcp_services]

  billing_account = data.google_billing_account.account.id
  display_name = "Budget Keeper Budget"

  budget_filter {
    credit_types_treatment = "EXCLUDE_ALL_CREDITS"
  }

  amount {
    specified_amount {
      currency_code = var.budget-currency
      units = var.budget-amount
    }
  }

  all_updates_rule {
    pubsub_topic = google_pubsub_topic.budget-pubsub.id
  }

}
