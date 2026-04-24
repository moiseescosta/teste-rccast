import { describe, expect, it } from "vitest";
import { computeWorkedHours, normalizeTimeEntryStatus } from "./timeUtils";

describe("computeWorkedHours", () => {
  it("calculates same-day shift", () => {
    expect(computeWorkedHours("08:00", "17:00", 1)).toBe(8);
  });

  it("calculates overnight shift", () => {
    expect(computeWorkedHours("22:00", "06:00", 1)).toBe(7);
  });

  it("never returns negative", () => {
    expect(computeWorkedHours("08:00", "09:00", 2)).toBe(0);
  });
});

describe("normalizeTimeEntryStatus", () => {
  it("maps localized statuses", () => {
    expect(normalizeTimeEntryStatus("Registrado")).toBe("completed");
    expect(normalizeTimeEntryStatus("Ativo")).toBe("active");
  });
});
