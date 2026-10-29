import User from "../models/User.js";
import Transaction from "../models/Transaction.js";
import { incomeCategories, expenseCategories } from "../config/categories.js";
import { createError } from "../utils/errors.js";

export async function getCategories(req, res, next) {
  try {
    const user = await User.findById(req.session.userId);
    const custom = user?.customCategories || [];
    res.json({ success: true, data: { income: incomeCategories, expense: expenseCategories, custom } });
  } catch (error) { return next(error); }
}

export async function addCategory(req, res, next) {
  try {
    const user = await User.findById(req.session.userId);
    const existing = user.customCategories.find(function findCategory(category) { return category.type === req.body.type && category.name.toLowerCase() === req.body.name.toLowerCase(); });
    if (existing) throw createError("This category already exists", 409);
    user.customCategories.push({ name: req.body.name, type: req.body.type });
    await user.save();
    res.status(201).json({ success: true, data: { category: user.customCategories[user.customCategories.length - 1] } });
  } catch (error) { return next(error); }
}

export async function deleteCategory(req, res, next) {
  try {
    const user = await User.findById(req.session.userId);
    const category = user.customCategories.find(function findCategory(item) { return item._id.toString() === req.params.id; });
    if (!category) throw createError("Category not found", 404);
    const transaction = await Transaction.findOne({ user: user._id, category: category.name });
    if (transaction) throw createError("This category is used by a transaction and cannot be deleted", 409);
    user.customCategories = user.customCategories.filter(function keepCategory(item) { return item._id.toString() !== req.params.id; });
    await user.save();
    res.json({ success: true, data: { message: "Category deleted" } });
  } catch (error) { return next(error); }
}
