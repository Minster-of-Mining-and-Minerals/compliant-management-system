// services/dashboardOverviewService.js
// Aggregated dashboard data (counts only — no complaint/feedback rows are sent to the client).
const { sequelize, SectorNode, ComplaintCategory } = require("../models");

// Statuses that still need action, and how long one may wait before it counts as overdue
const OPEN_STATUSES = ["pending", "under_review", "assigned", "in_progress"];
const RESOLVED_STATUSES = ["resolved", "closed"];
const OVERDUE_AFTER_DAYS = 7;

const DAY_MS = 86400000;

/** period key → { from, to } (to = now; from = null for all time) */
const resolvePeriod = (period) => {
  const now = new Date();
  switch (period) {
    case "7d":
      return { from: new Date(now - 7 * DAY_MS), to: now };
    case "30d":
      return { from: new Date(now - 30 * DAY_MS), to: now };
    case "90d":
      return { from: new Date(now - 90 * DAY_MS), to: now };
    case "year":
      return { from: new Date(Date.UTC(now.getUTCFullYear(), 0, 1)), to: now };
    default:
      return { from: null, to: now };
  }
};

/** Trend bucket size: daily up to ~3 months, weekly up to a year, monthly beyond */
const trendUnit = (from, to) => {
  if (!from) return "month";
  const days = (to - from) / DAY_MS;
  if (days <= 92) return "day";
  if (days <= 366) return "week";
  return "month";
};

/**
 * Sectors the user may see — same rule as the existing dashboard:
 * their own sector, or every first-level sector when they have none.
 */
const getScopeSectors = async (userSectorId) => {
  let where = { is_active: true };
  if (userSectorId) {
    where.sector_node_id = userSectorId;
  } else {
    const roots = await SectorNode.findAll({
      where: { parent_id: null, is_active: true },
      attributes: ["sector_node_id"],
      raw: true,
    });
    where.parent_id = roots.map((r) => r.sector_node_id);
  }
  return SectorNode.findAll({
    where,
    attributes: ["sector_node_id", "name"],
    order: [["name", "ASC"]],
    raw: true,
  });
};

const select = (sql, replacements) =>
  sequelize.query(sql, { replacements, type: sequelize.QueryTypes.SELECT });

// " AND col >= :from AND col < :to" — only the bounds that are set
const dateClause = (column, from, to) =>
  `${from ? ` AND ${column} >= :from` : ""}${to ? ` AND ${column} < :to` : ""}`;

const percentChange = (current, previous) =>
  previous > 0 ? Math.round(((current - previous) / previous) * 100) : null;

const round1 = (n) => (n === null || n === undefined ? null : Math.round(Number(n) * 10) / 10);

/* ------------------------------------------------------------------ */
/* Complaints                                                          */
/* ------------------------------------------------------------------ */
const complaintOverview = async ({ ids, categoryId, from, to, allIds }) => {
  const catClause = categoryId ? " AND category_id = :categoryId" : "";
  const params = { ids, categoryId, from, to };
  const scope = `deleted_at IS NULL AND sector_node_id IN (:ids)${catClause}`;

  const [statusRows, [overdueRow], [avgRow], trendRows, sectorRows, categoryRows] = await Promise.all([
    select(
      `SELECT status, COUNT(*)::int AS count FROM complaints
        WHERE ${scope}${dateClause("created_at", from, to)} GROUP BY status`,
      params,
    ),
    select(
      `SELECT COUNT(*)::int AS count FROM complaints
        WHERE ${scope} AND status IN (:open)
          AND created_at < NOW() - make_interval(days => :days)${dateClause("created_at", from, to)}`,
      { ...params, open: OPEN_STATUSES, days: OVERDUE_AFTER_DAYS },
    ),
    // Days from submission to the first resolution, averaged over resolved complaints
    select(
      `SELECT AVG(days)::float AS avg_days FROM (
          SELECT EXTRACT(EPOCH FROM (MIN(r.resolved_at) - c.created_at)) / 86400 AS days
            FROM complaints c JOIN complaint_resolutions r ON r.complaint_id = c.complaint_id
           WHERE c.deleted_at IS NULL AND c.sector_node_id IN (:ids)
                 ${categoryId ? "AND c.category_id = :categoryId" : ""}${dateClause("c.created_at", from, to)}
           GROUP BY c.complaint_id, c.created_at) t`,
      params,
    ),
    // Received per bucket, and resolved per bucket (by first resolution date)
    select(
      `WITH received AS (
          SELECT date_trunc(:unit, created_at) AS bucket, COUNT(*)::int AS n
            FROM complaints WHERE ${scope}${dateClause("created_at", from, to)} GROUP BY 1
        ), resolved AS (
          SELECT date_trunc(:unit, first_resolved) AS bucket, COUNT(*)::int AS n FROM (
            SELECT MIN(r.resolved_at) AS first_resolved
              FROM complaints c JOIN complaint_resolutions r ON r.complaint_id = c.complaint_id
             WHERE c.deleted_at IS NULL AND c.sector_node_id IN (:ids)
                   ${categoryId ? "AND c.category_id = :categoryId" : ""}
             GROUP BY c.complaint_id) f
           WHERE TRUE${dateClause("first_resolved", from, to)} GROUP BY 1
        )
        SELECT COALESCE(a.bucket, b.bucket) AS bucket,
               COALESCE(a.n, 0) AS received, COALESCE(b.n, 0) AS resolved
          FROM received a FULL OUTER JOIN resolved b ON a.bucket = b.bucket
         ORDER BY 1`,
      { ...params, unit: trendUnit(from, to) },
    ),
    // Per sector across the whole scope (so the comparison always shows every sector)
    select(
      `SELECT sector_node_id,
              COUNT(*)::int AS total,
              COUNT(*) FILTER (WHERE status IN (:open))::int AS open,
              COUNT(*) FILTER (WHERE status IN (:resolved))::int AS resolved
         FROM complaints
        WHERE deleted_at IS NULL AND sector_node_id IN (:allIds)${catClause}${dateClause("created_at", from, to)}
        GROUP BY sector_node_id`,
      { ...params, allIds, open: OPEN_STATUSES, resolved: RESOLVED_STATUSES },
    ),
    select(
      `SELECT c.category_id, cc.name, COUNT(*)::int AS total
         FROM complaints c JOIN complaint_categories cc ON cc.category_id = c.category_id
        WHERE c.deleted_at IS NULL AND c.sector_node_id IN (:ids)${dateClause("c.created_at", from, to)}
        GROUP BY c.category_id, cc.name ORDER BY total DESC LIMIT 8`,
      params,
    ),
  ]);

  const byStatus = Object.fromEntries(statusRows.map((r) => [r.status, r.count]));
  const sum = (list) => list.reduce((n, s) => n + (byStatus[s] || 0), 0);
  const total = statusRows.reduce((n, r) => n + r.count, 0);

  let previousTotal = null;
  if (from) {
    const prevFrom = new Date(from - (to - from));
    const [prev] = await select(
      `SELECT COUNT(*)::int AS count FROM complaints WHERE ${scope}${dateClause("created_at", prevFrom, from)}`,
      { ids, categoryId, from: prevFrom, to: from },
    );
    previousTotal = prev.count;
  }

  return {
    kpis: {
      total,
      open: sum(OPEN_STATUSES),
      resolved: sum(RESOLVED_STATUSES),
      rejected: byStatus.rejected || 0,
      overdue: overdueRow.count,
      overdue_after_days: OVERDUE_AFTER_DAYS,
      avg_resolution_days: round1(avgRow.avg_days),
      previous_total: previousTotal,
      change_percent: previousTotal === null ? null : percentChange(total, previousTotal),
    },
    by_status: byStatus,
    trend: trendRows.map((r) => ({ date: r.bucket, received: r.received, resolved: r.resolved })),
    by_sector: sectorRows,
    by_category: categoryRows,
  };
};

/* ------------------------------------------------------------------ */
/* Feedback                                                            */
/* ------------------------------------------------------------------ */
const feedbackOverview = async ({ ids, includeUnassigned, from, to, allIds }) => {
  // Feedback has an optional sector; unrestricted "all sectors" also counts feedback without one
  const scope = `deleted_at IS NULL AND (sector_node_id IN (:ids)${includeUnassigned ? " OR sector_node_id IS NULL" : ""})`;
  const params = { ids, from, to };

  const [[totals], ratingRows, trendRows, sectorRows, lowRows] = await Promise.all([
    select(
      `SELECT COUNT(*)::int AS total, AVG(rating)::float AS avg_rating,
              COUNT(*) FILTER (WHERE rating >= 4)::int AS satisfied,
              COUNT(*) FILTER (WHERE rating <= 2)::int AS unsatisfied
         FROM feedbacks WHERE ${scope}${dateClause("created_at", from, to)}`,
      params,
    ),
    select(
      `SELECT rating, COUNT(*)::int AS count FROM feedbacks
        WHERE ${scope}${dateClause("created_at", from, to)} GROUP BY rating`,
      params,
    ),
    select(
      `SELECT date_trunc(:unit, created_at) AS bucket, COUNT(*)::int AS count, AVG(rating)::float AS avg_rating
         FROM feedbacks WHERE ${scope}${dateClause("created_at", from, to)} GROUP BY 1 ORDER BY 1`,
      { ...params, unit: trendUnit(from, to) },
    ),
    select(
      `SELECT sector_node_id, COUNT(*)::int AS total, AVG(rating)::float AS avg_rating
         FROM feedbacks WHERE deleted_at IS NULL AND sector_node_id IN (:allIds)${dateClause("created_at", from, to)}
        GROUP BY sector_node_id`,
      { ...params, allIds },
    ),
    select(
      `SELECT f.feedback_id, f.full_name, LEFT(f.feedback, 160) AS feedback, f.rating, f.created_at, s.name AS sector_name
         FROM feedbacks f LEFT JOIN sector_nodes s ON s.sector_node_id = f.sector_node_id
        WHERE f.deleted_at IS NULL AND f.rating <= 2
          AND (f.sector_node_id IN (:ids)${includeUnassigned ? " OR f.sector_node_id IS NULL" : ""})${dateClause("f.created_at", from, to)}
        ORDER BY f.created_at DESC LIMIT 5`,
      params,
    ),
  ]);

  let previousTotal = null;
  if (from) {
    const prevFrom = new Date(from - (to - from));
    const [prev] = await select(
      `SELECT COUNT(*)::int AS count FROM feedbacks WHERE ${scope}${dateClause("created_at", prevFrom, from)}`,
      { ids, from: prevFrom, to: from },
    );
    previousTotal = prev.count;
  }

  const pct = (n) => (totals.total > 0 ? Math.round((n / totals.total) * 100) : null);

  return {
    kpis: {
      total: totals.total,
      avg_rating: round1(totals.avg_rating),
      satisfied_percent: pct(totals.satisfied),
      unsatisfied_percent: pct(totals.unsatisfied),
      previous_total: previousTotal,
      change_percent: previousTotal === null ? null : percentChange(totals.total, previousTotal),
    },
    by_rating: [5, 4, 3, 2, 1].map((r) => ({
      rating: r,
      count: ratingRows.find((row) => Number(row.rating) === r)?.count || 0,
    })),
    trend: trendRows.map((r) => ({ date: r.bucket, count: r.count, avg_rating: round1(r.avg_rating) })),
    by_sector: sectorRows.map((r) => ({ ...r, avg_rating: round1(r.avg_rating) })),
    low_ratings: lowRows,
  };
};

/**
 * Dashboard overview for one tab.
 * @param {object} opts
 * @param {"complaint"|"feedback"} opts.type
 * @param {string|null} opts.userSectorId  user's own sector (null = unrestricted)
 * @param {string|null} opts.sectorId      optional filter, must be within scope
 * @param {string|null} opts.categoryId    optional complaint category filter
 * @param {string} opts.period             7d | 30d | 90d | year | all
 */
const getDashboardOverview = async ({ type, userSectorId, sectorId, categoryId, period }) => {
  const sectors = await getScopeSectors(userSectorId);
  const allIds = sectors.map((s) => s.sector_node_id);

  if (sectorId && !allIds.includes(sectorId)) {
    const err = new Error("You do not have access to this sector.");
    err.status = 403;
    throw err;
  }

  const { from, to } = resolvePeriod(period);
  const ids = sectorId ? [sectorId] : allIds;
  const categories = await ComplaintCategory.findAll({
    attributes: ["category_id", "name"],
    order: [["name", "ASC"]],
    raw: true,
  });

  const meta = {
    period: { key: period, from, to },
    filters: { sectors, categories },
  };

  // No sectors in scope → empty but well-formed result
  if (ids.length === 0) {
    return { ...meta, empty: true };
  }

  const data =
    type === "feedback"
      ? await feedbackOverview({ ids, includeUnassigned: !sectorId && !userSectorId, from, to, allIds })
      : await complaintOverview({ ids, categoryId, from, to, allIds });

  const sectorName = Object.fromEntries(sectors.map((s) => [s.sector_node_id, s.name]));
  data.by_sector = (data.by_sector || []).map((row) => ({ ...row, name: sectorName[row.sector_node_id] }));

  return { ...meta, ...data };
};

module.exports = { getDashboardOverview, OVERDUE_AFTER_DAYS };
