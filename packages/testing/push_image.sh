#!/bin/bash

repository_url=$1
staging_env=$2

# Build the Docker image locally
docker build -t jasss_"$staging_env"_testing_microservice .

# Authenticate Docker to ECR registry
aws ecr get-login-password --region ap-southeast-2 | docker login --username AWS --password-stdin $repository_url

# Tag the Docker image
docker tag jasss_"$staging_env"_testing_microservice $repository_url

# Push the Docker image to ECR
docker push $repository_url