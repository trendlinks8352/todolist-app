'use strict';

const { Pool, types } = require('pg');
const dbConfig = require('../config/database');

// DATE(1082) 타입을 string으로 반환하도록 설정 (타임존 변환 방지)
types.setTypeParser(1082, (val) => val);

const pool = new Pool({
  connectionString: dbConfig.connectionString,
  max: dbConfig.max,
  idleTimeoutMillis: dbConfig.idleTimeoutMillis,
  connectionTimeoutMillis: dbConfig.connectionTimeoutMillis,
});

pool.on('error', (err) => {
  console.error('[DB Pool] 유휴 클라이언트 오류:', err.message);
});

async function withTransaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { pool, withTransaction };
