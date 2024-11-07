# jasss-data-collection

## 2.0.0

### Major Changes

- 11df7f5: Added extra conditions, additional bug fixes

### Patch Changes

- 140eb6a: Implemented mock testing into all services, added logging for api gateway in terraform
- a05d4a5: Updating comments, and other minor changes
- cf4a716: Completed implementation of data-fetch-historical, which fetches up to 31 days of historical data and places it in s3 bucket.

## 1.1.0

### Minor Changes

- Implemented fetching suburbs route in data collection and implemented testing. Also ran changeset to apply changelogs from changeset and update versions in package json

## 1.0.0

### Major Changes

- 23e55aa: Finished development of data-collection and testing. Initial release

### Minor Changes

- 798befd: Changed all services to use snake case for JSON outputs, general linting and cleanup of repository"
- 2a017d8: Initialising our repository, including setting up the file structure, adding linting and prettier, as well as CI. CI also includes ensuring that each PR includes a changeset for consistency and versioning.
- 08f8c31: Implemented and setup deployment for preprocessing microservice. Also removed extraneous console log in data-collection.

### Patch Changes

- ce4ff62: fixed tests and linting in all packages
- c07753c: Removed the pnpm workspace to reduce coupling between modules. Modules each have their own scripts and testing libraries now. Additionally refactored the CI to reduce repetition.
- 82d9cce: Updating terraform configuration to disable cloudwatch by default except production, and change the data collection route
