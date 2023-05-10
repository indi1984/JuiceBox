const { Client } = require('pg');

const client = new Client('postgres://pi-ai:5432/juicebox-dev');

async function createUser({ username, password }) {
  try {
    const { rows } = await client.query(/*sql*/`
      INSERT INTO users (username, password) 
      VALUES ($1, $2)
      ON CONFLICT (username) DO NOTHING
      RETURNING *;
    `, [ username, password ]);
    return rows;
  } catch (error) {
    throw error;
  };
};

async function getAllUsers() {
  const { rows } = await client.query(/*sql*/`
    SELECT id, username 
    FROM users;
  `);
  return rows;
};

module.exports = {
  client,
  getAllUsers,
  createUser
};
