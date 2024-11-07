# JASSS Microservices

[![Docs](https://img.shields.io/badge/docs-v3.0.0-green)](https://solid-adventure-371rz28.pages.github.io/)

![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![Terraform](https://img.shields.io/badge/terraform-%235835CC.svg?style=for-the-badge&logo=terraform&logoColor=white)
![AWS](https://img.shields.io/badge/AWS-%23FF9900.svg?style=for-the-badge&logo=amazon-aws&logoColor=white)
![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)
![Swagger](https://img.shields.io/badge/-Swagger-%23Clojure?style=for-the-badge&logo=swagger&logoColor=white)
![PNPM](https://img.shields.io/badge/pnpm-%234a4a4a.svg?style=for-the-badge&logo=pnpm&logoColor=f69220)

<div align="center">
  <img src="logo.png" alt="Solarvoyant Logo" width="100" height="100">
</div>

This repository holds all of the microservices that will make up JASSS' frontend application - **Solarvoyant** - ostensibly a combination of the words 'Solar' and 'Clairvoyant'.

## Basic Setup

Our monolithic repository utilises `pnpm` as our package manager and `changesets` for versioning.

`pnpm` is a much more space efficient and speed-focussed package manager, and also has support for workspaces to manage multi-project repositories like our one. Thus, our project utilises a pnpm workspace.

### Installing pnpm

Do note that we are utilising **Node 21** for our project, so please ensure your Node version is up to date before anything else. `nvm` is highly recommended.

`pnpm` can be installed by simply running:

`npm install -g pnpm`

### Installing packages

You will notice that there is a package.json within each package, but few to no dependencies. This is because an advantage of using workspaces is that of shared dependencies. Since most if not all of our repositories will utilise linting and Prettier, these packages have been placed in the root level `package.json`. Any additional packages that individual packages may need can simply be added to the corresponding `package.json`.

To install **all** modules in all packages, run:

`pnpm i --recursive`

### Changesets

We are utilising changesets to help organise versioning of packages. It also allows us to create detailed changelogs and as much documentation as we want.

Everything is already setup, but every time a set of changes is to be considered as a new version, run `pnpm changeset` to create a new changeset, and follow its instructions.

Learn more [here](https://github.com/changesets/changesets).

### Building packages

Run the following command to build all packages from the project root directory.

`chmod +x build-all.sh && ./build-all.sh`
