'use strict';

require('dotenv').config();

// JWT_SECRET 필수 검증
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error('[Server] JWT_SECRET은 32자 이상이어야 합니다.');
  process.exit(1);
}

const app = require('./app');
const { pool } = require('./db/pool');

const PORT = parseInt(process.env.PORT, 10) || 3000;

async function start() {
  try {
    await pool.query('SELECT 1');
    console.log('[DB] DB 연결 성공');

    app.listen(PORT, () => {
      console.log(`[Server] 서버 실행 중: http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('[Server] DB 연결 실패:', err.message);
    process.exit(1);
  }
}

start();
