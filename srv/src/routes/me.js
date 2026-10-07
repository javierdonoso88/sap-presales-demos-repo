'use strict';

const { Router } = require('express');
const xsenv = require('@sap/xsenv');
const { getUserEmail } = require('../utils/user');
const router = Router();

router.get('/', (req, res) => {
  const u = req.user;

  // Resolve identity using the same chain as getUserEmail
  const logon     = u?.getLogonName?.() || '';
  const email     = u?.getEmail?.()     || u?.email     || '';
  const firstName = u?.getGivenName?.() || '';
  const lastName  = u?.getFamilyName?.() || '';

  // CDS user or local mock fallbacks
  const cdsFallback = (u?.id && u.id !== 'anonymous') ? u.id : '';

  // Try JWT payload as last resort
  let payloadUser = '';
  try {
    const p = u?.getTokenInfo?.()?.getPayload?.() || {};
    payloadUser = p.user_name || p.email || p.sub || '';
  } catch (_) {}

  const canonical = getUserEmail(u); // single source of truth for the identifier

  // Debug: log all resolved values to CF logs
  console.log('[/api/me] logon=%s email=%s given=%s family=%s cds=%s payload=%s → canonical=%s',
    logon, email, firstName, lastName, cdsFallback, payloadUser, canonical);

  const displayName = (firstName || lastName)
    ? `${firstName} ${lastName}`.trim()
    : email.split('@')[0] || logon || cdsFallback || payloadUser || 'User';

  const i1 = firstName?.[0]?.toUpperCase() || (displayName !== 'User' ? displayName[0]?.toUpperCase() : null) || 'U';
  const i2 = lastName?.[0]?.toUpperCase()  || '';
  const initials = (i1 + i2).slice(0, 2);

  let logoutUrl = '/';
  try {
    const uaa = xsenv.getServices({ uaa: { tag: 'xsuaa' } }).uaa;
    if (uaa?.url) {
      logoutUrl = `${uaa.url}/logout?redirect=${encodeURIComponent(
        req.protocol + '://' + req.get('host')
      )}`;
    }
  } catch (_) {}

  res.json({ email: email || canonical, name: displayName, initials, logoutUrl });
});

module.exports = router;


