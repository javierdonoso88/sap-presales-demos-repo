'use strict';

const { Router } = require('express');
const { query } = require('../config/db');

const router = Router();

// ─── GET /dashboard/stats ─────────────────────────────────────────────────────

router.get('/stats', async (req, res, next) => {
  try {
    // Totals by status
    const totalsRows = await query(`
      SELECT
        COUNT(*) AS TOTAL,
        SUM(CASE WHEN STATUS = 'DRAFT' THEN 1 ELSE 0 END) AS DRAFT,
        SUM(CASE WHEN STATUS = 'READY' THEN 1 ELSE 0 END) AS READY,
        SUM(CASE WHEN STATUS = 'ARCHIVED' THEN 1 ELSE 0 END) AS ARCHIVED,
        SUM(CASE WHEN TO_CHAR(CREATEDAT, 'YYYY-MM') = TO_CHAR(CURRENT_DATE, 'YYYY-MM') THEN 1 ELSE 0 END) AS THIS_MONTH
      FROM SAP_PRESALES_DEMOS_DEMOS
    `);

    const totals = totalsRows[0] || { TOTAL: 0, DRAFT: 0, READY: 0, ARCHIVED: 0, THIS_MONTH: 0 };

    // By status array
    const byStatus = [
      { status: 'DRAFT', count: Number(totals.DRAFT) },
      { status: 'READY', count: Number(totals.READY) },
      { status: 'ARCHIVED', count: Number(totals.ARCHIVED) }
    ];

    // By solution
    const bySolutionRows = await query(`
      SELECT s.NAME, COUNT(DISTINCT ds.DEMO_ID) AS CNT
      FROM SAP_PRESALES_DEMOS_DEMOSOLUTIONS ds
      JOIN SAP_PRESALES_DEMOS_SOLUTIONS s ON s.ID = ds.SOLUTION_ID
      GROUP BY s.ID, s.NAME
      ORDER BY CNT DESC
    `);

    const bySolution = bySolutionRows.map(r => ({ name: r.NAME, count: Number(r.CNT) }));

    // By month (last 6 months)
    const byMonthRows = await query(`
      SELECT TO_CHAR(CREATEDAT, 'YYYY-MM') AS MONTH, COUNT(*) AS CNT
      FROM SAP_PRESALES_DEMOS_DEMOS
      WHERE CREATEDAT >= ADD_MONTHS(CURRENT_TIMESTAMP, -6)
      GROUP BY TO_CHAR(CREATEDAT, 'YYYY-MM')
      ORDER BY MONTH
    `);

    const byMonth = byMonthRows.map(r => ({ month: r.MONTH, count: Number(r.CNT) }));

    // Recent demos (last 5)
    const recentRows = await query(`
      SELECT d.ID, d.TITLE, d.STATUS, d.DEMODATE, d.CREATEDAT, d.CREATEDBY,
        (SELECT COUNT(*) FROM SAP_PRESALES_DEMOS_DEMOCLIENTS WHERE DEMO_ID = d.ID) AS CLIENT_COUNT
      FROM SAP_PRESALES_DEMOS_DEMOS d
      ORDER BY d.CREATEDAT DESC
      FETCH FIRST 5 ROWS ONLY
    `);

    const recentDemos = recentRows.map(r => ({ ...r, CLIENT_COUNT: Number(r.CLIENT_COUNT) }));

    res.json({
      data: {
        totals: {
          total: Number(totals.TOTAL),
          draft: Number(totals.DRAFT),
          ready: Number(totals.READY),
          archived: Number(totals.ARCHIVED),
          thisMonth: Number(totals.THIS_MONTH)
        },
        byStatus,
        bySolution,
        byMonth,
        recentDemos
      }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
