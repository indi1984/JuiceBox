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
    console.error("Error creating user!", error);
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
    console.error("Error updating user!", error);
  };
};

async function createPost( { authorId, title, content, tags = [], active } ) {
  try {
    const { rows: [ post ] } = await client.query(/*sql*/`
      INSERT INTO posts ("authorId", title, content, active) 
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `, [ authorId, title, content, active ]);
    const tagList = await createTags(tags);
    return await addTagsToPost(post.id, tagList);
  } catch (error) {
    console.error("Error creating post!", error);
  };
};

async function updatePost(postId, fields = {}) {
  const { tags } = fields;
  delete fields.tags;
  const setString = Object.keys(fields).map(
    (key, index) => `"${ key }" = $${ index + 1 }`
  ).join(', ');
  try {
    if (setString.length > 0) {
      await client.query(/*sql*/`
        UPDATE posts
        SET ${ setString }
        WHERE id = ${ setString.length + 1 }
        RETURNING *;
      `, [ ...Object.values(fields), postId ]);
    };
    if (tags === undefined) {
      return await getPostById(postId);
    };
    const tagList = await createTags(tags);
    const tagListIdString = tagList.map(
      (tag) => `${ tag.id }`
    );
    await client.query(/*sql*/`
      DELETE FROM post_tags
      WHERE "tagId"
      NOT IN (${ tagListIdString })
      AND "postId" = $1
    `, [ postId ]);
    await addTagsToPost(postId, tagList);
    return await getPostById(postId);
  } catch (error) {
    console.error("Error updating post!", error);
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
    console.error("Error getting all users!", error);
  };
};

async function getUserById(userId) {
  try {
    const { rows: [ user ] } = await client.query(/*sql*/`
      SELECT id, name, username, location, active 
      FROM users
      WHERE id = $1;
    `, [ userId ]);
    if (user.length === 0) {
      return null;
    } else {
      user.posts = await getPostsByUser(userId);
      return user;
    };
  } catch (error) {
    console.error("Error getting users by ID!", error);
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
    console.error("Error getting all posts!", error);
  };
};

async function getPostsByUser(userId) {
  try {
    const { rows: postIds } = await client.query(/*sql*/`
      SELECT id 
      FROM posts
      WHERE "authorId" = $1;
    ` [ userId ]);
    const posts = await Promise.all(
      postIds.map((post) => getPostById( post.id ))
    );
    return posts;
  } catch (error) {
    console.error("Error getting posts by user!", error);
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
    await client.query(/*sql*/`
      INSERT INTO post_tags ("postId", "tagId")
      VALUES ($1, $2)
      ON CONFLICT ("postId", "tagId") DO NOTHING;
    `, [ postId, tagId ]);
  } catch (error) {
    console.error("Error creating post tags!", error);
  };
};

async function addTagsToPost(postId, tagList) {
  try {
    const createPostTagPromises = tagList.map(
      (tag) => createPostTag(postId, tag.id)
    );
    await Promise.all(createPostTagPromises);
    return await getPostById(postId);
  } catch (error) {
    console.error("Error adding tags to post!", error);
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
      JOIN post_tags ON tags.id = post_tags."tagId"
      WHERE post_tags."postId" = $1;
    `, [ postId ])
    const { rows: [ author ] } = await client.query(/*sql*/`
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
  };
};

async function getPostsByTagName(tagName) {
  try {
    const { rows: postIds } = await client.query(/*sql*/`
      SELECT posts.id
      FROM posts
      JOIN post_tags ON posts.id = post_tags."postId"
      JOIN tags ON tags.id = post_tags."tagId"
      WHERE tags.name = $1;
    `, [tagName]);
    return await Promise.all(
      postIds.map((post) => getPostById(post.id))
    );
  } catch (error) {
    console.error("Error getting posts by tag name!", error);
  };
} ;

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
  getPostById,
  getPostsByTagName
};
