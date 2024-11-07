## Initialising (Dev ONLY)

- Run `terraform init` in this folder.
- Run `terraform workspace select -or-create=true dev` to create a Dev workspace.
- Run `pnpm build` on the respective packages you wish to deploy before you deploy any changes.

**Staging and Production deployments are handled by the CD. Avoid creating workspaces for staging and prod to avoid confusion.**
