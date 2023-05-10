const { client, getAllUsers, createUser } = require('./index');

async function dropTables() {
  try {
    console.log('Starting to drop tables...');
    await client.query(/*sql*/`
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
        location VARCHAR(255) NOT NULL,
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
        location: 'Sidney, Australia',
        active: true
      }
    );
    const sandra = await createUser(
      {
        id: 2,
        name: 'sandra',
        username: 'Just Sandra',
        location: "Ain't tellin'",
        active: true
      }
    );
    const glamgal = await createUser(
      {
        id: 3,
        name: 'glamgal',
        username: 'Joshua',
        location: 'Upper East Side',
        active: true
      }
    );
    console.log(albert, sandra, glamgal);
    console.log("Finished creating users!");
  } catch(error) {
    console.error("Error creating users!");
    throw error;
  };
};

async function rebuildDB() {
  try {
    client.connect();
    await dropTables();
    await createTables();
    await createInitialUsers();
  } catch (error) {
    console.error(error);
  };
};

async function testDB() {
  try {
    console.log("Starting to test database...");
    const users = await getAllUsers();
    console.log("getAllUsers:", users);
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