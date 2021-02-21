resource "google_project_service" "secretmanager" {
  provider = google
  project = var.gcp-project
  service  = "secretmanager.googleapis.com"
}

resource "google_secret_manager_secret" "notifications-config" {
  provider = google-beta
  secret_id = "notifications-config"
  replication {
    automatic = true
  }

  depends_on = [google_project_service.secretmanager]
}

resource "google_secret_manager_secret_version" "notifications-config-version" {
  provider = google-beta
  secret      = google_secret_manager_secret.notifications-config.id
  secret_data = "{\"endpoints\":[{\"type\": \"telegram\", \"chatId\": \"1\"},{\"type\": \"slack\", \"channelId\": \"2\"},{\"type\": \"email\", \"from\": \"from@example.com\", \"recipient\": \"recipient@example.com\", \"subject\": \"Alert\", \"smtpConfig\": {\"host\": \"smtp.example.com\",\"port\": 587,\"secure\": false, \"auth\": {\"user\": \"example\", \"pass\": \"example\"},\"debug\": false,\"logger\": false}}]}"
}

resource "google_secret_manager_secret_iam_member" "serviceAccount-close-billing-on-exceeded-quota" {
  provider = google-beta
  secret_id = google_secret_manager_secret.notifications-config.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${var.gcp-project}@appspot.gserviceaccount.com"
}