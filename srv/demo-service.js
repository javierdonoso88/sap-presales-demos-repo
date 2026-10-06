'use strict';

const cds = require('@sap/cds');
const { query } = require('./src/config/db');

module.exports = class DemoService extends cds.ApplicationService {
  async init() {
    const { Systems } = this.entities;

    // Accept camelCase form keys (from MasterData frontend) as well as UPPERCASE
    this.before(['CREATE', 'UPDATE'], Systems, req => {
      const d = req.data;
      if (!d) return;
      if (d.name  !== undefined && d.NAME  === undefined) req.data.NAME  = d.name;
      if (d.type  !== undefined && d.TYPE  === undefined) req.data.TYPE  = d.type;
      if (d.landscape !== undefined && d.LANDSCAPE === undefined) req.data.LANDSCAPE = d.landscape;
      if (d.url   !== undefined && d.URL   === undefined) req.data.URL   = d.url;
      if (d.description !== undefined && d.DESCRIPTION === undefined) req.data.DESCRIPTION = d.description;
      if (d.active !== undefined && d.ACTIVE === undefined) req.data.ACTIVE = d.active;
    });

    // Referential integrity check before deleting a system
    this.before('DELETE', Systems, async req => {
      const id = req.params?.[0]?.ID ?? req.params?.[0];
      if (!id) return;
      try {
        const rows = await query(
          `SELECT COUNT(*) AS CNT FROM SAP_PRESALES_DEMOS_DEMOSYSTEMS WHERE SYSTEM_ID = ?`,
          [id]
        );
        if (Number(rows?.[0]?.CNT) > 0) {
          req.error(409, 'System is referenced by one or more demos and cannot be deleted.');
        }
      } catch (err) {
        // If check fails, allow CAP to proceed (HANA FK will block it anyway)
      }
    });

    await super.init();
  }
};
