'use strict';

const { S3Client } = require('@aws-sdk/client-s3');
const xsenv = require('@sap/xsenv');

let _client = null;
let _bucket = null;

function getS3() {
  if (_client) return { client: _client, bucket: _bucket };
  try {
    const services = xsenv.getServices({ objectstore: { label: 'objectstore' } });
    const creds = services.objectstore;
    _client = new S3Client({
      region: creds.region,
      credentials: {
        accessKeyId: creds.access_key_id,
        secretAccessKey: creds.secret_access_key
      }
    });
    _bucket = creds.bucket;
  } catch {
    // Not bound (local dev without service binding)
  }
  return { client: _client, bucket: _bucket };
}

module.exports = { getS3 };
