'use strict';

const { Router } = require('express');
const { query } = require('../config/db');

const router = Router();

router.get('/stats', async (req, res, next) => {
  try {
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

    const byStatus = [
      { status: 'DRAFT', count: Number(totals.DRAFT) },
      { status: 'READY', count: Number(totals.READY) },
      { status: 'ARCHIVED', count: Number(totals.ARCHIVED) }
    ];

    const bySystemTypeRows = await query(`
      SELECT s.TYPE AS type, COUNT(DISTINCT ds.DEMO_ID) AS CNT
      FROM SAP_PRESALES_DEMOS_DEMOSYSTEMS ds
      JOIN SAP_PRESALES_DEMOS_SYSTEMS s ON s.ID = ds.SYSTEM_ID
      GROUP BY s.TYPE
      ORDER BY CNT DESC
    `);
    const bySystemType = bySystemTypeRows.map(r => ({ type: r.type, count: Number(r.CNT) }));

    const byMonthRows = await query(`
      SELECT TO_CHAR(CREATEDAT, 'YYYY-MM') AS MONTH, COUNT(*) AS CNT
      FROM SAP_PRESALES_DEMOS_DEMOS
      WHERE CREATEDAT >= ADD_MONTHS(CURRENT_TIMESTAMP, -6)
      GROUP BY TO_CHAR(CREATEDAT, 'YYYY-MM')
      ORDER BY MONTH
    `);
    const byMonth = byMonthRows.map(r => ({ month: r.MONTH, count: Number(r.CNT) }));

    const recentRows = await query(`
      SELECT TOP 5 d.ID, d.TITLE, d.STATUS, d.DEMODATE, d.CREATEDAT, d.CREATEDBY,
        (SELECT COUNT(*) FROM SAP_PRESALES_DEMOS_DEMOCLIENTS WHERE DEMO_ID = d.ID) AS CLIENT_COUNT
      FROM SAP_PRESALES_DEMOS_DEMOS d
      ORDER BY d.CREATEDAT DESC
    `);
    const recentDemos = recentRows.map(r => ({ ...r, CLIENT_COUNT: Number(r.CLIENT_COUNT) }));

    // Activity: last 10 modified demos
    const activityRows = await query(`
      SELECT TOP 10 ID, TITLE, STATUS, MODIFIEDAT, MODIFIEDBY, CREATEDAT, CREATEDBY
      FROM SAP_PRESALES_DEMOS_DEMOS
      ORDER BY MODIFIEDAT DESC
    `);

    // Top users by demo count
    const byUserRows = await query(`
      SELECT CREATEDBY, COUNT(*) AS CNT
      FROM SAP_PRESALES_DEMOS_DEMOS
      GROUP BY CREATEDBY
      ORDER BY CNT DESC
    `);
    const byUser = byUserRows.map(r => ({
      user: r.CREATEDBY ? r.CREATEDBY.split('@')[0] : 'unknown',
      count: Number(r.CNT)
    }));

    res.json({
      data: {
        totals: {
          total: Number(totals.TOTAL),
          draft: Number(totals.DRAFT),
          ready: Number(totals.READY),
          archived: Number(totals.ARCHIVED),
          thisMonth: Number(totals.THIS_MONTH)
        },
        byStatus, bySystemType, byMonth, recentDemos,
        activity: activityRows,
        byUser,
      }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
