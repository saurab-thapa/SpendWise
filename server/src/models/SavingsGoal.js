import mongoose from "mongoose";

const contributionSchema = new mongoose.Schema({
  amountMinor: { type: Number, required: true, min: 1 },
  date: { type: Date, required: true },
  note: { type: String, maxlength: 200, default: "" }
}, { _id: true });

const savingsGoalSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 80 },
  targetAmountMinor: { type: Number, required: true, min: 1 },
  contributions: { type: [contributionSchema], default: [] },
  targetDate: { type: Date, default: null },
  description: { type: String, maxlength: 500, default: "" },
  status: { type: String, enum: ["active", "completed"], default: "active" },
  completedAt: { type: Date, default: null }
}, { timestamps: true });

export default mongoose.model("SavingsGoal", savingsGoalSchema);
