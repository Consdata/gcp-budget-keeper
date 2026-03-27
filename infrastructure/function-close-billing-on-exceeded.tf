data "archive_file" "close-billing-on-exceeded-quota" {
  type = "zip"
  source_dir = "../function-close-billing-on-exceeded-quota"
  output_path = "${var.dir-build}/close-billing-on-exceeded-quota.zip"
  excludes = [
    "node_modules"
  ]
}

resource "google_storage_bucket_object" "close-billing-on-exceeded-quota" {
  depends_on = [google_project_service.gcp_services]

  name = format("%s.%s.zip", "close-billing-on-exceeded-quota", data.archive_file.close-billing-on-exceeded-quota.output_md5)
  bucket = google_storage_bucket.functions-source-archive.name
  source = "${var.dir-build}/close-billing-on-exceeded-quota.zip"
}

resource "google_cloudfunctions2_function" "close-billing-on-exceeded-quota" {
  depends_on = [google_project_service.gcp_services]

  name = "close-billing-on-exceeded-quota"
  location = var.gcp-region
  project = var.gcp-project

  build_config {
    runtime = "nodejs22"
    entry_point = "closeBillingOnExceededQuota"
    source {
      storage_source {
        bucket = google_storage_bucket.functions-source-archive.name
        object = google_storage_bucket_object.close-billing-on-exceeded-quota.name
      }
    }
  }

  service_config {
    max_instance_count = 1
    available_memory = "256Mi"
    timeout_seconds = 60
    service_account_email = google_service_account.function-service-account.email

    environment_variables = {
      CONFIG_JSON = jsonencode(var.function-close-billing-on-exceeded-quota-config-json)
    }
  }

  event_trigger {
    trigger_region = var.gcp-region
    event_type = "google.cloud.pubsub.topic.v1.messagePublished"
    pubsub_topic = google_pubsub_topic.budget-pubsub.id
    retry_policy = "RETRY_POLICY_RETRY"
  }

}