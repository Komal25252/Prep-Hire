# Design Document: Light/Dark Theme

## Overview

PrepHire currently renders every page and component with hardcoded inline hex color values. This design introduces a full light/dark theme system built entirely on CSS custom properties (variables) and a single `data-theme` attribute on the `<html>` element. No new npm dependencies are required.

The system has four moving parts:

1. **`globals.css`** — declares the six semantic color tokens under `[data-theme="dark"]` and `[data-theme="light"]` selectors, plus a smooth CSS transition on `body`.
2. **`useTheme` hook** — client-side React hook that reads/writes the active theme to `localStorage`, falls back to `prefers-color-scheme`, and keeps the `<html>` `data-theme` attribute in sync.
3. **`ThemeToggle` component** — a sun/moon button rendered inside `Navigation.tsx`.
4. **Color migration** — every page and component replaces `style={{ color: '#D6D6D6' }}` with `style={{ color: 'var(--color-text)' }}` (and equivalent for all other tokens).

A small inline `<script>` in `layout.tsx` reads `localStorage` synchronously before the first paint to prevent a flash of the wrong theme.

---

## Architecture

```mermaid
flowchart TD
    A[layout.tsx\ninline script] -->|sets data-theme on html| B[<html data-theme="dark|light">]
    B -->|CSS cascade| C[globals.css\nCSS variables resolve]
    D[useTheme hook] -->|reads/writes| E[localStorage\nph-theme]
    D -->|listens to| F[matchMedia\nprefers-color-scheme]
    D -->|setAttribute| B
    G[ThemeToggle button] -->|calls toggleTheme| D
    C -->|var(--color-*)| H[All pages & components]
```

Theme resolution priority (highest to lowest):

1. `localStorage["ph-theme"]` — explicit user preference
2. `window.matchMedia('(prefers-color-scheme: dark)')` — OS preference
3. Light theme — safe default

---

## Components and Interfaces

### `useTheme` hook — `src/hooks/useTheme.ts`

```ts
type Theme = 'light' | 'dark';

interface UseThemeReturn {
  theme: Theme;
  toggleTheme: () => void;
}

export function useTheme(): UseThemeReturn
```

Responsibilities:
- On mount: read `localStorage["ph-theme"]`; if absent, read `matchMedia`; apply resolved theme to `document.documentElement.dataset.theme`.
- Subscribe to `matchMedia` `change` events (only when no localStorage preference exists).
- `toggleTheme`: flip theme, write to `localStorage`, update `document.documentElement.dataset.theme`.

### `ThemeToggle` component — `src/components/ThemeToggle.tsx`

```tsx
export default function ThemeToggle(): JSX.Element
```

- Renders a `<button>` with `aria-label="Switch to light theme"` (dark mode) or `"Switch to dark theme"` (light mode).
- Shows `<Sun>` icon when theme is dark; `<Moon>` icon when theme is light (both from `lucide-react`).
- Calls `toggleTheme` from `useTheme` on click.
- Styled with `var(--color-text)` for icon color.

### `Navigation.tsx` changes

- Import and render `<ThemeToggle />` in the desktop nav row and mobile menu.
- Replace all hardcoded hex values with CSS variable equivalents (see migration table below).

### `layout.tsx` changes

Add an inline `<script>` as the first child of `<body>` (before `<Providers>`):

```html
<script dangerouslySetInnerHTML={{ __html: `
  (function() {
    try {
      var stored = localStorage.getItem('ph-theme');
      if (stored === 'light' || stored === 'dark') {
        document.documentElement.setAttribute('data-theme', stored);
      } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        document.documentElement.setAttribute('data-theme', 'light');
      }
    } catch(e) {}
  })();
` }} />
```

This runs synchronously before React hydration, eliminating the flash of wrong theme (FOWT).

---

## Data Models

### Token mapping

| Semantic token        | Dark value  | Light value |
|-----------------------|-------------|-------------|
| `--color-background`  | `#2C2B30`   | `#FFFFFF`   |
| `--color-card`        | `#4F4F51`   | `#F5F5F5`   |
| `--color-accent`      | `#F58F7C`   | `#F58F7C`   |
| `--color-secondary`   | `#F2C4CE`   | `#E8A0B0`   |
| `--color-text`        | `#D6D6D6`   | `#1A1A1A`   |
| `--color-border`      | `#4F4F51`   | `#E0E0E0`   |

### localStorage schema

| Key        | Values           | Description                    |
|------------|------------------|--------------------------------|
| `ph-theme` | `"light"`, `"dark"` | Persisted user theme preference |

### Inline style migration pattern

Every occurrence of a hardcoded hex in a `style` prop or inline style object is replaced with the corresponding CSS variable:

| Hardcoded hex | CSS variable              | Role       |
|---------------|---------------------------|------------|
| `#2C2B30`     | `var(--color-background)` | Background |
| `#4F4F51`     | `var(--color-card)`       | Card/surface |
| `#F58F7C`     | `var(--color-accent)`     | Accent/CTA |
| `#F2C4CE`     | `var(--color-secondary)`  | Secondary  |
| `#D6D6D6`     | `var(--color-text)`       | Body text  |
| `#4F4F51`     | `var(--color-border)`     | Borders    |

Tailwind utility classes that embed hex values (e.g. `border-[#4F4F51]`, `hover:bg-[#4F4F51]`) are replaced with inline style props or Tailwind CSS variable utilities where possible, or extracted to a CSS class.

### `globals.css` structure

```css
/* Remove old :root --background / --foreground */

[data-theme="dark"] {
  --color-background: #2C2B30;
  --color-card:       #4F4F51;
  --color-accent:     #F58F7C;
  --color-secondary:  #F2C4CE;
  --color-text:       #D6D6D6;
  --color-border:     #4F4F51;
}

[data-theme="light"] {
  --color-background: #FFFFFF;
  --color-card:       #F5F5F5;
  --color-accent:     #F58F7C;
  --color-secondary:  #E8A0B0;
  --color-text:       #1A1A1A;
  --color-border:     #E0E0E0;
}

body {
  background-color: var(--color-background);
  color: var(--color-text);
  transition: background-color 200ms ease, color 200ms ease, border-color 200ms ease;
}

@media (prefers-reduced-motion: reduce) {
  body { transition-duration: 0ms; }
}
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: data-theme attribute reflects active theme

*For any* theme value (`"light"` or `"dark"`), after the theme manager applies that theme, `document.documentElement.getAttribute('data-theme')` must equal that theme value.

**Validates: Requirements 1.4, 3.1**

### Property 2: Theme toggle is a round trip

*For any* starting theme, calling `toggleTheme` twice must return the active theme to its original value, and `localStorage["ph-theme"]` must equal the original theme after both calls.

**Validates: Requirements 2.4, 3.1**

### Property 3: Toggle icon is always the opposite theme

*For any* active theme state, the `ThemeToggle` button must render the icon that represents the opposite theme (sun when dark, moon when light), and its `aria-label` must describe switching to the opposite theme.

**Validates: Requirements 2.2, 2.3, 2.5**

### Property 4: localStorage round trip

*For any* theme value written by `toggleTheme`, reading `localStorage["ph-theme"]` immediately after must return that same value, and re-initializing the hook with that localStorage state must produce the same active theme.

**Validates: Requirements 3.1, 3.2**

### Property 5: OS preference is respected when no localStorage entry exists

*For any* `prefers-color-scheme` value (`dark` or `light`/unset), when `localStorage["ph-theme"]` is absent, the theme manager must initialize the active theme to match the OS preference.

**Validates: Requirements 4.1, 4.2, 4.3**

### Property 6: OS preference change updates theme (no saved preference)

*For any* sequence of OS preference change events, when no localStorage preference exists, each change event must cause the active theme to update to match the new OS preference.

**Validates: Requirements 4.4**

### Property 7: No hardcoded hex values in migrated files

*For any* source file in `src/app/` and `src/components/`, no color-related style property may contain a hardcoded hex color value — all colors must be expressed as `var(--color-*)` CSS variable references.

**Validates: Requirements 5.1–5.6, 6.1–6.6, 7.1–7.5**

### Property 8: Theme change does not reset interview session state

*For any* interview session state (messages, current index, responses), calling `toggleTheme` must leave all React state values unchanged.

**Validates: Requirements 7.6**

---

## Error Handling

| Scenario | Handling |
|---|---|
| `localStorage` unavailable (private browsing, quota exceeded) | The inline script and `useTheme` hook wrap all `localStorage` access in `try/catch`; fall back to OS preference silently. |
| `matchMedia` unavailable (SSR, old browser) | Guard with `typeof window !== 'undefined'` and `window.matchMedia` existence check; default to light theme. |
| Invalid `localStorage` value (e.g. `"blue"`) | `useTheme` validates the stored value against `['light', 'dark']`; ignores invalid values and falls back to OS preference. |
| `data-theme` attribute missing on `<html>` | CSS variables will be undefined; the inline script in `layout.tsx` ensures the attribute is always set before first paint. |

---

## Testing Strategy

### Unit tests

Focus on specific examples, edge cases, and integration points:

- `useTheme` initializes to dark when `localStorage["ph-theme"] === "dark"`.
- `useTheme` initializes to light when `localStorage["ph-theme"] === "light"`.
- `useTheme` falls back to OS dark preference when localStorage is empty and `matchMedia` returns dark.
- `useTheme` falls back to light when localStorage is empty and `matchMedia` returns light.
- `useTheme` ignores invalid localStorage values (e.g. `"blue"`).
- `useTheme` handles `localStorage` throwing (private browsing).
- `ThemeToggle` renders sun icon in dark mode.
- `ThemeToggle` renders moon icon in light mode.
- `ThemeToggle` has correct `aria-label` in each mode.
- Inline script in `layout.tsx` sets `data-theme` before React hydration.
- CSS transition declaration includes `background-color`, `color`, `border-color` at ≤200ms.
- `@media (prefers-reduced-motion)` sets transition to `0ms`.

### Property-based tests

Use **fast-check** (already compatible with the Next.js/Jest setup, zero new runtime dependencies).

Each property test runs a minimum of **100 iterations**.

Tag format: `// Feature: light-dark-theme, Property N: <property text>`

**Property 1 — data-theme reflects active theme**
```ts
// Feature: light-dark-theme, Property 1: data-theme attribute reflects active theme
fc.assert(fc.property(
  fc.constantFrom('light', 'dark'),
  (theme) => {
    applyTheme(theme); // calls document.documentElement.setAttribute
    return document.documentElement.getAttribute('data-theme') === theme;
  }
), { numRuns: 100 });
```

**Property 2 — Toggle is a round trip**
```ts
// Feature: light-dark-theme, Property 2: Theme toggle is a round trip
fc.assert(fc.property(
  fc.constantFrom('light', 'dark'),
  (initial) => {
    setTheme(initial);
    toggleTheme(); toggleTheme();
    return getTheme() === initial && localStorage.getItem('ph-theme') === initial;
  }
), { numRuns: 100 });
```

**Property 3 — Toggle icon is always the opposite theme**
```ts
// Feature: light-dark-theme, Property 3: Toggle icon is always the opposite theme
fc.assert(fc.property(
  fc.constantFrom('light', 'dark'),
  (theme) => {
    render(<ThemeToggle />, { theme });
    const btn = screen.getByRole('button');
    const expectSun = theme === 'dark';
    return expectSun
      ? btn.querySelector('[data-icon="sun"]') !== null
      : btn.querySelector('[data-icon="moon"]') !== null;
  }
), { numRuns: 100 });
```

**Property 4 — localStorage round trip**
```ts
// Feature: light-dark-theme, Property 4: localStorage round trip
fc.assert(fc.property(
  fc.constantFrom('light', 'dark'),
  (theme) => {
    setTheme(theme);
    const stored = localStorage.getItem('ph-theme');
    const rehydrated = resolveTheme(); // reads localStorage
    return stored === theme && rehydrated === theme;
  }
), { numRuns: 100 });
```

**Property 5 — OS preference respected when no localStorage entry**
```ts
// Feature: light-dark-theme, Property 5: OS preference respected when no localStorage entry
fc.assert(fc.property(
  fc.boolean(), // true = OS dark, false = OS light
  (osDark) => {
    localStorage.removeItem('ph-theme');
    mockMatchMedia(osDark);
    const theme = resolveTheme();
    return theme === (osDark ? 'dark' : 'light');
  }
), { numRuns: 100 });
```

**Property 6 — OS preference change updates theme**
```ts
// Feature: light-dark-theme, Property 6: OS preference change updates theme
fc.assert(fc.property(
  fc.array(fc.boolean(), { minLength: 1, maxLength: 10 }),
  (changes) => {
    localStorage.removeItem('ph-theme');
    let lastTheme: Theme;
    changes.forEach((osDark) => {
      fireMatchMediaChange(osDark);
      lastTheme = getTheme();
    });
    return lastTheme! === (changes[changes.length - 1] ? 'dark' : 'light');
  }
), { numRuns: 100 });
```

**Property 7 — No hardcoded hex values in migrated files**
```ts
// Feature: light-dark-theme, Property 7: No hardcoded hex values in migrated files
// This is a static analysis property run once over the file set.
const HEX_PATTERN = /#[0-9A-Fa-f]{3,6}\b/;
const filesToCheck = glob.sync('src/**/*.{tsx,ts,css}', { ignore: ['**/*.test.*'] });
fc.assert(fc.property(
  fc.constantFrom(...filesToCheck),
  (file) => {
    const src = fs.readFileSync(file, 'utf8');
    // Allow hex only in comments and the globals.css variable declarations
    const strippedComments = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*/g, '');
    return !HEX_PATTERN.test(strippedComments);
  }
), { numRuns: filesToCheck.length });
```

**Property 8 — Theme change does not reset interview session state**
```ts
// Feature: light-dark-theme, Property 8: Theme change does not reset interview session state
fc.assert(fc.property(
  fc.array(fc.string(), { minLength: 1, maxLength: 15 }), // messages
  fc.nat(14), // currentIndex
  (messages, currentIndex) => {
    const { result } = renderHook(() => useInterviewSession(messages, currentIndex));
    const before = { messages: result.current.messages, index: result.current.currentIndex };
    act(() => toggleTheme());
    return (
      result.current.messages === before.messages &&
      result.current.currentIndex === before.index
    );
  }
), { numRuns: 100 });
```
