'use strict';

const request = require('supertest');
const app = require('../../src/app');
const { pool } = require('../../src/db/pool');

/**
 * 테스트용 사용자를 등록하고 accessToken을 반환한다.
 */
async function registerAndLogin({
  email,
  password = 'TestPass123',
  name = '테스트사용자',
}) {
  const regRes = await request(app)
    .post('/api/auth/register')
    .send({ email, password, name });

  if (regRes.status !== 201) {
    throw new Error(`Register failed: ${JSON.stringify(regRes.body)}`);
  }

  return {
    accessToken: regRes.body.accessToken,
    user: regRes.body.user,
  };
}

/**
 * email로 사용자 삭제 (ON DELETE CASCADE로 todos·categories 함께 삭제)
 */
async function cleanupUser(email) {
  await pool.query('DELETE FROM users WHERE email = $1', [email]);
}

/**
 * userId로 사용자 삭제
 */
async function cleanupUserById(userId) {
  await pool.query('DELETE FROM users WHERE id = $1', [userId]);
}

/**
 * DB에서 기본 카테고리 ID를 조회한다.
 * @param {string} name - '일반', '업무', '개인' 중 하나
 */
async function getDefaultCategoryId(name = '일반') {
  const { rows } = await pool.query(
    'SELECT id FROM categories WHERE name = $1 AND is_default = true LIMIT 1',
    [name]
  );
  if (!rows[0]) throw new Error(`기본 카테고리 '${name}'을 찾을 수 없습니다.`);
  return rows[0].id;
}

/**
 * 인증 헤더 문자열 반환
 */
function authHeader(accessToken) {
  return `Bearer ${accessToken}`;
}

module.exports = {
  registerAndLogin,
  cleanupUser,
  cleanupUserById,
  getDefaultCategoryId,
  authHeader,
};
