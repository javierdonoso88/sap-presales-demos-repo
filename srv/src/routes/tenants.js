'use strict';

const { Router } = require('express');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/db');

const router = Router();

function getUserEmail(user) {
  return user.getEmail ? user.getEmail() : (user.email || 'unknown');
}

function normalizeTenant(row) {
  return { ...row, ACTIVE: row.ACTIVE === 1 || row.ACTIVE === true };
}

// ─── GET /tenants ─────────────────────────────────────────────────────────────

router.get('/', async (req, res, next) => {
  try {
    const { active } = req.query;
    let sql = `SELECT ID, NAME, TYPE, URL, DESCRIPTION, ACTIVE, CREATEDAT, CREATEDBY, MODIFIEDAT, MODIFIEDBY
               FROM SAP_PRESALES_DEMOS_TENANTS`;
    const params = [];
    if (active === 'true') {
      sql += ` WHERE ACTIVE = 1`;
    }
    sql += ` ORDER BY NAME`;
    const rows = await query(sql, params);
    res.json({ data: rows.map(normalizeTenant) });
  } catch (err) {
    next(err);
  }
});

// ─── POST /tenants ────────────────────────────────────────────────────────────

router.post('/', async (req, res, next) => {
  try {
    const { name, type, url, description, active = true } = req.body;
    const id = uuidv4();
    const now = new Date().toISOString();
    const userEmail = getUserEmail(req.user);

    await query(
      `INSERT INTO SAP_PRESALES_DEMOS_TENANTS
       (ID, NAME, TYPE, URL, DESCRIPTION, ACTIVE, CREATEDAT, CREATEDBY, MODIFIEDAT, MODIFIEDBY)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, name, type, url, description, active ? 1 : 0, now, userEmail, now, userEmail]
    );

    const rows = await query(`SELECT * FROM SAP_PRESALES_DEMOS_TENANTS WHERE ID = ?`, [id]);
    res.status(201).json({ data: normalizeTenant(rows[0]) });
  } catch (err) {
    next(err);
  }
});

// ─── PUT /tenants/:id ─────────────────────────────────────────────────────────

router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, type, url, description, active } = req.body;
    const now = new Date().toISOString();
    const userEmail = getUserEmail(req.user);

    await query(
      `UPDATE SAP_PRESALES_DEMOS_TENANTS
       SET NAME = ?, TYPE = ?, URL = ?, DESCRIPTION = ?, ACTIVE = ?, MODIFIEDAT = ?, MODIFIEDBY = ?
       WHERE ID = ?`,
      [name, type, url, description, active ? 1 : 0, now, userEmail, id]
    );

    const rows = await query(`SELECT * FROM SAP_PRESALES_DEMOS_TENANTS WHERE ID = ?`, [id]);
    if (!rows || rows.length === 0) return res.status(404).json({ error: 'Tenant not found' });
    res.json({ data: normalizeTenant(rows[0]) });
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /tenants/:id ──────────────────────────────────────────────────────

router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const refs = await query(
      `SELECT COUNT(*) AS CNT FROM SAP_PRESALES_DEMOS_DEMOTENANTS WHERE TENANT_ID = ?`,
      [id]
    );
    if (Number(refs[0].CNT) > 0) {
      return res.status(409).json({ error: 'Tenant is referenced by one or more demos and cannot be deleted.' });
    }

    await query(`DELETE FROM SAP_PRESALES_DEMOS_TENANTS WHERE ID = ?`, [id]);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
