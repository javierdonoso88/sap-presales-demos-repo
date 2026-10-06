'use strict';

const { Router } = require('express');
const router = Router();

router.use('/demos', require('./demos'));
router.use('/demos/:id/attachments', require('./attachments'));
router.use('/demos/:id/share', require('./share'));
router.use('/share', require('./share'));
router.use('/systems', require('./systems'));
router.use('/clients', require('./clients'));
router.use('/dashboard', require('./dashboard'));

module.exports = router;
