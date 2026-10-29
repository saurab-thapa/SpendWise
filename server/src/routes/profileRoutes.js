import express from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { getProfile, updateProfile, updateAccountType, getAccountTypeHistory, updateOnboarding, changePassword, deleteAccount } from "../controllers/profileController.js";

const router = express.Router();
router.use(requireAuth);
router.get("/", getProfile);
router.patch("/", validate(z.object({ name: z.string().trim().min(2).max(80).optional(), currency: z.enum(["INR", "USD", "EUR", "GBP", "JPY", "AUD", "CAD"]).optional(), budgetWarningPercent: z.number().min(1).max(100).optional() })), updateProfile);
router.patch("/account-type", validate(z.object({ accountType: z.enum(["student", "workingProfessional", "personalFinance"]) })), updateAccountType);
router.get("/account-type-history", getAccountTypeHistory);
router.patch("/password", validate(z.object({ currentPassword: z.string().min(1).max(72), newPassword: z.string().min(8).max(72) })), changePassword);
router.delete("/", validate(z.object({ currentPassword: z.string().min(1).max(72), confirmation: z.string() })), deleteAccount);
router.patch("/onboarding", validate(z.object({ currency: z.enum(["INR", "USD", "EUR", "GBP", "JPY", "AUD", "CAD"]).optional(), estimatedMonthlyIncomeMinor: z.number().int().min(0).optional(), estimatedMonthlyBudgetMinor: z.number().int().min(0).optional(), goalsNote: z.string().trim().max(300).optional() })), updateOnboarding);

export default router;
