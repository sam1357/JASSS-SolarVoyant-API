terraform {
  backend "s3" {
    bucket = "seng3011-student"
    key    = "SE3011-24-F14A-03/state/collection-terraform.tfstate"
    region = "ap-southeast-2"
  }
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Configure the AWS Provider
provider "aws" {
  region = "ap-southeast-2"
}