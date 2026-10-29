import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Transaction from "../models/Transaction.js";
import Budget from "../models/Budget.js";
import SavingsGoal from "../models/SavingsGoal.js";
import { createError } from "../utils/errors.js";
import { publicUser } from "./authController.js";

// Get Profile
export async function getProfile(req, res, next) {
  try {
    const user = await User.findById(req.session.userId);
    if (!user) throw createError("User not found", 404);
    return res.json({ success: true, data: { user: publicUser(user) } });
  } catch (error) { return next(error); }
}

// Update Profile
export async function updateProfile(req, res, next) {
  try {
    const user = await User.findById(req.session.userId);
    if (!user) throw createError("User not found", 404);
    if (req.body.name) user.name = req.body.name;
    if (req.body.currency) user.currency = req.body.currency;
    if (req.body.budgetWarningPercent) user.budgetWarningPercent = req.body.budgetWarningPercent;
    await user.save();
    return res.json({ success: true, data: { user: publicUser(user) } });
  } catch (error) { return next(error); }
}

// Switch Account Type
export async function updateAccountType(req, res, next) {
  try {
    const currentUser = await User.findById(req.session.userId);
    if (!currentUser) throw createError("User not found", 404);
    if (currentUser.accountType === req.body.accountType) {
      throw createError("Choose a different account type", 400);
    }
    const event = {
      previousType: currentUser.accountType,
      newType: req.body.accountType,
      changedAt: new Date()
    };
    const user = await User.findOneAndUpdate(
      { _id: req.session.userId },
      { $set: { accountType: req.body.accountType }, $push: { accountTypeHistory: event } },
      { returnDocument: "after" }
    );
    return res.json({ success: true, data: { user: publicUser(user) } });
  } catch (error) { return next(error); }
}

// Account History
export async function getAccountTypeHistory(req, res, next) {
  try {
    const user = await User.findById(req.session.userId).select("accountTypeHistory accountType");
    if (!user) throw createError("User not found", 404);
    return res.json({ success: true, data: { accountType: user.accountType, history: user.accountTypeHistory } });
  } catch (error) { return next(error); }
}

// Save Onboarding
export async function updateOnboarding(req, res, next) {
  try {
    const user = await User.findById(req.session.userId);
    if (!user) throw createError("User not found", 404);
    user.currency = req.body.currency || user.currency;
    user.estimatedMonthlyIncomeMinor = req.body.estimatedMonthlyIncomeMinor || 0;
    user.estimatedMonthlyBudgetMinor = req.body.estimatedMonthlyBudgetMinor || 0;
    user.goalsNote = req.body.goalsNote || "";
    user.onboardingCompleted = true;
    await user.save();
    return res.json({ success: true, data: { user: publicUser(user) } });
  } catch (error) { return next(error); }
}

// Change Password
export async function changePassword(req, res, next) {
  try {
    const user = await User.findById(req.session.userId).select("+passwordHash");
    if (!user) throw createError("User not found", 404);
    const matches = await bcrypt.compare(req.body.currentPassword, user.passwordHash);
    if (!matches) throw createError("Current password is incorrect", 401);
    user.passwordHash = await bcrypt.hash(req.body.newPassword, process.env.NODE_ENV === "test" ? 4 : 12);
    await user.save();
    req.session.regenerate(function regeneratePasswordSession(error) {
      if (error) return next(error);
      req.session.userId = user._id.toString();
      req.session.save(function savePasswordSession(saveError) {
        if (saveError) return next(saveError);
        return res.json({ success: true, data: { message: "Password changed" } });
      });
    });
  } catch (error) { return next(error); }
}

// Delete Account
export async function deleteAccount(req, res, next) {
  try {
    const user = await User.findById(req.session.userId).select("+passwordHash");
    if (!user) throw createError("User not found", 404);
    if (req.body.confirmation !== "DELETE") throw createError("Type DELETE to confirm", 400);
    const matches = await bcrypt.compare(req.body.currentPassword, user.passwordHash);
    if (!matches) throw createError("Current password is incorrect", 401);
    await Transaction.deleteMany({ user: user._id });
    await Budget.deleteMany({ user: user._id });
    await SavingsGoal.deleteMany({ user: user._id });
    await User.deleteOne({ _id: user._id });
    req.session.destroy(function destroyDeletedSession(error) {
      if (error) return next(error);
      res.clearCookie("spendwise.sid", { httpOnly: true, sameSite: "lax" });
      return res.json({ success: true, data: { message: "Account deleted" } });
    });
  } catch (error) { return next(error); }
}
