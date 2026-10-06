'use strict';

const passport = require('../config/auth');

module.exports = (req, res, next) => {
  // In local dev without XSUAA, skip auth if no JWT strategy registered
  const strategy = passport._strategy('JWT');
  if (!strategy) {
    req.user = { logonName: 'local-dev', email: 'dev@local' };
    return next();
  }
  passport.authenticate('JWT', { session: false }, (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    req.user = user;
    next();
  })(req, res, next);
};
