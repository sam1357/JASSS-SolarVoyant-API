output "api_endpoint" {
  value = "${aws_apigatewayv2_api.main_api.api_endpoint}/${terraform.workspace}"
}

output "data_collection_weather" {
  value = aws_apigatewayv2_route.data_collection_route_weather.route_key
}

output "data_collection_suburb" {
  value = aws_apigatewayv2_route.data_collection_route_suburb.route_key
}

output "data_retrieval" {
  value = {
    retrieve = aws_apigatewayv2_route.data_retrieval_route.route_key
    retrieve-history = aws_apigatewayv2_route.data_retrieval_route_history.route_key
    retrieve-wmo = aws_apigatewayv2_route.data_retrieval_route_wmo.route_key
  }
}

output "suburb_finder" {
  value = aws_apigatewayv2_route.suburb_finder_route.route_key
}

output "data_analytics" {
  value = {
    analyse = aws_apigatewayv2_route.data_analytics_analyse_route.route_key
    analyse-selective = aws_apigatewayv2_route.data_analytics_analyse_selective_route.route_key
    analyse-history = aws_apigatewayv2_route.data_analytics_analyse_selective_history_route.route_key
    analyse-selective-historys = aws_apigatewayv2_route.data_analytics_analyse_history_route.route_key
  }
}

output "testing_public_ip" {
    value = data.aws_network_interface.interface_tags.association[0].public_ip
}

output "user_data_url" {
  value = aws_lambda_function_url.user_data.function_url
}

output "calculator_url" {
  value = aws_lambda_function_url.calculator.function_url
}