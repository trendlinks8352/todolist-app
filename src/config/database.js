'use strict';

require('dotenv').config();

const REQUIRED = ['POSTGRES_CONNECTION_STRING'];

for (const key of REQUIRED) {
  if (!process.env[key]) {
    console.error(`[DB Config] 필수 환경변수 누락: ${key}`);
    process.exit(1);
  }
}

const poolMax = parseInt(process.env.DB_POOL_MAX, 10);
if (process.env.DB_POOL_MAX !== undefined && isNaN(poolMax)) {
  console.error('[DB Config] DB_POOL_MAX는 숫자여야 합니다.');
  process.exit(1);
}

module.exports = {
  connectionString: process.env.POSTGRES_CONNECTION_STRING,
  max: poolMax || 10,
  idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_TIMEOUT_MS, 10) || 30000,
  connectionTimeoutMillis: parseInt(process.env.DB_POOL_CONNECTION_TIMEOUT_MS, 10) || 2000,
};
