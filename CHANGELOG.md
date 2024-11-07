# JASSS_API

## 2.0.0

### Major Changes

- bbc8f3f: Deployed data-fetch-historical

### Minor Changes

- 11df7f5: Added extra conditions, additional bug fixes

### Patch Changes

- 70940bb: changed terraform to ensure service names differ, fixed data preprocessing to point to new collection route
- 6667304: Fixed pipeline to fail when testing microservice fails, spruced up main readme
- 0f73009: Adding testing microservice, including pipelines for deployment and running E2E tests
- 140eb6a: Implemented mock testing into all services, added logging for api gateway in terraform
- a05d4a5: Updating comments, and other minor changes
- 1763692: Implemented append history microservice, including testing and deployment
- 3a43c7b: Adding e2e pipeline
- b8895d0: Typo fix in fetch-historical, migrating swagger documentation to repo for collaboration
- 6142745: Added retrieve-history route
- 3e2ce95: Added a custom route to process history data into S3, also greatly improved performance of data preprocessing microservice

## 1.0.2

### Patch Changes

- Implemented fetching suburbs route in data collection and implemented testing. Also ran changeset to apply changelogs from changeset and update versions in package json

## 1.0.1

### Patch Changes

- e7771a1: Adding terraform workflows
- f016d79: Fixing changesets to work on individual packages and updated old metadata files
- introductory setup
- 0e1852d: Testing new terraform deployment action
