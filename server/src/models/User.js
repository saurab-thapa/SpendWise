import mongoose from "mongoose";

const customCategorySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 40 },
  type: { type: String, required: true, enum: ["income", "expense"] }
}, { _id: true });

const accountTypeHistorySchema = new mongoose.Schema({
  previousType: { type: String, required: true },
  newType: { type: String, required: true },
  changedAt: { type: Date, required: true, default: Date.now }
}, { _id: false });

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
  email: { type: String, required: true, lowercase: true, trim: true, unique: true },
  passwordHash: { type: String, required: true, select: false },
  accountType: { type: String, required: true, enum: ["student", "workingProfessional", "personalFinance"], default: "student" },
  currency: { type: String, required: true, default: "INR", uppercase: true },
  budgetWarningPercent: { type: Number, required: true, min: 1, max: 100, default: 80 },
  estimatedMonthlyIncomeMinor: { type: Number, min: 0, default: 0 },
  estimatedMonthlyBudgetMinor: { type: Number, min: 0, default: 0 },
  onboardingCompleted: { type: Boolean, default: false },
  customCategories: { type: [customCategorySchema], default: [] },
  accountTypeHistory: { type: [accountTypeHistorySchema], default: [] },
  goalsNote: { type: String, maxlength: 300, default: "" }
}, { timestamps: true });

export default mongoose.model("User", userSchema);
