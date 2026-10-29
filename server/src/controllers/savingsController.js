import SavingsGoal from "../models/SavingsGoal.js";
import { createError } from "../utils/errors.js";

function goalWithProgress(goal) {
  let savedMinor = 0;
  for (const contribution of goal.contributions) savedMinor += contribution.amountMinor;
  return { ...goal.toObject(), savedMinor, remainingMinor: Math.max(0, goal.targetAmountMinor - savedMinor) };
}

export async function listSavings(req, res, next) {
  try { const goals = await SavingsGoal.find({ user: req.session.userId }).sort({ createdAt: -1 }); res.json({ success: true, data: { goals: goals.map(goalWithProgress) } }); } catch (error) { return next(error); }
}
export async function createSavings(req, res, next) {
  try { const goal = await SavingsGoal.create({ ...req.body, user: req.session.userId }); res.status(201).json({ success: true, data: { goal: goalWithProgress(goal) } }); } catch (error) { return next(error); }
}
export async function getSavings(req, res, next) {
  try { const goal = await SavingsGoal.findOne({ _id: req.params.id, user: req.session.userId }); if (!goal) throw createError("Savings goal not found", 404); res.json({ success: true, data: { goal: goalWithProgress(goal) } }); } catch (error) { return next(error); }
}
export async function updateSavings(req, res, next) {
  try { const goal = await SavingsGoal.findOneAndUpdate({ _id: req.params.id, user: req.session.userId }, req.body, { returnDocument: "after", runValidators: true }); if (!goal) throw createError("Savings goal not found", 404); res.json({ success: true, data: { goal: goalWithProgress(goal) } }); } catch (error) { return next(error); }
}
export async function deleteSavings(req, res, next) {
  try { const goal = await SavingsGoal.findOneAndDelete({ _id: req.params.id, user: req.session.userId }); if (!goal) throw createError("Savings goal not found", 404); res.json({ success: true, data: { message: "Savings goal deleted" } }); } catch (error) { return next(error); }
}
export async function addContribution(req, res, next) {
  try { const goal = await SavingsGoal.findOne({ _id: req.params.id, user: req.session.userId }); if (!goal) throw createError("Savings goal not found", 404); goal.contributions.push({ amountMinor: req.body.amountMinor, date: new Date(req.body.date + "T00:00:00.000Z"), note: req.body.note || "" }); await goal.save(); res.status(201).json({ success: true, data: { goal: goalWithProgress(goal) } }); } catch (error) { return next(error); }
}
