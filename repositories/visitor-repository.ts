import "server-only";

import type { Prisma, PrismaClient, VisitorStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type { AdminDateFilter, AdminSortMode } from "@/types/visitor";

export interface CreateCheckedInVisitorRecordInput {
  visitor: Prisma.VisitorCreateInput;
  sessionTokenHash: string;
  expiresAt: Date;
  auditEventType: string;
  auditMetadata?: Prisma.InputJsonObject;
}

export async function createCheckedInVisitorRecord(
  input: CreateCheckedInVisitorRecordInput,
  prismaClient: PrismaClient = prisma
) {
  return prismaClient.$transaction(async (transaction) => {
    const visitor = await transaction.visitor.create({
      data: input.visitor,
    });

    await transaction.visitorSession.create({
      data: {
        visitorId: visitor.id,
        sessionTokenHash: input.sessionTokenHash,
        expiresAt: input.expiresAt,
      },
    });

    await transaction.auditLog.create({
      data: {
        eventType: input.auditEventType,
        actorType: "VISITOR",
        actorId: visitor.id,
        visitorId: visitor.id,
        metadata: {
          status: visitor.status,
          ...input.auditMetadata,
        },
      },
    });

    return visitor;
  });
}

export async function findVisitorSessionByHash(
  visitorId: string,
  sessionTokenHash: string,
  prismaClient: PrismaClient = prisma
) {
  return prismaClient.visitorSession.findFirst({
    where: {
      visitorId,
      sessionTokenHash,
      revokedAt: null,
      destroyedAt: null,
    },
    include: {
      visitor: true,
    },
  });
}

export async function findVisitorsForCheckoutSearch(
  contactNumber: string,
  prismaClient: PrismaClient = prisma
) {
  return prismaClient.visitor.findMany({
    where: {
      contactNumber: {
        equals: contactNumber,
        mode: "insensitive",
      },
    },
    include: {
      sessions: {
        where: {
          revokedAt: null,
          destroyedAt: null,
        },
        orderBy: {
          expiresAt: "desc",
        },
      },
    },
    orderBy: {
      checkInAt: "desc",
    },
  });
}

export async function completeVisitorCheckout(
  visitorId: string,
  sessionId: string,
  checkOutAt: Date,
  prismaClient: PrismaClient = prisma,
  auditEventType = "VISITOR_CHECKED_OUT",
  auditMetadata: Prisma.InputJsonObject = {}
) {
  return prismaClient.$transaction(async (transaction) => {
    const visitor = await transaction.visitor.update({
      where: {
        id: visitorId,
      },
      data: {
        checkOutAt,
        status: "CHECKED_OUT",
      },
    });

    await transaction.visitorSession.update({
      where: {
        id: sessionId,
      },
      data: {
        destroyedAt: checkOutAt,
        revokedAt: checkOutAt,
      },
    });

    await transaction.auditLog.create({
      data: {
        eventType: auditEventType,
        actorType: "VISITOR",
        actorId: visitor.id,
        visitorId: visitor.id,
        metadata: {
          status: visitor.status,
          ...auditMetadata,
        },
      },
    });

    return visitor;
  });
}

export async function createVisitorCheckoutSearchAuditLog(
  eventType: string,
  metadata: Prisma.InputJsonObject,
  visitorId?: string,
  prismaClient: PrismaClient = prisma
): Promise<void> {
  await prismaClient.auditLog.create({
    data: {
      eventType,
      actorType: "VISITOR",
      actorId: visitorId,
      visitorId,
      metadata,
    },
  });
}

export async function expireVisitorSession(
  visitorId: string,
  sessionId: string,
  expiredAt: Date,
  prismaClient: PrismaClient = prisma
): Promise<void> {
  await prismaClient.$transaction(async (transaction) => {
    await transaction.visitor.updateMany({
      where: {
        id: visitorId,
        status: "CHECKED_IN",
      },
      data: {
        status: "EXPIRED",
      },
    });

    await transaction.visitorSession.update({
      where: {
        id: sessionId,
      },
      data: {
        revokedAt: expiredAt,
      },
    });

    await transaction.auditLog.create({
      data: {
        eventType: "VISITOR_SESSION_EXPIRED",
        actorType: "SYSTEM",
        visitorId,
        metadata: {
          expiredAt,
        },
      },
    });
  });
}

export async function getVisitorSummary(
  now: Date,
  prismaClient: PrismaClient = prisma
) {
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  const [totalVisitors, currentVisitors, todayCheckIns, checkedOutVisitors] =
    await Promise.all([
      countVisitorRecords({}, prismaClient),
      countVisitorRecords({ status: "CHECKED_IN" }, prismaClient),
      countVisitorRecords({ checkInAt: { gte: startOfDay } }, prismaClient),
      countVisitorRecords({ status: "CHECKED_OUT" }, prismaClient),
    ]);

  return {
    totalVisitors,
    currentVisitors,
    todayCheckIns,
    checkedOutVisitors,
  };
}

export interface VisitorQueryInput {
  query?: string;
  status?: VisitorStatus;
  dateFilter?: AdminDateFilter;
  customFrom?: Date;
  customTo?: Date;
  sort?: AdminSortMode;
  skip: number;
  take: number;
}

function buildVisitorWhere(
  input: Pick<VisitorQueryInput, "query" | "status" | "dateFilter" | "customFrom" | "customTo">
) {
  const where: Prisma.VisitorWhereInput = {};

  if (input.status) {
    where.status = input.status;
  }

  if (input.query) {
    const searchConditions: Prisma.VisitorWhereInput[] = [
      { fullName: { contains: input.query, mode: "insensitive" } },
      { identificationNumber: { contains: input.query, mode: "insensitive" } },
      { vehiclePlateNumber: { contains: input.query, mode: "insensitive" } },
      { companyName: { contains: input.query, mode: "insensitive" } },
      { contactNumber: { contains: input.query, mode: "insensitive" } },
      { hostName: { contains: input.query, mode: "insensitive" } },
    ];

    where.OR = searchConditions;
  }

  const dateRange = buildDateRange(input.dateFilter, input.customFrom, input.customTo);

  if (dateRange) {
    where.checkInAt = dateRange;
  }

  return where;
}

function buildDateRange(
  dateFilter: AdminDateFilter | undefined,
  customFrom: Date | undefined,
  customTo: Date | undefined,
  now: Date = new Date()
): Prisma.DateTimeFilter | undefined {
  if (dateFilter === "all") {
    return undefined;
  }

  if (dateFilter === "custom") {
    const range: Prisma.DateTimeFilter = {};

    if (customFrom) {
      range.gte = customFrom;
    }

    if (customTo) {
      range.lte = customTo;
    }

    return Object.keys(range).length > 0 ? range : undefined;
  }

  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  if (dateFilter === "week") {
    const dayOffset = (start.getDay() + 6) % 7;
    start.setDate(start.getDate() - dayOffset);
  } else if (dateFilter === "month") {
    start.setDate(1);
  }

  return {
    gte: start,
  };
}

function buildVisitorOrderBy(sort: AdminSortMode | undefined): Prisma.VisitorOrderByWithRelationInput {
  if (sort === "oldest") {
    return {
      checkInAt: "asc",
    };
  }

  if (sort === "duration") {
    return {
      checkOutAt: {
        sort: "desc",
        nulls: "first",
      },
    };
  }

  return {
    checkInAt: "desc",
  };
}

export async function listVisitors(
  input: VisitorQueryInput,
  prismaClient: PrismaClient = prisma
) {
  const where = buildVisitorWhere(input);
  const [visitors, total] = await Promise.all([
    prismaClient.visitor.findMany({
      where,
      orderBy: buildVisitorOrderBy(input.sort),
      skip: input.skip,
      take: input.take,
    }),
    prismaClient.visitor.count({ where }),
  ]);

  return {
    visitors,
    total,
  };
}

export async function listVisitorsForExport(
  input: Pick<VisitorQueryInput, "query" | "status" | "dateFilter" | "customFrom" | "customTo" | "sort">,
  prismaClient: PrismaClient = prisma
) {
  return prismaClient.visitor.findMany({
    where: buildVisitorWhere(input),
    orderBy: buildVisitorOrderBy(input.sort),
  });
}

export async function listCurrentVisitors(
  take = 50,
  prismaClient: PrismaClient = prisma
) {
  return prismaClient.visitor.findMany({
    where: {
      status: "CHECKED_IN",
    },
    orderBy: {
      checkInAt: "asc",
    },
    take,
  });
}

export async function deleteVisitorRecord(
  visitorId: string,
  adminActorId: string | null,
  prismaClient: PrismaClient = prisma
): Promise<void> {
  await prismaClient.$transaction(async (transaction) => {
    const visitor = await transaction.visitor.delete({
      where: {
        id: visitorId,
      },
    });

    await transaction.auditLog.create({
      data: {
        eventType: "VISITOR_DELETED",
        actorType: "ADMIN",
        actorId: adminActorId,
        visitorId: null,
        metadata: {
          deletedVisitorId: visitor.id,
          visitorName: visitor.fullName,
        },
      },
    });
  });
}

export async function countVisitorsBetween(
  start: Date,
  end: Date,
  prismaClient: PrismaClient = prisma
): Promise<number> {
  return countVisitorRecords(
    {
      checkInAt: {
        gte: start,
        lt: end,
      },
    },
    prismaClient
  );
}

async function countVisitorRecords(
  where: Prisma.VisitorWhereInput,
  prismaClient: PrismaClient
): Promise<number> {
  return prismaClient.visitor.count({ where });
}

export async function getAverageCompletedVisitDurationMinutes(
  take = 250,
  prismaClient: PrismaClient = prisma
): Promise<number> {
  const visitors = await prismaClient.visitor.findMany({
    where: {
      checkOutAt: {
        not: null,
      },
    },
    orderBy: {
      checkOutAt: "desc",
    },
    select: {
      checkInAt: true,
      checkOutAt: true,
    },
    take,
  });

  if (visitors.length === 0) {
    return 0;
  }

  const totalMinutes = visitors.reduce((total, visitor) => {
    const checkOutAt = visitor.checkOutAt ?? visitor.checkInAt;
    return total + Math.max(Math.round((checkOutAt.getTime() - visitor.checkInAt.getTime()) / 60000), 0);
  }, 0);

  return Math.round(totalMinutes / visitors.length);
}
