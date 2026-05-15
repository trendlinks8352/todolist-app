'use strict';

const { pool } = require('../db/pool');

async function findAllByUser(userId) {
  const { rows } = await pool.query(
    `SELECT id, user_id AS "userId", name, is_default AS "isDefault",
            created_at AS "createdAt"
     FROM categories
     WHERE user_id IS NULL OR user_id = $1
     ORDER BY is_default DESC, created_at ASC`,
    [userId]
  );
  return rows;
}

async function findByNameAndUser(name, userId) {
  const { rows } = await pool.query(
    `SELECT id FROM categories
     WHERE LOWER(name) = LOWER($1) AND (user_id IS NULL OR user_id = $2)`,
    [name, userId]
  );
  return rows[0] || null;
}

async function create({ userId, name }) {
  const { rows } = await pool.query(
    `INSERT INTO categories (user_id, name, is_default)
     VALUES ($1, $2, false)
     RETURNING id, user_id AS "userId", name, is_default AS "isDefault",
               created_at AS "createdAt"`,
    [userId, name]
  );
  return rows[0];
}

async function findDefaultGeneralCategory() {
  const { rows } = await pool.query(
    `SELECT id, name FROM categories
     WHERE name = '일반' AND user_id IS NULL AND is_default = true
     LIMIT 1`
  );
  return rows[0] || null;
}

async function findAccessible(userId, categoryId) {
  const { rows } = await pool.query(
    `SELECT id FROM categories
     WHERE id = $1 AND (user_id IS NULL OR user_id = $2)`,
    [categoryId, userId]
  );
  return rows[0] || null;
}

module.exports = {
  findAllByUser,
  findByNameAndUser,
  create,
  findDefaultGeneralCategory,
  findAccessible,
};
