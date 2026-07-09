# UI Registry

### Design System Foundation

File: app/globals.css
Last updated: 2026-06-30

| Property | Class |
| ---------------- | --------------- |
| Background | `bg-background`, `bg-bg-base`, `bg-card` |
| Border | `border-border`, `border-border-default`, `border-border-subtle` |
| Border radius | `rounded-xl`, `rounded-2xl`, `rounded-3xl` |
| Text - primary | `text-foreground`, `text-text-primary` |
| Text - secondary | `text-text-secondary` |
| Spacing | component-owned shadcn spacing with token-backed surfaces |
| Hover state | semantic token variants such as `hover:bg-muted` and `hover:bg-primary/80` |
| Shadow | none by default |
| Accent usage | `bg-primary`, `text-primary`, `text-destructive`, state token utilities |

**Pattern notes:**
Use `app/globals.css` as the source of truth for the corporate light theme. Project-specific UI should use semantic shadcn tokens (`background`, `foreground`, `card`, `primary`, `secondary`, `muted`, `destructive`, `border`, `input`, `ring`) or the explicit corporate token utilities (`bg-bg-base`, `text-text-primary`, `border-border-default`, `bg-state-success`, etc.). Do not hardcode colors in application components. Generated `components/ui/*` files are protected and should remain unmodified after generation.

### Authentication Pages

File: app/login/page.tsx
Last updated: 2026-06-30

| Property | Class |
| ---------------- | --------------- |
| Background | `bg-bg-base` |
| Border | shadcn `Card` ring token |
| Border radius | `rounded-2xl` |
| Text - primary | `text-text-primary` |
| Text - secondary | `text-muted-foreground` |
| Spacing | `px-4 py-10`, `space-y-5`, `space-y-2` |
| Hover state | generated `Button` primary hover |
| Shadow | none |
| Accent usage | `Button` default `bg-primary`, error `text-destructive` |

**Pattern notes:**
Authentication screens use a centered single-card layout on `bg-bg-base`, with shadcn form controls and no custom hardcoded colors. Admin foundation pages use the same page background and card radius so future admin/dashboard screens stay visually aligned.

### Frontend Shell

Files: app/page.tsx, app/admin/page.tsx, app/admin/sign-out-button.tsx
Last updated: 2026-06-30

| Property | Class |
| ---------------- | --------------- |
| Background | `bg-bg-base`, `bg-background`, `bg-card` |
| Border | `border-border` |
| Border radius | `rounded-xl`, `rounded-2xl` |
| Text - primary | `text-text-primary` |
| Text - secondary | `text-text-secondary`, `text-muted-foreground` |
| Spacing | `px-4 py-6`, `gap-4`, `gap-6`, `space-y-3`, `space-y-6` |
| Hover state | generated `Button` variants via `buttonVariants` |
| Shadow | none |
| Accent usage | icon blocks use `bg-primary text-primary-foreground` and `bg-secondary text-secondary-foreground` |

**Pattern notes:**
The public entry and protected admin shell use compact operational layouts rather than a marketing landing page. Header identity appears as a token-backed square icon plus system name. Primary actions are Next `Link` elements styled with `buttonVariants`; interactive auth controls stay in small client components. Dashboard status surfaces use standalone shadcn cards on the page background, without nested cards or raw color utilities.

### Visitor Registration

Files: app/page.tsx, app/register/page.tsx, app/register/registration-page-content.tsx, app/register/visitor-registration-form.tsx
Last updated: 2026-06-30

| Property | Class |
| ---------------- | --------------- |
| Background | `bg-register-page`, `bg-visitor-ink`, `bg-card`, `bg-visitor-success-soft` |
| Border | `border-border`, generated input `border-input` |
| Border radius | `rounded-2xl`, `rounded-[1.75rem]`, `rounded-[2rem]` |
| Text - primary | `text-visitor-ink`, `text-primary-foreground` |
| Text - secondary | `text-text-secondary`, `text-text-muted`, `text-primary-foreground/85` |
| Spacing | `px-4 py-8`, `px-6 py-7`, `px-5 py-6`, `space-y-5`, `gap-6` |
| Hover state | `hover:bg-visitor-success-deep` |
| Shadow | `shadow-xl shadow-register-shadow/10`, `shadow-2xl shadow-register-shadow/20`, `shadow-xl shadow-visitor-success/20` |
| Accent usage | dark intro `bg-visitor-ink`, action `bg-visitor-success`, icon chips `bg-visitor-success-soft text-visitor-success-deep` |

**Pattern notes:**
Visitor-facing registration is the index experience at `/` and is also available at `/register`. It uses a centered mobile-first stack on green-tinted `bg-register-page`, with a dark rounded intro panel followed by separate white section cards for personal information, vehicle, and company. Inputs use `h-14 rounded-2xl` controls, the purpose field uses a tall rounded textarea, and the submit action is a full-width green `h-14 rounded-2xl` button. Vehicle capture includes a bordered `No Vehicle` checkbox block; when selected, vehicle plate is not required. The final field set is name, IC/passport number, contact number, number of people in the visiting group, email, vehicle/no-vehicle selection, vehicle plate number when applicable, company name, purpose of visit, person to meet/PIC, and department.

### Visitor Status And Check-Out

Files: app/visitor/status/page.tsx, app/check-out/page.tsx, app/check-out/active-visit-check-out-form.tsx
Last updated: 2026-07-09

| Property | Class |
| ---------------- | --------------- |
| Background | `bg-visitor-page`, `bg-card`, `bg-visitor-success`, `bg-visitor-ink`, `bg-visitor-success-soft`, `bg-visitor-surface`, `bg-muted` |
| Border | `border-visitor-success/10`, `border-visitor-success-deep` |
| Border radius | `rounded-2xl`, `rounded-3xl`, `rounded-full` |
| Text - primary | `text-visitor-ink`, `text-primary-foreground` |
| Text - secondary | `text-text-secondary`, `text-text-muted`, `text-visitor-success-deep` |
| Spacing | `px-4 py-8`, `px-6 py-6`, `px-6 py-7`, `p-4`, `p-5`, `space-y-4`, `space-y-5` |
| Hover state | `hover:bg-visitor-success-deep` |
| Shadow | `shadow-2xl shadow-visitor-success/10`, `shadow-xl shadow-visitor-success/20` |
| Accent usage | checked-in header `bg-visitor-success`, check-out confirmation header `bg-visitor-ink`, action `bg-visitor-success`, success badge `bg-visitor-success-soft` |

**Pattern notes:**
Visitor status uses a dedicated pass-card design on `bg-visitor-page`. Checked-in state has a green header, white status pill, soft success status panel, light detail tiles, and a centered instruction panel telling visitors to scan the exit check-out QR. The check-out action lives only on `/check-out`, which always uses a centered white search card with a muted icon, one `h-14 rounded-2xl` phone-number field, a dark find button, a soft green active-visit summary, and a green confirmation button. Checked-out state redirects to a separate thank-you card with a circular check icon and no registration return action. These visitor confirmation screens intentionally use the visitor-specific tokens added in `app/globals.css`.

### Admin Control Center

Files: app/admin/page.tsx, app/admin/admin-filter-form.tsx, app/admin/admin-settings-form.tsx, app/admin/admin-delete-visitor-button.tsx, app/admin/admin-pagination.tsx
Last updated: 2026-07-09

| Property | Class |
| ---------------- | --------------- |
| Background | `bg-admin-page`, `bg-card`, `bg-bg-base`, `bg-admin-panel`, `bg-visitor-success-soft` |
| Border | `border-border`, `border-visitor-success/10`, `border-input` |
| Border radius | `rounded-2xl`, `rounded-[1.75rem]` |
| Text - primary | `text-visitor-ink`, `text-text-primary` |
| Text - secondary | `text-text-secondary`, `text-text-muted`, `text-muted-foreground` |
| Spacing | `px-5 py-6`, `p-5`, `p-6`, `space-y-6`, `gap-4`, `gap-6` |
| Hover state | `hover:bg-bg-base`, `hover:bg-visitor-success-deep`, token-backed ghost hover states |
| Shadow | `shadow-xl shadow-admin-shadow/10`, `shadow-lg shadow-visitor-success/20` |
| Accent usage | active nav/action `bg-visitor-success`, shell mark `bg-visitor-ink`, info panels `bg-admin-panel`, status pills use visitor/state tokens |

**Pattern notes:**
Admin pages use a fixed left TVMS control-center sidebar on desktop and compact tab grid on mobile. The sidebar brand displays `TVMS Admin` above `TOE Visitor Management System`. Section hero panels are large white `rounded-[1.75rem]` cards with uppercase green eyebrow text, followed by operational metric cards, filter panels, tables, or settings/export cards. Inputs and selects use `h-12 rounded-2xl`; primary admin actions use green `rounded-2xl` buttons with subtle brand shadows. Settings utility cards, including printable QR generation, use `rounded-[1.75rem] border border-visitor-success/10 bg-admin-panel p-6 shadow-xl shadow-admin-shadow/10` with white inner content blocks. Visitor QR management displays separate check-in and check-out panels inside the Settings utility card; each panel uses icon chips, rounded QR canvases, break-all URL text, and paired download/print buttons. QR URLs convert localhost admin sessions to the server machine's internal IPv4 origin when available, while deployed origins remain unchanged. QR canvases are rendered as rounded-corner PNGs inside `rounded-2xl` display surfaces so downloaded and printed QR assets match the Settings card design. Tables sit inside a `px-5 pb-5` or `p-5` gutter with an inner `rounded-2xl border border-border` table frame, pale header rows, uppercase headers, compact token-backed status pills, and no nested card structures. First/last table cells use explicit `pl-4`/`pr-4` padding so row content does not crowd rounded container edges.

### Admin Visitor Detail Dialog

File: app/admin/page.tsx
Last updated: 2026-07-01

| Property | Class |
| ---------------- | --------------- |
| Background | `bg-card`, `bg-bg-base`, `bg-visitor-success-soft` |
| Border | `border-border` |
| Border radius | `rounded-[1.75rem]`, `rounded-2xl` |
| Text - primary | `text-visitor-ink` |
| Text - secondary | `text-text-secondary`, `text-text-muted` |
| Spacing | `p-5`, `p-6`, `px-4 py-3`, `gap-3`, `mt-6` |
| Hover state | `hover:bg-visitor-success/15` |
| Shadow | `shadow-xl shadow-admin-shadow/10` |
| Accent usage | `text-visitor-success-deep`, `bg-visitor-success-soft` |

**Pattern notes:**
Admin detail dialogs use the same card treatment as control-center panels: white `bg-card`, `rounded-[1.75rem]`, token border, and soft admin shadow. Trigger buttons stay compact at `h-9 rounded-2xl` with green soft background and icon+text labeling. Detail fields are displayed as `rounded-2xl bg-bg-base` tiles with uppercase muted labels and bold visitor-ink values. The dialog content must override the generated dialog's narrow default max width with viewport-safe sizing, keep internal scrolling under `100dvh`, and allow the detail tile grid to expand from one column to two and then three columns on wide admin screens.
