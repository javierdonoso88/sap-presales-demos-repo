'use strict';

const { Router } = require('express');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/db');

const router = Router();

function getUserEmail(user) {
  return user.getEmail ? user.getEmail() : (user.email || 'unknown');
}

function normalizeObject(row) {
  return { ...row, ACTIVE: row.ACTIVE === 1 || row.ACTIVE === true };
}

// ─── GET /objects ─────────────────────────────────────────────────────────────

router.get('/', async (req, res, next) => {
  try {
    const { tenant_id, solution_id, active } = req.query;
    let sql = `
      SELECT co.ID, co.NAME, co.OBJECTTYPE, co.TENANT_ID, co.SOLUTION_ID,
             co.PATH, co.DESCRIPTION, co.ACTIVE,
             co.CREATEDAT, co.CREATEDBY, co.MODIFIEDAT, co.MODIFIEDBY,
             t.NAME AS TENANT_NAME,
             s.NAME AS SOLUTION_NAME
      FROM SAP_PRESALES_DEMOS_COMPONENTOBJECTS co
      LEFT JOIN SAP_PRESALES_DEMOS_TENANTS t ON t.ID = co.TENANT_ID
      LEFT JOIN SAP_PRESALES_DEMOS_SOLUTIONS s ON s.ID = co.SOLUTION_ID
    `;
    const params = [];
    const conditions = [];

    if (tenant_id) {
      conditions.push(`co.TENANT_ID = ?`);
      params.push(tenant_id);
    }
    if (solution_id) {
      conditions.push(`co.SOLUTION_ID = ?`);
      params.push(solution_id);
    }
    if (active === 'true') {
      conditions.push(`co.ACTIVE = 1`);
    }

    if (conditions.length > 0) {
      sql += ` WHERE ` + conditions.join(' AND ');
    }
    sql += ` ORDER BY co.NAME`;

    const rows = await query(sql, params);
    res.json({ data: rows.map(normalizeObject) });
  } catch (err) {
    next(err);
  }
});

// ─── POST /objects ────────────────────────────────────────────────────────────

router.post('/', async (req, res, next) => {
  try {
    const { name, objectType, tenant_id, solution_id, path, description, active = true } = req.body;
    const id = uuidv4();
    const now = new Date().toISOString();
    const userEmail = getUserEmail(req.user);

    await query(
      `INSERT INTO SAP_PRESALES_DEMOS_COMPONENTOBJECTS
       (ID, NAME, OBJECTTYPE, TENANT_ID, SOLUTION_ID, PATH, DESCRIPTION, ACTIVE, CREATEDAT, CREATEDBY, MODIFIEDAT, MODIFIEDBY)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, name, objectType, tenant_id, solution_id, path, description, active ? 1 : 0, now, userEmail, now, userEmail]
    );

    const rows = await query(
      `SELECT co.*, t.NAME AS TENANT_NAME, s.NAME AS SOLUTION_NAME
       FROM SAP_PRESALES_DEMOS_COMPONENTOBJECTS co
       LEFT JOIN SAP_PRESALES_DEMOS_TENANTS t ON t.ID = co.TENANT_ID
       LEFT JOIN SAP_PRESALES_DEMOS_SOLUTIONS s ON s.ID = co.SOLUTION_ID
       WHERE co.ID = ?`,
      [id]
    );
    res.status(201).json({ data: normalizeObject(rows[0]) });
  } catch (err) {
    next(err);
  }
});

// ─── PUT /objects/:id ─────────────────────────────────────────────────────────

router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, objectType, tenant_id, solution_id, path, description, active } = req.body;
    const now = new Date().toISOString();
    const userEmail = getUserEmail(req.user);

    await query(
      `UPDATE SAP_PRESALES_DEMOS_COMPONENTOBJECTS
       SET NAME = ?, OBJECTTYPE = ?, TENANT_ID = ?, SOLUTION_ID = ?, PATH = ?, DESCRIPTION = ?, ACTIVE = ?, MODIFIEDAT = ?, MODIFIEDBY = ?
       WHERE ID = ?`,
      [name, objectType, tenant_id, solution_id, path, description, active ? 1 : 0, now, userEmail, id]
    );

    const rows = await query(
      `SELECT co.*, t.NAME AS TENANT_NAME, s.NAME AS SOLUTION_NAME
       FROM SAP_PRESALES_DEMOS_COMPONENTOBJECTS co
       LEFT JOIN SAP_PRESALES_DEMOS_TENANTS t ON t.ID = co.TENANT_ID
       LEFT JOIN SAP_PRESALES_DEMOS_SOLUTIONS s ON s.ID = co.SOLUTION_ID
       WHERE co.ID = ?`,
      [id]
    );
    if (!rows || rows.length === 0) return res.status(404).json({ error: 'Object not found' });
    res.json({ data: normalizeObject(rows[0]) });
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /objects/:id ──────────────────────────────────────────────────────

router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const refs = await query(
      `SELECT COUNT(*) AS CNT FROM SAP_PRESALES_DEMOS_DEMOOBJECTS WHERE OBJECT_ID = ?`,
      [id]
    );
    if (Number(refs[0].CNT) > 0) {
      return res.status(409).json({ error: 'Object is referenced by one or more demos and cannot be deleted.' });
    }

    await query(`DELETE FROM SAP_PRESALES_DEMOS_COMPONENTOBJECTS WHERE ID = ?`, [id]);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
