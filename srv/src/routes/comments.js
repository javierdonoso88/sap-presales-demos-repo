'use strict';

const { Router } = require('express');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/db');

// Mounted at /demos/:id/comments — req.params.id is the demo ID
const router = Router({ mergeParams: true });

function getUserEmail(user) {
  return user.getEmail ? user.getEmail() : (user.email || 'unknown');
}

// GET /demos/:id/comments
router.get('/', async (req, res, next) => {
  try {
    const rows = await query(`
      SELECT ID, DEMO_ID, COMMENT, CREATEDAT, CREATEDBY
      FROM SAP_PRESALES_DEMOS_DEMOCOMMENTS
      WHERE DEMO_ID = ?
      ORDER BY CREATEDAT ASC
    `, [req.params.id]);
    res.json({ data: rows });
  } catch (err) {
    next(err);
  }
});

// POST /demos/:id/comments
router.post('/', async (req, res, next) => {
  try {
    const { comment } = req.body;
    if (!comment || !comment.trim()) {
      return res.status(400).json({ error: 'Comment text is required.' });
    }
    const id = uuidv4();
    const now = new Date().toISOString();
    const userEmail = getUserEmail(req.user);

    await query(
      `INSERT INTO SAP_PRESALES_DEMOS_DEMOCOMMENTS (ID, DEMO_ID, COMMENT, CREATEDAT, CREATEDBY)
       VALUES (?, ?, ?, ?, ?)`,
      [id, req.params.id, comment.trim(), now, userEmail]
    );

    const rows = await query(
      `SELECT ID, DEMO_ID, COMMENT, CREATEDAT, CREATEDBY FROM SAP_PRESALES_DEMOS_DEMOCOMMENTS WHERE ID = ?`,
      [id]
    );
    res.status(201).json({ data: rows[0] });
  } catch (err) {
    next(err);
  }
});

// DELETE /demos/:id/comments/:commentId
router.delete('/:commentId', async (req, res, next) => {
  try {
    const { id, commentId } = req.params;
    const rows = await query(
      `SELECT CREATEDBY FROM SAP_PRESALES_DEMOS_DEMOCOMMENTS WHERE ID = ? AND DEMO_ID = ?`,
      [commentId, id]
    );
    if (!rows || rows.length === 0) return res.status(404).json({ error: 'Comment not found.' });

    const userEmail = getUserEmail(req.user);
    if (rows[0].CREATEDBY !== userEmail) {
      return res.status(403).json({ error: 'You can only delete your own comments.' });
    }

    await query(`DELETE FROM SAP_PRESALES_DEMOS_DEMOCOMMENTS WHERE ID = ?`, [commentId]);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
