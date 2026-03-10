resource "google_project_service" "secretmanager" {
  project = var.gcp-project
  service  = "secretmanager.googleapis.com"
}

resource "google_secret_manager_secret" "notifications-config" {
  secret_id = "notifications-config"
  replication {
    auto {}
  }

  depends_on = [google_project_service.secretmanager]
}

resource "google_secret_manager_secret_iam_member" "serviceAccount-close-billing-on-exceeded-quota" {
  secret_id = google_secret_manager_secret.notifications-config.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${var.gcp-project}@appspot.gserviceaccount.com"
}
