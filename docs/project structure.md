# Project Structure

The Cyclepath project is organized as a Nrwl Nx Monorepo to ensure modularity, scalability, and maintainability. Below is an overview of the project structure and its purpose:

## Root Directory

- **cyclepath.code-workspace**: VS Code workspace configuration file.
- **eslint.config.mjs**: Shared ESLint configuration for the monorepo.
- **nx.json**: Nx workspace configuration file.
- **package.json**: Root package configuration for managing dependencies.
- **pnpm-lock.yaml**: Lockfile for pnpm package manager.
- **pnpm-workspace.yaml**: Configuration for pnpm workspace.
- **README.MD**: Project overview and documentation.
- **tsconfig.base.json**: Base TypeScript configuration shared across the workspace.
- **tsconfig.json**: Root TypeScript configuration.
- **vitest.workspace.ts**: Vitest configuration for testing.

## Applications

### `apps/`

Contains application-specific code. Each application is self-contained and follows the Nx structure.

#### `cyclepath/`

- **eslint.config.mjs**: ESLint configuration for the Cyclepath app.
- **index.html**: Entry HTML file for the application.
- **package.json**: Application-specific dependencies.
- **postcss.config.js**: PostCSS configuration for styling.
- **tailwind.config.js**: Tailwind CSS configuration.
- **tsconfig.*.json**: TypeScript configurations for the app, including app, spec, and base configurations.
- **vite.config.ts**: Vite configuration for the app.
- **public/**: Static assets such as the favicon.
- **src/**: Source code for the application.
  - **main.tsx**: Entry point for the React application.
  - **styles.css**: Global styles for the app.
  - **app/**: Core application logic and components.
    - **app.tsx**: Main application component.
    - **app.spec.tsx**: Unit tests for the main application component.
    - **nx-welcome.tsx**: Welcome component for Nx.
  - **assets/**: Application-specific assets.

#### `cyclepath-e2e/`

- **eslint.config.mjs**: ESLint configuration for E2E tests.
- **package.json**: Dependencies for E2E testing.
- **playwright.config.ts**: Playwright configuration for end-to-end tests.
- **tsconfig.json**: TypeScript configuration for E2E tests.
- **src/**: Source code for E2E tests.
  - **example.spec.ts**: Example Playwright test.

## Documentation

### `docs/`

Contains project documentation.

- **design guide.md**: Design guidelines for the project.
- **implementation plan.md**: Implementation plan and roadmap.
- **product requirements.md**: Product requirements and specifications.
- **project structure.md**: Documentation of the project structure (this file).
- **tasks.md**: Task breakdown and tracking.

## Libraries

### `libs/`

Shared libraries for reusable code and components.

#### `api/`

- **clients/**: API client implementations.
- **types/**: TypeScript types and interfaces for API responses.
- **utils/**: Utility functions for API interactions.
- **errors/**: Custom error handling for API calls.

#### `shared/`

- **types/**: Shared TypeScript types used across the project.
- **utils/**: Common helper functions.
- **constants/**: Shared constants for the project.

## End-to-End Tests

### `e2e/`

Contains end-to-end tests for the project.

#### `client/`

- **src/tests/**: Playwright test files for the client application.
