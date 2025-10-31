# GitHub Copilot Instructions for F2LTrainer-Svelte

## Project Overview

F2LTrainer-Svelte is a web-based training application for learning F2L (First Two Layers) algorithms for Rubik's cube solving. The application helps users practice and master various F2L cases through interactive training sessions.

## Technology Stack

- **Framework**: SvelteKit with Svelte 5 (using Svelte 5 runes for reactivity)
- **Language**: TypeScript (strict mode enabled)
- **Styling**: TailwindCSS v4 with Flowbite components
- **UI Components**: Flowbite-Svelte, Flowbite-Svelte-Icons, Flowbite-Svelte-Blocks
- **Build Tool**: Vite v7
- **Package Manager**: npm (with pnpm support via lockfile)
- **3D Cube Visualization**: cubing library
- **Documentation**: MDSvex for markdown support

## Code Style & Formatting

### Prettier Configuration
- **Indentation**: Tabs (not spaces)
- **Quotes**: Single quotes
- **Trailing Commas**: None
- **Print Width**: 100 characters
- **Plugins**: prettier-plugin-svelte, prettier-plugin-tailwindcss

### ESLint Rules
- TypeScript recommended rules enabled
- Svelte recommended rules enabled
- `no-undef` rule disabled for TypeScript files (TypeScript handles this)
- Browser and Node globals available

### Code Formatting Commands
- Format code: `npm run format`
- Check formatting: `npm run lint`
- Type checking: `npm run check`

## Project Structure

```
src/
├── lib/                      # Library code and components
│   ├── components/          # Svelte components
│   │   ├── SelectView/     # Case selection view
│   │   ├── TrainView/      # Training view
│   │   └── Modals/         # Modal dialogs
│   ├── data/               # Static data and configurations
│   ├── types/              # TypeScript type definitions
│   ├── utils/              # Utility functions
│   ├── casesState.svelte.ts    # Case state management
│   ├── globalState.svelte.ts   # Global application state
│   └── trainCaseQueue.svelte.ts # Training queue state
├── routes/                  # SvelteKit routes
│   ├── +layout.svelte      # Root layout
│   ├── +layout.ts          # Layout load function
│   └── +page.svelte        # Main page
└── app.css                 # Global styles

e2e/                        # Playwright end-to-end tests
```

## State Management

This project uses **Svelte 5 runes** for state management:

- `$state()` for reactive state
- `$derived()` for computed values
- `$effect()` for side effects
- `.svelte.ts` files for shared state modules

**Key State Files:**
- `globalState.svelte.ts`: Application-wide settings and UI state
- `casesState.svelte.ts`: F2L case states (unlearned, learning, finished)
- `trainCaseQueue.svelte.ts`: Training session queue and progress

State is persisted to localStorage using utility functions in `utils/localStorage.ts`.

## Development Workflow

### Setup
```bash
npm install          # Install dependencies (requires Node.js >=22.3.0)
npm run dev          # Start development server (http://localhost:5173)
```

### Build & Deploy
```bash
npm run build        # Production build
npm run preview      # Preview production build
npm run pages:prepare # Prepare for GitHub Pages deployment
```

### Testing
- **Unit Tests**: Vitest with browser environment for Svelte component tests
  - Client tests: `src/**/*.svelte.{test,spec}.{js,ts}`
  - Server tests: `src/**/*.{test,spec}.{js,ts}` (excluding .svelte tests)
  - Run: `npm run test:unit`
  
- **E2E Tests**: Playwright tests in the `e2e/` directory
  - Run: `npm run test:e2e`
  - Full test suite: `npm test`

### Quality Checks
```bash
npm run check        # Type check with svelte-check
npm run lint         # Prettier + ESLint checks
npm run format       # Auto-format all files
```

## Key Architectural Patterns

### Svelte 5 Runes
Always use Svelte 5 syntax and runes:
- Use `$state()` instead of `let` for reactive variables
- Use `$derived()` for computed values
- Use `$effect()` for side effects
- Use `$props()` for component props

### Component Structure
- Use `<script lang="ts">` for TypeScript in components
- Follow single-file component structure
- Use Flowbite-Svelte components for UI consistency
- Keep components focused and composable

### Type Safety
- Define types in `src/lib/types/` directory
- Use TypeScript strict mode
- Avoid `any` types where possible
- Export and reuse type definitions

### Naming Conventions
- Components: PascalCase (e.g., `SelectView.svelte`)
- Files: camelCase for utilities, PascalCase for components
- State files: `*.svelte.ts` for shared state modules
- Types: PascalCase for interfaces and types

## GitHub Pages Deployment

The application is deployed to GitHub Pages with:
- Base path: `/F2LTrainer-Svelte` (configured in `svelte.config.js`)
- Adapter: `@sveltejs/adapter-auto` with SPA fallback
- Deployment: Automated via GitHub Actions on push to `main`

## Important Notes

### Dependencies
- The `cubing` library requires Node.js >=22.3.0 or Bun >=1.2.7
- Use GitHub Actions with Node 22 for CI/CD (configured in `.github/workflows/deploy.yml`)

### Local Storage
- User preferences and case states are stored in localStorage
- Use utilities from `utils/localStorage.ts` for persistence
- Handle cases where localStorage might not be available

### Cube Algorithms
- Algorithms use standard cube notation
- Support for AUF (Adjust U Face) additions
- Algorithm mirroring for left/right cases
- Stickering patterns for visualization

## Best Practices

1. **Always run linting and type checking** before committing
2. **Write tests** for new features and bug fixes
3. **Use existing Flowbite components** instead of custom styling where possible
4. **Keep state management simple** - use Svelte 5 runes patterns
5. **Document complex logic** with comments when necessary
6. **Handle edge cases** especially around localStorage and user input
7. **Test in different browsers** as this is a progressive web app
8. **Maintain accessibility** - ensure keyboard navigation and screen reader support

## Common Tasks

### Adding a New F2L Case
1. Add case definition to appropriate data file in `src/lib/data/`
2. Update types if needed in `src/lib/types/`
3. Add to case selection UI in `SelectView` components
4. Test visualization with TwistyPlayer component

### Adding a New Component
1. Create in appropriate subdirectory under `src/lib/components/`
2. Use TypeScript with proper prop types
3. Follow Flowbite-Svelte component patterns
4. Add unit test in `*.svelte.spec.ts` file

### Modifying State
1. Update state definition in appropriate `.svelte.ts` file
2. Update TypeScript types in `src/lib/types/`
3. Update localStorage persistence if needed
4. Test state changes with unit tests

### Adding New Settings
1. Update `GlobalState` type in `src/lib/types/globalState.ts`
2. Add to default state in `globalState.svelte.ts`
3. Add UI controls in Settings modal
4. Ensure persistence to localStorage
