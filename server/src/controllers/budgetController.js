import Budget from "../models/Budget.js";
import User from "../models/User.js";
import { createError } from "../utils/errors.js";
import { calculateBudgets, addBudgetStatus } from "../services/budgetService.js";

export async function listBudgets(req, res, next) {
  try {
    const month = req.query.month || new Date().toISOString().slice(0, 7);
    const user = await User.findById(req.session.userId);
    const budgets = await Budget.find({ user: user._id, month }).sort({ category: 1 });
    const calculated = await calculateBudgets(user._id, budgets, month);
    const complete = addBudgetStatus(calculated, user.budgetWarningPercent || 80);
    res.json({ success: true, data: { month, budgets: complete } });
  } catch (error) { return next(error); }
}

export async function createBudget(req, res, next) {
  try {
    if (req.body.budgets) {
      const categories = req.body.budgets.map((budget) => budget.category);
      if (new Set(categories).size !== categories.length) {
        throw createError("Each template category must be unique", 400);
      }

      const existingBudgets = await Budget.find({
        user: req.session.userId,
        month: req.body.month,
        category: { $in: categories }
      }).select("category").lean();

      if (existingBudgets.length) {
        throw createError(`A budget already exists for ${existingBudgets[0].category} this month`, 409);
      }

      const budgets = await Budget.insertMany(req.body.budgets.map((budget) => ({
        ...budget,
        user: req.session.userId,
        month: req.body.month
      })));
      return res.status(201).json({ success: true, data: { budgets } });
    }

    const budget = await Budget.create({ user: req.session.userId, month: req.body.month, category: req.body.category || null, amountMinor: req.body.amountMinor });
    res.status(201).json({ success: true, data: { budget } });
  } catch (error) { if (error.code === 11000) return next(createError("A budget already exists for this month and category", 409)); return next(error); }
}

export async function updateBudget(req, res, next) {
  try {
    const budget = await Budget.findOneAndUpdate({ _id: req.params.id, user: req.session.userId }, { amountMinor: req.body.amountMinor }, { returnDocument: "after", runValidators: true });
    if (!budget) throw createError("Budget not found", 404);
    res.json({ success: true, data: { budget } });
  } catch (error) { return next(error); }
}

export async function deleteBudget(req, res, next) {
  try {
    const budget = await Budget.findOneAndDelete({ _id: req.params.id, user: req.session.userId });
    if (!budget) throw createError("Budget not found", 404);
    res.json({ success: true, data: { message: "Budget deleted" } });
  } catch (error) { return next(error); }
}
