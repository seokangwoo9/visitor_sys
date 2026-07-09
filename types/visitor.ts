import type { AuditActorType, VisitorStatus } from "@prisma/client";

export interface VisitorRegistrationInput {
  fullName: string;
  companyName: string;
  contactNumber: string;
  partySize: number;
  email?: string;
  identificationNumber: string;
  hasVehicle: boolean;
  vehiclePlateNumber: string;
  department?: string;
  hostName: string;
  purposeOfVisit: string;
}

export interface VisitorSessionCookieValue {
  visitorId: string;
  sessionToken: string;
}

export interface VisitorCheckInResult {
  visitorId: string;
  status: VisitorStatus;
  checkInAt: Date;
  expiresAt: Date;
  sessionToken: string;
}

export interface ActiveVisitorSession {
  visitorId: string;
  fullName: string;
  companyName: string;
  contactNumber: string;
  email: string | null;
  identificationNumber: string | null;
  partySize: number;
  hasVehicle: boolean;
  vehiclePlateNumber: string;
  department: string | null;
  hostName: string;
  purposeOfVisit: string;
  checkInAt: Date;
  checkOutAt: Date | null;
  status: VisitorStatus;
  expiresAt: Date;
}

export interface VisitorCheckoutResult {
  visitorId: string;
  status: VisitorStatus;
  checkInAt: Date;
  checkOutAt: Date;
}

export interface VisitorCheckoutSearchInput {
  contactNumber: string;
}

export interface VisitorCheckoutSearchMatch {
  visitorId: string;
  fullName: string;
  companyName: string;
  contactNumber: string;
  partySize: number;
  checkInAt: Date;
  expiresAt: Date;
}

export type VisitorCheckoutSearchStatus =
  | "FOUND"
  | "NOT_FOUND"
  | "AMBIGUOUS"
  | "ALREADY_CHECKED_OUT"
  | "EXPIRED";

export interface VisitorCheckoutSearchLookupResult {
  status: VisitorCheckoutSearchStatus;
  match?: VisitorCheckoutSearchMatch;
}

export interface AdminVisitorListItem {
  id: string;
  fullName: string;
  companyName: string;
  contactNumber: string;
  email: string | null;
  identificationNumber: string | null;
  partySize: number;
  hasVehicle: boolean;
  vehiclePlateNumber: string;
  department: string | null;
  hostName: string;
  purposeOfVisit: string;
  checkInAt: Date;
  checkOutAt: Date | null;
  status: VisitorStatus;
}

export interface AdminVisitorSummary {
  totalVisitors: number;
  currentVisitors: number;
  todayCheckIns: number;
  checkedOutVisitors: number;
  weekVisitors: number;
  monthVisitors: number;
  averageVisitDurationMinutes: number;
}

export type AdminDateFilter = "today" | "week" | "month" | "all" | "custom";
export type AdminSortMode = "newest" | "oldest" | "duration";

export interface VisitorListFilters {
  query?: string;
  status?: VisitorStatus;
  dateFilter?: AdminDateFilter;
  customFrom?: string;
  customTo?: string;
  sort?: AdminSortMode;
  page?: number;
  pageSize?: number;
}

export interface PaginatedVisitors {
  visitors: AdminVisitorListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AdminTrendPoint {
  label: string;
  value: number;
}

export interface AdminDashboardData {
  summary: AdminVisitorSummary;
  dailyTrend: AdminTrendPoint[];
  weeklyTrend: AdminTrendPoint[];
  monthlyTrend: AdminTrendPoint[];
  currentVisitors: AdminVisitorListItem[];
}

export interface AdminSettingsValues {
  overdueThresholdHours: number;
  autoExpireHours: number;
}

export interface AdminAuditLogItem {
  id: string;
  eventType: string;
  actorType: AuditActorType;
  actorId: string | null;
  visitorId: string | null;
  adminId: string | null;
  metadata: unknown;
  createdAt: Date;
}
