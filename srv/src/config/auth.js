'use strict';

const passport = require('passport');
const xsenv = require('@sap/xsenv');
let JWTStrategy;
try { ({ JWTStrategy } = require('@sap/xssec')); } catch (e) {}

function setup() {
  if (!JWTStrategy) return; // skip if xssec not available (local dev without XSUAA)
  let uaa;
  try {
    uaa = xsenv.getServices({ uaa: { tag: 'xsuaa' } }).uaa;
  } catch (e) {
    return; // no XSUAA bound — local dev
  }
  passport.use('JWT', new JWTStrategy(uaa));
}

setup();
module.exports = passport;
