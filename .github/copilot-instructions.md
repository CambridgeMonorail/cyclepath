# Cyclepath - Coding Standards

## Project Overview

Cyclepath is a humorous 3D racing game where players navigate a cyclist through urban obstacles in Cambridge to reach work on time. Built as a React SPA with TypeScript in an Nx monorepo.

## Tech Stack

- React (functional components, hooks)
- TypeScript (strict mode)
- Tailwind CSS with shadcn/ui
- Three.js with React Three Fiber
- Nx monorepo
- Vitest/Playwright for testing
- pnpm for package management

## Core Development Principles

- **TypeScript**: Use strict typing, prefer `type` over `interface` except when extending
- **Components**: Functional, stateless when possible, composable, and single-responsibility
- **State**: Manage with React hooks, lift complex state to parents/context
- **Styling**: Use Tailwind classes and shadcn theme variables
- **Testing**: Co-locate tests with components (Component.spec.tsx)

## 3D Development

- Use React Three Fiber for declarative 3D components
- Use `useFrame` for animation loops
- Implement instanced meshes for performance
- Organize 3D assets in dedicated directories

## File Organization

- Components: `PascalCase.tsx`
- Hooks: `camelCase.ts`
- Utilities: `camelCase.ts`
- Tests: `ComponentName.spec.tsx`
- Prefer named exports
- Use relative paths within projects, absolute paths across projects

## Component Best Practices

- Extend native HTML element props
- Compose complex components from smaller ones
- Enable customization via props/slots/children
- Handle loading/error states appropriately
- Make components accessible and responsive

## Error Handling

- Use try/catch for API calls
- Handle typed ApiError instances
- Display user-friendly error messages
- Log errors with context
- Implement retry logic where appropriate

## Package Management

- Use pnpm exclusively
- Document new dependencies

## Directory Structure

```
apps/                    # Application projects
  cyclepath/             # Main web client
  cyclepath-e2e/         # E2E tests
libs/                    # Shared libraries
  road-system/           # Road system components
  shared/                # Shared utilities
docs/                    # Documentation
```

## API Integration

- Use typed API client with generics
- Handle errors with ApiError types
- Use environment variables for configuration
- Implement loading/error states
- Use mock clients for testing
