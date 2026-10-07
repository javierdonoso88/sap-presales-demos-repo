'use strict';

// Normalize email to logon name: 'javier.donoso@sap.com' → 'javier.donoso'
// Keeps non-email IDs (P/I-numbers, plain logon names) as-is
function normalizeId(id) {
  if (!id) return id;
  return id.includes('@') ? id.split('@')[0] : id;
}

function getUserEmail(user) {
  if (!user) return 'unknown';

  // xssec SecurityContext (passport JWTStrategy)
  const logon = user.getLogonName?.();
  if (logon) return normalizeId(logon);
  const email = user.getEmail?.();
  if (email) return normalizeId(email);

  // CDS cds.User — .id comes from JWT user_name or sub claim
  if (user.id && user.id !== 'anonymous') return normalizeId(user.id);

  // plain object (local dev mock)
  if (user.logonName) return normalizeId(user.logonName);
  if (user.email)     return normalizeId(user.email);

  // Last resort: read JWT payload directly (xssec v3 TokenInfo)
  try {
    const p = user.getTokenInfo?.()?.getPayload?.() || {};
    const id = p.user_name || p.email || p.sub;
    if (id) return normalizeId(id);
  } catch (_) {}

  console.warn('[getUserEmail] all identity sources empty — user type:', user.constructor?.name);
  return 'unknown';
}

module.exports = { getUserEmail };



