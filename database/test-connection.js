'use strict';

require('dotenv').config();
const { pool, withTransaction } = require('../src/db/pool');

async function testConnection() {
  // 1. 연결 확인
  const { rows: [{ now }] } = await pool.query('SELECT NOW() AS now');
  console.log('DB 연결 성공 -', now);

  // 2. 테이블 row count
  const tables = ['users', 'categories', 'todos'];
  for (const table of tables) {
    const { rows: [{ cnt }] } = await pool.query(`SELECT COUNT(*) AS cnt FROM ${table}`);
    console.log(`  ${table}: ${cnt}건`);
  }

  // 3. pgcrypto UUID 생성 확인
  const { rows: [{ uuid }] } = await pool.query('SELECT gen_random_uuid() AS uuid');
  console.log('gen_random_uuid():', uuid);

  // 4. withTransaction 정상 커밋 검증
  const val = await withTransaction(async (client) => {
    const { rows: [{ result }] } = await client.query('SELECT 1+1 AS result');
    return result;
  });
  console.log('withTransaction 커밋:', val);

  // 5. withTransaction ROLLBACK 시나리오 — 데이터 변경 없음 확인
  try {
    await withTransaction(async (client) => {
      await client.query(`INSERT INTO categories (user_id, name, is_default) VALUES (NULL, '__test__', false)`);
      throw new Error('의도적 롤백');
    });
  } catch {
    const { rows: [{ cnt }] } = await pool.query(`SELECT COUNT(*) AS cnt FROM categories WHERE name = '__test__'`);
    console.log('withTransaction ROLLBACK 후 __test__ 행 수:', cnt, '(0이어야 함)');
  }

  // 6. 잘못된 비밀번호 연결 에러 핸들링
  const { Pool } = require('pg');
  const badPool = new Pool({ connectionString: 'postgresql://postgres:wrongpassword@localhost:5432/postgres' });
  try {
    await badPool.query('SELECT 1');
  } catch (err) {
    console.log('잘못된 비밀번호 에러 처리:', err.message.split('\n')[0]);
  } finally {
    await badPool.end();
  }

  await pool.end();
  console.log('\n모든 검증 완료');
}

testConnection().catch((err) => {
  console.error('DB 연결 실패:', err.message);
  process.exit(1);
});
