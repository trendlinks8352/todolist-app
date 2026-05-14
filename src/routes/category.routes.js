'use strict';

const { Router } = require('express');
const categoryController = require('../controllers/categoryController');
const { authenticate } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');
const { createCategorySchema } = require('../middlewares/schemas/category.schema');

const router = Router();

router.use(authenticate);

router.get('/', categoryController.getCategories);
router.post('/', validate(createCategorySchema), categoryController.createCategory);

module.exports = router;
