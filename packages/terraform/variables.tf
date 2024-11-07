locals {
  environment = {
    "BUCKET" : var.bucket
    "BASE_S3_PATH" : var.base_s3_path
    "S3_ENDPOINT" : var.s3_endpoint
    "API_BASE_URL" : "https://customer-api.open-meteo.com/v1/forecast"
    "API_KEY": var.api_key
    "GOOGLE_API_KEY": var.google_key
    "STAGING_ENV": terraform.workspace
    "TZ": "Australia/Sydney"
  }
}

variable "region" {
  default = "ap-southeast-2"
}

variable "bucket" {
  type    = string
  default = "seng3011-student"
}

variable "base_s3_path" {
  type    = string
  default = "SE3011-24-F14A-03/"
}

variable "global_name" {
  type    = string
  default = "SE3011-24-F14A-03"
}

variable "api_key" {
  type        = string
  sensitive   = true
}

variable "google_key" {
  type        = string
  sensitive   = true
}

# for ecs container
variable "aws_access_key_id" {
  type        = string
  sensitive   = true
}

# for ecs container
variable "aws_secret_access_key" {
  type        = string
  sensitive   = true
}

variable "mail_username" {
  default = "solarvoyant@gmail.com"
}

variable "mail_password" {
  type        = string
  sensitive   = true
}

variable "environment" {
  description = "Environment (dev, staging or prod)"
  default     = "dev"
}

variable "s3_endpoint" {
  default = "https://s3.ap-southeast-2.amazonaws.com/"
}

variable "testing_ecr_script" {
  default = "push_image.sh"
}