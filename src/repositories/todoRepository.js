'use strict';

const { pool } = require('../db/pool');

const TODO_SELECT = `
  SELECT
    t.id,
    t.user_id          AS "userId",
    t.category_id      AS "categoryId",
    t.title,
    t.description,
    t.due_date         AS "dueDate",
    t.is_completed     AS "isCompleted",
    t.completed_at     AS "completedAt",
    t.created_at       AS "createdAt",
    t.updated_at       AS "updatedAt",
    json_build_object(
      'id',        c.id,
      'name',      c.name,
      'isDefault', c.is_default
    ) AS category
  FROM todos t
  JOIN categories c ON t.category_id = c.id
`;

async function find({ userId, categoryId, isCompleted, dueDateFrom, dueDateTo, page = 1, size = 20 }) {
  const conditions = ['t.user_id = $1'];
  const params = [userId];
  let idx = 2;

  if (categoryId !== undefined) {
    conditions.push(`t.category_id = $${idx++}`);
    params.push(categoryId);
  }
  if (isCompleted !== undefined) {
    conditions.push(`t.is_completed = $${idx++}`);
    params.push(isCompleted);
  }
  if (dueDateFrom !== undefined) {
    conditions.push(`t.due_date >= $${idx++}`);
    params.push(dueDateFrom);
  }
  if (dueDateTo !== undefined) {
    conditions.push(`t.due_date <= $${idx++}`);
    params.push(dueDateTo);
  }

  const where = conditions.join(' AND ');

  const countRes = await pool.query(
    `SELECT COUNT(*) FROM todos t WHERE ${where}`,
    params
  );
  const total = parseInt(countRes.rows[0].count, 10);

  const offset = (page - 1) * size;
  const dataRes = await pool.query(
    `${TODO_SELECT} WHERE ${where} ORDER BY t.created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
    [...params, size, offset]
  );

  return {
    data: dataRes.rows,
    pagination: {
      page,
      size,
      total,
      totalPages: Math.ceil(total / size) || 0,
    },
  };
}

async function create({ userId, categoryId, title, description, dueDate }) {
  const { rows } = await pool.query(
    `INSERT INTO todos (user_id, category_id, title, description, due_date)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [userId, categoryId, title, description ?? null, dueDate ?? null]
  );
  return findById(rows[0].id);
}

async function findById(id) {
  const { rows } = await pool.query(`${TODO_SELECT} WHERE t.id = $1`, [id]);
  return rows[0] || null;
}

async function update(id, fields) {
  const setClauses = [];
  const params = [];
  let idx = 1;

  const map = {
    title: 'title',
    description: 'description',
    dueDate: 'due_date',
    categoryId: 'category_id',
    isCompleted: 'is_completed',
    completedAt: 'completed_at',
  };

  for (const [key, col] of Object.entries(map)) {
    if (key in fields) {
      setClauses.push(`${col} = $${idx++}`);
      params.push(fields[key]);
    }
  }

  setClauses.push('updated_at = NOW()');
  params.push(id);

  await pool.query(
    `UPDATE todos SET ${setClauses.join(', ')} WHERE id = $${idx}`,
    params
  );

  return findById(id);
}

async function deleteById(id) {
  await pool.query('DELETE FROM todos WHERE id = $1', [id]);
}

module.exports = { find, create, findById, update, deleteById };
