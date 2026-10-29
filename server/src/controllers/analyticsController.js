import { calculateSummary, calculateMonthlyTrends } from "../services/analyticsService.js";

export async function summary(req, res, next) {
  try {
    const month = req.query.month || new Date().toISOString().slice(0, 7);
    const data = await calculateSummary(req.session.userId, month);
    res.json({ success: true, data });
  } catch (error) { return next(error); }
}

export async function spendingByCategory(req, res, next) {
  try {
    const month = req.query.month || new Date().toISOString().slice(0, 7);
    const data = await calculateSummary(req.session.userId, month);
    res.json({ success: true, data: { categoryRows: data.categoryRows } });
  } catch (error) { return next(error); }
}

export async function monthlyTrends(req, res, next) {
  try {
    const fromMonth = req.query.fromMonth || new Date().toISOString().slice(0, 7);
    const toMonth = req.query.toMonth || fromMonth;
    const rows = await calculateMonthlyTrends(req.session.userId, fromMonth, toMonth);
    res.json({ success: true, data: { rows } });
  } catch (error) { return next(error); }
}
