'use strict';

const { pool } = require('../db/pool');

async function findByEmail(email) {
  const { rows } = await pool.query(
    `SELECT id, email, password, name, theme,
            created_at AS "createdAt", updated_at AS "updatedAt"
     FROM users WHERE email = $1`,
    [email]
  );
  return rows[0] || null;
}

async function create({ email, password, name }) {
  const { rows } = await pool.query(
    `INSERT INTO users (email, password, name)
     VALUES ($1, $2, $3)
     RETURNING id, email, name, theme,
               created_at AS "createdAt", updated_at AS "updatedAt"`,
    [email, password, name]
  );
  return rows[0];
}

async function findById(id) {
  const { rows } = await pool.query(
    `SELECT id, email, name, theme,
            created_at AS "createdAt", updated_at AS "updatedAt"
     FROM users WHERE id = $1`,
    [id]
  );
  return rows[0] || null;
}

async function updateTheme(id, theme) {
  const { rows } = await pool.query(
    `UPDATE users SET theme = $1, updated_at = NOW()
     WHERE id = $2
     RETURNING id, email, name, theme,
               created_at AS "createdAt", updated_at AS "updatedAt"`,
    [theme, id]
  );
  return rows[0] || null;
}

async function deleteById(id) {
  await pool.query('DELETE FROM users WHERE id = $1', [id]);
}

module.exports = { findByEmail, create, findById, updateTheme, deleteById };
