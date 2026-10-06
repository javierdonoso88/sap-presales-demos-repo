'use strict';

const hana = require('@sap/hana-client');
const xsenv = require('@sap/xsenv');

let pool = null;

function getPool() {
  if (pool) return pool;
  let creds;
  try {
    const services = xsenv.getServices({ hana: { tag: 'hana' } });
    creds = services.hana;
  } catch (e) {
    // local dev: read from env vars
    creds = {
      host: process.env.HANA_HOST,
      port: process.env.HANA_PORT || 443,
      user: process.env.HANA_USER,
      password: process.env.HANA_PASSWORD,
      schema: process.env.HANA_SCHEMA
    };
  }
  pool = hana.createPool({
    serverNode: `${creds.host}:${creds.port}`,
    uid: creds.user,
    pwd: creds.password,
    encrypt: true,
    sslValidateCertificate: false,
    CURRENTSCHEMA: creds.schema
  }, { min: 2, max: 10 });
  return pool;
}

async function query(sql, params = []) {
  const pool = getPool();
  const conn = await new Promise((resolve, reject) => {
    pool.getConnection((err, conn) => err ? reject(err) : resolve(conn));
  });
  try {
    const rows = await new Promise((resolve, reject) => {
      conn.exec(sql, params, (err, rows) => err ? reject(err) : resolve(rows));
    });
    return rows;
  } finally {
    conn.disconnect();
  }
}

async function transaction(fn) {
  const pool = getPool();
  const conn = await new Promise((resolve, reject) => {
    pool.getConnection((err, conn) => err ? reject(err) : resolve(conn));
  });
  conn.setAutoCommit(false);
  try {
    const result = await fn(conn);
    await new Promise((res, rej) => conn.commit(err => err ? rej(err) : res()));
    return result;
  } catch (err) {
    await new Promise((res) => conn.rollback(() => res()));
    throw err;
  } finally {
    conn.disconnect();
  }
}

module.exports = { query, transaction };
