import "server-only";

import type { VisitorStatus } from "@prisma/client";

import type {
  AdminAuditLogItem,
  AdminDashboardData,
  AdminDateFilter,
  AdminSettingsValues,
  AdminSortMode,
  AdminVisitorSummary,
  PaginatedVisitors,
  VisitorListFilters,
} from "@/types/visitor";
import { listLatestAuditLogs } from "@/repositories/audit-log-repository";
import {
  getAdminSettings,
  saveAdminSettings,
} from "@/repositories/admin-settings-repository";
import {
  countVisitorsBetween,
  deleteVisitorRecord,
  getAverageCompletedVisitDurationMinutes,
  getVisitorSummary,
  listCurrentVisitors,
  listVisitors,
  listVisitorsForExport,
} from "@/repositories/visitor-repository";

export const visitorStatuses: VisitorStatus[] = [
  "PENDING",
  "CHECKED_IN",
  "CHECKED_OUT",
  "EXPIRED",
];

export const adminDateFilters: AdminDateFilter[] = [
  "today",
  "week",
  "month",
  "all",
  "custom",
];

export const adminSortModes: AdminSortMode[] = ["newest", "oldest", "duration"];

export async function getAdminVisitorSummary(): Promise<AdminVisitorSummary> {
  const now = new Date();
  const [summary, weekVisitors, monthVisitors, averageVisitDurationMinutes] =
    await Promise.all([
      getVisitorSummary(now),
      countVisitorsBetween(startOfWeek(now), addDays(startOfWeek(now), 7)),
      countVisitorsBetween(startOfMonth(now), addMonths(startOfMonth(now), 1)),
      getAverageCompletedVisitDurationMinutes(),
    ]);

  return {
    ...summary,
    weekVisitors,
    monthVisitors,
    averageVisitDurationMinutes,
  };
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const now = new Date();
  const [summary, dailyTrend, weeklyTrend, monthlyTrend, currentVisitors] =
    await Promise.all([
      getAdminVisitorSummary(),
      getDailyTrend(now),
      getWeeklyTrend(now),
      getMonthlyTrend(now),
      listCurrentVisitors(50),
    ]);

  return {
    summary,
    dailyTrend,
    weeklyTrend,
    monthlyTrend,
    currentVisitors,
  };
}

export async function getAdminVisitors(
  filters: VisitorListFilters
): Promise<PaginatedVisitors> {
  const page = Math.max(filters.page ?? 1, 1);
  const pageSize = Math.min(Math.max(filters.pageSize ?? 10, 1), 50);
  const { visitors, total } = await listVisitors({
    query: normalizeQuery(filters.query),
    status: filters.status,
    dateFilter: filters.dateFilter ?? "today",
    customFrom: parseDateBoundary(filters.customFrom, "start"),
    customTo: parseDateBoundary(filters.customTo, "end"),
    sort: filters.sort ?? "newest",
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  return {
    visitors,
    total,
    page,
    pageSize,
  };
}

export async function getAdminVisitorsForExport(filters: VisitorListFilters) {
  return listVisitorsForExport({
    query: normalizeQuery(filters.query),
    status: filters.status,
    dateFilter: filters.dateFilter ?? "today",
    customFrom: parseDateBoundary(filters.customFrom, "start"),
    customTo: parseDateBoundary(filters.customTo, "end"),
    sort: filters.sort ?? "newest",
  });
}

export async function getSettingsValues(): Promise<AdminSettingsValues> {
  return (
    (await getAdminSettings()) ?? {
      overdueThresholdHours: 12,
      autoExpireHours: 24,
    }
  );
}

export async function updateSettingsValues(
  settings: AdminSettingsValues,
  adminActorId: string | null
): Promise<AdminSettingsValues> {
  return saveAdminSettings(settings, adminActorId);
}

export async function getAdminAuditLogs(): Promise<AdminAuditLogItem[]> {
  return listLatestAuditLogs(100);
}

export async function removeVisitorRecord(
  visitorId: string,
  adminActorId: string | null
): Promise<void> {
  await deleteVisitorRecord(visitorId, adminActorId);
}

export function parseVisitorStatus(value: string | undefined): VisitorStatus | undefined {
  return visitorStatuses.find((status) => status === value);
}

export function parseDateFilter(value: string | undefined): AdminDateFilter {
  return adminDateFilters.find((dateFilter) => dateFilter === value) ?? "today";
}

export function parseSortMode(value: string | undefined): AdminSortMode {
  return adminSortModes.find((sortMode) => sortMode === value) ?? "newest";
}

function normalizeQuery(query: string | undefined): string | undefined {
  const normalizedQuery = query?.trim();
  return normalizedQuery ? normalizedQuery : undefined;
}

function parseDateBoundary(
  value: string | undefined,
  boundary: "start" | "end"
): Date | undefined {
  if (!value) {
    return undefined;
  }

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  if (boundary === "end") {
    date.setHours(23, 59, 59, 999);
  }

  return date;
}

async function getDailyTrend(now: Date) {
  const days = Array.from({ length: 7 }, (_, index) => {
    const start = startOfDay(addDays(now, index - 6));
    return {
      start,
      end: addDays(start, 1),
      label: new Intl.DateTimeFormat("en-MY", { weekday: "short" })
        .format(start)
        .toUpperCase(),
    };
  });

  return Promise.all(
    days.map(async (day) => ({
      label: day.label,
      value: await countVisitorsBetween(day.start, day.end),
    }))
  );
}

async function getWeeklyTrend(now: Date) {
  const currentWeekStart = startOfWeek(now);
  const weeks = Array.from({ length: 6 }, (_, index) => {
    const start = addDays(currentWeekStart, (index - 5) * 7);
    return {
      start,
      end: addDays(start, 7),
      label: `W${index + 1}`,
    };
  });

  return Promise.all(
    weeks.map(async (week) => ({
      label: week.label,
      value: await countVisitorsBetween(week.start, week.end),
    }))
  );
}

async function getMonthlyTrend(now: Date) {
  const currentMonthStart = startOfMonth(now);
  const months = Array.from({ length: 6 }, (_, index) => {
    const start = addMonths(currentMonthStart, index - 5);
    return {
      start,
      end: addMonths(start, 1),
      label: new Intl.DateTimeFormat("en-MY", { month: "short" })
        .format(start)
        .toUpperCase(),
    };
  });

  return Promise.all(
    months.map(async (month) => ({
      label: month.label,
      value: await countVisitorsBetween(month.start, month.end),
    }))
  );
}

function startOfDay(date: Date): Date {
  const nextDate = new Date(date);
  nextDate.setHours(0, 0, 0, 0);
  return nextDate;
}

function startOfWeek(date: Date): Date {
  const nextDate = startOfDay(date);
  const dayOffset = (nextDate.getDay() + 6) % 7;
  nextDate.setDate(nextDate.getDate() - dayOffset);
  return nextDate;
}

function startOfMonth(date: Date): Date {
  const nextDate = startOfDay(date);
  nextDate.setDate(1);
  return nextDate;
}

function addDays(date: Date, days: number): Date {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function addMonths(date: Date, months: number): Date {
  const nextDate = new Date(date);
  nextDate.setMonth(nextDate.getMonth() + months);
  return nextDate;
}
