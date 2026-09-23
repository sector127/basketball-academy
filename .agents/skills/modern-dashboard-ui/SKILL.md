---
name: modern-dashboard-ui
description: Design system guidelines, color tokens, and reusable component patterns for creating modern basketball academy dashboard interfaces with high visual polish, responsive sidebars, KPI metric cards, and accessible data layouts adhering strictly to DRY principles.
---

# Modern Dashboard UI Design System for Brooklyn Basketball Academy (BBA)

This skill provides design tokens, visual hierarchy, layout conventions, and component patterns to maintain a cohesive, high-performance, and modern dashboard aesthetic across all academy portals (Admin, Coach, Player, and Guardian) while adhering strictly to the **DRY (Don't Repeat Yourself)** principle.

---

## 1. Visual Identity & Design Tokens

### A. Color Palette
- **Canvas & Surface**:
  - Light Canvas: Neutral Zinc/Slate `bg-slate-50/60 dark:bg-slate-950`
  - Cards & Panels: Elevated pure white `bg-white dark:bg-slate-900/90` with hairline border `border border-slate-200/80 dark:border-slate-800`
  - Subtle Gradient Headers: `from-slate-900 via-slate-800 to-indigo-950` for high-impact banners.
- **Brand & Sport Accents**:
  - **Basketball Gold/Amber**: Primary energy color for court, starters, highlights (`#f59e0b` / `text-amber-500 bg-amber-500/10 border-amber-500/20`)
  - **Brooklyn Navy**: Anchoring executive tone (`#0f172a` / `#1e293b`)
  - **Victory Emerald**: Wins, active status, confirmed rosters (`#10b981` / `text-emerald-500 bg-emerald-500/10`)
  - **Match Crimson**: Losses, inactive players, destructive dialogs (`#ef4444` / `text-rose-500 bg-rose-500/10`)
  - **Tactical Blue**: Practices, combinations, analytics (`#3b82f6` / `text-blue-500 bg-blue-500/10`)

### B. Elevation & Shadows
- Rest State: `shadow-sm hover:shadow-md transition-all duration-200`
- Floating Panels: `shadow-xl border border-slate-200/80 dark:border-slate-800`
- Subtle Glow: `hover:border-amber-500/30 dark:hover:border-amber-500/20`

### C. Typography & Spacing
- Page Titles: `text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100`
- Section Subtitles: `text-sm text-slate-500 dark:text-slate-400 font-medium`
- Micro-Labels: `text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500`
- Tabular Numbers: `font-semibold font-mono` for jersey numbers, scores, and heights.

---

## 2. Canonical Reusable Components (DRY Architecture)

Every page and dashboard in this application MUST use these canonical reusable components instead of inventing ad-hoc markup:

### 1. `PageHeader` (`@/components/ui/page-header`)
Use at the top of every dashboard and subpage to provide a unified title, badge/tag, description, and action button bar:
```tsx
import { PageHeader } from "@/components/ui/page-header";

<PageHeader
  title="BBA U18 Elite"
  subtitle="Team roster, tactical court layout, and player stats"
  badge="10 Players"
  actions={
    <Button onClick={handleAddPlayer}>
      <Plus className="w-4 h-4 mr-1.5" /> Add Player
    </Button>
  }
/>
```

### 2. `StatCard` (`@/components/ui/stat-card`)
Use for top-level dashboard metrics, KPI counters, and statistical highlights:
```tsx
import { StatCard } from "@/components/ui/stat-card";

<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  <StatCard
    title="Total Players"
    value={17}
    icon={Users}
    trend="+2 this month"
    trendType="positive"
    accent="gold"
  />
</div>
```

### 3. `StatusBadge` (`@/components/ui/status-badge`)
Unified status pill for game statuses, active/inactive states, and starting lineup flags:
```tsx
import { StatusBadge } from "@/components/ui/status-badge";

<StatusBadge status="completed" label="Won 95-81" variant="success" />
<StatusBadge status="firstTeam" label="Starter" variant="gold" dot />
```

### 4. `EntityCard` (`@/components/ui/entity-card`)
Modern, responsive card for grid views (Teams, Coaches, Venues, Combinations):
```tsx
import { EntityCard } from "@/components/ui/entity-card";

<EntityCard
  title={team.name}
  subtitle={team.description}
  image="/assets/images/logo.png"
  badge="Under-18"
  href={`/dashboard/coach/teams/${team._id}`}
  meta={[{ label: "Coach", value: "Nika Mskhalaia" }]}
/>
```

### 5. `EmptyState` (`@/components/ui/empty-state`)
Standard empty state presentation when lists or searches return zero records:
```tsx
import { EmptyState } from "@/components/ui/empty-state";

<EmptyState
  icon={Users}
  title="No players found"
  description="Get started by adding your first basketball player to the roster."
  actionText="Add Player"
  onAction={() => router.push("/dashboard/admin/players/create")}
/>
```

---

## 3. Page Layout & Dashboard Guidelines

1. **Dashboard Shell (`DashboardLayout`)**:
   - Sleek responsive sidebar with active link indicator, badge counters, and seamless collapse.
   - Glassmorphic top navigation bar with search shortcut, breadcrumbs, notifications, and user avatar.
   - Zero layout shift during client hydration.
2. **Data Tables (`DataTable`)**:
   - Filter input with icon, density toggle, column visibility, and contextual action buttons.
   - Alternating subtle row hover, rounded header, and polished pagination footer.
3. **Interactive Court (`BasketballCourt`)**:
   - SVG court with accurate lines, wood grain or modern charcoal surface, and interactive starter tokens for PG, SG, SF, PF, C with quick-action player detail tooltips.
4. **Forms & Modals (`Dialog`)**:
   - Clean floating sheets or centered modals with organized fieldsets, inline validation errors, and clear primary/secondary buttons.
