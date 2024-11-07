// ------------------------------------- LOG GROUPS ----------------------------------
resource "aws_cloudwatch_log_group" "data_collection_log" {
  name              = "/aws/lambda/${aws_lambda_function.data_collection.function_name}"
  retention_in_days = 7
  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_cloudwatch_log_group" "suburb_finder_log" {
  name              = "/aws/lambda/${aws_lambda_function.suburb_finder.function_name}"
  retention_in_days = 7
  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_cloudwatch_log_group" "calculator_log" {
  name              = "/aws/lambda/${aws_lambda_function.calculator.function_name}"
  retention_in_days = 7
  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_cloudwatch_log_group" "user_data_log" {
  name              = "/aws/lambda/${aws_lambda_function.user_data.function_name}"
  retention_in_days = 7
  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_cloudwatch_log_group" "data_retrieval_log" {
  name              = "/aws/lambda/${aws_lambda_function.data_retrieval.function_name}"
  retention_in_days = 7
  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_cloudwatch_log_group" "data_preprocessing_log" {
  name              = "/aws/lambda/${aws_lambda_function.data_preprocessing.function_name}"
  retention_in_days = 7
  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_cloudwatch_log_group" "notification_log" {
  name              = "/aws/lambda/${aws_lambda_function.notification.function_name}"
  retention_in_days = 7
  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_cloudwatch_log_group" "data_analytics_log" {
  name              = "/aws/lambda/${aws_lambda_function.data_analytics.function_name}"
  retention_in_days = 7
  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_cloudwatch_log_group" "append_history_log" {
  name              = "/aws/lambda/${aws_lambda_function.append_history.function_name}"
    retention_in_days = 7
  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_cloudwatch_log_group" "data_fetch_historical_log" {
  name              = "/aws/lambda/${aws_lambda_function.data_fetch_historical.function_name}"
  retention_in_days = 7
  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_cloudwatch_log_group" "jasss_testing_ecs_log" {
  name              = "/aws/ecs/jasss_${terraform.workspace}_testing_ec2_logs"
  retention_in_days = 7
  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_cloudwatch_log_group" "jasss_main_api_log" {
  name              = "/aws/api/${aws_apigatewayv2_api.main_api.name}"
  retention_in_days = 7
  lifecycle {
    prevent_destroy = false
  }
}
