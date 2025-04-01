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

When making changes always check the editor for typescript errors before assuming the code is complete or trying to run it.

// Ensure road tiles are always flat (aligned to the XZ plane)
// Only allow rotation around the Y axis for direction changes
tile.rotation.x = 0;
tile.rotation.z = 0;
// tile.rotation.y = someAngle; // only this is allowed to change

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

## Road Network Layout Guidance

When working on the road network system, adhere to the following principles to ensure proper layout and alignment of road segments:

1. **Flat Surface Constraint**:
   - All road segments must be placed on a single flat plane (e.g., `y = 0`).
   - The height (`y` coordinate) of all segments and their connection points should remain constant.

2. **2D Rotation Only**:
   - Road segments should only rotate around the vertical axis (`y-axis`) to define their direction.
   - No tilting or rolling of segments (no rotation around `x` or `z` axes).

3. **Connection Alignment**:
   - The end of one segment must align perfectly with the start of the next segment.
   - Connection points should be validated to ensure continuity.

4. **Validation and Debugging**:
   - Add validation checks to ensure all segments are on the same plane and properly aligned.
   - Use debug visualizations (e.g., markers, lines) to confirm correct placement.

5. **Documentation**:
   - Write a clear explanation of these constraints in the project documentation.
   - Include examples and diagrams to illustrate correct and incorrect layouts.

By following these principles, we can ensure that the road network is consistent, visually accurate, and functions as intended in the game.
