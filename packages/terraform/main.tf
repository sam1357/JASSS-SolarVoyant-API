// ------------------------------------- ARCHIVES ----------------------------------
data "archive_file" "data_collection" {
  type        = "zip"
  output_path = "${path.module}/../data-collection/dist/data_collection.zip"
  source_dir  = "${path.module}/../data-collection/dist/"     
}

data "archive_file" "suburb_finder" {
  type        = "zip"
  output_path = "${path.module}/../suburb-finder/dist/suburb_finder.zip"
  source_dir  = "${path.module}/../suburb-finder/dist/"     
}

data "archive_file" "calculator" {
  type        = "zip"
  output_path = "${path.module}/../calculator/dist/calculator.zip"
  source_dir  = "${path.module}/../calculator/dist/"     
}

data "archive_file" "user_data" {
  type        = "zip"
  output_path = "${path.module}/../user-data/dist/user_data.zip"
  source_dir  = "${path.module}/../user-data/dist/"     
}

data "archive_file" "data_preprocessing" {
  type        = "zip"
  output_path = "${path.module}/../data-preprocessing/dist/data_preprocessing.zip"
  source_dir  = "${path.module}/../data-preprocessing/dist/"     
}

data "archive_file" "notification" {
  type        = "zip"
  output_path = "${path.module}/../notification/dist/notification.zip"
  source_dir  = "${path.module}/../notification/dist/"     
}

data "archive_file" "data_retrieval" {
  type        = "zip"
  output_path = "${path.module}/../data-retrieval/dist/data_retrieval.zip"
  source_dir  = "${path.module}/../data-retrieval/dist/"     
}

data "archive_file" "data_analytics" {
  type        = "zip"
  output_path = "${path.module}/../data-analytics/dist/data_analytics.zip"
  source_dir  = "${path.module}/../data-analytics/dist/"     
}

data "archive_file" "append_history" {
  type        = "zip"
  output_path = "${path.module}/../append-history/dist/append-history.zip"
  source_dir  = "${path.module}/../append-history/dist/"     
}

data "archive_file" "data_fetch_historical" {
  type        = "zip"
  output_path = "${path.module}/../data-fetch-historical/dist/data-fetch-historical.zip"
  source_dir  = "${path.module}/../data-fetch-historical/dist/"     
}

// --------------------------------- LAMBDA FUNCTIONS ----------------------------------
resource "aws_lambda_function" "data_collection" {
  filename      = data.archive_file.data_collection.output_path
  function_name = "${var.global_name}_${terraform.workspace}_jasss_collection_lambda"
  handler       = "index.handler"
  runtime       = "nodejs18.x" 
  timeout       = 15
  memory_size   = 256

  role             = "arn:aws:iam::381491885579:role/role-lambda-student"
  source_code_hash = data.archive_file.data_collection.output_base64sha256

  environment {
    variables = merge(local.environment, {
      POWERTOOLS_SERVICE_NAME = "jasss_data_collection"
    })
  }
}

resource "aws_lambda_function" "suburb_finder" {
  filename      = data.archive_file.suburb_finder.output_path
  function_name = "${var.global_name}_${terraform.workspace}_jasss_suburb_finder_lambda"
  handler       = "index.handler"
  runtime       = "nodejs18.x" 
  timeout       = 15
  memory_size   = 256

  role             = "arn:aws:iam::381491885579:role/role-lambda-student"
  source_code_hash = data.archive_file.suburb_finder.output_base64sha256

  environment {
    variables = merge(local.environment, {
      POWERTOOLS_SERVICE_NAME = "jasss_suburb_finder"
    })
  }
}

resource "aws_lambda_function" "calculator" {
  filename      = data.archive_file.calculator.output_path
  function_name = "${var.global_name}_${terraform.workspace}_jasss_calculator_lambda"
  handler       = "index.handler"
  runtime       = "nodejs18.x" 
  timeout       = 15
  memory_size   = 256

  role             = "arn:aws:iam::381491885579:role/role-lambda-student"
  source_code_hash = data.archive_file.calculator.output_base64sha256

  environment {
    variables = merge(local.environment, {
      POWERTOOLS_SERVICE_NAME = "jasss_calculator"
    })
  }
}

resource "aws_lambda_function_url" "calculator" {
  function_name = "${var.global_name}_${terraform.workspace}_jasss_calculator_lambda"
  authorization_type = "NONE"
}

resource "aws_lambda_function" "user_data" {
  filename      = data.archive_file.user_data.output_path
  function_name = "${var.global_name}_${terraform.workspace}_jasss_user_data_lambda"
  handler       = "index.handler"
  runtime       = "nodejs18.x" 
  timeout       = 15
  memory_size   = 256

  role             = "arn:aws:iam::381491885579:role/role-lambda-student"
  source_code_hash = data.archive_file.user_data.output_base64sha256

  environment {
    variables = merge(local.environment, {
      POWERTOOLS_SERVICE_NAME = "jasss_user_data"
      MAIL_USERNAME =  var.mail_username
      MAIL_PASSWORD = var.mail_password
    })
  }
}

resource "aws_lambda_function_url" "user_data" {
  function_name = "${var.global_name}_${terraform.workspace}_jasss_user_data_lambda"
  authorization_type = "NONE"
}

resource "aws_lambda_function" "data_preprocessing" {
  filename      = data.archive_file.data_preprocessing.output_path
  function_name = "${var.global_name}_${terraform.workspace}_jasss_preprocessing_lambda"
  handler       = "index.handler"
  runtime       = "nodejs18.x" 
  timeout       = 120
  memory_size   = 2048

  role             = "arn:aws:iam::381491885579:role/role-lambda-student"
  source_code_hash = data.archive_file.data_preprocessing.output_base64sha256

  environment {
    variables = merge(local.environment, {
      POWERTOOLS_SERVICE_NAME = "jasss_data_preprocessing"
    })
  }
}

resource "aws_lambda_function" "notification" {
  filename      = data.archive_file.notification.output_path
  function_name = "${var.global_name}_${terraform.workspace}_jasss_notification_lambda"
  handler       = "index.handler"
  runtime       = "nodejs18.x" 
  timeout       = 120
  memory_size   = 2048

  role             = "arn:aws:iam::381491885579:role/role-lambda-student"
  source_code_hash = data.archive_file.notification.output_base64sha256

  environment {
    variables = merge(local.environment, {
      POWERTOOLS_SERVICE_NAME = "jasss_notification",
      MAIL_USERNAME =  var.mail_username
      MAIL_PASSWORD = var.mail_password
    })
  }
}

resource "aws_lambda_function" "data_retrieval" {
  filename      = data.archive_file.data_retrieval.output_path
  function_name = "${var.global_name}_${terraform.workspace}_jasss_retrieval_lambda"
  handler       = "index.handler"
  runtime       = "nodejs18.x" 
  timeout       = 120
  memory_size   = 2048

  role             = "arn:aws:iam::381491885579:role/role-lambda-student"
  source_code_hash = data.archive_file.data_retrieval.output_base64sha256

  environment {
    variables = merge(local.environment, {
      POWERTOOLS_SERVICE_NAME = "jasss_data_retrieval"
    })
  }
}

resource "aws_lambda_function" "data_analytics" {
  filename      = data.archive_file.data_analytics.output_path
  function_name = "${var.global_name}_${terraform.workspace}_jasss_analytics_lambda"
  handler       = "index.handler"
  runtime       = "nodejs18.x" 
  timeout       = 120
  memory_size   = 256

  role             = "arn:aws:iam::381491885579:role/role-lambda-student"
  source_code_hash = data.archive_file.data_analytics.output_base64sha256

  environment {
    variables = merge(local.environment, {
      POWERTOOLS_SERVICE_NAME = "jasss_data_analytics"
    })
  }
}

resource "aws_lambda_function" "append_history" {
  filename      = data.archive_file.append_history.output_path
  function_name = "${var.global_name}_${terraform.workspace}_jasss_append_history"
  handler       = "index.handler"
  runtime       = "nodejs18.x" 
  timeout       = 120
  memory_size   = 1024

  role             = "arn:aws:iam::381491885579:role/role-lambda-student"
  source_code_hash = data.archive_file.append_history.output_base64sha256

  environment {
    variables = merge(local.environment, {
      POWERTOOLS_SERVICE_NAME = "jasss_append_history"
    })
  }
}

resource "aws_lambda_function" "data_fetch_historical" {
  filename      = data.archive_file.data_fetch_historical.output_path
  function_name = "${var.global_name}_${terraform.workspace}_jasss_fetch_historical_lambda"
  handler       = "index.handler"
  runtime       = "nodejs18.x" 
  timeout       = 120
  memory_size   = 256

  role             = "arn:aws:iam::381491885579:role/role-lambda-student"
  source_code_hash = data.archive_file.data_fetch_historical.output_base64sha256

  environment {
    variables = merge(local.environment, {
      POWERTOOLS_SERVICE_NAME = "jasss_fetch_historical"
    })
  }
}
