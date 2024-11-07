# jasss-data-retrieval

## 3.0.0

### Major Changes

- 15f43a3: Integrating with address2suburb functionality

### Minor Changes

- 11df7f5: Added extra conditions, additional bug fixes
- 6142745: Added retrieve-history route

### Patch Changes

- de5e785: Added mock tests for S3
- 140eb6a: Implemented mock testing into all services, added logging for api gateway in terraform
- a05d4a5: Updating comments, and other minor changes
- cf4a716: Completed implementation of data-fetch-historical, which fetches up to 31 days of historical data and places it in s3 bucket.
- 9c2e316: finished up user-data, fixed error propagation

## 2.0.1

### Patch Changes

- Implemented fetching suburbs route in data collection and implemented testing. Also ran changeset to apply changelogs from changeset and update versions in package json

## 2.0.0

### Major Changes

- 48f8ae4: Data retrieval implementation and testing
- 9e22564: first major dev retrieval release
- f4fbce0: Refactoring data-retrieval to use lambda functions

### Minor Changes

- 798befd: Changed all services to use snake case for JSON outputs, general linting and cleanup of repository"
- 9e9e9d5: Update filter function and tests to expect json attributes in snake case

### Patch Changes

- ce4ff62: fixed tests and linting in all packages
- c07753c: Removed the pnpm workspace to reduce coupling between modules. Modules each have their own scripts and testing libraries now. Additionally refactored the CI to reduce repetition.
- e194236: Added and updated readme for analytics and retrieval
