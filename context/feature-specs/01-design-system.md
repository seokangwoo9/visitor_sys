Read `AGENTS.md` and `context/ui-context.md` before starting.

We're building the design system and reusable UI foundation for the TOE Visitor Management System.

Install and configure `shadcn/ui`.

Add these shadcn components:

- Button
- Card
- Dialog
- Input
- Label
- Select
- Textarea
- Table
- Badge
- Separator
- Sheet
- DropdownMenu
- AlertDialog
- Calendar
- Popover
- Form
- Skeleton
- Sonner

Do not modify the generated `components/ui/*` files after installation.

Also install:

- lucide-react
- class-variance-authority
- clsx
- tailwind-merge

Create `lib/utils.ts` with a reusable `cn()` helper for merging Tailwind classes.

Ensure all components follow the design tokens defined in `globals.css`.

Do not use hardcoded colors.

All components must support the light corporate theme defined in `ui-context.md`.

### Check when done

- All components import without errors
- `cn()` works properly
- No TypeScript errors
- No ESLint errors
- All components follow the project design tokens
- No hardcoded colors are used
- No generated `components/ui/*` files have been modified
