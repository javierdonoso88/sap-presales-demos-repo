'use strict';

function getUserEmail(user) {
  if (!user) return 'unknown';
  // XSUAA security context — try email first, then logon name
  const email = user.getEmail?.();
  if (email) return email;
  const logon = user.getLogonName?.();
  if (logon) return logon;
  // local dev mock / plain object
  return user.email || user.logonName || 'unknown';
}

module.exports = { getUserEmail };
