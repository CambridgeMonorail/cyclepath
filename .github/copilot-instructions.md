# Project Context

Cyclepath immerses players in a humorous, high-speed race through a 3D recreation of Mill Road in Cambridge. The player, a determined cyclist, must navigate a series of increasingly wild urban obstacles—ranging from erratic pedestrians and stray animals to chaotic vehicles—to reach work on time. The game blends playful power-ups and exaggerated hazards with authentic local details, ensuring both fun and a strong sense of place.

We are building a React Single Page Application in TypeScript, using client-side routing within a Nrwl Nx Monorepo. We install packages exclusively via pnpm.

## Code Style and Structure

We prioritize clean, modern, type-safe React functional components emphasizing security, robustness, maintainability, readability, separation of concerns, and DRY principles. Follow Nx monorepo structure for organizing code.

- Use React hooks (useState, useEffect) for state management and side effects.
- Prefer named (explicit) exports.
- Adhere to TypeScript strict typing.
- Prefer 'type' over 'interface' unless extending.
- Place code in relevant Nx library/app folders.

## Tech Stack

Core technologies and libraries used in the project.

- React (SPA)
- TypeScript
- Tailwind CSS
- shadcn/ui
- Nrwl Nx
- Vitest and Playwright for testing
- API Client with TypeScript generics
- Error handling with custom ApiError types

## Naming Conventions

Ensure clarity and consistency in how files and components are named.

- Use descriptive names for exports and files.
- Employ direct named imports and relative paths within the project.

## TypeScript Usage

Enforce strict type safety and best practices.

- Use interfaces only when merging or extending object definitions.
- Keep components as stateless as possible, delegating state or context to higher levels.
- Use generic types for API client implementations
- Implement proper error type handling with ApiError
- Define resource types for API responses

## UI and Styling

Follow Tailwind CSS and shadcn/ui guidelines for consistent design.

- Apply Tailwind classes for styling.

- Utilize shadcn theme variables (bg-background, text-foreground, etc.).

## State Management

Handle state and effects efficiently within React hooks.

- Keep logic in functional components.
- Delegate complex state to parent components or React Context.

## Storybook Usage

Ensure stories are modern and annotated correctly.

- Use modern syntax (StoryObj, tags: ['autodocs']).
- Cover various use cases with JSDoc comments for each story.

## Icons

Maintain consistent icon usage in the UI.

- Use lucide-react for icons.

## Testing

Verify code functionality using unit and E2E tests.

- Implement Vitest for unit tests.
- Implement Playwright for end-to-end tests.
- Place test files alongside their corresponding components.

## Accessibility and Responsiveness

Ensure inclusive UX on various devices.

- Ensure all components are accessible and responsive.
- Follow best practices for screen readers and dynamic layouts.
- Use semantic HTML elements to improve accessibility and SEO.

## Project Structure

Follow Nx workspace organization and naming conventions:

```text
apps/                   # Application projects
├── client/            # Main web client
    ├── src/
        ├── app/       # Core application logic
        ├── components/# Page-specific components
        ├── hooks/     # Custom React hooks
        ├── utils/     # Helper functions
        ├── pages/     # Route components
        ├── styles/    # Global styles
        └── tests/     # Test files
├── api/               # Backend API
    └── src/          
        ├── routes/    # API endpoints
        ├── services/  # Business logic
        └── utils/     # Helper functions

libs/                  # Shared libraries
├── api/       # API client library
    ├── src/
        ├── clients/  # API client implementations
        ├── types/    # API types and interfaces
        ├── utils/    # API utilities
        └── errors/   # Error handling

├── shared/           # Shared utilities
    ├── src/
        ├── types/    # Shared TypeScript types
        ├── utils/    # Common helper functions
        └── constants/# Shared constants

e2e/                  # End-to-end tests
├── client/          # Client E2E tests
    └── src/
        └── tests/   # Playwright test files
```

## Component Design

Structure components for maximum reusability and maintainability.

- Extend native HTML element props where applicable
- Use composition for complex components
- Allow customization via props, slots, or children
- Keep components modular and DRY
- Follow single responsibility principle

## API Integration

Follow these guidelines for API integration:

- Use typed API client from '@cyclepath/api'
- Implement proper error handling using ApiError types
- Use environment variables for API configuration
- Handle loading and error states in components
- Implement retry logic where appropriate
- Use mock client for development and testing

## Error Handling

Implement comprehensive error handling:

- Use try/catch blocks for API calls
- Handle ApiError instances appropriately
- Show user-friendly error messages
- Log errors with meaningful context
- Implement retry logic where necessary

## Package Management

Follow consistent package management practices.

- Use pnpm exclusively for package installation
- Maintain clean dependency tree
- Document new dependencies in README

## Code Organization

Structure code for clarity and maintainability.

- Place components in appropriate Nx library/app folders
- Use barrel exports (index.ts) for library exports
- Keep related files close together
- Follow feature-based organization within apps

## File Naming

Use consistent file naming patterns.

- Components: PascalCase.tsx
- Hooks: camelCase.ts
- Utils: camelCase.ts
- Tests: ComponentName.test.tsx
- Stories: ComponentName.stories.tsx

## Import/Export Patterns

Follow consistent import/export patterns.

- Use named exports
- Prefer direct imports (import { FC } from 'react')
- Use relative paths within projects
- Use absolute paths across projects
