# JASSS Fetch Historical Data API

Fetches 31 days of weather data, processes and stores in the S3 bucket.
Returns data as JSON.
Pass in an optional `testPath` variable representing to a path to a different JSON file in the S3 folder,
particularly using for testing with a smaller subset of suburbs.

## Deployment (Dev ONLY)

- Duplicate the `.env.template` as `.env` and fill out the env variables (necessary for testing).
- Follow the steps provided in the [Terraform Readme.](../terraform/README.md)
- Run `pnpm build` before you deploy any changes.
- `terraform plan` to check the changes that Terraform will apply. (optional)
- `terraform apply` and follow the instructions for inputting the API key.

**Staging and Production deployments are handled by the CD. DO NOT create workspaces for staging and prod to avoid confusion.**
