const express = require('express');
const tagsRouter = express.Router();
const { getAllTags, getPostsByTagName } = require('../db');


tagsRouter.use((req, res, next) => {
  console.log("A request is being made to /tags!");
  next();
});

tagsRouter.get('/', async (req, res) => {
  const tags = await getAllTags();
  res.send({
    tags
  });
});

// tagsRouter.get('/:tagName/posts', async (req, res, next) => {
//   const { tagName } = req.params;
//   try {
//     const tagPosts = await getPostsByTagName(tagName);
//     res.send({ posts: tagPosts });
//   } catch ({ name, message }) {
//     next({ name, message });
//   };
// });

tagsRouter.get('/:tagName/posts', async (req, res, next) => {
  const { tagName } = req.params;
  try {
    const allTagPosts = await getPostsByTagName(tagName);
    console.log(allTagPosts[0].author.id);
    const tagPosts = allTagPosts.filter((post) => {
      return post.active || (req.user && post.author.Id === req.user.id);
    });
    res.send(
      { 
        posts: tagPosts 
      }
    );
  } catch ({ name, message }) {
    next({ name, message });
  };
});

module.exports = tagsRouter;
