import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  type: { type: String, required: true, enum: ["income", "expense"] },
  amountMinor: { type: Number, required: true, min: 1 },
  category: { type: String, required: true, trim: true, maxlength: 40 },
  description: { type: String, required: true, trim: true, maxlength: 120 },
  notes: { type: String, trim: true, maxlength: 500, default: "" },
  date: { type: Date, required: true },
  accountTypeAtCreation: { type: String, enum: ["student", "workingProfessional", "personalFinance"] }
}, { timestamps: true });

transactionSchema.index({ user: 1, date: -1 });
transactionSchema.index({ user: 1, type: 1, category: 1 });

export default mongoose.model("Transaction", transactionSchema);
