"use strict";

const SYSTEM_TIMEZONE = process.env.SYSTEM_TIMEZONE || "Africa/Addis_Ababa";

const ISO_DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const ISO_DATETIME_NO_TZ =
  /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?$/;

function normalizeToIsoUtcString(input) {
  const trimmed = String(input).trim();
  if (!trimmed) return null;

  if (ISO_DATE_ONLY.test(trimmed)) {
    return `${trimmed}T00:00:00.000Z`;
  }

  if (/Z$/i.test(trimmed) || /[+-]\d{2}:?\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  if (ISO_DATETIME_NO_TZ.test(trimmed)) {
    const withT = trimmed.replace(" ", "T");
    const withMs = withT.includes(".") ? withT : `${withT}.000`;
    return `${withMs}Z`;
  }

  const ms = Date.parse(trimmed);
  if (!Number.isNaN(ms)) {
    return new Date(ms).toISOString();
  }

  return null;
}

function parseUtcDate(value) {
  if (value == null || value === "") return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === "number") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  if (typeof value === "string") {
    const iso = normalizeToIsoUtcString(value);
    if (!iso) return null;
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  return null;
}

function toUtc(value) {
  const d = parseUtcDate(value);
  return d ? d.toISOString() : null;
}

function toUtcDateOrNow(value) {
  return parseUtcDate(value) || new Date();
}

function isValidDate(value) {
  return parseUtcDate(value) !== null;
}

module.exports = {
  SYSTEM_TIMEZONE,
  parseUtcDate,
  toUtc,
  toUtcDateOrNow,
  isValidDate,
  normalizeToIsoUtcString,
};
