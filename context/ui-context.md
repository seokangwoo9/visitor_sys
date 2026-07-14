# UI Context

## Theme

Light only. No dark mode.

The visual language follows a modern enterprise design focused on clarity, simplicity, and usability for factory visitors and administrators.

The interface should feel professional, clean, and trustworthy while minimizing distractions.

All colors are defined as CSS custom properties in `globals.css` and mapped to Tailwind tokens via `@theme inline`.

Components must use these tokens only.

Never use hardcoded hex colors or raw Tailwind color classes.

| Role | CSS Variable | Hex Value |
| ---------------- | ---------------------- | --------- |
| Page Background | `--bg-base` | `#F8FAFC` |
| Surface | `--bg-surface` | `#FFFFFF` |
| Elevated Surface | `--bg-elevated` | `#FFFFFF` |
| Subtle Surface | `--bg-subtle` | `#F1F5F9` |
| Default Border | `--border-default` | `#E2E8F0` |
| Subtle Border | `--border-subtle` | `#CBD5E1` |
| Primary Text | `--text-primary` | `#0F172A` |
| Secondary Text | `--text-secondary` | `#334155` |
| Muted Text | `--text-muted` | `#64748B` |
| Brand Primary | `--brand-primary` | `#059669` |
| Brand Secondary | `--brand-secondary` | `#047857` |
| Success | `--state-success` | `#16A34A` |
| Warning | `--state-warning` | `#F59E0B` |
| Error | `--state-error` | `#DC2626` |

Tailwind utility names should reference these design tokens instead of raw colors.

---

## Typography

| Role | Font |
| --------- | ---------------- |
| UI Text | Geist Sans |
| Numbers | Geist Sans |
| Monospace | Geist Mono |

Typography Guidelines

- Clear hierarchy
- Comfortable spacing
- Large readable form labels
- Large button text
- Mobile-friendly sizing

Avoid decorative fonts.

---

## Border Radius

Border radius should remain consistent throughout the application.

| Context | Class |
| ---------------- | ------------ |
| Inputs | `rounded-xl` |
| Buttons | `rounded-xl` |
| Cards | `rounded-2xl` |
| Dialogs | `rounded-2xl` |
| Modals | `rounded-3xl` |

Avoid inconsistent border radius.

---

## Forms

Visitor forms are the primary interaction within the application.

Requirements:

- Large touch targets
- Mobile-first layout
- One-column layout on mobile
- Clear labels
- Required field indicators
- Inline validation
- Accessible error messages
- Comfortable spacing

Group related fields together.

---

## Buttons

Primary Button

- Corporate green
- White text
- Full width on mobile

Secondary Button

- White background
- Border
- Primary text

Danger Button

- Red
- Used only for destructive actions

Success Button

- Green
- Used for successful completion actions such as Check Out confirmation

---

## Status Colors

Checked In

- Green

Checked Out

- Gray

Pending

- Orange

Expired

- Red

Status indicators should remain consistent across the application.

---

## Tables

Admin tables should support:

- Sorting
- Searching
- Pagination
- Responsive layout
- Sticky table header
- Hover highlight
- Zebra striping

Large datasets should never be rendered without pagination.

---

## Component Library

Use shadcn/ui as the primary component library.

Components should remain reusable and unmodified whenever possible.

Business logic should never be placed inside reusable UI components.

---

## Layout Patterns

### Visitor Pages

- Mobile-first
- Centered content
- Single-column layout
- Maximum readability
- Minimal scrolling
- Large action buttons

### Admin Dashboard

- Responsive sidebar
- Top navigation bar
- Dashboard cards
- Responsive tables
- Statistics widgets
- Professional enterprise layout

### Dialogs

- Centered
- Rounded corners
- Clear action buttons
- Confirmation before destructive actions

---

## Icons

Use Lucide React.

Guidelines

- Stroke icons only
- Consistent icon size
- Meaningful icons only
- Avoid decorative icons

Recommended Sizes

Inline

`h-4 w-4`

Buttons

`h-5 w-5`

Dashboard Cards

`h-6 w-6`

Empty States

`h-8 w-8`

---

## Mobile First Principles

The visitor interface is primarily designed for mobile devices.

Requirements

- Responsive on all screen sizes
- Thumb-friendly controls
- Large input fields
- Large buttons
- Fast loading
- No horizontal scrolling

Desktop optimization is secondary for visitor pages.

Admin pages should support desktop, tablet, and mobile devices.

## Elevation

Do not use box shadows in the application UI.

Use borders, background contrast, spacing, and typography to separate surfaces.

---

## User Experience Principles

The application should always feel:

- Fast
- Simple
- Professional
- Predictable
- Consistent
- Accessible

Every interaction should require the minimum number of steps.

Avoid unnecessary animations, popups, or visual distractions.

The user should always understand what to do next without additional instructions.
