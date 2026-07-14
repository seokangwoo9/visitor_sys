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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getAdminAuthSession } from "@/lib/admin-auth-session";
import { resolveVisitorQrCodeOrigin } from "@/lib/network-origin";
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
import { AdminSafetyAcknowledgmentForm } from "./admin-safety-acknowledgment-form";
import { AdminSettingsForm } from "./admin-settings-form";
import { SignOutButton } from "./sign-out-button";
import { getActiveSafetyAcknowledgmentPolicy } from "@/services/safety-acknowledgment-service";

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
  { value: "audit", label: "Activity Log", icon: History },
];

export default async function AdminPage(props: PageProps<"/admin">) {
  const headersList = await headers();
  const session = await getAdminAuthSession(headersList);

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
              <DashboardView data={await getAdminDashboardData()} />
            ) : section === "visitors" ? (
              <VisitorsView
                customFrom={customFrom}
                customTo={customTo}
                dateFilter={dateFilter}
                query={query}
                sortMode={sortMode}
                visitorPage={await getAdminVisitors({
                  query,
                  status,
                  dateFilter,
                  customFrom,
                  customTo,
                  sort: sortMode,
                  page,
                  pageSize: 10,
                })}
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
              <SettingsView
                qrCodeOrigin={resolveVisitorQrCodeOrigin(headersList)}
                safetyAcknowledgment={await getActiveSafetyAcknowledgmentPolicy()}
                settingsValues={await getSettingsValues()}
              />
            ) : (
              <AuditView auditLogs={await getAdminAuditLogs()} />
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
        description="Monitor visitor traffic, visit duration, and who is currently inside."
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
        description="Search visitor history, filter by date, and review visit details."
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
        description="Download visitor reports for the selected date range and search filters."
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
            Export visitor records with the same filters used in the Visitors section.
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
            eyebrow="Report Includes"
            items={[
              "Visitor contact, company, PIC, vehicle, visit time, duration, status, and safety acknowledgment.",
              "A formatted spreadsheet that is ready to review, print, or archive.",
              "Report summary with generated time, admin user, and total visitor count.",
            ]}
        />
      </section>
    </>
  );
}

function SettingsView({
  qrCodeOrigin,
  safetyAcknowledgment,
  settingsValues,
}: {
  qrCodeOrigin?: string;
  safetyAcknowledgment: Awaited<ReturnType<typeof getActiveSafetyAcknowledgmentPolicy>>;
  settingsValues: Awaited<ReturnType<typeof getSettingsValues>>;
}) {
  return (
    <>
      <AdminHero
        description="Manage visitor timing rules, QR codes, and the safety acknowledgment text."
        title="Settings"
      />
      <section className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <div className="space-y-6">
          <section className="rounded-[1.75rem] border border-border bg-card p-6 shadow-xl shadow-admin-shadow/10">
            <p className="text-sm font-bold uppercase tracking-[0.32em] text-visitor-success-deep">
              Operational Settings
            </p>
            <h2 className="mt-4 text-2xl font-bold text-visitor-ink">
              Visitor Timeout Rules
            </h2>
            <p className="mt-3 text-sm text-text-secondary">
              Set when active visits should be highlighted as overdue and when they should expire.
            </p>
            <div className="mt-6 border-t border-border pt-6">
              <AdminSettingsForm
                autoExpireHours={settingsValues.autoExpireHours}
                overdueThresholdHours={settingsValues.overdueThresholdHours}
              />
            </div>
          </section>
          <section className="rounded-[1.75rem] border border-border bg-card p-6 shadow-xl shadow-admin-shadow/10">
            <p className="text-sm font-bold uppercase tracking-[0.32em] text-visitor-success-deep">
              Safety Form
            </p>
            <h2 className="mt-4 text-2xl font-bold text-visitor-ink">
              Visitor Safety Acknowledgment
            </h2>
            <p className="mt-3 text-sm text-text-secondary">
              Update the English safety and indemnity text visitors must accept before check-in.
            </p>
            <div className="mt-6 border-t border-border pt-6">
              <AdminSafetyAcknowledgmentForm safetyAcknowledgment={safetyAcknowledgment} />
            </div>
          </section>
        </div>
        <div className="space-y-6">
          <AdminQrCodeCard preferredOrigin={qrCodeOrigin} />
          <InfoPanel
            eyebrow="Current Settings"
            items={[
              `Visitors show as overdue after ${settingsValues.overdueThresholdHours} hours inside.`,
              `Open visits expire after ${settingsValues.autoExpireHours} hours.`,
              "The latest published safety acknowledgment is active for new check-ins.",
              "Important admin changes are recorded in the activity log.",
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
        description="Review important admin actions and visitor activity."
        title="Activity Log"
      />
      <section className="overflow-hidden rounded-[1.75rem] border border-border bg-card shadow-xl shadow-admin-shadow/10">
        <div className="p-5">
          <p className="text-sm font-bold uppercase tracking-[0.32em] text-visitor-success-deep">
            Recent Activity
          </p>
          <h2 className="mt-4 text-xl font-bold text-visitor-ink">Activity History</h2>
        </div>
        <div className="px-5 pb-5">
          <div className="overflow-hidden rounded-2xl border border-border">
            <Table>
              <TableHeader className="bg-bg-base">
                <TableRow>
                  <TableHead className="pl-4">Time</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Record</TableHead>
                  <TableHead>Actor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditLogs.length > 0 ? (
                  auditLogs.map((auditLog) => (
                    <TableRow key={auditLog.id}>
                      <TableCell className="pl-4">{formatDateTime(auditLog.createdAt)}</TableCell>
                      <TableCell>
                        <span className="rounded-2xl border border-visitor-success/20 bg-visitor-success-soft px-3 py-1 text-xs font-bold text-visitor-success-deep">
                          {formatAuditActionLabel(auditLog)}
                        </span>
                      </TableCell>
                      <TableCell className="font-semibold text-visitor-ink">
                        {describeAuditLog(auditLog)}
                      </TableCell>
                      <TableCell>{auditLog.visitorId ? "Visitor" : "System"}</TableCell>
                      <TableCell className="pr-4">{formatActorType(auditLog.actorType)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell className="py-10 text-center text-text-secondary" colSpan={5}>
                      No activity found.
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
            Visitors currently inside, ordered by longest stay.
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
                <TableHead>Vehicle</TableHead>
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
                      <p className="font-semibold text-visitor-ink">
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
                        <VisitorDetailDialog visitor={visitor} />
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

function VisitorDetailDialog({ visitor }: { visitor: AdminVisitorListItem }) {
  return (
    <Dialog>
      <DialogTrigger
        render={
          <button
            className="inline-flex h-9 items-center gap-2 rounded-2xl bg-visitor-success-soft px-4 text-xs font-bold text-visitor-success-deep transition hover:bg-visitor-success/15"
            type="button"
          />
        }
      >
        <Eye className="size-4" aria-hidden="true" />
        View
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] !max-w-none overflow-y-auto rounded-[1.75rem] border border-border bg-card p-5 shadow-xl shadow-admin-shadow/10 sm:!max-w-[calc(100vw-3rem)] sm:p-6 lg:!max-w-5xl xl:!max-w-6xl">
        <DialogHeader>
          <p className="text-sm font-bold uppercase tracking-[0.32em] text-visitor-success-deep">
            Visitor Details
          </p>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <DialogTitle className="text-2xl font-bold text-visitor-ink">
                {visitor.fullName}
              </DialogTitle>
              <DialogDescription className="mt-2 text-sm text-text-secondary">
                Complete information for this visitor record.
              </DialogDescription>
            </div>
            <StatusBadge status={visitor.status} />
          </div>
        </DialogHeader>
        <div className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          <VisitorDetailItem label="IC / Passport" value={visitor.identificationNumber ?? "-"} />
          <VisitorDetailItem label="Phone Number" value={visitor.contactNumber} />
          <VisitorDetailItem label="Email" value={visitor.email ?? "-"} />
          <VisitorDetailItem label="Company" value={visitor.companyName} />
          <VisitorDetailItem label="Person to Meet / PIC" value={visitor.hostName} />
          <VisitorDetailItem
            label="Vehicle"
            value={visitor.hasVehicle ? visitor.vehiclePlateNumber : "No vehicle"}
          />
          <VisitorDetailItem label="Check In" value={formatDateTime(visitor.checkInAt)} />
          <VisitorDetailItem
            label="Check Out"
            value={visitor.checkOutAt ? formatDateTime(visitor.checkOutAt) : "-"}
          />
          <VisitorDetailItem
            className="md:col-span-2 lg:col-span-1"
            label="Duration"
            value={formatDuration(visitor.checkInAt, visitor.checkOutAt)}
          />
          <VisitorDetailItem
            label="Safety Accepted"
            value={visitor.safetyAcknowledged ? "Yes" : "No"}
          />
          <VisitorDetailItem
            label="Safety Accepted At"
            value={visitor.safetyAcknowledgedAt ? formatDateTime(visitor.safetyAcknowledgedAt) : "-"}
          />
          <VisitorDetailItem
            label="Safety Version"
            value={visitor.safetyAcknowledgmentVersion
              ? `Version ${visitor.safetyAcknowledgmentVersion}`
              : "-"
            }
          />
          <VisitorDetailItem
            className="md:col-span-2 lg:col-span-3"
            label="Purpose of Visit"
            value={visitor.purposeOfVisit}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

function VisitorDetailItem({
  className,
  label,
  value,
}: {
  className?: string;
  label: string;
  value: string;
}) {
  return (
    <div className={cn("rounded-2xl bg-bg-base px-4 py-3", className)}>
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-text-muted">
        {label}
      </p>
      <p className="mt-2 break-words text-sm font-bold text-visitor-ink">{value}</p>
    </div>
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
  const label =
    status === "CHECKED_IN"
      ? "Inside"
      : status === "CHECKED_OUT"
        ? "Left"
        : status === "EXPIRED"
          ? "Expired"
          : status.replace("_", " ");
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

function formatAuditActionLabel(auditLog: AdminAuditLogItem): string {
  if (auditLog.eventType === "SETTINGS_UPDATE") {
    return "Settings Updated";
  }

  if (auditLog.eventType === "SAFETY_ACKNOWLEDGMENT_UPDATE") {
    return "Safety Form Updated";
  }

  if (auditLog.eventType === "VISITOR_DELETED") {
    return "Visitor Deleted";
  }

  if (auditLog.eventType === "VISITOR_CHECKED_IN") {
    return "Checked In";
  }

  if (auditLog.eventType === "VISITOR_CHECKED_OUT") {
    return "Checked Out";
  }

  return titleCase(auditLog.eventType.replaceAll("_", " "));
}

function describeAuditLog(auditLog: AdminAuditLogItem): string {
  if (auditLog.eventType === "SETTINGS_UPDATE") {
    return "Visitor timing settings were updated";
  }

  if (auditLog.eventType === "SAFETY_ACKNOWLEDGMENT_UPDATE") {
    return "Visitor safety acknowledgment text was updated";
  }

  if (auditLog.eventType === "VISITOR_DELETED") {
    return "A visitor record was deleted";
  }

  if (auditLog.eventType === "VISITOR_CHECKED_IN") {
    return "Visitor checked in";
  }

  if (auditLog.eventType === "VISITOR_CHECKED_OUT") {
    return "Visitor checked out";
  }

  return titleCase(auditLog.eventType.replaceAll("_", " "));
}

function formatActorType(actorType: string): string {
  return titleCase(actorType.replaceAll("_", " "));
}

function titleCase(value: string): string {
  return value
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
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
