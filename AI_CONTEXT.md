# Antigravity AI Context & Project Rules

## Project Overview

**Name:** F2LTrainer
**Description:** A speedcubing training application for F2L (First 2 Layers), featuring 3D cube rendering, algorithm management, and timing statistics.

## Technology Stack

- **Framework:** Svelte 5 (Runes mode)
- **Build Tool:** Vite
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4 (via @tailwindcss/vite)
- **UI Components:** Flowbite Svelte
- **Icons:** Lucide Svelte, Flowbite Svelte Icons
- **Domain Logic:** `cubing.js` for puzzle logic and rendering
- **Package Manager:** pnpm

## Coding Conventions

1.  **State Management:** Use Svelte 5 runes (`$state`, `$derived`, `$effect`, `$props`) exclusively. Avoid legacy Svelte 4 stores or `export let` syntax where possible.
2.  **Components:**
    - Locate in `src/lib/components/`.
    - Use functional patterns.
    - Ensure responsiveness (mobile-first approach).
3.  **Styling:**
    - Use utility classes (Tailwind) primarily.
    - Avoid `style` tags unless necessary for dynamic values.
4.  **Imports:**
    - Use `$lib/` alias for imports from `src/lib`.
5.  **Types:**
    - Define types in `src/lib/types/`.
    - Prefer `type` over `interface`.

## Key Features & Context

- **TrainView:** The main training interface.
- **TwistyPlayer:** Wrapper around `cubing.js` for 3D visualization.
- **Algorithms:** Users can select, mirror, and manage algorithms for specific cases.
- **Timer:** Integrated timer with inspection and stats (Ao5, Ao12).

## User Preferences

- **IDE:** Antigravity (VS Code fork).
- **Design:** Prioritize premium, "wow" aesthetics with smooth animations and modern UI patterns.
- **Performance:** Low latency is critical for the timer and cube interactions.
