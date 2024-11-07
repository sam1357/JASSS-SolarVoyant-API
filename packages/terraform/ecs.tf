# check if ecr repo exists
data "external" "check_repo" {
  program = ["/usr/bin/bash", "${path.module}/check-ecr.sh", "jasss_${terraform.workspace}_testing_microservice", var.region]
}

# create ecr repo if not exist
resource "aws_ecr_repository" "jasss_testing_ecr" {
  count    = data.external.check_repo.result.success == "true" ? 0 : 1
  name     = "jasss_${terraform.workspace}_testing_microservice"
}

data "aws_ecr_repository" "existing_jasss_testing_ecr" {
  count = data.external.check_repo.result.success == "false" ? 0 : 1
  name  = "jasss_${terraform.workspace}_testing_microservice"
}

locals {
  ecr_repo = data.external.check_repo.result.success == "false" ? aws_ecr_repository.jasss_testing_ecr[0] : data.aws_ecr_repository.existing_jasss_testing_ecr[0]
}

resource "aws_ecs_task_definition" "jasss_testing_task" {
  family                   = "jasss_testing_microservice"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu       = 1024
  memory    = 3072

  provisioner "local-exec" {
    command     = "bash ${var.testing_ecr_script} ${local.ecr_repo.repository_url} ${terraform.workspace}"
    working_dir = "${path.module}/../testing"
  }

  execution_role_arn = "arn:aws:iam::381491885579:role/ecsTaskExecutionRole"
  
  lifecycle {
    create_before_destroy = true
  }
  
  container_definitions = jsonencode([
    {
      name      = "jasss_testing_microservice_container"
      image     = "${local.ecr_repo.repository_url}"
      cpu       = 1024,
      memory    = 3072
      portMappings = [
        {
          containerPort = 8080
          hostPort      = 8080
        }
      ],
      environment = [
        {
          "name": "BASE_API_URL",
          "value": "${aws_apigatewayv2_api.main_api.api_endpoint}"
        },
        {
          "name": "BUCKET",
          "value": "${var.bucket}"
        },
        {
          "name": "S3_ENDPOINT",
          "value": "${var.s3_endpoint}"
        },
        {
          "name": "STAGING_ENV",
          "value": "${terraform.workspace}"
        },
        {
          "name": "AWS_ACCESS_KEY_ID",
          "value": "${var.aws_access_key_id}"
        },
        {
          "name": "AWS_SECRET_ACCESS_KEY",
          "value": "${var.aws_secret_access_key}"
        },
      ],
      logConfiguration = {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/aws/ecs/jasss_${terraform.workspace}_testing_ec2_logs",
          "awslogs-region": "ap-southeast-2",
          "awslogs-stream-prefix": "jasss_testing"
        }
      }
    }
  ])
} 

resource "aws_ecs_cluster" "jasss_testing_ecs" {
  name = "jasss_testing_microservice"
} 

resource "aws_ecs_service" "jasss_testing_service" {
  name            = "jasss_testing_microservice_service"
  cluster         = "${aws_ecs_cluster.jasss_testing_ecs.id}"
  task_definition = "${aws_ecs_task_definition.jasss_testing_task.arn}"
  desired_count   = 1
  launch_type     = "FARGATE"

  enable_ecs_managed_tags = true  # It will tag the network interface with service name
  wait_for_steady_state   = true  # Terraform will wait for the service to reach a steady state 

  network_configuration {
    subnets         = ["subnet-0162e9ca045234d15", "subnet-0d4c66d8d3680353d", "subnet-0279c4cee6fc8fc21"]
    security_groups = ["sg-0cd9b33f1803e4c07"]
    assign_public_ip = true
  }
}

data "aws_network_interface" "interface_tags" {
  depends_on = [aws_ecs_service.jasss_testing_service]
  filter {
    name   = "group-id"
    values = ["sg-0cd9b33f1803e4c07"]
  }
}