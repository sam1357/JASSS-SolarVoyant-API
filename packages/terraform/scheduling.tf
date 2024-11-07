// ---------------------------------- CLOUDWATCH RULES ----------------------------------
resource "aws_cloudwatch_event_rule" "data_preprocessing_schedule" {
  name        = "${var.global_name}_${terraform.workspace}_jasss_preprocess_schedule"
  description = "Schedule rule to trigger refresh for weather periodically"

  state = terraform.workspace == "prod" ? "ENABLED" : "DISABLED"

  schedule_expression = "cron(0 2/4 * * ? *)"  # Runs every 4 hours 
  tags = {
    Environment = "${terraform.workspace}"
  }
}

resource "aws_cloudwatch_event_target" "data_preprocessing_cloudwatch_target" {
  rule      = aws_cloudwatch_event_rule.data_preprocessing_schedule.id
  target_id = "trigger-lambda"

  arn = aws_lambda_function.data_preprocessing.arn
}

resource aws_lambda_permission allow_preprocessing_invoke {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.data_preprocessing.arn
  principal     = "events.amazonaws.com"
}

resource "aws_cloudwatch_event_rule" "append_history_schedule" {
  name        = "${var.global_name}_${terraform.workspace}_jasss_history_schedule"
  description = "Schedule rule to shuffle data into history periodically"

  state = terraform.workspace == "prod" ? "ENABLED" : "DISABLED"

  schedule_expression = "cron(50 12 * * ? *)" // run at 11:50pm australian time dst
  tags = {
    Environment = "${terraform.workspace}"
  }
}

resource "aws_cloudwatch_event_target" "append_history_cloudwatch_target" {
  rule      = aws_cloudwatch_event_rule.append_history_schedule.id
  target_id = "trigger-lambda"

  arn = aws_lambda_function.append_history.arn
}

resource aws_lambda_permission allow_append_history_invoke {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.append_history.arn
  principal     = "events.amazonaws.com"
}