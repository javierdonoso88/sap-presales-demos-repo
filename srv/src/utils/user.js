'use strict';

function getUserEmail(user) {
  if (!user) return 'unknown';
  // XSUAA security context — logon name first (always present, consistent across sessions)
  const logon = user.getLogonName?.();
  if (logon) return logon;
  const email = user.getEmail?.();
  if (email) return email;
  // local dev mock / plain object
  return user.logonName || user.email || 'unknown';
}

module.exports = { getUserEmail };
