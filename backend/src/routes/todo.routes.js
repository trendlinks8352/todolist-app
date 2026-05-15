'use strict';

const { Router } = require('express');
const todoController = require('../controllers/todoController');
const { authenticate } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');
const {
  createTodoSchema,
  updateTodoSchema,
  getTodosQuerySchema,
} = require('../middlewares/schemas/todo.schema');

const router = Router();

// 모든 Todo 라우트는 인증 필수
router.use(authenticate);

router.get('/', validate(getTodosQuerySchema, 'query'), todoController.getTodos);
router.post('/', validate(createTodoSchema), todoController.createTodo);
router.put('/:id', validate(updateTodoSchema), todoController.updateTodo);
router.patch('/:id/complete', todoController.completeTodo);
router.delete('/:id', todoController.deleteTodo);

module.exports = router;
