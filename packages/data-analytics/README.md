# JASSS Data Analytics API

Fetches data from the retrieval microservice about the weather conditions in a certain suburb.<br/>
One endpoint `/data-analytics/analyse`.<br/>
Pass startDate and endDate as query params in "YYYY-MM-DD" format, must be within a week of the current date.<br/>
Pass in any valid suburb in Sydney as suburb query value<br/>
Optionally pass in attribute values to thin out response as a string separated by commas<br/>
Optionall pass in aggregates based on the calulcations required (mean, median, mode, min, max and/or variance) as a string separated by commas<br/>

example usage:
_path 1: /data-analytics/analyse_
'https://wl3fywkj02.execute-api.ap-southeast-2.amazonaws.com/prod/data-analytics/data-analytics/analyse?startdate=2024-03-15&enddate=2024-03-18&suburb=Panania&attributes=cloudcover&aggregates=min'
_path 2: /data-analytics/analyse-selective_
'https://wl3fywkj02.execute-api.ap-southeast-2.amazonaws.com/prod/data-analytics/data-analytics/analyse-selective'
In the body, add an object as below:
{
"query": {
"temperature_2m": "min, max",
"cloud_cover": "mode, sum",
}
}

## Deployment (Dev ONLY)

- Duplicate the `.env.template` as `.env` and fill out the env variables (necessary for testing).
- Follow the steps provided in the [Terraform Readme.](../terraform/README.md)
- Run `pnpm build` before you deploy any changes.
- `terraform plan` to check the changes that Terraform will apply. (optional)
- `terraform apply` and follow the instructions for inputting the API key.

**Staging and Production deployments are handled by the CD. DO NOT create workspaces for staging and prod to avoid confusion.**
