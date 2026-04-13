# Requirements Document

## Introduction

PrepHire currently uses a dark theme with hardcoded inline hex color values throughout all pages and components. This feature introduces a full light/dark theme system by migrating all hardcoded colors to CSS custom properties (variables), adding a theme toggle in the Navigation bar, persisting the user's preference to localStorage, and defaulting to the OS-level `prefers-color-scheme` when no preference has been saved. All six pages (home, dashboard, prepare, interview, results, profile) and all interview sub-components (WebcamPanel, ChatPanel, MessageThread, ChatInputBar, TypingIndicator) must render correctly in both themes. Color transitions must be smooth so the switch is not jarring.

## Glossary

- **Theme_System**: The set of CSS custom properties, data attributes, and JavaScript logic that controls the active color theme across the application.
- **Theme_Toggle**: The button rendered inside the Navigation bar that switches between light and dark themes.
- **Theme_Manager**: The client-side module (hook or context) responsible for reading, writing, and broadcasting the active theme.
- **CSS_Variable**: A CSS custom property declared in `globals.css` under `:root` or `[data-theme]` selectors that maps a semantic token name to a color value.
- **Semantic_Token**: A named CSS variable representing a UI role (e.g., `--color-background`, `--color-card`) rather than a raw color value.
- **localStorage**: The browser's persistent key-value storage used to save the user's theme preference across sessions.
- **System_Preference**: The OS-level color scheme preference exposed via the CSS media query `prefers-color-scheme`.
- **Dark_Theme**: The theme using background `#2C2B30`, card `#4F4F51`, accent `#F58F7C`, secondary `#F2C4CE`, text `#D6D6D6`, border `#4F4F51`.
- **Light_Theme**: The theme using background `#FFFFFF`, card `#F5F5F5`, accent `#F58F7C`, secondary `#E8A0B0`, text `#1A1A1A`, border `#E0E0E0`.
- **Navigation**: The shared `Navigation.tsx` component rendered at the top of every page.
- **Interview_Components**: The five components under `src/components/interview/`: WebcamPanel, ChatPanel, MessageThread, ChatInputBar, and TypingIndicator.

---

## Requirements

### Requirement 1: CSS Variable Token System

**User Story:** As a developer, I want all colors defined as CSS custom properties, so that theme switching requires only a single attribute change on the root element rather than touching individual component styles.

#### Acceptance Criteria

1. THE Theme_System SHALL declare the following Semantic_Tokens in `globals.css`: `--color-background`, `--color-card`, `--color-accent`, `--color-secondary`, `--color-text`, `--color-border`.
2. THE Theme_System SHALL assign Dark_Theme values to all Semantic_Tokens under the `[data-theme="dark"]` selector.
3. THE Theme_System SHALL assign Light_Theme values to all Semantic_Tokens under the `[data-theme="light"]` selector.
4. THE Theme_System SHALL apply the `data-theme` attribute to the `<html>` element so that all descendant elements inherit the active token values.
5. THE Theme_System SHALL remove the existing hardcoded `--background` and `--foreground` variables from `:root` and replace them with the new Semantic_Token set.

### Requirement 2: Theme Toggle Button

**User Story:** As a user, I want a theme toggle button in the navigation bar, so that I can switch between light and dark themes at any time without leaving the current page.

#### Acceptance Criteria

1. THE Navigation SHALL render a Theme_Toggle button that is visible on all screen sizes.
2. WHEN the active theme is dark, THE Theme_Toggle SHALL display a sun icon indicating that clicking will switch to the Light_Theme.
3. WHEN the active theme is light, THE Theme_Toggle SHALL display a moon icon indicating that clicking will switch to the Dark_Theme.
4. WHEN the user clicks the Theme_Toggle, THE Theme_Manager SHALL switch the active theme to the opposite theme.
5. THE Theme_Toggle SHALL have an accessible `aria-label` attribute that describes the action it will perform (e.g., "Switch to light theme").

### Requirement 3: Theme Persistence

**User Story:** As a user, I want my theme preference saved, so that the app remembers my choice the next time I visit without requiring me to toggle again.

#### Acceptance Criteria

1. WHEN the user activates a theme via the Theme_Toggle, THE Theme_Manager SHALL write the selected theme value (`"light"` or `"dark"`) to localStorage under the key `"ph-theme"`.
2. WHEN the application loads, THE Theme_Manager SHALL read the `"ph-theme"` key from localStorage and apply the stored theme before the first render.
3. IF the `"ph-theme"` key is absent from localStorage, THEN THE Theme_Manager SHALL fall back to the System_Preference detection defined in Requirement 4.
4. THE Theme_Manager SHALL apply the resolved theme to the `<html>` element before the page is painted to prevent a flash of the wrong theme.

### Requirement 4: System Preference Default

**User Story:** As a first-time visitor, I want the app to match my OS color scheme by default, so that I don't have to manually configure the theme on my first visit.

#### Acceptance Criteria

1. WHEN no saved preference exists in localStorage, THE Theme_Manager SHALL query `window.matchMedia('(prefers-color-scheme: dark)')` to determine the default theme.
2. IF the System_Preference is dark, THEN THE Theme_Manager SHALL apply the Dark_Theme as the initial theme.
3. IF the System_Preference is light or not detectable, THEN THE Theme_Manager SHALL apply the Light_Theme as the initial theme.
4. WHEN the user has not set a preference and the OS preference changes, THE Theme_Manager SHALL update the active theme to match the new System_Preference.

### Requirement 5: Page-Wide Color Variable Migration

**User Story:** As a developer, I want all pages to use CSS variables instead of hardcoded hex values, so that theme switching takes effect uniformly across the entire application.

#### Acceptance Criteria

1. THE home page (`/`) SHALL reference only Semantic_Tokens for all color properties and SHALL contain no hardcoded hex color values.
2. THE dashboard page (`/dashboard`) SHALL reference only Semantic_Tokens for all color properties and SHALL contain no hardcoded hex color values.
3. THE prepare page (`/prepare`) SHALL reference only Semantic_Tokens for all color properties and SHALL contain no hardcoded hex color values.
4. THE interview page (`/interview`) SHALL reference only Semantic_Tokens for all color properties and SHALL contain no hardcoded hex color values.
5. THE results page (`/results`) SHALL reference only Semantic_Tokens for all color properties and SHALL contain no hardcoded hex color values.
6. THE profile page (`/profile`) SHALL reference only Semantic_Tokens for all color properties and SHALL contain no hardcoded hex color values.
7. WHEN the active theme changes, ALL pages SHALL reflect the new theme colors without requiring a page reload.

### Requirement 6: Navigation Theme Adaptation

**User Story:** As a user, I want the navigation bar to look correct in both themes, so that the header is always readable and visually consistent with the rest of the page.

#### Acceptance Criteria

1. THE Navigation SHALL use `var(--color-background)` for its background color in both themes.
2. THE Navigation SHALL use `var(--color-border)` for its bottom border in both themes.
3. THE Navigation SHALL use `var(--color-text)` for nav link text in both themes.
4. THE Navigation's profile dropdown menu SHALL use `var(--color-background)` as its background and `var(--color-border)` for its border in both themes.
5. THE Navigation's auth modal SHALL use `var(--color-background)` as its background and `var(--color-card)` for input fields in both themes.
6. THE Navigation SHALL contain no hardcoded hex color values.

### Requirement 7: Interview Component Theme Adaptation

**User Story:** As a user, I want the interview page components to render correctly in both themes, so that the chat UI and webcam panel are readable and usable regardless of the active theme.

#### Acceptance Criteria

1. THE WebcamPanel SHALL use Semantic_Tokens for all background, border, and text colors and SHALL contain no hardcoded hex color values.
2. THE ChatPanel SHALL use Semantic_Tokens for all background, border, and text colors and SHALL contain no hardcoded hex color values.
3. THE MessageThread SHALL use Semantic_Tokens for all background, border, and text colors and SHALL contain no hardcoded hex color values.
4. THE ChatInputBar SHALL use Semantic_Tokens for all background, border, and text colors and SHALL contain no hardcoded hex color values.
5. THE TypingIndicator SHALL use Semantic_Tokens for all background and text colors and SHALL contain no hardcoded hex color values.
6. WHEN the active theme changes during an active interview session, ALL Interview_Components SHALL update their colors without interrupting the session state.

### Requirement 8: Smooth Color Transitions

**User Story:** As a user, I want the theme switch to animate smoothly, so that the color change is not jarring or disorienting.

#### Acceptance Criteria

1. THE Theme_System SHALL declare a CSS transition on the `body` element that applies to `background-color`, `color`, and `border-color` properties.
2. THE transition duration SHALL be 200 milliseconds or less to remain responsive while still being perceptible.
3. THE transition timing function SHALL be `ease` or equivalent to produce a natural-feeling animation.
4. IF the user has enabled the `prefers-reduced-motion` media query, THEN THE Theme_System SHALL set the transition duration to `0ms` to respect the user's motion preference.
