'use strict';

const { Router } = require('express');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { query } = require('../config/db');
const { getS3 } = require('../config/objectstore');

// mergeParams gives us req.params.id from the parent demos/:id route
const router = Router({ mergeParams: true });

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 200 * 1024 * 1024 } // 200 MB
});

const ALLOWED_TYPES = new Set([
  'application/pdf',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/png',
  'image/jpeg'
]);

function userEmail(user) {
  return (user && user.getEmail) ? user.getEmail() : (user && user.email) || 'system';
}

// ─── GET /api/demos/:id/attachments ──────────────────────────────────────────

router.get('/', async (req, res, next) => {
  try {
    const rows = await query(
      `SELECT ID, FILENAME, CONTENTTYPE, SIZE, CREATEDAT, CREATEDBY
       FROM SAP_PRESALES_DEMOS_DEMOATTACHMENTS
       WHERE DEMO_ID = ?
       ORDER BY CREATEDAT DESC`,
      [req.params.id]
    );
    res.json({ data: rows });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/demos/:id/attachments (multipart, streams buffer → S3) ────────

router.post('/', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file provided' });
    if (!ALLOWED_TYPES.has(req.file.mimetype)) {
      return res.status(415).json({ error: 'File type not allowed. Accepted: PDF, PPT/PPTX, XLS/XLSX, DOC/DOCX, PNG, JPEG.' });
    }

    const { client, bucket } = getS3();
    if (!client) return res.status(503).json({ error: 'Object storage not available' });

    const id = uuidv4();
    const objectKey = `demos/${req.params.id}/${id}`;

    await client.send(new PutObjectCommand({
      Bucket: bucket,
      Key: objectKey,
      Body: req.file.buffer,
      ContentType: req.file.mimetype
    }));

    const now = new Date().toISOString();
    const createdBy = userEmail(req.user);

    await query(
      `INSERT INTO SAP_PRESALES_DEMOS_DEMOATTACHMENTS
         (ID, DEMO_ID, FILENAME, CONTENTTYPE, SIZE, OBJECTKEY, CREATEDAT, CREATEDBY, MODIFIEDAT, MODIFIEDBY)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, req.params.id, req.file.originalname, req.file.mimetype, req.file.size, objectKey, now, createdBy, now, createdBy]
    );

    res.status(201).json({
      data: { ID: id, FILENAME: req.file.originalname, CONTENTTYPE: req.file.mimetype, SIZE: req.file.size, CREATEDAT: now, CREATEDBY: createdBy }
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/demos/:id/attachments/:aid/download (presigned GET URL) ────────

router.get('/:aid/download', async (req, res, next) => {
  try {
    const rows = await query(
      `SELECT FILENAME, OBJECTKEY, CONTENTTYPE
       FROM SAP_PRESALES_DEMOS_DEMOATTACHMENTS
       WHERE ID = ? AND DEMO_ID = ?`,
      [req.params.aid, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Attachment not found' });

    const { FILENAME, OBJECTKEY, CONTENTTYPE } = rows[0];
    const { client, bucket } = getS3();

    const url = await getSignedUrl(
      client,
      new GetObjectCommand({
        Bucket: bucket,
        Key: OBJECTKEY,
        ResponseContentDisposition: `attachment; filename*=UTF-8''${encodeURIComponent(FILENAME)}`,
        ResponseContentType: CONTENTTYPE
      }),
      { expiresIn: 900 } // 15 min
    );

    res.json({ data: { url } });
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /api/demos/:id/attachments/:aid ───────────────────────────────────

router.delete('/:aid', async (req, res, next) => {
  try {
    const rows = await query(
      `SELECT OBJECTKEY FROM SAP_PRESALES_DEMOS_DEMOATTACHMENTS WHERE ID = ? AND DEMO_ID = ?`,
      [req.params.aid, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Attachment not found' });

    const { client, bucket } = getS3();
    if (client) {
      await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: rows[0].OBJECTKEY }));
    }
    await query(`DELETE FROM SAP_PRESALES_DEMOS_DEMOATTACHMENTS WHERE ID = ?`, [req.params.aid]);

    res.json({ data: { deleted: true } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
