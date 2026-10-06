'use strict';

const { Router } = require('express');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/db');

const router = Router();

function getUserEmail(user) {
  return user.getEmail ? user.getEmail() : (user.email || 'unknown');
}

// ─── GET /solutions ───────────────────────────────────────────────────────────

router.get('/', async (req, res, next) => {
  try {
    const rows = await query(
      `SELECT ID, NAME, AREA, DESCRIPTION, CREATEDAT, CREATEDBY, MODIFIEDAT, MODIFIEDBY
       FROM SAP_PRESALES_DEMOS_SOLUTIONS
       ORDER BY NAME`
    );
    res.json({ data: rows });
  } catch (err) {
    next(err);
  }
});

// ─── POST /solutions ──────────────────────────────────────────────────────────

router.post('/', async (req, res, next) => {
  try {
    const { name, area, description } = req.body;
    const id = uuidv4();
    const now = new Date().toISOString();
    const userEmail = getUserEmail(req.user);

    await query(
      `INSERT INTO SAP_PRESALES_DEMOS_SOLUTIONS
       (ID, NAME, AREA, DESCRIPTION, CREATEDAT, CREATEDBY, MODIFIEDAT, MODIFIEDBY)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, name, area, description, now, userEmail, now, userEmail]
    );

    const rows = await query(`SELECT * FROM SAP_PRESALES_DEMOS_SOLUTIONS WHERE ID = ?`, [id]);
    res.status(201).json({ data: rows[0] });
  } catch (err) {
    next(err);
  }
});

// ─── PUT /solutions/:id ───────────────────────────────────────────────────────

router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, area, description } = req.body;
    const now = new Date().toISOString();
    const userEmail = getUserEmail(req.user);

    await query(
      `UPDATE SAP_PRESALES_DEMOS_SOLUTIONS
       SET NAME = ?, AREA = ?, DESCRIPTION = ?, MODIFIEDAT = ?, MODIFIEDBY = ?
       WHERE ID = ?`,
      [name, area, description, now, userEmail, id]
    );

    const rows = await query(`SELECT * FROM SAP_PRESALES_DEMOS_SOLUTIONS WHERE ID = ?`, [id]);
    if (!rows || rows.length === 0) return res.status(404).json({ error: 'Solution not found' });
    res.json({ data: rows[0] });
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /solutions/:id ────────────────────────────────────────────────────

router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const refs = await query(
      `SELECT COUNT(*) AS CNT FROM SAP_PRESALES_DEMOS_DEMOSOLUTIONS WHERE SOLUTION_ID = ?`,
      [id]
    );
    if (Number(refs[0].CNT) > 0) {
      return res.status(409).json({ error: 'Solution is referenced by one or more demos and cannot be deleted.' });
    }

    await query(`DELETE FROM SAP_PRESALES_DEMOS_SOLUTIONS WHERE ID = ?`, [id]);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
