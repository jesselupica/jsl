# Components Module

## Purpose

Reusable UI components shared across the JSL application. These are generic, themeable components that aren't specific to git or version control.

## Key Components

### Button.tsx
Primary button component with variants:
- Primary / Secondary / Danger
- Icon buttons
- Loading states
- Disabled states

**Usage:**
```tsx
<Button onClick={handleClick}>Save</Button>
<Button icon variant="primary">Submit</Button>
```

### Dropdown.tsx
Dropdown menu component:
- Single select
- Multi-select
- Custom rendering
- Keyboard navigation

### TextField.tsx / TextArea.tsx
Input components with:
- Validation states
- Error messages
- Label support
- Placeholders

### Tooltip.tsx
Hover tooltips:
- Configurable placement
- Delay settings
- Rich content support

### Badge.tsx
Small labels for status indicators:
- Color variants
- Icons
- Pill / rectangular shapes

### Icon.tsx
Icon component supporting:
- VSCode codicons
- Custom SVG icons
- Size variants
- Color theming

### Checkbox.tsx / Radio.tsx
Form input components:
- Controlled / uncontrolled
- Label support
- Group support for radios

### Panels.tsx
Layout component for split views:
- Resizable panels
- Horizontal / vertical split
- Persist sizes

### Tag.tsx
Chips/tags for displaying multiple items:
- Dismissible
- Color variants
- Icon support

### Flex.tsx
Flexbox layout helper component:
- Common flex patterns
- Gap support
- Alignment helpers

### Divider.tsx
Visual separator:
- Horizontal / vertical
- With label support

### KeyboardShortcuts.tsx
System for defining and handling keyboard shortcuts globally.

### Typeahead.tsx
Autocomplete input component:
- Async data loading
- Custom rendering
- Keyboard navigation

### DatetimePicker.tsx
Date and time selection component.

### ViewportOverlay.tsx
Component for rendering overlays (modals, popovers).

### ErrorNotice.tsx
Error display component:
- Expandable details
- Dismissible
- Different severity levels

## Theming

### ThemedComponentsRoot.tsx
Root component that sets up theme context:
- Light / dark mode
- CSS variables
- StyleX integration

### theme/
Theme configuration:
- `tokens.stylex.ts`: Design tokens (colors, spacing, etc.)
- `themeDark.css`: Dark mode overrides
- `themeLight.css`: Light mode overrides
- `layout.ts`: Layout constants

## Styling Approach

Components use **StyleX** (Facebook's CSS-in-JS):

```tsx
import * as stylex from '@stylexjs/stylex';

const styles = stylex.create({
  button: {
    padding: 8,
    backgroundColor: 'var(--button-background)',
  },
});

<button {...stylex.props(styles.button)}>Click</button>
```

### CSS Variables
Theme-aware via CSS custom properties:
- `--button-background`
- `--foreground`
- `--error`
- etc.

## Operating System Detection

### OperatingSystem.ts
Detects current OS for platform-specific behavior:
- Different keyboard shortcuts (Cmd vs Ctrl)
- Path separators
- UI conventions

## Component Explorer

### explorer/
Standalone app for previewing all components:

```bash
cd components
npm start
```

Opens interactive component gallery at http://localhost:3000

## Usage in JSL

```tsx
import {Button} from 'components/Button';
import {TextField} from 'components/TextField';
import {Tooltip} from 'components/Tooltip';

function MyFeature() {
  return (
    <div>
      <TextField placeholder="Commit message" />
      <Tooltip title="Create commit">
        <Button>Commit</Button>
      </Tooltip>
    </div>
  );
}
```

## Testing

### __tests__/
- `basic.test.tsx`: Smoke tests for all components
- `KeyboardShortcuts.test.tsx`: Keyboard handling tests
- `setupTests.ts`: Test environment setup

## Contributing Guidelines

When adding new components:
1. Make them generic and reusable
2. Support theming via CSS variables
3. Include TypeScript types
4. Add to component explorer
5. Follow existing patterns for props API
6. Support both light and dark themes
7. Include accessibility attributes (ARIA)

## Accessibility

Components should:
- Support keyboard navigation
- Include ARIA labels
- Have sufficient color contrast
- Support screen readers
- Follow WAI-ARIA best practices

