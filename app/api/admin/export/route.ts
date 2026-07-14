import { headers } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import ExcelJS from "exceljs";

import { apiError } from "@/lib/api-response";
import { getAdminAuthSession } from "@/lib/admin-auth-session";
import {
  getAdminVisitorsForExport,
  parseDateFilter,
  parseSortMode,
  parseVisitorStatus,
} from "@/services/admin-visitor-service";

export const runtime = "nodejs";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await getAdminAuthSession(await headers());

  if (!session) {
    return apiError("Authentication required.", 401);
  }

  const query = request.nextUrl.searchParams.get("query") ?? undefined;
  const requestedStatus = request.nextUrl.searchParams.get("status");
  const status = parseVisitorStatus(requestedStatus ?? undefined);
  const visitors = await getAdminVisitorsForExport({
    query,
    status,
    dateFilter: parseDateFilter(request.nextUrl.searchParams.get("date") ?? undefined),
    customFrom: request.nextUrl.searchParams.get("from") ?? undefined,
    customTo: request.nextUrl.searchParams.get("to") ?? undefined,
    sort: parseSortMode(request.nextUrl.searchParams.get("sort") ?? undefined),
  });
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Visitors");

  worksheet.columns = [
    { header: "Name", key: "fullName", width: 28 },
    { header: "IC / Passport no", key: "identificationNumber", width: 22 },
    { header: "Contact number", key: "contactNumber", width: 18 },
    { header: "Email", key: "email", width: 28 },
    { header: "Number of people", key: "partySize", width: 18 },
    { header: "Has vehicle", key: "hasVehicle", width: 14 },
    { header: "Vehicle plate no", key: "vehiclePlateNumber", width: 18 },
    { header: "Company name", key: "companyName", width: 24 },
    { header: "Department", key: "department", width: 24 },
    { header: "Purpose of visit", key: "purposeOfVisit", width: 36 },
    { header: "Person to meet / PIC", key: "hostName", width: 24 },
    { header: "Status", key: "status", width: 16 },
    { header: "Check In", key: "checkInAt", width: 24 },
    { header: "Check Out", key: "checkOutAt", width: 24 },
    { header: "Duration Minutes", key: "durationMinutes", width: 18 },
    { header: "Safety acknowledged", key: "safetyAcknowledged", width: 22 },
    { header: "Safety acknowledged at", key: "safetyAcknowledgedAt", width: 26 },
    { header: "Safety version", key: "safetyAcknowledgmentVersion", width: 18 },
  ];

  for (const visitor of visitors) {
    worksheet.addRow({
      fullName: visitor.fullName,
      identificationNumber: visitor.identificationNumber ?? "",
      contactNumber: visitor.contactNumber,
      email: visitor.email ?? "",
      partySize: visitor.partySize,
      hasVehicle: visitor.hasVehicle ? "Yes" : "No",
      vehiclePlateNumber: visitor.vehiclePlateNumber,
      companyName: visitor.companyName,
      department: visitor.department ?? "",
      purposeOfVisit: visitor.purposeOfVisit,
      hostName: visitor.hostName,
      status: visitor.status,
      checkInAt: formatExportDateTime(visitor.checkInAt),
      checkOutAt: visitor.checkOutAt ? formatExportDateTime(visitor.checkOutAt) : "",
      durationMinutes: visitor.checkOutAt
        ? Math.max(
            Math.round(
              (visitor.checkOutAt.getTime() - visitor.checkInAt.getTime()) / 60000
            ),
            0
          )
        : "",
      safetyAcknowledged: visitor.safetyAcknowledged ? "Yes" : "No",
      safetyAcknowledgedAt: visitor.safetyAcknowledgedAt
        ? formatExportDateTime(visitor.safetyAcknowledgedAt)
        : "",
      safetyAcknowledgmentVersion: visitor.safetyAcknowledgmentVersion
        ? `Version ${visitor.safetyAcknowledgmentVersion}`
        : "",
    });
  }

  worksheet.getRow(1).font = { bold: true };
  worksheet.views = [{ state: "frozen", ySplit: 1 }];
  worksheet.autoFilter = {
    from: "A1",
    to: "R1",
  };

  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    headers: {
      "Content-Disposition": `attachment; filename="visitor-report-${new Date()
        .toISOString()
        .slice(0, 10)}.xlsx"`,
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function formatExportDateTime(date: Date): string {
  return new Intl.DateTimeFormat("en-MY", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}
