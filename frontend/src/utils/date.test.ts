import { describe, expect, it } from "vitest";
import {
  compareUtcDates,
  formatDate,
  formatDateTime,
  formatTime,
  isValidDate,
  parseUtcDate,
  toUtc,
} from "./date";

describe("parseUtcDate", () => {
  it("parses ISO UTC strings", () => {
    const d = parseUtcDate("2026-06-24T08:30:00.000Z");
    expect(d?.toISOString()).toBe("2026-06-24T08:30:00.000Z");
  });

  it("parses date-only as UTC midnight", () => {
    const d = parseUtcDate("2026-06-24");
    expect(d?.toISOString()).toBe("2026-06-24T00:00:00.000Z");
  });

  it("parses Sequelize-style datetime without timezone", () => {
    const d = parseUtcDate("2026-06-24 08:30:00");
    expect(d).not.toBeNull();
    expect(isValidDate(d)).toBe(true);
  });

  it("returns null for invalid values", () => {
    expect(parseUtcDate("not-a-date")).toBeNull();
    expect(parseUtcDate(null)).toBeNull();
    expect(parseUtcDate(undefined)).toBeNull();
  });
});

describe("formatters", () => {
  const sample = "2026-06-24T08:30:00.000Z";

  it("never returns NaN or Invalid Date text", () => {
    expect(formatDate("bad")).toBe("—");
    expect(formatDateTime(null)).toBe("—");
    expect(formatTime(undefined)).toBe("—");
  });

  it("formats valid UTC in system timezone", () => {
    expect(formatDate(sample)).toMatch(/2026/);
    expect(formatTime(sample)).toMatch(/\d{2}:\d{2}/);
    expect(formatDateTime(sample)).toMatch(/2026/);
  });

  it("toUtc returns ISO string", () => {
    expect(toUtc(sample)).toBe("2026-06-24T08:30:00.000Z");
  });

  it("compareUtcDates orders correctly", () => {
    expect(
      compareUtcDates("2026-06-24T08:30:00.000Z", "2026-06-25T08:30:00.000Z"),
    ).toBeLessThan(0);
  });
});
