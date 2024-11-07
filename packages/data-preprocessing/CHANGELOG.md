# jasss-data-preprocessing

## 2.0.0

### Major Changes

- 11df7f5: Added extra conditions, additional bug fixes

### Minor Changes

- 3e2ce95: Added a custom route to process history data into S3, also greatly improved performance of data preprocessing microservice

### Patch Changes

- 70940bb: changed terraform to ensure service names differ, fixed data preprocessing to point to new collection route
- a05d4a5: Updating comments, and other minor changes
- cf4a716: Completed implementation of data-fetch-historical, which fetches up to 31 days of historical data and places it in s3 bucket.

## 1.0.1

### Patch Changes

- Implemented fetching suburbs route in data collection and implemented testing. Also ran changeset to apply changelogs from changeset and update versions in package json

## 1.0.0

### Major Changes

- 08f8c31: Implemented and setup deployment for preprocessing microservice. Also removed extraneous console log in data-collection.

### Minor Changes

- 798befd: Changed all services to use snake case for JSON outputs, general linting and cleanup of repository"
- 2a017d8: Initialising our repository, including setting up the file structure, adding linting and prettier, as well as CI. CI also includes ensuring that each PR includes a changeset for consistency and versioning.

### Patch Changes

- ce4ff62: fixed tests and linting in all packages
- c07753c: Removed the pnpm workspace to reduce coupling between modules. Modules each have their own scripts and testing libraries now. Additionally refactored the CI to reduce repetition.
