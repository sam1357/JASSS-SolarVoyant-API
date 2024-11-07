# # To ensure access for ecs service with more secure vpc create a aws sercurity group service.
# # also used for isolating each ecs container to allow for fetching of ip address
# resource "aws_security_group" "jasss_testing_ecs_security_group" {
#   name        = "jasss_${terraform.workspace}_testing_ecr_security_group"
#   description = "security group for jasss ecr testing microservice"
#   vpc_id      = data.aws_vpc.default_vpc.id

#   ingress {
#     from_port   = 8080
#     to_port     = 8080
#     protocol    = "tcp"
#     cidr_blocks = ["0.0.0.0/0"]
#   }

#   egress {
#     from_port        = 0
#     to_port          = 0
#     protocol         = "-1"
#     cidr_blocks      = ["0.0.0.0/0"]
#     ipv6_cidr_blocks = ["::/0"]
#   }  
# }

# # retrieve default vpc
# data "aws_vpc" "default_vpc" {
#   id = "vpc-048160e5c4f538967" 
# }