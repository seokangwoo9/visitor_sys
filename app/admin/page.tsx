import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  ClipboardList,
  Clock3,
  Download,
  Eye,
  History,
  LineChart,
  Settings,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import type { VisitorStatus } from "@prisma/client";

import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { auth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import type {
  AdminAuditLogItem,
  AdminDateFilter,
  AdminSortMode,
  AdminTrendPoint,
  AdminVisitorListItem,
} from "@/types/visitor";
import {
  getAdminAuditLogs,
  getAdminDashboardData,
  getAdminVisitors,
  getSettingsValues,
  parseDateFilter,
  parseSortMode,
  parseVisitorStatus,
} from "@/services/admin-visitor-service";

import { AdminDeleteVisitorButton } from "./admin-delete-visitor-button";
import { AdminFilterForm } from "./admin-filter-form";
import { AdminPagination } from "./admin-pagination";
import { AdminQrCodeCard } from "./admin-qr-code-card";
import { AdminSettingsForm } from "./admin-settings-form";
import { SignOutButton } from "./sign-out-button";

type AdminSection = "dashboard" | "visitors" | "export" | "settings" | "audit";

const adminSections: Array<{
  icon: typeof BarChart3;
  label: string;
  value: AdminSection;
}> = [
  { value: "dashboard", label: "Dashboard", icon: BarChart3 },
  { value: "visitors", label: "Visitors", icon: ClipboardList },
  { value: "export", label: "Export", icon: Download },
  { value: "settings", label: "Settings", icon: Settings },
  { value: "audit", label: "Audit Logs", icon: History },
];

export default async function AdminPage(props: PageProps<"/admin">) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login?callbackUrl=/admin");
  }

  const searchParams = await props.searchParams;
  const section = parseSection(normalizeSearchParam(searchParams.section));
  const query = normalizeSearchParam(searchParams.query) ?? "";
  const dateFilter = parseDateFilter(normalizeSearchParam(searchParams.date));
  const sortMode = parseSortMode(normalizeSearchParam(searchParams.sort));
  const customFrom = normalizeSearchParam(searchParams.from) ?? "";
  const customTo = normalizeSearchParam(searchParams.to) ?? "";
  const requestedStatus = normalizeSearchParam(searchParams.status);
  const status = parseVisitorStatus(requestedStatus);
  const pageValue = Number(normalizeSearchParam(searchParams.page) ?? "1");
  const page = Number.isFinite(pageValue) ? pageValue : 1;
  const [dashboardData, visitorPage, settingsValues, auditLogs] = await Promise.all([
    getAdminDashboardData(),
    getAdminVisitors({
      query,
      status,
      dateFilter,
      customFrom,
      customTo,
      sort: sortMode,
      page,
      pageSize: 10,
    }),
    getSettingsValues(),
    getAdminAuditLogs(),
  ]);

  return (
    <main className="min-h-screen bg-admin-page text-text-primary">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 shrink-0 border-r border-border bg-card px-5 py-6 lg:flex lg:flex-col">
          <AdminBrand />
          <nav className="mt-8 space-y-3">
            {adminSections.map((item) => (
              <AdminNavItem
                active={section === item.value}
                icon={item.icon}
                key={item.value}
                label={item.label}
                section={item.value}
              />
            ))}
          </nav>
          <div className="mt-auto">
            <SignedInCard displayName={session.user.name ?? "admin"} />
          </div>
        </aside>

        <section className="w-full px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-[98rem] space-y-6">
            <div className="lg:hidden">
              <AdminBrand />
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
                {adminSections.map((item) => (
                  <AdminNavItem
                    active={section === item.value}
                    icon={item.icon}
                    key={item.value}
                    label={item.label}
                    section={item.value}
                  />
                ))}
              </div>
            </div>

            {section === "dashboard" ? (
              <DashboardView data={dashboardData} />
            ) : section === "visitors" ? (
              <VisitorsView
                customFrom={customFrom}
                customTo={customTo}
                dateFilter={dateFilter}
                query={query}
                sortMode={sortMode}
                visitorPage={visitorPage}
              />
            ) : section === "export" ? (
              <ExportView
                customFrom={customFrom}
                customTo={customTo}
                dateFilter={dateFilter}
                query={query}
                sortMode={sortMode}
              />
            ) : section === "settings" ? (
              <SettingsView settingsValues={settingsValues} />
            ) : (
              <AuditView auditLogs={auditLogs} />
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function DashboardView({ data }: { data: Awaited<ReturnType<typeof getAdminDashboardData>> }) {
  return (
    <>
      <AdminHero
        description="Overview shell for live visitor metrics, trends, and current visitor activity."
        title="Dashboard"
      />
      <section className="grid gap-4 xl:grid-cols-5">
        <MetricCard
          icon={UsersRound}
          label="Visitors Inside"
          note="Currently checked in"
          value={data.summary.currentVisitors}
        />
        <MetricCard
          icon={LineChart}
          label="Today's Visitors"
          note="Since midnight"
          value={data.summary.todayCheckIns}
        />
        <MetricCard
          icon={CalendarDays}
          label="This Week"
          note="Week starts Monday"
          value={data.summary.weekVisitors}
        />
        <MetricCard
          icon={ArrowUpRight}
          label="This Month"
          note="Month-to-date"
          value={data.summary.monthVisitors}
        />
        <MetricCard
          icon={Clock3}
          label="Average Visit Duration"
          note="Last 250 completed visits"
          value={`${data.summary.averageVisitDurationMinutes}m`}
        />
      </section>
      <section className="grid gap-4 xl:grid-cols-3">
        <TrendCard points={data.dailyTrend} subtitle="Last 7 days" title="Daily Trend" />
        <TrendCard points={data.weeklyTrend} subtitle="Last 6 weeks" title="Weekly Trend" />
        <TrendCard points={data.monthlyTrend} subtitle="Last 6 months" title="Monthly Trend" />
      </section>
      <CurrentVisitorsTable visitors={data.currentVisitors} />
    </>
  );
}

function VisitorsView({
  customFrom,
  customTo,
  dateFilter,
  query,
  sortMode,
  visitorPage,
}: {
  customFrom: string;
  customTo: string;
  dateFilter: AdminDateFilter;
  query: string;
  sortMode: AdminSortMode;
  visitorPage: Awaited<ReturnType<typeof getAdminVisitors>>;
}) {
  return (
    <>
      <AdminHero
        description="Search visitor history, filter operational windows, sort stays, and review audit-ready visit details."
        title="Visitors"
      />
      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard icon={CalendarDays} label="Filtered Records" value={visitorPage.total} />
        <MetricCard
          icon={ShieldCheck}
          label="Currently Inside"
          value={visitorPage.visitors.filter((visitor) => visitor.status === "CHECKED_IN").length}
          variant="success"
        />
        <MetricCard
          icon={Clock3}
          label="Sort Mode"
          value={sortMode === "newest" ? "Newest" : sortMode === "oldest" ? "Oldest" : "Duration"}
          variant="warning"
        />
      </section>
      <AdminFilterForm
        initialCustomFrom={customFrom}
        initialCustomTo={customTo}
        initialDateFilter={dateFilter}
        initialQuery={query}
        initialSort={sortMode}
      />
      <VisitorHistoryTable visitors={visitorPage.visitors} />
      <AdminPagination
        customFrom={customFrom}
        customTo={customTo}
        dateFilter={dateFilter}
        page={visitorPage.page}
        pageSize={visitorPage.pageSize}
        query={query}
        section="visitors"
        sort={sortMode}
        status=""
        total={visitorPage.total}
      />
    </>
  );
}

function ExportView({
  customFrom,
  customTo,
  dateFilter,
  query,
  sortMode,
}: {
  customFrom: string;
  customTo: string;
  dateFilter: AdminDateFilter;
  query: string;
  sortMode: AdminSortMode;
}) {
  const exportParams = new URLSearchParams();
  setExportParam(exportParams, "query", query);
  setExportParam(exportParams, "date", dateFilter);
  setExportParam(exportParams, "sort", sortMode);
  setExportParam(exportParams, "from", customFrom);
  setExportParam(exportParams, "to", customTo);

  return (
    <>
      <AdminHero
        description="Generate enterprise-formatted Excel reports from filtered visitor records."
        title="Export"
      />
      <section className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <section className="rounded-[1.75rem] border border-border bg-card p-6 shadow-xl shadow-admin-shadow/10">
          <p className="text-sm font-bold uppercase tracking-[0.32em] text-visitor-success-deep">
            Excel Export
          </p>
          <h2 className="mt-4 text-2xl font-bold text-visitor-ink">
            Visitor Records Workbook
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-text-secondary">
            Export the same operational fields used by visitor history with green corporate styling, filters, frozen headers, alternating rows, automatic widths, and audit footer details.
          </p>
          <div className="mt-6 border-t border-border pt-6">
            <AdminFilterForm
              initialCustomFrom={customFrom}
              initialCustomTo={customTo}
              initialDateFilter={dateFilter}
              initialQuery={query}
              initialSort={sortMode}
              variant="embedded"
            />
            <Link
              className={cn(
                buttonVariants({ variant: "default" }),
                "mt-5 h-12 rounded-2xl bg-visitor-success px-7 shadow-lg shadow-visitor-success/20 hover:bg-visitor-success-deep"
              )}
              href={`/api/admin/export?${exportParams.toString()}`}
            >
              Download Excel
            </Link>
          </div>
        </section>
        <InfoPanel
          eyebrow="Workbook Format"
          items={[
            "Specified visitor columns include contact, company, PIC, pass, vehicle, check-in, check-out, duration, status, and IP.",
            "ExcelJS applies a green corporate header, auto column widths, frozen header row, filters, and alternating row fills.",
            "Footer includes Generated Time, Generated By, and Total Visitors for audit-ready handoff.",
          ]}
        />
      </section>
    </>
  );
}

function SettingsView({ settingsValues }: { settingsValues: Awaited<ReturnType<typeof getSettingsValues>> }) {
  return (
    <>
      <AdminHero
        description="Persist visitor timeout settings and record every administrative configuration change."
        title="Settings"
      />
      <section className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <section className="rounded-[1.75rem] border border-border bg-card p-6 shadow-xl shadow-admin-shadow/10">
          <p className="text-sm font-bold uppercase tracking-[0.32em] text-visitor-success-deep">
            Operational Settings
          </p>
          <h2 className="mt-4 text-2xl font-bold text-visitor-ink">
            Visitor Timeout Rules
          </h2>
          <p className="mt-3 text-sm text-text-secondary">
            Changes are persisted in system settings and recorded as SETTINGS_UPDATE audit events.
          </p>
          <div className="mt-6 border-t border-border pt-6">
            <AdminSettingsForm
              autoExpireHours={settingsValues.autoExpireHours}
              overdueThresholdHours={settingsValues.overdueThresholdHours}
            />
          </div>
        </section>
        <div className="space-y-6">
          <AdminQrCodeCard />
          <InfoPanel
            eyebrow="Current Values"
            items={[
              `Visitors show as overdue after ${settingsValues.overdueThresholdHours} hours inside.`,
              `Open sessions auto-expire after ${settingsValues.autoExpireHours} hours.`,
              "Audit Logs will show the before and after settings payload for every save.",
            ]}
          />
        </div>
      </section>
    </>
  );
}

function AuditView({ auditLogs }: { auditLogs: AdminAuditLogItem[] }) {
  return (
    <>
      <AdminHero
        description="Protected audit trail for administrative activity and system auto-close events."
        title="Audit Logs"
      />
      <section className="overflow-hidden rounded-[1.75rem] border border-border bg-card shadow-xl shadow-admin-shadow/10">
        <div className="p-5">
          <p className="text-sm font-bold uppercase tracking-[0.32em] text-visitor-success-deep">
            Latest 100 Events
          </p>
          <h2 className="mt-4 text-xl font-bold text-visitor-ink">Audit Trail</h2>
        </div>
        <div className="px-5 pb-5">
          <div className="overflow-hidden rounded-2xl border border-border">
            <Table>
              <TableHeader className="bg-bg-base">
                <TableRow>
                  <TableHead className="pl-4">Time</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead className="pr-4">Metadata</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditLogs.length > 0 ? (
                  auditLogs.map((auditLog) => (
                    <TableRow key={auditLog.id}>
                      <TableCell className="pl-4">{formatDateTime(auditLog.createdAt)}</TableCell>
                      <TableCell>
                        <span className="rounded-2xl border border-visitor-success/20 bg-visitor-success-soft px-3 py-1 text-xs font-bold text-visitor-success-deep">
                          {auditLog.eventType}
                        </span>
                      </TableCell>
                      <TableCell className="font-semibold text-visitor-ink">
                        {describeAuditLog(auditLog)}
                      </TableCell>
                      <TableCell>{auditLog.visitorId ? "Visitor" : "System"}</TableCell>
                      <TableCell>{auditLog.actorType.toLowerCase()}</TableCell>
                      <TableCell className="pr-4">{auditLog.metadata ? "JSON" : "-"}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell className="py-10 text-center text-text-secondary" colSpan={6}>
                      No audit logs found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </section>
    </>
  );
}

function AdminBrand() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex size-12 items-center justify-center rounded-2xl bg-visitor-ink text-primary-foreground shadow-xl shadow-admin-shadow/20">
        <ShieldCheck className="size-6" aria-hidden="true" />
      </div>
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.32em] text-visitor-success-deep">
          TVMS Admin
        </p>
        <p className="text-lg font-bold text-visitor-ink">
          TOE Visitor Management System
        </p>
      </div>
    </div>
  );
}

function AdminNavItem({
  active,
  icon: Icon,
  label,
  section,
}: {
  active: boolean;
  icon: typeof BarChart3;
  label: string;
  section: AdminSection;
}) {
  return (
    <Link
      className={cn(
        "flex h-11 items-center gap-3 rounded-2xl px-4 text-sm font-bold text-text-secondary",
        active
          ? "bg-visitor-success text-primary-foreground shadow-lg shadow-visitor-success/20"
          : "hover:bg-bg-base"
      )}
      href={`/admin?section=${section}`}
    >
      <Icon className="size-5" aria-hidden="true" />
      {label}
    </Link>
  );
}

function SignedInCard({ displayName }: { displayName: string }) {
  return (
    <section className="rounded-2xl border border-border bg-bg-base p-4">
      <p className="text-xs font-bold uppercase tracking-[0.28em] text-text-muted">
        Signed In As
      </p>
      <p className="mt-3 font-bold text-visitor-ink">{displayName}</p>
      <div className="mt-5">
        <SignOutButton />
      </div>
    </section>
  );
}

function AdminHero({ description, title }: { description: string; title: string }) {
  return (
    <section className="rounded-[1.75rem] border border-border bg-card p-6 shadow-xl shadow-admin-shadow/10">
      <p className="text-sm font-bold uppercase tracking-[0.32em] text-visitor-success-deep">
        Admin
      </p>
      <h1 className="mt-4 text-3xl font-bold text-visitor-ink">{title}</h1>
      <p className="mt-4 text-sm text-text-secondary">{description}</p>
    </section>
  );
}

function MetricCard({
  icon: Icon,
  label,
  note,
  value,
  variant = "brand",
}: {
  icon: typeof BarChart3;
  label: string;
  note?: string;
  value: number | string;
  variant?: "brand" | "success" | "warning";
}) {
  const iconClassName =
    variant === "success"
      ? "bg-state-success/10 text-state-success"
      : variant === "warning"
        ? "bg-state-warning/10 text-state-warning"
        : "bg-visitor-success-soft text-visitor-success-deep";

  return (
    <section className="rounded-[1.75rem] border border-border bg-card p-5 shadow-xl shadow-admin-shadow/10">
      <div className="flex items-start justify-between gap-3">
        <div className={cn("flex size-11 items-center justify-center rounded-2xl", iconClassName)}>
          <Icon className="size-5" aria-hidden="true" />
        </div>
        <span className="rounded-2xl bg-bg-base px-3 py-1 text-xs font-bold text-text-muted">
          Live
        </span>
      </div>
      <p className="mt-6 text-sm font-semibold text-text-secondary">{label}</p>
      <p className="mt-3 text-3xl font-bold text-visitor-ink">{value}</p>
      {note ? <p className="mt-2 text-xs font-semibold text-text-muted">{note}</p> : null}
    </section>
  );
}

function TrendCard({
  points,
  subtitle,
  title,
}: {
  points: AdminTrendPoint[];
  subtitle: string;
  title: string;
}) {
  const maxValue = Math.max(...points.map((point) => point.value), 1);

  return (
    <section className="rounded-[1.75rem] border border-border bg-card p-5 shadow-xl shadow-admin-shadow/10">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-bold text-visitor-ink">{title}</h2>
          <p className="mt-2 text-sm text-text-secondary">{subtitle}</p>
        </div>
        <div className="flex size-10 items-center justify-center rounded-2xl bg-visitor-success-soft text-visitor-success-deep">
          <ArrowUpRight className="size-5" aria-hidden="true" />
        </div>
      </div>
      <div className="mt-5 grid grid-cols-7 items-end gap-2">
        {points.map((point) => {
          const height = Math.max(Math.round((point.value / maxValue) * 7), 1);

          return (
            <div className="space-y-2 text-center" key={point.label}>
              <div className="flex h-32 items-end">
                <div
                  className={cn(
                    "w-full rounded-3xl",
                    point.value === maxValue && point.value > 0
                      ? "bg-visitor-success shadow-lg shadow-visitor-success/20"
                      : "bg-bg-base"
                  )}
                  style={{ height: `${height * 12.5}%` }}
                />
              </div>
              <p className="text-xs font-bold text-visitor-ink">{point.value}</p>
              <p className="text-xs font-semibold text-text-muted">{point.label}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function CurrentVisitorsTable({ visitors }: { visitors: AdminVisitorListItem[] }) {
  return (
    <section className="overflow-hidden rounded-[1.75rem] border border-border bg-card shadow-xl shadow-admin-shadow/10">
      <div className="flex items-start justify-between gap-3 p-5">
        <div>
          <h2 className="text-xl font-bold text-visitor-ink">Current Visitors</h2>
          <p className="mt-2 text-sm text-text-secondary">
            Live INSIDE records ordered by longest stay.
          </p>
        </div>
        <span className="rounded-2xl bg-visitor-success-soft px-4 py-2 text-sm font-bold text-visitor-success-deep">
          {visitors.length} inside
        </span>
      </div>
      <div className="px-5 pb-5">
        <div className="overflow-hidden rounded-2xl border border-border">
          <Table>
            <TableHeader className="bg-bg-base">
              <TableRow>
                <TableHead className="pl-4">Name</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Purpose</TableHead>
                <TableHead>PIC</TableHead>
                <TableHead>Check In</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead className="pr-4 text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visitors.length > 0 ? (
                visitors.map((visitor) => (
                  <TableRow key={visitor.id}>
                    <TableCell className="pl-4 font-bold text-visitor-ink">
                      {visitor.fullName}
                    </TableCell>
                    <TableCell>{visitor.companyName}</TableCell>
                    <TableCell>{visitor.purposeOfVisit}</TableCell>
                    <TableCell>{visitor.hostName}</TableCell>
                    <TableCell>{formatDateTime(visitor.checkInAt)}</TableCell>
                    <TableCell>{formatDuration(visitor.checkInAt, visitor.checkOutAt)}</TableCell>
                    <TableCell className="pr-4 text-center">
                      <StatusBadge status={visitor.status} />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell className="py-12 text-center text-text-secondary" colSpan={7}>
                    No visitors are currently inside.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </section>
  );
}

function VisitorHistoryTable({ visitors }: { visitors: AdminVisitorListItem[] }) {
  return (
    <section className="overflow-hidden rounded-[1.75rem] border border-border bg-card shadow-xl shadow-admin-shadow/10">
      <div className="p-5">
        <div className="overflow-hidden rounded-2xl border border-border">
          <Table>
            <TableHeader className="bg-bg-base">
              <TableRow>
                <TableHead className="pl-4">Visitor</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>PIC</TableHead>
                <TableHead>Pass / Vehicle</TableHead>
                <TableHead>Check In</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="pr-4 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visitors.length > 0 ? (
                visitors.map((visitor) => (
                  <TableRow key={visitor.id}>
                    <TableCell className="pl-4">
                      <p className="font-bold text-visitor-ink">{visitor.fullName}</p>
                      <p className="mt-1 text-xs text-text-secondary">{visitor.contactNumber}</p>
                    </TableCell>
                    <TableCell>{visitor.companyName}</TableCell>
                    <TableCell>{visitor.hostName}</TableCell>
                    <TableCell>
                      <p className="font-semibold text-visitor-ink">{visitor.visitorPassId}</p>
                      <p className="mt-1 text-xs text-text-secondary">
                        {visitor.hasVehicle ? visitor.vehiclePlateNumber : "No vehicle"}
                      </p>
                    </TableCell>
                    <TableCell>{formatDateTime(visitor.checkInAt)}</TableCell>
                    <TableCell className="font-bold text-visitor-ink">
                      {formatDuration(visitor.checkInAt, visitor.checkOutAt)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={visitor.status} />
                    </TableCell>
                    <TableCell className="pr-4">
                      <div className="flex justify-end gap-2">
                        <button
                          className="inline-flex h-9 items-center gap-2 rounded-2xl bg-visitor-success-soft px-4 text-xs font-bold text-visitor-success-deep"
                          type="button"
                        >
                          <Eye className="size-4" aria-hidden="true" />
                          View
                        </button>
                        <AdminDeleteVisitorButton visitorId={visitor.id} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell className="py-10 text-center text-text-secondary" colSpan={8}>
                    No visitor records found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </section>
  );
}

function InfoPanel({ eyebrow, items }: { eyebrow: string; items: string[] }) {
  return (
    <section className="rounded-[1.75rem] border border-visitor-success/10 bg-admin-panel p-6 shadow-xl shadow-admin-shadow/10">
      <p className="text-sm font-bold uppercase tracking-[0.32em] text-visitor-success-deep">
        {eyebrow}
      </p>
      <div className="mt-6 space-y-4">
        {items.map((item) => (
          <div className="rounded-2xl bg-card px-4 py-4 text-sm font-semibold leading-6 text-text-primary" key={item}>
            {item}
          </div>
        ))}
      </div>
    </section>
  );
}

function StatusBadge({ status }: { status: VisitorStatus }) {
  const label = status === "CHECKED_OUT" ? "LEFT" : status.replace("_", " ");
  const className =
    status === "CHECKED_IN"
      ? "bg-visitor-success-soft text-visitor-success-deep"
      : status === "CHECKED_OUT"
        ? "bg-muted text-muted-foreground"
        : status === "EXPIRED"
          ? "bg-destructive/10 text-destructive"
          : "bg-state-warning/10 text-text-primary";

  return (
    <span className={cn("inline-flex rounded-2xl px-3 py-1 text-xs font-bold", className)}>
      {label}
    </span>
  );
}

function describeAuditLog(auditLog: AdminAuditLogItem): string {
  if (auditLog.eventType === "SETTINGS_UPDATE") {
    return "Admin updated visitor timeout settings";
  }

  if (auditLog.eventType === "VISITOR_DELETED") {
    return "Admin deleted a visitor record";
  }

  if (auditLog.eventType === "VISITOR_CHECKED_IN") {
    return "Visitor checked in";
  }

  if (auditLog.eventType === "VISITOR_CHECKED_OUT") {
    return "Visitor checked out";
  }

  return auditLog.eventType.replaceAll("_", " ").toLowerCase();
}

function normalizeSearchParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function parseSection(value: string | undefined): AdminSection {
  if (
    value === "dashboard" ||
    value === "visitors" ||
    value === "export" ||
    value === "settings" ||
    value === "audit"
  ) {
    return value;
  }

  return "dashboard";
}

function setExportParam(params: URLSearchParams, key: string, value: string) {
  if (value) {
    params.set(key, value);
  }
}

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("en-MY", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatDuration(checkInAt: Date, checkOutAt: Date | null): string {
  const end = checkOutAt ?? new Date();
  const minutes = Math.max(Math.round((end.getTime() - checkInAt.getTime()) / 60000), 0);

  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}
