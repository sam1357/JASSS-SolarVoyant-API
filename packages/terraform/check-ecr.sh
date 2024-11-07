#!/bin/bash

result=$(aws ecr describe-repositories --repository-names $1 --region $2 2>&1)
if [ $? -eq 0  ]; then
    repository_url=$(echo $result | jq -r '.repositories[0].repositoryUri')
    echo -n "{\"success\":\"true\", \"repository_url\":\"$repository_url\", \"name\":\"$1\"}"
else
    error_message=$(echo $result | jq -R -s -c '.')
    echo -n "{\"success\":\"false\", \"error_message\": $error_message , \"name\":\"$1\"}"
fi