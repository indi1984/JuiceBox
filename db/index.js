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

async function updateUser(id, fields = {}) {
  const setString = Object.keys(fields).map(
    (key, index) => `"${ key }" = $${ index + 1 }`
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

async function updatePost(id, fields = {}) {
  const setString = Object.keys(fields).map(
    (key, index) => `"${ key }" = $${ index + 1 }`
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
  try {
    const { rows } = await client.query(/*sql*/`
      SELECT id, name, username, password, location, active
      FROM users;
    `);
    return rows;
  } catch (error) {
    throw error;
  };
};

async function getUserById(userId) {
  try {
    const { rows: [user] } = await client.query(/*sql*/`
      SELECT id, name, username, location, active 
      FROM users
      WHERE id = ${ userId };
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
  try {
    const { rows } = await client.query(/*sql*/`
      SELECT id, "authorId", title, content, active
      FROM posts;
    `);
    return rows;
  } catch (error) {
    throw error;
  };
};

async function getPostsByUser(userId) {
  try {
    const { rows } = await client.query(/*sql*/`
      SELECT * 
      FROM posts
      WHERE "authorId" = ${ userId };
    `);
    return rows;
  } catch (error) {
    throw error;
  };
};

async function createTags(tagList) {
  if (tagList.length === 0) { 
    return; 
  } else {
    const insertValues = tagList.map(
      (_, index) => `$${index + 1}`).join('), (');
    const selectValues = tagList.map(
      (_, index) => `$${index + 1}`).join(', ');
    try {
      await client.query(/*sql*/`
        INSERT INTO tags (name)
        VALUES (${ insertValues })
        ON CONFLICT (name) DO NOTHING;
      `, tagList);
      const { rows } = await client.query(/*sql*/`
        SELECT * FROM tags
        WHERE name
        IN (${ selectValues })
      `, tagList);
      return rows;
    } catch (error) {
      console.error("Error creating tags!", error);
    };
  };
};

async function createPostTag(postId, tagId) {
  try {
    console.log("Adding tags to posts!");
    await client.query(/*sql*/`
      INSERT INTO post_tags ("postId", "tagId")
      VALUES ($1, $2)
      ON CONFLICT ("postId", "tagId") DO NOTHING;
    `, [ postId, tagId ]);
  } catch (error) {
    console.error("Error adding tags to posts!", error);
  };
};

async function addTagsToPost(postId, tagList) {
  try {
    const createPostTagPromises = tagList.map(
      tag => createPostTag(postId, tag.id)
    );
    await Promise.all(createPostTagPromises);
    return await getPostById(postId);
  } catch (error) {
    throw error;
  };
};

async function getPostById(postId) {
  try {
    const { rows: [ post ]  } = await client.query(/*sql*/`
      SELECT *
      FROM posts
      WHERE id = $1;
    `, [ postId ]);
    const { rows: tags } = await client.query(/*sql*/`
      SELECT tags.*
      FROM tags
      JOIN post_tags ON tags.id=post_tags."tagId"
      WHERE post_tags."postId" = $1;
    `, [ postId ])
    const { rows: [author] } = await client.query(/*sql*/`
      SELECT id, username, name, location
      FROM users
      WHERE id = $1;
    `, [ post.authorId ])
    post.tags = tags;
    post.author = author;
    delete post.authorId;
    return post;
  } catch (error) {
    console.error("Error getting posts by ID!", error);
  }
}

module.exports = {
  client,
  getAllUsers,
  getAllPosts,
  getPostsByUser,
  getUserById,
  createUser,
  updateUser,
  createPost,
  updatePost,
  createTags,
  getPostById,
  addTagsToPost
};
