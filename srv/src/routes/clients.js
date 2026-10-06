'use strict';

const { Router } = require('express');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/db');

const router = Router();

function getUserEmail(user) {
  return user.getEmail ? user.getEmail() : (user.email || 'unknown');
}

// ─── GET /clients ─────────────────────────────────────────────────────────────

router.get('/', async (req, res, next) => {
  try {
    const rows = await query(
      `SELECT ID, NAME, INDUSTRY, COUNTRY, CONTACT, EMAIL, CREATEDAT, CREATEDBY, MODIFIEDAT, MODIFIEDBY
       FROM SAP_PRESALES_DEMOS_CLIENTS
       ORDER BY NAME`
    );
    res.json({ data: rows });
  } catch (err) {
    next(err);
  }
});

// ─── POST /clients ────────────────────────────────────────────────────────────

router.post('/', async (req, res, next) => {
  try {
    const { name, industry, country, contact, email } = req.body;
    const id = uuidv4();
    const now = new Date().toISOString();
    const userEmail = getUserEmail(req.user);

    await query(
      `INSERT INTO SAP_PRESALES_DEMOS_CLIENTS
       (ID, NAME, INDUSTRY, COUNTRY, CONTACT, EMAIL, CREATEDAT, CREATEDBY, MODIFIEDAT, MODIFIEDBY)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, name, industry, country, contact, email, now, userEmail, now, userEmail]
    );

    const rows = await query(`SELECT * FROM SAP_PRESALES_DEMOS_CLIENTS WHERE ID = ?`, [id]);
    res.status(201).json({ data: rows[0] });
  } catch (err) {
    next(err);
  }
});

// ─── PUT /clients/:id ─────────────────────────────────────────────────────────

router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, industry, country, contact, email } = req.body;
    const now = new Date().toISOString();
    const userEmail = getUserEmail(req.user);

    await query(
      `UPDATE SAP_PRESALES_DEMOS_CLIENTS
       SET NAME = ?, INDUSTRY = ?, COUNTRY = ?, CONTACT = ?, EMAIL = ?, MODIFIEDAT = ?, MODIFIEDBY = ?
       WHERE ID = ?`,
      [name, industry, country, contact, email, now, userEmail, id]
    );

    const rows = await query(`SELECT * FROM SAP_PRESALES_DEMOS_CLIENTS WHERE ID = ?`, [id]);
    if (!rows || rows.length === 0) return res.status(404).json({ error: 'Client not found' });
    res.json({ data: rows[0] });
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /clients/:id ──────────────────────────────────────────────────────

router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const refs = await query(
      `SELECT COUNT(*) AS CNT FROM SAP_PRESALES_DEMOS_DEMOCLIENTS WHERE CLIENT_ID = ?`,
      [id]
    );
    if (Number(refs[0].CNT) > 0) {
      return res.status(409).json({ error: 'Client is referenced by one or more demos and cannot be deleted.' });
    }

    await query(`DELETE FROM SAP_PRESALES_DEMOS_CLIENTS WHERE ID = ?`, [id]);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
