resource "aws_apigatewayv2_api" "main_api" {
  name          = "${var.global_name}_${terraform.workspace}_jasss_main_API"
  protocol_type = "HTTP"
  cors_configuration {
    allow_origins = ["*"]
    allow_headers = ["*"]
    allow_methods = ["*"]
  }
}

// data collection
resource "aws_apigatewayv2_integration" "data_collection_integration" {
  api_id           = aws_apigatewayv2_api.main_api.id
  integration_type = "AWS_PROXY"

  integration_uri    = aws_lambda_function.data_collection.arn
  integration_method = "GET"
}

resource "aws_apigatewayv2_route" "data_collection_route_weather" {
  api_id    = aws_apigatewayv2_api.main_api.id
  route_key = "GET /data-collection/weather" 

  target = "integrations/${aws_apigatewayv2_integration.data_collection_integration.id}" 
}

resource "aws_apigatewayv2_route" "data_collection_route_suburb" {
  api_id    = aws_apigatewayv2_api.main_api.id
  route_key = "GET /data-collection/suburbs" 

  target = "integrations/${aws_apigatewayv2_integration.data_collection_integration.id}" 
}


resource "aws_lambda_permission" "data_collection_permission" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.data_collection.function_name 
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_apigatewayv2_api.main_api.execution_arn}/*/*/*"
}

// address to suburb
resource "aws_apigatewayv2_integration" "suburb_finder_integration" {
  api_id           = aws_apigatewayv2_api.main_api.id
  integration_type = "AWS_PROXY"

  integration_uri    = aws_lambda_function.suburb_finder.arn
  integration_method = "GET"

}

resource "aws_apigatewayv2_route" "suburb_finder_route" {
  api_id    = aws_apigatewayv2_api.main_api.id
  route_key = "GET /address-to-suburb/get-suburb" 

  target = "integrations/${aws_apigatewayv2_integration.suburb_finder_integration.id}" 
}

resource "aws_lambda_permission" "suburb_finder_permission" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.suburb_finder.function_name 
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_apigatewayv2_api.main_api.execution_arn}/*/*"
}

// data retrieval
resource "aws_apigatewayv2_integration" "data_retrieval_integration" {
  api_id           = aws_apigatewayv2_api.main_api.id
  integration_type = "AWS_PROXY"

  integration_uri    = aws_lambda_function.data_retrieval.arn
  integration_method = "GET"
}


resource "aws_apigatewayv2_route" "data_retrieval_route" {
  api_id    = aws_apigatewayv2_api.main_api.id
  route_key = "GET /data-retrieval/retrieve" 

  target = "integrations/${aws_apigatewayv2_integration.data_retrieval_integration.id}" 
}

resource "aws_apigatewayv2_route" "data_retrieval_energy_data" {
  api_id    = aws_apigatewayv2_api.main_api.id
  route_key = "GET /data-retrieval/retrieve-energy-data" 

  target = "integrations/${aws_apigatewayv2_integration.data_retrieval_integration.id}" 
}

resource "aws_apigatewayv2_route" "data_retrieval_route_history" {
  api_id    = aws_apigatewayv2_api.main_api.id
  route_key = "GET /data-retrieval/retrieve-history" 

  target = "integrations/${aws_apigatewayv2_integration.data_retrieval_integration.id}" 
}

resource "aws_apigatewayv2_route" "data_retrieval_route_wmo" {
  api_id    = aws_apigatewayv2_api.main_api.id
  route_key = "GET /data-retrieval/retrieve-wmo" 

  target = "integrations/${aws_apigatewayv2_integration.data_retrieval_integration.id}" 
}

resource "aws_apigatewayv2_route" "data_retrieval_route_mapping" {
  api_id    = aws_apigatewayv2_api.main_api.id
  route_key = "GET /data-retrieval/retrieve-mapping" 

  target = "integrations/${aws_apigatewayv2_integration.data_retrieval_integration.id}" 
}

resource "aws_lambda_permission" "data_retrieval_permission" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.data_retrieval.function_name 
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_apigatewayv2_api.main_api.execution_arn}/*/*"

}
// end data retrieval

// data analytics
resource "aws_apigatewayv2_integration" "data_analytics_integration" {
  api_id           = aws_apigatewayv2_api.main_api.id
  integration_type = "AWS_PROXY"

  integration_uri    = aws_lambda_function.data_analytics.arn
  integration_method = "ANY"
}

resource "aws_apigatewayv2_route" "data_analytics_analyse_route" {
  api_id    = aws_apigatewayv2_api.main_api.id
  route_key = "GET /data-analytics/analyse" 

  target = "integrations/${aws_apigatewayv2_integration.data_analytics_integration.id}" 
}

resource "aws_apigatewayv2_route" "data_analytics_analyse_selective_route" {
  api_id    = aws_apigatewayv2_api.main_api.id
  route_key = "POST /data-analytics/analyse-selective" 

  target = "integrations/${aws_apigatewayv2_integration.data_analytics_integration.id}" 
}

resource "aws_apigatewayv2_route" "data_analytics_analyse_history_route" {
  api_id    = aws_apigatewayv2_api.main_api.id
  route_key = "GET /data-analytics/analyse-history" 

  target = "integrations/${aws_apigatewayv2_integration.data_analytics_integration.id}" 
}

resource "aws_apigatewayv2_route" "data_analytics_analyse_selective_history_route" {
  api_id    = aws_apigatewayv2_api.main_api.id
  route_key = "POST /data-analytics/analyse-selective-history" 

  target = "integrations/${aws_apigatewayv2_integration.data_analytics_integration.id}" 
}

resource "aws_lambda_permission" "data_analytics_permission" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.data_analytics.function_name 
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_apigatewayv2_api.main_api.execution_arn}/*/*"

}
// end data analytics

resource "aws_apigatewayv2_stage" "api_stage" {
  name          = "${terraform.workspace}"
  api_id        = aws_apigatewayv2_api.main_api.id
  auto_deploy   = true

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.jasss_main_api_log.arn
    format          = "{\"requestId\":\"$context.requestId\",\"ip\":\"$context.identity.sourceIp\",\"requestTime\":\"$context.requestTime\",\"httpMethod\":\"$context.httpMethod\",\"resourcePath\":\"$context.path\",\"status\":\"$context.status\",\"protocol\":\"$context.protocol\",\"responseLength\":\"$context.responseLength\"}"
  }

  default_route_settings {
    throttling_burst_limit = 5000
    throttling_rate_limit = 10000
  }

  // throttle weather collection route
  route_settings {
    route_key = aws_apigatewayv2_route.data_collection_route_weather.route_key
    throttling_burst_limit = 2
    throttling_rate_limit = 2
  }
}

