# JASSS Append History

Takes the previous day's worth of weather data, averages it and puts it into history.
Triggered by a CloudWatch event set to run every 24 hours from midnight AEST time.

## Deployment (Dev ONLY)

- Duplicate the `.env.template` as `.env` and fill out the env variables (necessary for testing).
- Follow the steps provided in the [Terraform Readme.](../terraform/README.md)
- Run `pnpm build` before you deploy any changes.
- `terraform plan` to check the changes that Terraform will apply. (optional)
- `terraform apply` and follow the instructions for inputting the API key.

**Staging and Production deployments are handled by the CD. DO NOT create workspaces for staging and prod to avoid confusion.**
