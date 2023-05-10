const { client, getAllUsers, getAllPosts, createUser, updateUser, createPost, updatePost } = require('./index');

async function dropTables() {
  try {
    console.log('Starting to drop tables...');
    await client.query(/*sql*/`
      DROP TABLE IF EXISTS posts;
      DROP TABLE IF EXISTS users;
    `);
    console.log('Finished dropping tables!');
  } catch (error) {
    console.error('Error dropping tables!');
    throw error;
  };
};

async function createTables() {
  try {
    console.log('Starting to build tables...');
    await client.query(/*sql*/`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,      
        location VARCHAR(255) NOT NULL,
        active BOOLEAN DEFAULT true
      );
      CREATE TABLE posts (
        id SERIAL PRIMARY KEY,
        "authorId" INTEGER REFERENCES users(id) NOT NULL,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        active BOOLEAN DEFAULT true
      );
    `);
    console.log('Finished building tables!');
  } catch (error) {
    console.error('Error building tables!');
    throw error;
  };
};

async function createInitialUsers() {
  try {
    console.log("Starting to create users...");
    const albert = await createUser(
      {
        id: 1,
        name: 'albert',
        username: 'Al Bert',
        password: 'bertie99',
        location: 'Sidney, Australia',
        active: true
      }
    );
    const sandra = await createUser(
      {
        id: 2,
        name: 'sandra',
        username: 'Just Sandra',
        password: '2sandy4me',
        location: "Ain't tellin'",
        active: true
      }
    );
    const glamgal = await createUser(
      {
        id: 3,
        name: 'glamgal',
        username: 'Joshua',
        password: 'soglam',
        location: 'Upper East Side',
        active: true
      }
    );
    // console.log(albert, sandra, glamgal);
    console.log("Finished creating users!");
  } catch(error) {
    console.error("Error creating users!");
    throw error;
  };
};

async function createInitialPosts() {
  try {
    console.log("Starting to create posts...");
    const [ albert, sandra, glamgal ] = await getAllUsers();
    await createPost(
      {
        authorId: albert.id,
        title: "First Post",
        content: "This is my first post. I hope I love writing blogs as much as I love writing them.",
        active: true
      }
    );
    await createPost(
      {
        authorId: sandra.id,
        title: "First Post",
        content: "This is my first post. I hope I love writing blogs as much as I love writing them.",
        active: true
      }
    );
    await createPost(
      {
        authorId: glamgal.id,
        title: "First Post",
        content: "This is my first post. I hope I love writing blogs as much as I love writing them.",
        active: true
      }
    );
    console.log("Finished creating posts!");
  } catch (error) {
    throw error;
  };
};

async function rebuildDB() {
  try {
    client.connect();
    await dropTables();
    await createTables();
    await createInitialUsers();
    await createInitialPosts();
  } catch (error) {
    console.error(error);
  };
};

async function testDB() {
  try {
    console.log("Starting to test database...");
    const users = await getAllUsers();
    const posts = await getAllPosts();
    console.log("getAllUsers:", users);
    console.log("getAllPosts", posts);
    // console.log("Calling updateUser on users[0]")
    // const updateUserResult = await updateUser(users[0].id,
    //   {
    //     name: "Newname Sogood",
    //     location: "Lesterville, KY"
    //   }
    // );
    // console.log("Result:", updateUserResult);
    console.log("Finished database tests!");
  } catch (error) {
    console.error("Error testing database!");
    console.error(error);
  };
};

rebuildDB()
  .then(testDB)
  .catch(console.error)
  .finally(() => client.end());