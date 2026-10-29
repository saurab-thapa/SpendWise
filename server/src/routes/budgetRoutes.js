import express from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { listBudgets, createBudget, updateBudget, deleteBudget } from "../controllers/budgetController.js";
const router = express.Router();
router.use(requireAuth);
router.get("/", validate(z.object({ month: z.string().regex(/^\d{4}-\d{2}$/).optional() }), "query"), listBudgets);
router.post("/", validate(z.union([
  z.object({
    month: z.string().regex(/^\d{4}-\d{2}$/),
    category: z.string().trim().max(40).nullable().optional(),
    amountMinor: z.number().int().positive()
  }),
  z.object({
    month: z.string().regex(/^\d{4}-\d{2}$/),
    budgets: z.array(z.object({
      category: z.string().trim().min(1).max(40),
      amountMinor: z.number().int().positive()
    })).min(1).max(20)
  })
])), createBudget);
router.patch("/:id", validate(z.object({ amountMinor: z.number().int().positive() })), updateBudget);
router.delete("/:id", deleteBudget);
export default router;
