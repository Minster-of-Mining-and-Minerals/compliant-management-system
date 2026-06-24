"use strict";

const { toUtc } = require("./dateTime");

/**
 * Recursively convert Date instances to ISO UTC strings in API responses.
 */
function serializeDates(value) {
  if (value === null || value === undefined) return value;

  if (value instanceof Date) {
    return toUtc(value);
  }

  if (Array.isArray(value)) {
    return value.map(serializeDates);
  }

  if (typeof value === "object") {
    if (value instanceof Buffer) return value;

    const out = {};
    for (const [key, nested] of Object.entries(value)) {
      out[key] = serializeDates(nested);
    }
    return out;
  }

  return value;
}

/**
 * Express middleware — all res.json() payloads use ISO UTC datetimes.
 */
function dateSerializationMiddleware(req, res, next) {
  const originalJson = res.json.bind(res);
  res.json = function jsonWithUtcDates(body) {
    return originalJson(serializeDates(body));
  };
  next();
}

module.exports = {
  serializeDates,
  dateSerializationMiddleware,
};
