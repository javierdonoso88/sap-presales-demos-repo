'use strict';

const { Router } = require('express');
const { v4: uuidv4 } = require('uuid');
const { query, transaction } = require('../config/db');

const router = Router();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getUserEmail(user) {
  return user.getEmail ? user.getEmail() : (user.email || 'unknown');
}

async function getDemoById(id) {
  const demos = await query(
    `SELECT ID, TITLE, DESCRIPTION, DEMODATE, STATUS, CREATEDAT, CREATEDBY, MODIFIEDAT, MODIFIEDBY
     FROM SAP_PRESALES_DEMOS_DEMOS WHERE ID = ?`,
    [id]
  );
  if (!demos || demos.length === 0) return null;
  const demo = demos[0];

  const tenants = await query(
    `SELECT dt.TENANT_ID, dt.NOTES, t.NAME, t.TYPE, t.URL
     FROM SAP_PRESALES_DEMOS_DEMOTENANTS dt
     JOIN SAP_PRESALES_DEMOS_TENANTS t ON t.ID = dt.TENANT_ID
     WHERE dt.DEMO_ID = ?`,
    [id]
  );

  const solutions = await query(
    `SELECT ds.SOLUTION_ID, ds.NOTES, s.NAME, s.AREA
     FROM SAP_PRESALES_DEMOS_DEMOSOLUTIONS ds
     JOIN SAP_PRESALES_DEMOS_SOLUTIONS s ON s.ID = ds.SOLUTION_ID
     WHERE ds.DEMO_ID = ?`,
    [id]
  );

  const objects = await query(
    `SELECT dob.OBJECT_ID, dob.NOTES,
            co.NAME, co.OBJECTTYPE,
            co.TENANT_ID AS OBJECT_TENANT_ID,
            co.SOLUTION_ID AS OBJECT_SOLUTION_ID,
            t.NAME AS TENANT_NAME,
            s.NAME AS SOLUTION_NAME
     FROM SAP_PRESALES_DEMOS_DEMOOBJECTS dob
     JOIN SAP_PRESALES_DEMOS_COMPONENTOBJECTS co ON co.ID = dob.OBJECT_ID
     LEFT JOIN SAP_PRESALES_DEMOS_TENANTS t ON t.ID = co.TENANT_ID
     LEFT JOIN SAP_PRESALES_DEMOS_SOLUTIONS s ON s.ID = co.SOLUTION_ID
     WHERE dob.DEMO_ID = ?`,
    [id]
  );

  const clients = await query(
    `SELECT dc.CLIENT_ID, dc.PRESENTATIONDATE, dc.RESULT, dc.FEEDBACK,
            c.NAME, c.INDUSTRY
     FROM SAP_PRESALES_DEMOS_DEMOCLIENTS dc
     JOIN SAP_PRESALES_DEMOS_CLIENTS c ON c.ID = dc.CLIENT_ID
     WHERE dc.DEMO_ID = ?`,
    [id]
  );

  return { ...demo, tenants, solutions, objects, clients };
}

// ─── GET /demos ───────────────────────────────────────────────────────────────

router.get('/', async (req, res, next) => {
  try {
    const { status, search, solution_id } = req.query;
    let sql = `
      SELECT d.ID, d.TITLE, d.DESCRIPTION, d.DEMODATE, d.STATUS,
             d.CREATEDAT, d.CREATEDBY, d.MODIFIEDAT, d.MODIFIEDBY,
             (SELECT COUNT(*) FROM SAP_PRESALES_DEMOS_DEMOCLIENTS WHERE DEMO_ID = d.ID) AS CLIENT_COUNT
      FROM SAP_PRESALES_DEMOS_DEMOS d
    `;
    const params = [];
    const conditions = [];

    if (solution_id) {
      sql += ` JOIN SAP_PRESALES_DEMOS_DEMOSOLUTIONS ds ON ds.DEMO_ID = d.ID AND ds.SOLUTION_ID = ?`;
      params.push(solution_id);
    }

    if (status) {
      conditions.push(`d.STATUS = ?`);
      params.push(status);
    }
    if (search) {
      conditions.push(`(UPPER(d.TITLE) LIKE UPPER(?) OR UPPER(d.DESCRIPTION) LIKE UPPER(?))`);
      params.push(`%${search}%`, `%${search}%`);
    }

    if (conditions.length > 0) {
      sql += ` WHERE ` + conditions.join(' AND ');
    }
    sql += ` ORDER BY d.CREATEDAT DESC`;

    const rows = await query(sql, params);
    const data = rows.map(r => ({ ...r, clientCount: Number(r.CLIENT_COUNT) }));
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

// ─── GET /demos/:id ───────────────────────────────────────────────────────────

router.get('/:id', async (req, res, next) => {
  try {
    const demo = await getDemoById(req.params.id);
    if (!demo) return res.status(404).json({ error: 'Demo not found' });
    res.json({ data: demo });
  } catch (err) {
    next(err);
  }
});

// ─── POST /demos ──────────────────────────────────────────────────────────────

router.post('/', async (req, res, next) => {
  try {
    const { title, description, demoDate, status, tenants = [], solutions = [], objects = [], clients = [] } = req.body;
    const id = uuidv4();
    const now = new Date().toISOString();
    const userEmail = getUserEmail(req.user);

    await transaction(async (conn) => {
      const exec = (sql, params) => new Promise((res, rej) =>
        conn.exec(sql, params, (err, result) => err ? rej(err) : res(result))
      );

      await exec(
        `INSERT INTO SAP_PRESALES_DEMOS_DEMOS
         (ID, TITLE, DESCRIPTION, DEMODATE, STATUS, CREATEDAT, CREATEDBY, MODIFIEDAT, MODIFIEDBY)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, title, description, demoDate, status || 'DRAFT', now, userEmail, now, userEmail]
      );

      for (const t of tenants) {
        await exec(
          `INSERT INTO SAP_PRESALES_DEMOS_DEMOTENANTS (DEMO_ID, TENANT_ID, NOTES) VALUES (?, ?, ?)`,
          [id, t.id, t.notes || null]
        );
      }

      for (const s of solutions) {
        await exec(
          `INSERT INTO SAP_PRESALES_DEMOS_DEMOSOLUTIONS (DEMO_ID, SOLUTION_ID, NOTES) VALUES (?, ?, ?)`,
          [id, s.id, s.notes || null]
        );
      }

      for (const o of objects) {
        await exec(
          `INSERT INTO SAP_PRESALES_DEMOS_DEMOOBJECTS (DEMO_ID, OBJECT_ID, NOTES) VALUES (?, ?, ?)`,
          [id, o.id, o.notes || null]
        );
      }

      for (const c of clients) {
        await exec(
          `INSERT INTO SAP_PRESALES_DEMOS_DEMOCLIENTS (DEMO_ID, CLIENT_ID, PRESENTATIONDATE, RESULT, FEEDBACK) VALUES (?, ?, ?, ?, ?)`,
          [id, c.clientId, c.presentationDate || null, c.result || null, c.feedback || null]
        );
      }
    });

    const created = await getDemoById(id);
    res.status(201).json({ data: created });
  } catch (err) {
    next(err);
  }
});

// ─── PUT /demos/:id ───────────────────────────────────────────────────────────

router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, demoDate, status, tenants = [], solutions = [], objects = [], clients = [] } = req.body;
    const now = new Date().toISOString();
    const userEmail = getUserEmail(req.user);

    await transaction(async (conn) => {
      const exec = (sql, params) => new Promise((res, rej) =>
        conn.exec(sql, params, (err, result) => err ? rej(err) : res(result))
      );

      await exec(
        `UPDATE SAP_PRESALES_DEMOS_DEMOS
         SET TITLE = ?, DESCRIPTION = ?, DEMODATE = ?, STATUS = ?, MODIFIEDAT = ?, MODIFIEDBY = ?
         WHERE ID = ?`,
        [title, description, demoDate, status, now, userEmail, id]
      );

      await exec(`DELETE FROM SAP_PRESALES_DEMOS_DEMOTENANTS WHERE DEMO_ID = ?`, [id]);
      await exec(`DELETE FROM SAP_PRESALES_DEMOS_DEMOSOLUTIONS WHERE DEMO_ID = ?`, [id]);
      await exec(`DELETE FROM SAP_PRESALES_DEMOS_DEMOOBJECTS WHERE DEMO_ID = ?`, [id]);
      await exec(`DELETE FROM SAP_PRESALES_DEMOS_DEMOCLIENTS WHERE DEMO_ID = ?`, [id]);

      for (const t of tenants) {
        await exec(
          `INSERT INTO SAP_PRESALES_DEMOS_DEMOTENANTS (DEMO_ID, TENANT_ID, NOTES) VALUES (?, ?, ?)`,
          [id, t.id, t.notes || null]
        );
      }

      for (const s of solutions) {
        await exec(
          `INSERT INTO SAP_PRESALES_DEMOS_DEMOSOLUTIONS (DEMO_ID, SOLUTION_ID, NOTES) VALUES (?, ?, ?)`,
          [id, s.id, s.notes || null]
        );
      }

      for (const o of objects) {
        await exec(
          `INSERT INTO SAP_PRESALES_DEMOS_DEMOOBJECTS (DEMO_ID, OBJECT_ID, NOTES) VALUES (?, ?, ?)`,
          [id, o.id, o.notes || null]
        );
      }

      for (const c of clients) {
        await exec(
          `INSERT INTO SAP_PRESALES_DEMOS_DEMOCLIENTS (DEMO_ID, CLIENT_ID, PRESENTATIONDATE, RESULT, FEEDBACK) VALUES (?, ?, ?, ?, ?)`,
          [id, c.clientId, c.presentationDate || null, c.result || null, c.feedback || null]
        );
      }
    });

    const updated = await getDemoById(id);
    if (!updated) return res.status(404).json({ error: 'Demo not found' });
    res.json({ data: updated });
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /demos/:id ────────────────────────────────────────────────────────

router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    // Clean up S3 objects before the DB transaction
    try {
      const { getS3 } = require('../config/objectstore');
      const { DeleteObjectsCommand } = require('@aws-sdk/client-s3');
      const attachments = await query(
        `SELECT OBJECTKEY FROM SAP_PRESALES_DEMOS_DEMOATTACHMENTS WHERE DEMO_ID = ?`, [id]
      );
      if (attachments.length) {
        const { client, bucket } = getS3();
        if (client) {
          await client.send(new DeleteObjectsCommand({
            Bucket: bucket,
            Delete: { Objects: attachments.map(a => ({ Key: a.OBJECTKEY })) }
          }));
        }
      }
    } catch { /* S3 cleanup is best-effort */ }

    await transaction(async (conn) => {
      const exec = (sql, params) => new Promise((res, rej) =>
        conn.exec(sql, params, (err, result) => err ? rej(err) : res(result))
      );

      await exec(`DELETE FROM SAP_PRESALES_DEMOS_DEMOTENANTS WHERE DEMO_ID = ?`, [id]);
      await exec(`DELETE FROM SAP_PRESALES_DEMOS_DEMOSOLUTIONS WHERE DEMO_ID = ?`, [id]);
      await exec(`DELETE FROM SAP_PRESALES_DEMOS_DEMOOBJECTS WHERE DEMO_ID = ?`, [id]);
      await exec(`DELETE FROM SAP_PRESALES_DEMOS_DEMOCLIENTS WHERE DEMO_ID = ?`, [id]);
      await exec(`DELETE FROM SAP_PRESALES_DEMOS_DEMOATTACHMENTS WHERE DEMO_ID = ?`, [id]);
      await exec(`DELETE FROM SAP_PRESALES_DEMOS_DEMOS WHERE ID = ?`, [id]);
    });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
