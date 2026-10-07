'use strict';

function getUserEmail(user) {
  if (!user) return 'unknown';

  // xssec SecurityContext (passport JWTStrategy)
  const logon = user.getLogonName?.();
  if (logon) return logon;
  const email = user.getEmail?.();
  if (email) return email;

  // CDS cds.User (.id is set from user_name or sub claim)
  if (user.id && user.id !== 'anonymous') return user.id;

  // plain object (local dev mock)
  if (user.logonName) return user.logonName;
  if (user.email)     return user.email;

  // Last resort: read JWT payload directly (xssec v3 TokenInfo)
  try {
    const payload = user.getTokenInfo?.()?.getPayload?.() || {};
    const id = payload.user_name || payload.email || payload.sub;
    if (id) return id;
  } catch (_) {}

  console.warn('[getUserEmail] all identity sources empty — user type:', user.constructor?.name, '| methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(user) || {}).filter(m => typeof user[m] === 'function').slice(0, 8).join(', '));
  return 'unknown';
}

module.exports = { getUserEmail };


