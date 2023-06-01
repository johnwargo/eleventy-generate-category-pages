import { generateCatPages } from "../eleventy-generate-category-pages.js";

console.log('Starting test...');

generateCatPages(
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
