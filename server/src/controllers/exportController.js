import Transaction from "../models/Transaction.js";
import { createError } from "../utils/errors.js";

export function safeCsvText(value) {
  const text = String(value || "");
  if (/^[=+\-@\t\r]/.test(text)) return "'" + text;
  return text;
}

export function escapeCsv(value) {
  const text = safeCsvText(value);
  return '"' + text.replaceAll('"', '""') + '"';
}

export async function exportTransactions(req, res, next) {
  try {
    const query = { user: req.session.userId };
    if (!req.query.from || !req.query.to) throw createError("Choose a from and to date", 400);
    if (req.query.from > req.query.to) throw createError("From date cannot be after to date", 400);
    query.date = { $gte: new Date(req.query.from + "T00:00:00.000Z"), $lte: new Date(req.query.to + "T00:00:00.000Z") };
    const records = await Transaction.find(query).sort({ date: 1 });
    const lines = [["Date", "Type", "Amount Minor Units", "Category", "Description", "Notes"]];
    for (const record of records) {
      lines.push([record.date.toISOString().slice(0, 10), record.type, record.amountMinor, record.category, record.description, record.notes]);
    }
    const csv = lines.map(function csvLine(row) { return row.map(escapeCsv).join(","); }).join("\r\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", 'attachment; filename="spendwise-transactions.csv"');
    res.send(csv);
  } catch (error) { return next(error); }
}
