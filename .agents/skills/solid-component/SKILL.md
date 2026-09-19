---
name: solid-component
description: >
  Enforces SOLID principles when creating or refactoring React/TypeScript components.
  Auto-load whenever writing a new component, designing component architecture, or
  refactoring an existing component. Applies to apps/web and any future mobile/shared UI.
allowed-tools:
  - Read
  - Edit
  - Write
  - Glob
  - Grep
---

# SOLID Component Checklist

Before writing or finalizing any component, verify each principle below. If a principle is violated, refactor before moving on.

## S — Single Responsibility

One component = one UI concern. Ask: "What does this component do?" — if the answer needs "and", split it.

- Extract data-fetching into a custom hook
- Extract sub-sections into named sub-components
- A component that fetches + renders + handles form state violates S

## O — Open/Closed

Components extend via props, not by forking. Closed for internal modification, open for external composition.

- Use `variant`, `size`, `asChild` props instead of duplicating components
- Use `children` for content injection instead of special-case props
- Never add an `if (specialCase)` branch inside a shared component — add a prop instead

## L — Liskov Substitution

Variants must be drop-in replacements. Any consumer of `<Button>` must be able to use `<IconButton>` without adapting call sites.

- Extend native HTML element props: `interface ButtonProps extends React.ComponentProps<'button'>`
- Spread `...rest` onto the root element so aria/data/event props flow through
- Never remove props that the parent interface guarantees

## I — Interface Segregation

Don't force consumers to pass props they don't use. Split large prop interfaces.

- Prefer discriminated unions over a bag of optional props: `type Props = { variant: 'icon'; icon: LucideIcon } | { variant: 'text'; label: string }`
- If a prop is only used when another prop has a specific value, restructure
- Shared base props → separate interface, extend it

## D — Dependency Inversion

Depend on abstractions (interfaces/types), not concrete implementations.

- Accept callbacks as props instead of importing services directly: `onSubmit: (data: FormData) => Promise<void>`
- Use render props or slot props for framework coupling: `renderIcon?: () => React.ReactNode`
- Never `import { toast } from 'sonner'` inside a reusable component — pass a callback

---

## Workflow

1. **Before writing**: Name the component and state its single responsibility in one sentence.
2. **While writing**: Check each principle above as you go.
3. **After writing**: Do a final pass — read the component top to bottom and verify all 5.
4. **If unsure on a pattern**: See [references/solid-react.md](references/solid-react.md) for concrete examples.

## Red Flags (stop and refactor)

- Component file > 150 lines → likely violates S
- Prop named `isSpecialCase`, `showForAdmin`, `legacyMode` → violates O
- Props that are only sometimes used together → violates I
- Direct `import` of a toast library, router, or analytics inside a presentational component → violates D
