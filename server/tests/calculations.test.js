import { describe, expect, it } from "vitest";
import { addBudgetStatus } from "../src/services/budgetService.js";
import { safeCsvText, escapeCsv } from "../src/controllers/exportController.js";
import { validateTestDatabase } from "./setup.js";

// Budget and CSV Tests
describe("Test database guard", function () {
  it("accepts the configured spendwise_test database", function () {
    process.env.MONGODB_URI_TEST = "mongodb://127.0.0.1:27017/spendwise_test";
    expect(validateTestDatabase).not.toThrow();
  });
});

describe("Budget status", function () {
  it("marks spent budgets as approaching limit", function () {
    const budgets = [{ spentMinor: 8000, amountMinor: 10000, percentUsed: 80 }];
    expect(addBudgetStatus(budgets, 80)[0].status).toBe("approaching limit");
  });

  it("marks spent budgets over limit as exceeded", function () {
    const budgets = [{ spentMinor: 11000, amountMinor: 10000, percentUsed: 110 }];
    expect(addBudgetStatus(budgets, 80)[0].status).toBe("budget exceeded");
  });
});

describe("CSV safety", function () {
  it("protects formula-like text", function () {
    expect(safeCsvText("=SUM(A1:A2)")).toBe("'=SUM(A1:A2)");
  });

  it("escapes quotes and commas", function () {
    expect(escapeCsv("Food, home")).toBe('"Food, home"');
  });
});
