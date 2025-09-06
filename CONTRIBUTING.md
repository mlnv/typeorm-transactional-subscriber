# Contributing

Thank you for your interest in contributing to this project!

## Development

To set up your development environment and contribute to this monorepo, follow these steps:

### Prerequisites

- [Node.js](https://nodejs.org/) (see required version in the root `package.json`)
  - It is recommended to use [nvm](https://github.com/nvm-sh/nvm) (Node Version Manager) to easily switch between Node.js versions. After installing nvm, you can run:
    ```sh
    nvm install
    nvm use
    ```
    This will use the version specified in the `.nvmrc` file if present, or you can manually specify the version from `package.json`.
- [pnpm](https://pnpm.io/) (see required version in the root `package.json`)

### Install dependencies

From the repository root, run:

```sh
pnpm install
```

### Common scripts

- **Build all packages:**
  ```sh
  pnpm build
  ```
- **Clean build artifacts:**
  ```sh
  pnpm clean
  ```
- **Lint all packages:**
  ```sh
  pnpm lint
  ```
- **Fix lint issues:**
  ```sh
  pnpm lint:fix
  ```
- **Run tests:**
  ```sh
  pnpm test
  ```

---

For more details, see the `package.json` files in each package folder.

## Pull Request Policies & Testing

- All changes must be submitted via a Pull Request (PR) targeting the main branch.
- Ensure your branch is up to date with the latest main branch before opening a PR.
- Every PR must include tests for new or changed functionality.
- All code must be tested using end-to-end (e2e) tests in the `e2e-tests` project:
  ```sh
  pnpm test
  ```
- All e2e tests must pass before a PR can be merged.

---

## Release Process

Follow these steps to release a new version of the package:

1. **Update the changelog**
   - Mark the current changes as released in `CHANGELOG.md`.
   - Create empty headers for the next release.
2. **Commit your changes**
   - Ensure all changes are committed to the repository.
3. **Update the package version**
   - In `packages/typeorm-transactional-subscriber/package.json`, set the version to the new release version.
4. **Build the package**
   - From the repository root, run:
     ```sh
     pnpm build
     ```
5. **Publish the package**
   - Change directory to the package folder:
     ```sh
     cd packages/typeorm-transactional-subscriber
     ```
   - Publish to npm:
     ```sh
     pnpm publish --access public
     ```
6. **Tag the release in git**
   - Add a git tag for the release version (e.g., `0.2.0`).
7. **Bump to the next minor version**
   - Update the version in `packages/typeorm-transactional-subscriber/package.json` to the next minor version for ongoing development.

---

For any questions or issues, please open an issue in the repository.
