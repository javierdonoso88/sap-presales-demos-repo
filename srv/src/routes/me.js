'use strict';

const { Router } = require('express');
const xsenv = require('@sap/xsenv');
const router = Router();

router.get('/', (req, res) => {
  const u = req.user;

  const email = u.getEmail ? u.getEmail() : (u.email || '');
  const firstName = u.getGivenName ? u.getGivenName() : '';
  const lastName = u.getFamilyName ? u.getFamilyName() : '';
  const displayName = (firstName || lastName)
    ? `${firstName} ${lastName}`.trim()
    : email.split('@')[0] || 'User';

  const i1 = firstName?.[0] || displayName[0] || 'U';
  const i2 = lastName?.[0] || '';
  const initials = (i1 + i2).toUpperCase();

  let logoutUrl = '/';
  try {
    const uaa = xsenv.getServices({ uaa: { tag: 'xsuaa' } }).uaa;
    if (uaa?.url) {
      logoutUrl = `${uaa.url}/logout?redirect=${encodeURIComponent(
        req.protocol + '://' + req.get('host')
      )}`;
    }
  } catch (_) {}

  res.json({ email, name: displayName, initials: initials.slice(0, 2), logoutUrl });
});

module.exports = router;
