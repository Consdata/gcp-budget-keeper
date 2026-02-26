resource "google_pubsub_topic" "budget-pubsub" {
  provider = google
  depends_on = [google_project_service.gcp_services]

  name = var.pubsub-budget-topic
}
