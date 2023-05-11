const { Client } = require('pg');

const client = new Client('postgres://pi-ai:5432/juicebox-dev');

async function createUser( { name, username, password, location, active } ) {
  try {
    const { rows } = await client.query(/*sql*/`
      INSERT INTO users (name, username, password, location, active) 
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (username) DO NOTHING
      RETURNING *;
    `, [ name, username, password, location, active ]);
    return rows;
  } catch (error) {
    throw error;
  };
};

async function createPost( { authorId, title, content, active } ) {
  try {
    const { rows } = await client.query(/*sql*/`
      INSERT INTO posts ("authorId", title, content, active) 
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `, [ authorId, title, content, active ]);
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
      WHERE id = ${ id }
      RETURNING *;
    `, Object.values(fields));
    return user;
  } catch (error) {
    throw error;
  };
};

async function updatePost(id, fields = {}) {
  const setString = Object.keys(fields).map(
    (key, index) => `"${ key }"=$${ index + 1 }`
  ).join(', ');
  if (setString.length === 0) {
    return;
  };
  try {
    const { rows: [ post ] } = await client.query(/*sql*/`
      UPDATE posts
      SET ${ setString }
      WHERE id = ${ id }
      RETURNING *;
    `, Object.values(fields));
    return post;
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

async function getUserById(userId) {
  try {
    const { rows: [user] } = await client.query(/*sql*/`
      SELECT id, username, name, location, active 
      FROM users
      WHERE id=${ userId };
    `);
    if (user.length === 0) {
      return null;
    } else {
      user.posts = await getPostsByUser(userId);
      return user;
    };
  } catch (error) {
    throw error;
  };
};

async function getAllPosts() {
  const { rows } = await client.query(/*sql*/`
    SELECT id, "authorId", title, content, active
    FROM posts;
  `);
  return rows;
};

async function getPostsByUser(userId) {
  try {
    const { rows } = await client.query(/*sql*/`
      SELECT * FROM posts
      WHERE "authorId" = ${ userId };
    `);
    return rows;
  } catch (error) {
    throw error;
  };
};

module.exports = {
  client,
  getAllUsers,
  getAllPosts,
  getPostsByUser,
  getUserById,
  createUser,
  updateUser,
  createPost,
  updatePost  
};
