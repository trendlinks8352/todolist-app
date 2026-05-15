'use strict';

const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('../swagger/swagger.json');
const { errorHandler } = require('./middlewares/errorHandler');
const authRouter = require('./routes/auth.routes');
const todoRouter = require('./routes/todo.routes');
const categoryRouter = require('./routes/category.routes');
const userRouter = require('./routes/user.routes');

const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// 라우터 마운트 (errorHandler보다 반드시 앞에 위치)
app.use('/api/auth', authRouter);
app.use('/api/todos', todoRouter);
app.use('/api/categories', categoryRouter);
app.use('/api/users', userRouter);

// 전역 에러 핸들러
app.use(errorHandler);

module.exports = app;
