const { Router } = require("express");
const { z } = require("zod");

const prisma = require("../../config/prisma");
const { authenticate, requireRole } = require("../../middlewares/auth");

const router = Router();

const entityConfig = {
  members: {
    model: "memberProfile",
    textSearchFields: ["name", "profession", "chapter", "location"],
    defaultOrderBy: { createdAt: "desc" },
    allowedFields: [
      "userId",
      "name",
      "classYear",
      "profession",
      "chapter",
      "location",
      "status",
      "verified",
      "joinedAt"
    ]
  },
  events: {
    model: "event",
    textSearchFields: ["title", "type", "location", "description"],
    defaultOrderBy: { date: "asc" },
    allowedFields: ["title", "date", "schedule", "type", "location", "description", "status"]
  },
  donations: {
    model: "donation",
    textSearchFields: ["donorName", "classYear", "details", "transactionRef"],
    defaultOrderBy: { donatedAt: "desc" },
    allowedFields: [
      "donorName",
      "classYear",
      "amount",
      "currency",
      "details",
      "status",
      "donatedAt",
      "donorUserId",
      "transactionRef"
    ]
  },
  grievances: {
    model: "grievance",
    textSearchFields: ["trackingId", "category", "message", "status"],
    defaultOrderBy: { submittedAt: "desc" },
    allowedFields: [
      "trackingId",
      "category",
      "message",
      "status",
      "submittedById",
      "submittedAt",
      "resolvedAt"
    ]
  },
  "whistle-reports": {
    model: "whistleReport",
    textSearchFields: ["trackingId", "note"],
    defaultOrderBy: { submittedAt: "desc" },
    allowedFields: ["trackingId", "note", "submittedAt", "isAnonymous"]
  },
  careers: {
    model: "careerOpportunity",
    textSearchFields: ["title", "company", "location", "type", "description"],
    defaultOrderBy: { createdAt: "desc" },
    allowedFields: ["title", "company", "location", "type", "description", "status", "createdById"]
  },
  mentors: {
    model: "mentorProfile",
    textSearchFields: ["name", "profession", "company", "expertise", "bio"],
    defaultOrderBy: { createdAt: "desc" },
    allowedFields: ["userId", "name", "profession", "company", "expertise", "bio", "status"]
  },
  registrations: {
    model: "memberRegistration",
    textSearchFields: ["fullName", "email", "classYear", "chapter", "profession", "note"],
    defaultOrderBy: { createdAt: "desc" },
    allowedFields: [
      "fullName",
      "email",
      "classYear",
      "phone",
      "chapter",
      "profession",
      "note",
      "status"
    ]
  }
};

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().optional()
});

function getEntity(entity) {
  return entityConfig[entity];
}

const bulkImportSchema = z.object({
  entities: z.record(z.array(z.record(z.any()))).default({})
});

function pickAllowed(input, allowedFields) {
  return Object.entries(input || {}).reduce((acc, [key, value]) => {
    if (allowedFields.includes(key)) {
      acc[key] = value;
    }
    return acc;
  }, {});
}

function coerceEntityPayload(entity, payload) {
  const next = { ...payload };

  if (entity === "events" && next.date) {
    next.date = new Date(next.date);
  }

  if (entity === "members" && next.joinedAt) {
    next.joinedAt = new Date(next.joinedAt);
  }

  if (entity === "donations") {
    if (next.donatedAt) {
      next.donatedAt = new Date(next.donatedAt);
    }
    if (next.amount !== undefined) {
      next.amount = String(next.amount);
    }
  }

  if (entity === "grievances") {
    if (next.submittedAt) {
      next.submittedAt = new Date(next.submittedAt);
    }
    if (next.resolvedAt) {
      next.resolvedAt = new Date(next.resolvedAt);
    }
  }

  if (entity === "whistle-reports" && next.submittedAt) {
    next.submittedAt = new Date(next.submittedAt);
  }

  return next;
}

async function writeAudit(req, action, entityType, entityId, meta) {
  if (!req.user) return;

  await prisma.auditLog.create({
    data: {
      actorUserId: req.user.id,
      action,
      entityType,
      entityId,
      meta
    }
  });
}

router.post(
  "/import",
  authenticate,
  requireRole("ADMIN", "SUPERADMIN"),
  async (req, res, next) => {
    try {
      const payload = bulkImportSchema.parse(req.body);
      const entities = payload.entities || {};

      const summary = {
        imported: 0,
        skipped: 0,
        failed: 0,
        byEntity: {}
      };

      for (const [entity, records] of Object.entries(entities)) {
        const config = getEntity(entity);
        if (!config || !Array.isArray(records)) {
          summary.skipped += Array.isArray(records) ? records.length : 0;
          continue;
        }

        if (!summary.byEntity[entity]) {
          summary.byEntity[entity] = { imported: 0, skipped: 0, failed: 0 };
        }

        for (const rawRecord of records) {
          try {
            const picked = pickAllowed(rawRecord, config.allowedFields);
            const nextPayload = coerceEntityPayload(entity, picked);
            const created = await prisma[config.model].create({ data: nextPayload });

            await writeAudit(req, "bulk-import-create", entity, created.id, {
              source: "bulk-import",
              payload: picked
            });

            summary.imported += 1;
            summary.byEntity[entity].imported += 1;
          } catch (error) {
            summary.failed += 1;
            summary.byEntity[entity].failed += 1;
          }
        }
      }

      return res.status(200).json({
        success: true,
        message: "Bulk import completed",
        data: summary
      });
    } catch (error) {
      return next(error);
    }
  }
);

router.get("/:entity", async (req, res, next) => {
  try {
    const config = getEntity(req.params.entity);

    if (!config) {
      return res.status(404).json({ success: false, message: "Unknown entity" });
    }

    const query = listQuerySchema.parse(req.query);
    const skip = (query.page - 1) * query.pageSize;

    let where = undefined;
    if (query.q) {
      where = {
        OR: config.textSearchFields.map((field) => ({
          [field]: {
            contains: query.q,
            mode: "insensitive"
          }
        }))
      };
    }

    const [items, total] = await Promise.all([
      prisma[config.model].findMany({
        where,
        skip,
        take: query.pageSize,
        orderBy: config.defaultOrderBy
      }),
      prisma[config.model].count({ where })
    ]);

    return res.status(200).json({
      success: true,
      data: items,
      meta: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.ceil(total / query.pageSize)
      }
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/:entity/:id", async (req, res, next) => {
  try {
    const config = getEntity(req.params.entity);

    if (!config) {
      return res.status(404).json({ success: false, message: "Unknown entity" });
    }

    const item = await prisma[config.model].findUnique({
      where: { id: req.params.id }
    });

    if (!item) {
      return res.status(404).json({ success: false, message: "Record not found" });
    }

    return res.status(200).json({ success: true, data: item });
  } catch (error) {
    return next(error);
  }
});

router.post(
  "/:entity",
  authenticate,
  requireRole("ADMIN", "SUPERADMIN"),
  async (req, res, next) => {
    try {
      const entity = req.params.entity;
      const config = getEntity(entity);

      if (!config) {
        return res.status(404).json({ success: false, message: "Unknown entity" });
      }

      const picked = pickAllowed(req.body, config.allowedFields);
      const payload = coerceEntityPayload(entity, picked);

      const created = await prisma[config.model].create({ data: payload });

      await writeAudit(req, "create", entity, created.id, { payload: picked });

      return res.status(201).json({ success: true, data: created });
    } catch (error) {
      return next(error);
    }
  }
);

router.put(
  "/:entity/:id",
  authenticate,
  requireRole("ADMIN", "SUPERADMIN"),
  async (req, res, next) => {
    try {
      const entity = req.params.entity;
      const config = getEntity(entity);

      if (!config) {
        return res.status(404).json({ success: false, message: "Unknown entity" });
      }

      const picked = pickAllowed(req.body, config.allowedFields);
      const payload = coerceEntityPayload(entity, picked);

      const updated = await prisma[config.model].update({
        where: { id: req.params.id },
        data: payload
      });

      await writeAudit(req, "update", entity, updated.id, { payload: picked });

      return res.status(200).json({ success: true, data: updated });
    } catch (error) {
      return next(error);
    }
  }
);

router.delete(
  "/:entity/:id",
  authenticate,
  requireRole("ADMIN", "SUPERADMIN"),
  async (req, res, next) => {
    try {
      const entity = req.params.entity;
      const config = getEntity(entity);

      if (!config) {
        return res.status(404).json({ success: false, message: "Unknown entity" });
      }

      await prisma[config.model].delete({ where: { id: req.params.id } });

      await writeAudit(req, "delete", entity, req.params.id, null);

      return res.status(200).json({ success: true, message: "Record deleted" });
    } catch (error) {
      return next(error);
    }
  }
);

module.exports = router;
