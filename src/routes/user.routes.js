'use strict';

const { Router } = require('express');
const userController = require('../controllers/userController');
const { authenticate } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');
const { updatePreferencesSchema } = require('../middlewares/schemas/user.schema');

const router = Router();

router.use(authenticate);

router.get('/me', userController.getMe);
router.patch('/me/preferences', validate(updatePreferencesSchema), userController.updatePreferences);
router.delete('/me', userController.deleteMe);

module.exports = router;
