---
name: ui-ux-pro-max
description: "UI/UX design intelligence for web, mobile, and desktop. Use when designing, building, reviewing, or fixing interfaces, components, design systems, accessibility, interaction, responsive layout, typography, color, charts, or stack-specific UI implementation."
---

# UI/UX Pro Max v2.15.0

This is the Codex-facing UI/UX design skill for this project. Apply it whenever a task changes how the interface looks, feels, moves, or is interacted with.

## Priority order

1. Accessibility — contrast, alt text, keyboard navigation, labels, focus visibility, reduced motion.
2. Touch & interaction — 44px+ targets, adequate spacing, loading feedback, visible states, gesture alternatives.
3. Performance — responsive images, reserved space, lazy loading, route/code splitting, low input latency.
4. Style selection — match product and industry, maintain one coherent visual language, use SVG icons rather than emoji.
5. Layout & responsive — mobile-first, systematic breakpoints, no horizontal overflow, readable text, safe fixed-element offsets.
6. Typography & color — consistent type scale, readable line length, semantic color tokens, sufficient contrast.
7. Animation — purposeful motion, context-aware timing, spatial continuity, prefers-reduced-motion support.
8. Forms & feedback — visible labels, inline errors, helper text, clear async states.
9. Navigation — predictable hierarchy, back behavior, clear primary action, deep-linkable flows.
10. Charts/data — accessible legends, tooltips, labels, and meaning that does not depend on color alone.

## Workflow

### 1. Inspect before changing
Detect the actual stack from the repository. Read the existing components, design tokens, routes, package dependencies, and current UI before proposing changes. Preserve useful existing identity unless the user explicitly asks for a redesign.

### 2. Establish product direction
For a new page or broad redesign, reason about product type, industry, audience, platform, visual style, density, motion level, and typography before implementation. Prefer one coherent design system across the application.

### 3. Search by semantic outcome first
When the full UI/UX search dataset is available, query the semantic UX outcome first, then the implementation stack. Examples: `error summary validation`, `focus not obscured`, `badge chip label wraps`, `keyboard focus modal`. Do not replace outcome-oriented searches with framework keywords.

### 4. Implement with consistency
Use design tokens for color, spacing, typography, radius, elevation, and motion. Avoid arbitrary one-off values. Keep components reusable and states explicit: default, hover, focus, pressed, disabled, loading, success, error, and empty.

### 5. Validate
Check desktop, tablet, and mobile layouts; keyboard navigation; contrast; focus visibility; reduced motion; text scaling; long labels; loading/error/empty states; and interaction feedback. Never remove accessibility affordances to make the UI look cleaner.

## Healthcare / emergency interfaces

For healthcare, dispatch, routing, ambulance, doctor, medicine, or emergency dashboards:
- Make urgency and operational status scannable without relying on color alone.
- Distinguish critical, warning, active, queued, completed, and unavailable states with text/icon/state treatment.
- Keep the primary operational action obvious on every screen.
- Make route/map information readable at a glance and provide textual alternatives where appropriate.
- Preserve strong focus states and keyboard operation for dispatch controls.
- Avoid decorative motion that competes with emergency information.
- Use progressive disclosure for secondary operational details.

## Anti-patterns

Do not use emoji as UI icons. Do not rely on hover alone. Do not use tiny body text. Do not disable zoom. Do not hide essential information behind truncation. Do not animate everything. Do not introduce multiple unrelated visual styles. Do not make color the only signal for status.

## Important limitation of this repository bootstrap

This project copy is a network-isolated Codex bootstrap of the official v2.15.0 skill. The full upstream searchable data catalog could not be fetched by the Codex environment because npm/GitHub requests return HTTP 403. Do not fabricate database results or claim a search was performed when the local catalog is unavailable. Use the rules in this file and the repository's existing design context until the full catalog is restored.
