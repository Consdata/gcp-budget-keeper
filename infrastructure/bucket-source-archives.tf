resource "google_storage_bucket" "functions-source-archive" {
  name = "${var.gcp-project}-${var.bucket-function-source-archives}"
  location = var.gcp-location
  force_destroy = true
  lifecycle_rule {
    condition {
      age = 3
    }
    action {
      type = "Delete"
    }
  }
}
