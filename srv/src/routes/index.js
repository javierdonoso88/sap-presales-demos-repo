'use strict';

const { Router } = require('express');
const router = Router();

router.use('/demos', require('./demos'));
router.use('/tenants', require('./tenants'));
router.use('/solutions', require('./solutions'));
router.use('/clients', require('./clients'));
router.use('/objects', require('./objects'));
router.use('/dashboard', require('./dashboard'));

module.exports = router;
