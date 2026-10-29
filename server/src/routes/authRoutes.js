import express from "express";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import { register, login, logout, me } from "../controllers/authController.js";
import { validate } from "../middleware/validate.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();
const authLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: process.env.NODE_ENV === "test" ? 1000 : 20, standardHeaders: true, legacyHeaders: false });
const registerSchema = z.object({
  name: z.string().trim().min(2).max(80), email: z.string().trim().email().max(254),
  password: z.string().min(8).max(72), confirmPassword: z.string(),
  accountType: z.enum(["student", "workingProfessional", "personalFinance"])
}).refine(function passwordsMatch(data) { return data.password === data.confirmPassword; }, { message: "Passwords do not match", path: ["confirmPassword"] });
const loginSchema = z.object({ email: z.string().trim().email(), password: z.string().min(1).max(72) });

router.post("/register", authLimit, validate(registerSchema), register);
router.post("/login", authLimit, validate(loginSchema), login);
router.post("/logout", logout);
router.get("/me", requireAuth, me);

export default router;
