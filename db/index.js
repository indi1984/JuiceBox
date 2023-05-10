const { Client } = require('pg');

const client = new Client('postgres://pi-ai:5432/juicebox-dev');

async function createUser({ name, username, location, active }) {
  try {
    const { rows } = await client.query(/*sql*/`
      INSERT INTO users (name, username, location, active) 
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (username) DO NOTHING
      RETURNING *;
    `, [ name, username, location, active ]);
    return rows;
  } catch (error) {
    throw error;
  };
};

async function updateUser(id, fields = {}) {
  const setString = Object.keys(fields).map(
    (key, index) => `"${ key }"=$${ index + 1 }`
  ).join(', ');
  if (setString.length === 0) {
    return;
  };
  try {
    const { rows: [ user ] } = await client.query(/*sql*/`
      UPDATE users
      SET ${ setString }
      WHERE id=${ id }
      RETURNING *;
    `, Object.values(fields));
    return user;
  } catch (error) {
    throw error;
  };
};

async function getAllUsers() {
  const { rows } = await client.query(/*sql*/`
    SELECT id, username, name, location, active
    FROM users;
  `);
  return rows;
};

module.exports = {
  client,
  getAllUsers,
  createUser,
  updateUser
};
