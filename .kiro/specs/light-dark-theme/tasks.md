# Implementation Plan: Light/Dark Theme

## Overview

Migrate PrepHire from hardcoded hex colors to a CSS variable token system, add a `useTheme` hook and `ThemeToggle` component, wire the toggle into Navigation, and migrate all six pages and five interview components to use semantic tokens. An anti-flash inline script in `layout.tsx` prevents a flash of the wrong theme on load.

## Tasks

- [x] 1. Update `globals.css` with CSS variable tokens and transitions
  - Remove the existing `--background` and `--foreground` variables from `:root`
  - Add `[data-theme="dark"]` block with all six semantic tokens (`--color-background`, `--color-card`, `--color-accent`, `--color-secondary`, `--color-text`, `--color-border`) using the Dark_Theme hex values
  - Add `[data-theme="light"]` block with the same six tokens using the Light_Theme hex values
  - Update `body` to use `var(--color-background)` and `var(--color-text)`, and add `transition: background-color 200ms ease, color 200ms ease, border-color 200ms ease`
  - Add `@media (prefers-reduced-motion: reduce) { body { transition-duration: 0ms; } }`
  - _Requirements: 1.1, 1.2, 1.3, 1.5, 8.1, 8.2, 8.3, 8.4_

- [x] 2. Add anti-flash inline script to `layout.tsx`
  - Add a `<script dangerouslySetInnerHTML>` as the first child of `<body>` (before `<Providers>`) that reads `localStorage["ph-theme"]`, falls back to `matchMedia('(prefers-color-scheme: dark)')`, and calls `document.documentElement.setAttribute('data-theme', ...)` synchronously
  - Wrap all access in `try/catch` to handle private browsing
  - _Requirements: 1.4, 3.4_

- [x] 3. Create `useTheme` hook — `src/hooks/useTheme.ts`
  - [x] 3.1 Implement the `useTheme` hook
    - On mount: read `localStorage["ph-theme"]`; validate against `['light', 'dark']`; if absent or invalid, read `window.matchMedia('(prefers-color-scheme: dark)')`; apply resolved theme to `document.documentElement.dataset.theme`
    - Subscribe to `matchMedia` `change` events only when no localStorage preference exists; unsubscribe on cleanup
    - `toggleTheme`: flip theme, write to `localStorage["ph-theme"]`, update `document.documentElement.dataset.theme`
    - Guard all `window`/`localStorage` access with `typeof window !== 'undefined'` checks
    - _Requirements: 2.4, 3.1, 3.2, 3.3, 4.1, 4.2, 4.3, 4.4_

  - [ ]* 3.2 Write property test for `useTheme` — Property 1: data-theme reflects active theme
    - **Property 1: data-theme attribute reflects active theme**
    - **Validates: Requirements 1.4, 3.1**

  - [ ]* 3.3 Write property test for `useTheme` — Property 2: toggle is a round trip
    - **Property 2: Theme toggle is a round trip**
    - **Validates: Requirements 2.4, 3.1**

  - [ ]* 3.4 Write property test for `useTheme` — Property 4: localStorage round trip
    - **Property 4: localStorage round trip**
    - **Validates: Requirements 3.1, 3.2**

  - [ ]* 3.5 Write property test for `useTheme` — Property 5: OS preference respected when no localStorage entry
    - **Property 5: OS preference respected when no localStorage entry**
    - **Validates: Requirements 4.1, 4.2, 4.3**

  - [ ]* 3.6 Write property test for `useTheme` — Property 6: OS preference change updates theme
    - **Property 6: OS preference change updates theme**
    - **Validates: Requirements 4.4**

  - [ ]* 3.7 Write unit tests for `useTheme`
    - Test: initializes to dark when `localStorage["ph-theme"] === "dark"`
    - Test: initializes to light when `localStorage["ph-theme"] === "light"`
    - Test: falls back to OS dark when localStorage empty and matchMedia returns dark
    - Test: falls back to light when localStorage empty and matchMedia returns light
    - Test: ignores invalid localStorage values (e.g. `"blue"`)
    - Test: handles `localStorage` throwing (private browsing simulation)
    - _Requirements: 3.1, 3.2, 3.3, 4.1, 4.2, 4.3_

- [x] 4. Create `ThemeToggle` component — `src/components/ThemeToggle.tsx`
  - [x] 4.1 Implement `ThemeToggle`
    - Import `useTheme` and `Sun`, `Moon` from `lucide-react`
    - Render a `<button>` that calls `toggleTheme` on click
    - Show `<Sun>` icon when theme is `"dark"`; show `<Moon>` icon when theme is `"light"`
    - Set `aria-label="Switch to light theme"` when dark, `"Switch to dark theme"` when light
    - Style icon color with `var(--color-text)`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ]* 4.2 Write property test for `ThemeToggle` — Property 3: toggle icon is always the opposite theme
    - **Property 3: Toggle icon is always the opposite theme**
    - **Validates: Requirements 2.2, 2.3, 2.5**

  - [ ]* 4.3 Write unit tests for `ThemeToggle`
    - Test: renders sun icon in dark mode
    - Test: renders moon icon in light mode
    - Test: has correct `aria-label` in each mode
    - _Requirements: 2.2, 2.3, 2.5_

- [ ] 5. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Update `Navigation.tsx` — add `ThemeToggle` and migrate hardcoded hex to CSS vars
  - Import and render `<ThemeToggle />` in the desktop nav row (alongside the existing links) and in the mobile menu area
  - Replace all hardcoded hex values with CSS variable equivalents:
    - `#2C2B30` → `var(--color-background)` (nav background, dropdown background, modal background)
    - `#4F4F51` → `var(--color-card)` (input backgrounds, hover states, border values)
    - `#F58F7C` → `var(--color-accent)` (Sign Up button background, focus rings, icon colors)
    - `#F2C4CE` → `var(--color-secondary)` (brand text, link hover, modal subheadings)
    - `#D6D6D6` → `var(--color-text)` (nav link text, body text, placeholder text)
    - `#4F4F51` → `var(--color-border)` (border colors)
  - Replace Tailwind arbitrary-value classes (e.g. `border-[#4F4F51]`, `hover:bg-[#4F4F51]`, `text-[#D6D6D6]`) with inline style props using CSS variables
  - _Requirements: 2.1, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

- [x] 7. Migrate home page (`src/app/page.tsx`) to CSS vars
  - Replace all hardcoded hex values in `style` props and Tailwind arbitrary classes with the corresponding `var(--color-*)` tokens
  - _Requirements: 5.1, 5.7_

- [x] 8. Migrate dashboard page (`src/app/dashboard/page.tsx`) to CSS vars
  - Replace all hardcoded hex values in `style` props and Tailwind arbitrary classes with the corresponding `var(--color-*)` tokens
  - _Requirements: 5.2, 5.7_

- [x] 9. Migrate prepare page (`src/app/prepare/page.tsx`) to CSS vars
  - Replace all hardcoded hex values in `style` props and Tailwind arbitrary classes with the corresponding `var(--color-*)` tokens
  - _Requirements: 5.3, 5.7_

- [x] 10. Migrate interview page (`src/app/interview/page.tsx`) to CSS vars
  - Replace all hardcoded hex values in `style` props and Tailwind arbitrary classes with the corresponding `var(--color-*)` tokens
  - _Requirements: 5.4, 5.7_

- [x] 11. Migrate results page (`src/app/results/page.tsx`) to CSS vars
  - Replace all hardcoded hex values in `style` props and Tailwind arbitrary classes with the corresponding `var(--color-*)` tokens
  - _Requirements: 5.5, 5.7_

- [x] 12. Migrate profile page (`src/app/profile/page.tsx`) to CSS vars
  - Replace all hardcoded hex values in `style` props and Tailwind arbitrary classes with the corresponding `var(--color-*)` tokens
  - _Requirements: 5.6, 5.7_

- [x] 13. Migrate interview components to CSS vars
  - [x] 13.1 Migrate `WebcamPanel.tsx`
    - Replace `#2C2B30`, `#4F4F51`, `#D6D6D6`, `#F2C4CE`, `#F58F7C` with CSS variable equivalents
    - _Requirements: 7.1, 7.6_

  - [x] 13.2 Migrate `ChatPanel.tsx`
    - Replace `#2C2B30` with `var(--color-background)`
    - _Requirements: 7.2, 7.6_

  - [x] 13.3 Migrate `MessageThread.tsx`
    - Replace `#4F4F51` → `var(--color-card)`, `#D6D6D6` → `var(--color-text)`, `#F58F7C` → `var(--color-accent)`, `#2C2B30` → `var(--color-background)`
    - _Requirements: 7.3, 7.6_

  - [x] 13.4 Migrate `ChatInputBar.tsx`
    - Replace all hardcoded hex values; note `#3A3940` (textarea background) is closest to `var(--color-card)` — use `var(--color-card)` or define it as a slightly offset card shade
    - _Requirements: 7.4, 7.6_

  - [x] 13.5 Migrate `TypingIndicator.tsx`
    - Replace `#4F4F51` → `var(--color-card)`, `#D6D6D6` → `var(--color-text)`
    - _Requirements: 7.5, 7.6_

- [ ] 14. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ]* 15. Write property test — Property 7: no hardcoded hex values in migrated files
  - **Property 7: No hardcoded hex values in migrated files**
  - Use `fast-check` with `fc.constantFrom(...filesToCheck)` to assert no raw hex literals appear in style-bearing source files (excluding comments and `globals.css` variable declarations)
  - **Validates: Requirements 5.1–5.6, 6.1–6.6, 7.1–7.5**

- [ ]* 16. Write property test — Property 8: theme change does not reset interview session state
  - **Property 8: Theme change does not reset interview session state**
  - Use `fast-check` to generate arbitrary message arrays and `currentIndex` values, render the interview hook, call `toggleTheme`, and assert React state is unchanged
  - **Validates: Requirements 7.6**

- [ ] 17. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- The hex `#3A3940` in `ChatInputBar` has no direct token equivalent — map it to `var(--color-card)` or add a `--color-input` token if visual fidelity requires it
- All property tests use `fast-check` with a minimum of 100 iterations per the design spec
- Tag each property test with `// Feature: light-dark-theme, Property N: <property text>`
