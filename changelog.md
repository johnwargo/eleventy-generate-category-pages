# Changelog

## 20230619

The module needs to know what files in the folder are post files (mostly because some sites sore image files in the same folder as posts), so I added a configuration option called `postExtensions` that allows the site to specify the file extensions for post files:

```js
  const configDefaults: ConfigObject = {
    categoriesFolder: 'src/categories',
    dataFileName: 'category-meta.json',
    dataFolder: 'src/_data',
    postExtensions: ['.md', '.njk'],
    postsFolder: 'src/posts',
    templateFileName: '11ty-cat-pages.liquid'
  };
```

## 20230615

Added the module name to all console output:

```text
[Eleventy-Generate-Category-Pages] Reading template file 11ty-cat-page.liquid
[Eleventy-Generate-Category-Pages] Reading existing categories file D:\dev\11ty\eleventy-generate-category-pages\src\_data\categories.json
[Eleventy-Generate-Category-Pages] Building file list...
[Eleventy-Generate-Category-Pages] Located 6 files
[Eleventy-Generate-Category-Pages] Building category list...
[Eleventy-Generate-Category-Pages] Deleting unused categories (from previous runs)
[Eleventy-Generate-Category-Pages] Identified 6 categories
[Eleventy-Generate-Category-Pages] Writing categories list to D:\dev\11ty\eleventy-generate-category-pages\src\_data\categories.json
[Eleventy-Generate-Category-Pages] Writing category page: D:\dev\11ty\eleventy-generate-category-pages\src\categories\cats.liquid
[Eleventy-Generate-Category-Pages] Writing category page: D:\dev\11ty\eleventy-generate-category-pages\src\categories\dog.liquid
[Eleventy-Generate-Category-Pages] Writing category page: D:\dev\11ty\eleventy-generate-category-pages\src\categories\google-app-script.liquid
[Eleventy-Generate-Category-Pages] Writing category page: D:\dev\11ty\eleventy-generate-category-pages\src\categories\iot.liquid
[Eleventy-Generate-Category-Pages] Writing category page: D:\dev\11ty\eleventy-generate-category-pages\src\categories\ionic-framework.liquid
[Eleventy-Generate-Category-Pages] Writing category page: D:\dev\11ty\eleventy-generate-category-pages\src\categories\web-hosting.liquid
```