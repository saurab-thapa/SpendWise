import { describe, expect, it } from "vitest";
import {
  calculateIncomeStabilityInsights,
  calculateProfessionalInsights,
  calculateStudentInsights
} from "../src/services/analyticsService.js";

describe("Student dashboard calculations", function () {
  it("calculates a daily limit and budget runway from monthly figures", function () {
    const insights = calculateStudentInsights({
      overallBudgetMinor: 30000,
      expenseMinor: 10000,
      month: "2026-03",
      now: new Date("2026-03-11T12:00:00.000Z")
    });

    expect(insights.dailySpendingLimitMinor).toBe(952);
    expect(insights.budgetRunwayDays).toBe(22);
  });

  it("shows a clear state when no overall budget exists", function () {
    const insights = calculateStudentInsights({
      overallBudgetMinor: null,
      expenseMinor: 10000,
      month: "2026-03",
      now: new Date("2026-03-11T12:00:00.000Z")
    });

    expect(insights.hasBudget).toBe(false);
    expect(insights.dailySpendingLimitMinor).toBeNull();
    expect(insights.note).toContain("Set an overall budget");
  });
});

describe("Working professional dashboard calculations", function () {
  it("separates fixed and flexible costs and calculates a savings rate", function () {
    const insights = calculateProfessionalInsights({
      incomeMinor: 3000,
      categoryRows: [
        { category: "Rent", amountMinor: 300 },
        { category: "Bills", amountMinor: 200 },
        { category: "Subscriptions", amountMinor: 100 },
        { category: "Food", amountMinor: 600 }
      ]
    });

    expect(insights.savingsRatePercent).toBe(60);
    expect(insights.fixedSpendingMinor).toBe(600);
    expect(insights.flexibleSpendingMinor).toBe(600);
    expect(insights.fixedSpendingPercent).toBe(50);
  });

  it("leaves savings rate empty when there is no income", function () {
    const insights = calculateProfessionalInsights({
      incomeMinor: 0,
      categoryRows: [{ category: "Food", amountMinor: 500 }]
    });

    expect(insights.savingsRatePercent).toBeNull();
  });
});

describe("Personal finance income stability calculations", function () {
  it("calculates average and lowest income only from previous months with income", function () {
    const insights = calculateIncomeStabilityInsights({
      currentMonthIncomeMinor: 12000,
      previousMonthlyIncomes: [
        { month: "2026-01", incomeMinor: 10000 },
        { month: "2026-02", incomeMinor: 0 },
        { month: "2026-03", incomeMinor: 20000 }
      ]
    });

    expect(insights.currentMonthIncomeMinor).toBe(12000);
    expect(insights.previousIncomeMonthCount).toBe(2);
    expect(insights.averagePreviousMonthlyIncomeMinor).toBe(15000);
    expect(insights.lowestPreviousMonthlyIncomeMinor).toBe(10000);
  });

  it("shows an empty state when no previous months have income", function () {
    const insights = calculateIncomeStabilityInsights({
      currentMonthIncomeMinor: 12000,
      previousMonthlyIncomes: [{ month: "2026-02", incomeMinor: 0 }]
    });

    expect(insights.averagePreviousMonthlyIncomeMinor).toBeNull();
    expect(insights.lowestPreviousMonthlyIncomeMinor).toBeNull();
    expect(insights.note).toContain("earlier months");
  });
});
