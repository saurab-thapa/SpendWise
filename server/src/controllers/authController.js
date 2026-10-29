import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { createError } from "../utils/errors.js";

const bcryptRounds = process.env.NODE_ENV === "test" ? 4 : 12;

// Public User
export function publicUser(user) {
  return {
    id: user._id.toString(), name: user.name, email: user.email,
    accountType: user.accountType, currency: user.currency || "INR",
    budgetWarningPercent: user.budgetWarningPercent || 80,
    estimatedMonthlyIncomeMinor: user.estimatedMonthlyIncomeMinor || 0,
    estimatedMonthlyBudgetMinor: user.estimatedMonthlyBudgetMinor || 0,
    onboardingCompleted: user.onboardingCompleted || false,
    goalsNote: user.goalsNote || "",
    customCategories: user.customCategories || [], accountTypeHistory: user.accountTypeHistory || []
  };
}

// Register User
export async function register(req, res, next) {
  try {
    const existing = await User.findOne({ email: req.body.email.toLowerCase().trim() });
    if (existing) throw createError("An account with this email already exists", 409);
    const passwordHash = await bcrypt.hash(req.body.password, bcryptRounds);
    const user = await User.create({
      name: req.body.name, email: req.body.email, passwordHash,
      accountType: req.body.accountType
    });
    req.session.regenerate(function regenerateSession(error) {
      if (error) return next(error);
      req.session.userId = user._id.toString();
      req.session.save(function saveSession(saveError) {
        if (saveError) return next(saveError);
        return res.status(201).json({ success: true, data: { user: publicUser(user) } });
      });
    });
  } catch (error) { return next(error); }
}

// Login User
export async function login(req, res, next) {
  try {
    const user = await User.findOne({ email: req.body.email.toLowerCase().trim() }).select("+passwordHash");
    if (!user) throw createError("Incorrect email or password", 401);
    const matches = await bcrypt.compare(req.body.password, user.passwordHash);
    if (!matches) throw createError("Incorrect email or password", 401);
    req.session.regenerate(function regenerateSession(error) {
      if (error) return next(error);
      req.session.userId = user._id.toString();
      req.session.save(function saveSession(saveError) {
        if (saveError) return next(saveError);
        return res.json({ success: true, data: { user: publicUser(user) } });
      });
    });
  } catch (error) { return next(error); }
}

// Current User
export async function me(req, res, next) {
  try {
    const user = await User.findById(req.session.userId);
    if (!user) throw createError("Please log in again", 401);
    return res.json({ success: true, data: { user: publicUser(user) } });
  } catch (error) { return next(error); }
}

// Logout User
export function logout(req, res, next) {
  req.session.destroy(function destroySession(error) {
    if (error) return next(error);
    res.clearCookie("spendwise.sid", { httpOnly: true, sameSite: "lax" });
    return res.json({ success: true, data: { message: "Logged out" } });
  });
}
