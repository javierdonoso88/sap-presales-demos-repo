'use strict';

const { Router } = require('express');
const xsenv = require('@sap/xsenv');
const { getUserEmail } = require('../utils/user');
const router = Router();

router.get('/', (req, res) => {
  const u = req.user;

  const firstName = u?.getGivenName?.() || '';
  const lastName  = u?.getFamilyName?.() || '';

  // canonical = normalised logon name (e.g. 'javier.donoso'), same as what routes write to DB
  const canonical = getUserEmail(u);

  const displayName = (firstName || lastName)
    ? `${firstName} ${lastName}`.trim()
    : canonical !== 'unknown' ? canonical : 'User';

  const email = u?.getEmail?.() || u?.email || (u?.id?.includes?.('@') ? u.id : '');

  const i1 = firstName?.[0]?.toUpperCase() || displayName[0]?.toUpperCase() || 'U';
  const i2 = lastName?.[0]?.toUpperCase() || '';
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

  res.json({ email: email || (u?.id || ''), name: displayName, initials, logoutUrl });
});

module.exports = router;



