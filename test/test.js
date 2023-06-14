const generateCategoryPages = require('../eleventy-generate-category-pages.js');

console.log('Starting test...');

generateCategoryPages(
  {
    dataFileName: 'categories.json',
    // dataFolder: 'src/_data',
    // outputFolder: 'src/categories',
    postsFolder: 'src/posts',
    templateFileName: '11ty-cat-page.liquid'
  },
  true,
  false
);
