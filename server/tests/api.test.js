import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import User from "../src/models/User.js";
import Transaction from "../src/models/Transaction.js";
import Budget from "../src/models/Budget.js";
import SavingsGoal from "../src/models/SavingsGoal.js";
import { connectTestDatabase, clearTestDatabase, disconnectTestDatabase } from "./setup.js";

// API Tests
let app;
let agentOne;
let agentTwo;
let userOne;
const currentMonth = new Date().toISOString().slice(0, 7);
const previousThreeMonths = [3, 2, 1].map((offset) => {
  const date = new Date();
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() - offset, 1)).toISOString().slice(0, 7);
});

beforeAll(async function startTests() {
  await connectTestDatabase();
  process.env.NODE_ENV = "test";
  app = createApp({ mongoUri: process.env.MONGODB_URI_TEST, sessionSecret: "test-secret", clientOrigin: "http://localhost:5173" });
});

beforeEach(async function resetTestData() {
  await clearTestDatabase();
  agentOne = request.agent(app);
  agentTwo = request.agent(app);
  const registerOne = await agentOne.post("/api/auth/register").set("Origin", "http://localhost:5173").send({ name: "Student One", email: "student-one@example.com", password: "TestPass123", confirmPassword: "TestPass123", accountType: "student" });
  const registerTwo = await agentTwo.post("/api/auth/register").set("Origin", "http://localhost:5173").send({ name: "Student Two", email: "student-two@example.com", password: "TestPass123", confirmPassword: "TestPass123", accountType: "student" });
  userOne = await User.findOne({ email: "student-one@example.com" });
  if (registerOne.status !== 201 || registerTwo.status !== 201) throw new Error("Test setup registration failed");
});

afterAll(async function stopTests() { await disconnectTestDatabase(); });

describe("Registration", function () {
  it("stores passwordHash internally but excludes it from normal queries", async function () {
    const storedUser = await User.findById(userOne._id).select("+passwordHash");
    expect(storedUser.passwordHash).toBeDefined();
    const normalUser = await User.findById(userOne._id);
    expect(normalUser.passwordHash).toBeUndefined();
  });

  it("rejects a duplicate email", async function () {
    const response = await agentOne.post("/api/auth/register").set("Origin", "http://localhost:5173").send({ name: "Duplicate", email: "student-one@example.com", password: "TestPass123", confirmPassword: "TestPass123", accountType: "student" });
    expect(response.status).toBe(409);
  });
});

describe("Account Type Switching", function () {
  it("keeps the user ID and financial records unchanged", async function () {
    const userId = userOne._id.toString();
    await Transaction.create({ user: userOne._id, type: "expense", amountMinor: 1200, category: "Food", description: "Student lunch", date: new Date("2026-10-01T00:00:00.000Z") });
    await Budget.create({ user: userOne._id, month: "2026-10", category: null, amountMinor: 50000 });
    await SavingsGoal.create({ user: userOne._id, name: "Books", targetAmountMinor: 10000 });
    const transactionBefore = await Transaction.findOne({ user: userOne._id }).lean();
    const budgetBefore = await Budget.findOne({ user: userOne._id }).lean();
    const savingsBefore = await SavingsGoal.findOne({ user: userOne._id }).lean();

    const switchResponse = await agentOne.patch("/api/profile/account-type").set("Origin", "http://localhost:5173").send({ accountType: "workingProfessional" });
    expect(switchResponse.status).toBe(200);
    expect(switchResponse.body.data.user.id).toBe(userId);

    const transactionAfter = await Transaction.findOne({ user: userOne._id }).lean();
    const budgetAfter = await Budget.findOne({ user: userOne._id }).lean();
    const savingsAfter = await SavingsGoal.findOne({ user: userOne._id }).lean();
    expect(transactionAfter).toEqual(transactionBefore);
    expect(budgetAfter).toEqual(budgetBefore);
    expect(savingsAfter).toEqual(savingsBefore);

    const history = await User.findById(userOne._id);
    expect(history.accountTypeHistory.length).toBe(1);
    expect(history.accountTypeHistory[0].newType).toBe("workingProfessional");
  });
});

describe("Suggested budget templates", function () {
  it("creates only the budget categories explicitly submitted by the user", async function () {
    const response = await agentOne.post("/api/budgets")
      .set("Origin", "http://localhost:5173")
      .send({
        month: "2026-10",
        budgets: [
          { category: "Food", amountMinor: 12000 },
          { category: "Transport", amountMinor: 5000 }
        ]
      });

    expect(response.status).toBe(201);
    const savedBudgets = await Budget.find({ user: userOne._id, month: "2026-10" }).sort({ category: 1 }).lean();
    expect(savedBudgets.map((budget) => budget.category)).toEqual(["Food", "Transport"]);
  });

  it("does not partially create a template when one of its categories already exists", async function () {
    await Budget.create({ user: userOne._id, month: "2026-10", category: "Food", amountMinor: 12000 });

    const response = await agentOne.post("/api/budgets")
      .set("Origin", "http://localhost:5173")
      .send({
        month: "2026-10",
        budgets: [
          { category: "Food", amountMinor: 15000 },
          { category: "Transport", amountMinor: 5000 }
        ]
      });

    expect(response.status).toBe(409);
    const savedBudgets = await Budget.find({ user: userOne._id, month: "2026-10" }).lean();
    expect(savedBudgets).toHaveLength(1);
    expect(savedBudgets[0].amountMinor).toBe(12000);
  });
});

describe("Account-specific dashboard summaries", function () {
  it("returns a student daily limit when an overall budget exists", async function () {
    await Budget.create({ user: userOne._id, month: currentMonth, category: null, amountMinor: 50000 });
    await Transaction.create({ user: userOne._id, type: "expense", amountMinor: 10000, category: "Food", description: "Lunch", date: new Date(`${currentMonth}-02T00:00:00.000Z`) });

    const response = await agentOne.get(`/api/analytics/summary?month=${currentMonth}`).set("Origin", "http://localhost:5173");

    expect(response.status).toBe(200);
    expect(response.body.data.accountTypeInsights.type).toBe("student");
    expect(response.body.data.accountTypeInsights.hasBudget).toBe(true);
    expect(response.body.data.accountTypeInsights.dailySpendingLimitMinor).toEqual(expect.any(Number));
  });

  it("returns professional savings and fixed versus flexible spending from records", async function () {
    await agentOne.patch("/api/profile/account-type").set("Origin", "http://localhost:5173").send({ accountType: "workingProfessional" });
    await Transaction.create([
      { user: userOne._id, type: "income", amountMinor: 10000, category: "Salary", description: "Pay", date: new Date(`${currentMonth}-02T00:00:00.000Z`) },
      { user: userOne._id, type: "expense", amountMinor: 2000, category: "Rent", description: "Rent", date: new Date(`${currentMonth}-03T00:00:00.000Z`) },
      { user: userOne._id, type: "expense", amountMinor: 3000, category: "Food", description: "Food", date: new Date(`${currentMonth}-04T00:00:00.000Z`) }
    ]);

    const response = await agentOne.get(`/api/analytics/summary?month=${currentMonth}`).set("Origin", "http://localhost:5173");
    const insights = response.body.data.accountTypeInsights;

    expect(response.status).toBe(200);
    expect(insights.type).toBe("workingProfessional");
    expect(insights.savingsRatePercent).toBe(50);
    expect(insights.fixedSpendingMinor).toBe(2000);
    expect(insights.flexibleSpendingMinor).toBe(3000);
  });

  it("returns personal finance income comparisons using prior months with income", async function () {
    await agentOne.patch("/api/profile/account-type").set("Origin", "http://localhost:5173").send({ accountType: "personalFinance" });
    await Transaction.create([
      { user: userOne._id, type: "income", amountMinor: 10000, category: "Freelance", description: "Earlier month one", date: new Date(`${previousThreeMonths[0]}-02T00:00:00.000Z`) },
      { user: userOne._id, type: "income", amountMinor: 20000, category: "Freelance", description: "Earlier month three", date: new Date(`${previousThreeMonths[2]}-02T00:00:00.000Z`) },
      { user: userOne._id, type: "income", amountMinor: 15000, category: "Freelance", description: "Current month", date: new Date(`${currentMonth}-02T00:00:00.000Z`) }
    ]);

    const response = await agentOne.get(`/api/analytics/summary?month=${currentMonth}`).set("Origin", "http://localhost:5173");
    const insights = response.body.data.accountTypeInsights;

    expect(response.status).toBe(200);
    expect(insights.type).toBe("personalFinance");
    expect(insights.currentMonthIncomeMinor).toBe(15000);
    expect(insights.averagePreviousMonthlyIncomeMinor).toBe(15000);
    expect(insights.lowestPreviousMonthlyIncomeMinor).toBe(10000);
  });
});

describe("Record Ownership", function () {
  it("blocks cross-user transaction access", async function () {
    const transaction = await Transaction.create({ user: userOne._id, type: "expense", amountMinor: 1200, category: "Food", description: "Private food", date: new Date("2026-10-01T00:00:00.000Z") });
    const response = await agentTwo.get("/api/transactions/" + transaction._id).set("Origin", "http://localhost:5173");
    expect(response.status).toBe(404);
  });

  it("blocks cross-user savings access", async function () {
    const goal = await SavingsGoal.create({ user: userOne._id, name: "Private goal", targetAmountMinor: 10000 });
    const response = await agentTwo.get("/api/savings-goals/" + goal._id).set("Origin", "http://localhost:5173");
    expect(response.status).toBe(404);
  });

  it("blocks cross-user budget access and changes", async function () {
    const budget = await Budget.create({ user: userOne._id, month: "2026-10", category: null, amountMinor: 50000 });
    const response = await agentTwo.patch("/api/budgets/" + budget._id).set("Origin", "http://localhost:5173").set("Content-Type", "application/json").send({ amountMinor: 1000 });
    expect(response.status).toBe(404);
  });
});

describe("Savings Validation", function () {
  it("rejects a negative savings contribution", async function () {
    const goal = await SavingsGoal.create({ user: userOne._id, name: "Books", targetAmountMinor: 10000 });
    const response = await agentOne.post("/api/savings-goals/" + goal._id + "/contributions").set("Origin", "http://localhost:5173").set("Content-Type", "application/json").send({ amountMinor: -100, date: "2026-10-01" });
    expect(response.status).toBe(400);
  });
});

describe("Security", function () {
  it("rejects a bad Origin", async function () {
    const response = await agentOne.post("/api/transactions").set("Origin", "https://bad.example").set("Content-Type", "application/json").send({ type: "income", amountMinor: 1000, category: "Salary", description: "Test", date: "2026-10-01" });
    expect(response.status).toBe(403);
  });

  it("does not expose passwordHash from registration", async function () {
    const response = await agentOne.get("/api/profile").set("Origin", "http://localhost:5173");
    expect(response.status).toBe(200);
    expect(JSON.stringify(response.body)).not.toContain("passwordHash");
  });
});
