resource "aws_iam_policy" "data_collection_s3_permission" {
  name = "${var.global_name}_${terraform.workspace}_data_collection_s3_permission"

  policy = jsonencode(
    {
      "Version" : "2012-10-17",
      "Statement" : [
        {
          "Effect" : "Allow",
          "Action" : "s3:Get*",
          "Resource" : "*"
        }
      ]
  })
}

