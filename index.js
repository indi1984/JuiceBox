require('dotenv').config();

const PORT = process.env.PORT;
const express = require('express');
const server = express();
const apiRouter = require('./api');
const volleyball = require('volleyball');
const { client } = require('./db');


client.connect();

server.listen(PORT, () => {
  console.log('The server is up on port:', PORT)
});

server.use(volleyball);
server.use(express.json());

server.use((req, res, next) => {
  console.log("<____Body Logger START____>");
  console.log(req.body);
  console.log("<_____Body Logger END_____>");
  next();
});

server.use('/api', apiRouter);
