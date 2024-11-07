# jasss-data-analytics

## 3.0.0

### Major Changes

- 68b8ab2: analytics lambda modifications, new endpoints and revised tests
- 15f43a3: Integrating with address2suburb functionality
- 95fb9f8: fixes from review comments, changed and endpoint

### Minor Changes

- 36f856b: Fixed bug where invalid aggregate error not correctly propagating and added error to prevent giving routes invalid dates. Also deployed.
- added sum strategy and minor documentation changes
- daec213: fixing jest build for analytics
- 11df7f5: Added extra conditions, additional bug fixes
- 76e41bb: Minor bugfixes related to error messages, conversion to 2dp and added headers
- d5bc4e0: Added analysis for historical data and refactored index

### Patch Changes

- ec519d3: Added mocking to unit tests
- 1cb54a9: Added comments, logs and fixed up testing
- 140eb6a: Implemented mock testing into all services, added logging for api gateway in terraform
- a05d4a5: Updating comments, and other minor changes
- cf4a716: Completed implementation of data-fetch-historical, which fetches up to 31 days of historical data and places it in s3 bucket.
- 9c2e316: finished up user-data, fixed error propagation

## 2.0.1

### Patch Changes

- Implemented fetching suburbs route in data collection and implemented testing. Also ran changeset to apply changelogs from changeset and update versions in package json

## 2.0.0

### Major Changes

- cb42604: Data analytics implementation and testing
- 1678490: Completed route for calculating mean, mode, min, max and variation. Added tests, dataModels, and handling data from retrieval API.

### Minor Changes

- 798befd: Changed all services to use snake case for JSON outputs, general linting and cleanup of repository"
- 9798207: Refactored analytics calculations into strategy pattern to facillitate future additions.
- 0ffbd69: Added error checking propogation and testing and lint-fix
- 05dd207: Initialised express server files for data-analytics and fixed merge conflicts

### Patch Changes

- f5d8190: Fixed url from dev to prod
- ce4ff62: fixed tests and linting in all packages
- c07753c: Removed the pnpm workspace to reduce coupling between modules. Modules each have their own scripts and testing libraries now. Additionally refactored the CI to reduce repetition.
- 491c37f: Added tests to cover null and empty string value aggregates, as well as missing dates.

  Modified data-analytics to accept comma-separated string of operations via parse function. Modified tests accordingly. Removed error checking handled by retrieval API.

- e194236: Added and updated readme for analytics and retrieval
