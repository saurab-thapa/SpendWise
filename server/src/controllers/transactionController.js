import Transaction from "../models/Transaction.js";
import User from "../models/User.js";
import { incomeCategories, expenseCategories } from "../config/categories.js";
import { createError } from "../utils/errors.js";

async function categoryIsAllowed(userId, type, category) {
  const user = await User.findById(userId);
  const defaults = type === "income" ? incomeCategories : expenseCategories;
  if (defaults.includes(category)) return true;
  return user.customCategories.some(function matchesCustom(item) { return item.type === type && item.name === category; });
}

export async function createTransaction(req, res, next) {
  try {
    const allowed = await categoryIsAllowed(req.session.userId, req.body.type, req.body.category);
    if (!allowed) throw createError("Choose a valid category", 400);
    const user = await User.findById(req.session.userId);
    const transaction = await Transaction.create({ ...req.body, user: user._id, accountTypeAtCreation: user.accountType, date: new Date(req.body.date + "T00:00:00.000Z") });
    res.status(201).json({ success: true, data: { transaction } });
  } catch (error) { return next(error); }
}

export async function listTransactions(req, res, next) {
  try {
    const page = Number(req.query.page || 1);
    const limit = Math.min(Number(req.query.limit || 20), 100);
    const query = { user: req.session.userId };
    if (req.query.type) query.type = req.query.type;
    if (req.query.category) query.category = req.query.category;
    if (req.query.search) query.description = { $regex: req.query.search, $options: "i" };
    if (req.query.from || req.query.to) {
      query.date = {};
      if (req.query.from) query.date.$gte = new Date(req.query.from + "T00:00:00.000Z");
      if (req.query.to) query.date.$lte = new Date(req.query.to + "T00:00:00.000Z");
    }
    const sortField = req.query.sort === "amount" ? "amountMinor" : "date";
    const sortDirection = req.query.direction === "asc" ? 1 : -1;
    const records = await Transaction.find(query).sort({ [sortField]: sortDirection }).skip((page - 1) * limit).limit(limit);
    const total = await Transaction.countDocuments(query);
    res.json({ success: true, data: { items: records, pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) } } });
  } catch (error) { return next(error); }
}

export async function getTransaction(req, res, next) {
  try {
    const transaction = await Transaction.findOne({ _id: req.params.id, user: req.session.userId });
    if (!transaction) throw createError("Transaction not found", 404);
    res.json({ success: true, data: { transaction } });
  } catch (error) { return next(error); }
}

export async function updateTransaction(req, res, next) {
  try {
    const allowed = await categoryIsAllowed(req.session.userId, req.body.type, req.body.category);
    if (!allowed) throw createError("Choose a valid category", 400);
    const update = { ...req.body };
    if (req.body.date) update.date = new Date(req.body.date + "T00:00:00.000Z");
    const transaction = await Transaction.findOneAndUpdate({ _id: req.params.id, user: req.session.userId }, update, { returnDocument: "after", runValidators: true });
    if (!transaction) throw createError("Transaction not found", 404);
    res.json({ success: true, data: { transaction } });
  } catch (error) { return next(error); }
}

export async function deleteTransaction(req, res, next) {
  try {
    const transaction = await Transaction.findOneAndDelete({ _id: req.params.id, user: req.session.userId });
    if (!transaction) throw createError("Transaction not found", 404);
    res.json({ success: true, data: { message: "Transaction deleted" } });
  } catch (error) { return next(error); }
}
