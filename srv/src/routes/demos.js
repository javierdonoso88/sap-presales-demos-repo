'use strict';

const { Router } = require('express');
const { v4: uuidv4 } = require('uuid');
const { query, transaction } = require('../config/db');

const router = Router();

// ─── Helpers ──────────────────────────────────────────────────────────────────

const { getUserEmail } = require('../utils/user');

async function getDemoById(id) {
  const demos = await query(
    `SELECT ID, TITLE, DESCRIPTION, DEMODATE, STATUS, TAGS, CREATEDAT, CREATEDBY, MODIFIEDAT, MODIFIEDBY
     FROM SAP_PRESALES_DEMOS_DEMOS WHERE ID = ?`,
    [id]
  );
  if (!demos || demos.length === 0) return null;
  const demo = demos[0];

  const systems = await query(
    `SELECT ds.SYSTEM_ID, ds.NOTES, s.NAME, s.TYPE, s.LANDSCAPE, s.URL
     FROM SAP_PRESALES_DEMOS_DEMOSYSTEMS ds
     JOIN SAP_PRESALES_DEMOS_SYSTEMS s ON s.ID = ds.SYSTEM_ID
     WHERE ds.DEMO_ID = ?`,
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

  return { ...demo, systems, clients };
}

function computeCompleteness(r) {
  return (
    (r.TITLE ? 20 : 0) +
    (r.DESCRIPTION ? 20 : 0) +
    (r.DEMODATE ? 20 : 0) +
    (Number(r.SYSTEM_COUNT) > 0 ? 20 : 0) +
    (Number(r.CLIENT_COUNT) > 0 ? 20 : 0)
  );
}

async function logHistory(conn, demoId, changedAt, changedBy, changes) {
  const exec = (sql, params) => new Promise((res, rej) =>
    conn.exec(sql, params, (err, result) => err ? rej(err) : res(result))
  );
  for (const { field, oldValue, newValue } of changes) {
    if (String(oldValue || '') !== String(newValue || '')) {
      await exec(
        `INSERT INTO SAP_PRESALES_DEMOS_DEMOHISTORY (ID, DEMO_ID, CHANGEDAT, CHANGEDBY, FIELD, OLDVALUE, NEWVALUE)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [uuidv4(), demoId, changedAt, changedBy, field, String(oldValue || ''), String(newValue || '')]
      );
    }
  }
}

// ─── GET /demos ───────────────────────────────────────────────────────────────

router.get('/', async (req, res, next) => {
  try {
    const { status, search, system_type, landscape } = req.query;
    let sql = `
      SELECT d.ID, d.TITLE, d.DESCRIPTION, d.DEMODATE, d.STATUS, d.TAGS,
             d.CREATEDAT, d.CREATEDBY, d.MODIFIEDAT, d.MODIFIEDBY,
             (SELECT COUNT(*) FROM SAP_PRESALES_DEMOS_DEMOCLIENTS WHERE DEMO_ID = d.ID) AS CLIENT_COUNT,
             (SELECT COUNT(*) FROM SAP_PRESALES_DEMOS_DEMOSYSTEMS WHERE DEMO_ID = d.ID) AS SYSTEM_COUNT
      FROM SAP_PRESALES_DEMOS_DEMOS d
    `;
    const params = [];
    const conditions = [];

    if (system_type || landscape) {
      sql += ` JOIN SAP_PRESALES_DEMOS_DEMOSYSTEMS ds ON ds.DEMO_ID = d.ID
               JOIN SAP_PRESALES_DEMOS_SYSTEMS s ON s.ID = ds.SYSTEM_ID`;
      if (system_type) { sql += ` AND s.TYPE = ?`; params.push(system_type); }
      if (landscape)   { sql += ` AND s.LANDSCAPE = ?`; params.push(landscape); }
    }

    if (status) { conditions.push(`d.STATUS = ?`); params.push(status); }
    if (search) {
      conditions.push(`(UPPER(d.TITLE) LIKE UPPER(?) OR UPPER(d.DESCRIPTION) LIKE UPPER(?) OR UPPER(d.TAGS) LIKE UPPER(?))`);
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (conditions.length > 0) sql += ` WHERE ` + conditions.join(' AND ');
    sql += ` ORDER BY d.CREATEDAT DESC`;

    const rows = await query(sql, params);
    const data = rows.map(r => ({
      ...r,
      clientCount: Number(r.CLIENT_COUNT),
      systemCount: Number(r.SYSTEM_COUNT),
      completeness: computeCompleteness(r),
    }));
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

// ─── GET /demos/:id/history ───────────────────────────────────────────────────

router.get('/:id/history', async (req, res, next) => {
  try {
    const rows = await query(
      `SELECT ID, CHANGEDAT, CHANGEDBY, FIELD, OLDVALUE, NEWVALUE
       FROM SAP_PRESALES_DEMOS_DEMOHISTORY
       WHERE DEMO_ID = ?
       ORDER BY CHANGEDAT DESC`,
      [req.params.id]
    );
    res.json({ data: rows });
  } catch (err) {
    next(err);
  }
});

// ─── PATCH /demos/:id/status ──────────────────────────────────────────────────

router.patch('/:id/status', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const now = new Date().toISOString();
    const userEmail = getUserEmail(req.user);

    const old = await getDemoById(id);
    if (!old) return res.status(404).json({ error: 'Demo not found' });

    await transaction(async (conn) => {
      const exec = (sql, params) => new Promise((res, rej) =>
        conn.exec(sql, params, (err, result) => err ? rej(err) : res(result))
      );
      await exec(
        `UPDATE SAP_PRESALES_DEMOS_DEMOS SET STATUS = ?, MODIFIEDAT = ?, MODIFIEDBY = ? WHERE ID = ?`,
        [status, now, userEmail, id]
      );
      await logHistory(conn, id, now, userEmail, [
        { field: 'STATUS', oldValue: old.STATUS, newValue: status }
      ]);
    });

    res.json({ data: { ID: id, STATUS: status } });
  } catch (err) {
    next(err);
  }
});

// ─── POST /demos/bulk ─────────────────────────────────────────────────────────

router.post('/bulk', async (req, res, next) => {
  try {
    const { ids, action } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ error: 'No IDs provided' });

    const now = new Date().toISOString();
    const userEmail = getUserEmail(req.user);

    if (action === 'archive') {
      for (const id of ids) {
        await query(
          `UPDATE SAP_PRESALES_DEMOS_DEMOS SET STATUS = 'ARCHIVED', MODIFIEDAT = ?, MODIFIEDBY = ? WHERE ID = ?`,
          [now, userEmail, id]
        );
      }
      return res.json({ data: { updated: ids.length } });
    }

    if (action === 'delete') {
      for (const id of ids) {
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
        } catch { /* best-effort S3 cleanup */ }

        await transaction(async (conn) => {
          const exec = (sql, params) => new Promise((res, rej) =>
            conn.exec(sql, params, (err, result) => err ? rej(err) : res(result))
          );
          await exec(`DELETE FROM SAP_PRESALES_DEMOS_DEMOHISTORY WHERE DEMO_ID = ?`, [id]);
          await exec(`DELETE FROM SAP_PRESALES_DEMOS_SHARETOKENS WHERE DEMO_ID = ?`, [id]);
          await exec(`DELETE FROM SAP_PRESALES_DEMOS_DEMOSYSTEMS WHERE DEMO_ID = ?`, [id]);
          await exec(`DELETE FROM SAP_PRESALES_DEMOS_DEMOCLIENTS WHERE DEMO_ID = ?`, [id]);
          await exec(`DELETE FROM SAP_PRESALES_DEMOS_DEMOATTACHMENTS WHERE DEMO_ID = ?`, [id]);
          await exec(`DELETE FROM SAP_PRESALES_DEMOS_DEMOS WHERE ID = ?`, [id]);
        });
      }
      return res.json({ data: { deleted: ids.length } });
    }

    res.status(400).json({ error: 'Unknown action' });
  } catch (err) {
    next(err);
  }
});

// ─── POST /demos ──────────────────────────────────────────────────────────────

router.post('/', async (req, res, next) => {
  try {
    const { title, description, demoDate, status, tags, systems = [], clients = [] } = req.body;
    const id = uuidv4();
    const now = new Date().toISOString();
    const userEmail = getUserEmail(req.user);
    const tagsStr = Array.isArray(tags) ? tags.join(',') : (tags || null);

    await transaction(async (conn) => {
      const exec = (sql, params) => new Promise((res, rej) =>
        conn.exec(sql, params, (err, result) => err ? rej(err) : res(result))
      );

      await exec(
        `INSERT INTO SAP_PRESALES_DEMOS_DEMOS
         (ID, TITLE, DESCRIPTION, DEMODATE, STATUS, TAGS, CREATEDAT, CREATEDBY, MODIFIEDAT, MODIFIEDBY)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, title, description, demoDate, status || 'DRAFT', tagsStr, now, userEmail, now, userEmail]
      );

      for (const sys of systems) {
        await exec(
          `INSERT INTO SAP_PRESALES_DEMOS_DEMOSYSTEMS (DEMO_ID, SYSTEM_ID, NOTES) VALUES (?, ?, ?)`,
          [id, sys.id, sys.notes || null]
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
    const { title, description, demoDate, status, tags, systems = [], clients = [] } = req.body;
    const now = new Date().toISOString();
    const userEmail = getUserEmail(req.user);
    const tagsStr = Array.isArray(tags) ? tags.join(',') : (tags || null);

    const oldDemo = await getDemoById(id);

    await transaction(async (conn) => {
      const exec = (sql, params) => new Promise((res, rej) =>
        conn.exec(sql, params, (err, result) => err ? rej(err) : res(result))
      );

      await exec(
        `UPDATE SAP_PRESALES_DEMOS_DEMOS
         SET TITLE = ?, DESCRIPTION = ?, DEMODATE = ?, STATUS = ?, TAGS = ?, MODIFIEDAT = ?, MODIFIEDBY = ?
         WHERE ID = ?`,
        [title, description, demoDate, status, tagsStr, now, userEmail, id]
      );

      if (oldDemo) {
        const newSystemsCount = systems.length;
        const newClientsCount = clients.filter(c => c.clientId).length;
        await logHistory(conn, id, now, userEmail, [
          { field: 'TITLE',       oldValue: oldDemo.TITLE,       newValue: title },
          { field: 'STATUS',      oldValue: oldDemo.STATUS,      newValue: status },
          { field: 'DEMODATE',    oldValue: oldDemo.DEMODATE,    newValue: demoDate },
          { field: 'DESCRIPTION', oldValue: oldDemo.DESCRIPTION, newValue: description },
          { field: 'TAGS',        oldValue: oldDemo.TAGS,        newValue: tagsStr },
          { field: 'SYSTEMS',     oldValue: String(oldDemo.systems?.length || 0), newValue: String(newSystemsCount) },
          { field: 'CLIENTS',     oldValue: String(oldDemo.clients?.length || 0), newValue: String(newClientsCount) },
        ]);
      }

      await exec(`DELETE FROM SAP_PRESALES_DEMOS_DEMOSYSTEMS WHERE DEMO_ID = ?`, [id]);
      await exec(`DELETE FROM SAP_PRESALES_DEMOS_DEMOCLIENTS WHERE DEMO_ID = ?`, [id]);

      for (const sys of systems) {
        await exec(
          `INSERT INTO SAP_PRESALES_DEMOS_DEMOSYSTEMS (DEMO_ID, SYSTEM_ID, NOTES) VALUES (?, ?, ?)`,
          [id, sys.id, sys.notes || null]
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
    } catch { /* best-effort */ }

    await transaction(async (conn) => {
      const exec = (sql, params) => new Promise((res, rej) =>
        conn.exec(sql, params, (err, result) => err ? rej(err) : res(result))
      );
      await exec(`DELETE FROM SAP_PRESALES_DEMOS_DEMOHISTORY WHERE DEMO_ID = ?`, [id]);
      await exec(`DELETE FROM SAP_PRESALES_DEMOS_SHARETOKENS WHERE DEMO_ID = ?`, [id]);
      await exec(`DELETE FROM SAP_PRESALES_DEMOS_DEMOSYSTEMS WHERE DEMO_ID = ?`, [id]);
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
