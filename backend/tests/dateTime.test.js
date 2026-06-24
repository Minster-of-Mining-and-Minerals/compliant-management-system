"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
  parseUtcDate,
  toUtc,
  isValidDate,
  normalizeToIsoUtcString,
} = require("../utils/dateTime");
const { serializeDates } = require("../utils/dateSerializer");

describe("dateTime", () => {
  it("parses ISO UTC", () => {
    const d = parseUtcDate("2026-06-24T08:30:00.000Z");
    assert.equal(d.toISOString(), "2026-06-24T08:30:00.000Z");
  });

  it("normalizes datetime without timezone", () => {
    const iso = normalizeToIsoUtcString("2026-06-24 08:30:00");
    assert.ok(iso.endsWith("Z"));
    assert.ok(isValidDate(parseUtcDate(iso)));
  });

  it("toUtc serializes dates", () => {
    assert.equal(toUtc("2026-06-24"), "2026-06-24T00:00:00.000Z");
  });
});

describe("serializeDates", () => {
  it("converts nested Date objects to ISO strings", () => {
    const input = {
      startDate: new Date("2026-06-24T08:30:00.000Z"),
      items: [{ created_at: new Date("2026-06-24T08:30:00.000Z") }],
    };
    const out = serializeDates(input);
    assert.equal(out.startDate, "2026-06-24T08:30:00.000Z");
    assert.equal(out.items[0].created_at, "2026-06-24T08:30:00.000Z");
  });
});
