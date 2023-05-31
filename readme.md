# Eleventy Generate Category Pages

Generates individual category pages (with pagination) for an Eleventy site. Runs as a JavaScript module executed in the Eleventy `before` event. The module helps developers implement a categories page with descriptions plus separate paginated pages for each category.

The module: 

1. Recursively reads all the posts in a specified directory 
2. Generates a global data file containing a JSON object representing the list of categories with the following properties:
    * Category Name
    * Description
    * Post count (for the category)
3. Using a provided template document as a guide, creates a separate content file for each category's content

What this allows you to do is:

1. Create a categories page for your site that lists all of your site's categories in alphabetical order with:
    * A link to the generated category page
    * A description for the category
    * The number of posts in the category
2. Create a separate page for each category with pagination of the articles in the category

## Background

Eleventy (today) doesn't allow you to generate nested pages with pagination at both levels (parent (categories) and child (category) for example). If you want to have a categories page with a paginated list of the posts within the category you have to either manually create separate files for your category pages manually or hack something together programmatically to do it for you. This module does the latter through a simple command-line command, a configuration file, and category page template.

## Installation

To install the module in an Eleventy project, open a terminal window or command prompt, navigate to the Eleventy project, and execute the following command:

```shell
npm install eleventy-generate-category-pages
```

## Usage

To use this module, you must configure the project with the files it needs to operate; once that's in place, you simply execute the command every time you add a new category to your site and you're all set.

### Create the Template File

Every site will have different content for the category pages, so its up to you to create the template file used by the module. Create the file any way you want using whatever template language you're comfortable with. The general format of the file is:

1. YAML Front matter specifying the layout, pagination, permalink, and so on required for the page.
2. Content describing the page
3. The template code required to render the paginated post list on the page (including previous and next buttons)

Here's an example from [johnwargo.com](https://johnwargo.com):

**File: 11ty-cat-pages.liquid**
```liquid
---
layout: generic
pagination:
  data: collections.post
  size: 20
  alias: catposts
category: 
description: 
eleventyComputed:
  title: "Category: {{ category }}"
permalink: "categories/{{ category | slugify }}/{% if pagination.pageNumber != 0 %}page-{{ pagination.pageNumber }}/{% endif %}"
---

{% include 'pagination-count.html' %}

{{ description }}

<p>This page lists all posts in the category, in reverse chronological order.</p>

<ul class="posts">
  {% for post in catposts %}
    <li>
      <h4>
        <a href="{{post.url}}" style="cursor: pointer">{{ post.data.title }}</a>
      </h4>
      Posted {{ post.date | readableDate }}
      {% if post.data.categories.length > 0 %}
        in
        {% for cat in post.data.categories %}
          <a href="/categories/{{ cat | slugify }}">{{ cat }}</a>
          {%- unless forloop.last %},
          {% endunless %}
        {% endfor %}
      {% endif %}
      <br/>
      {% if post.data.description %}
        {{ post.data.description }}
      {% else %}
        {% excerpt post %}
      {% endif %}
    </li>
  {% endfor %}
</ul>

{% include 'pagination-nav.html' %}
```

> **Note:** The template file front matter must be in YAML format; the module does not understand any other format. 

When you generate category data for your site, the module, for each category, converts the template into a category page that looks like this:

```liquid
---js
{
  "layout": "generic",
  "pagination": {
    "data": "collections.post",
    "size": 20,
    "alias": "catposts",
    "before": function(paginationData, fullData){ return paginationData.filter((item) => item.data.categories.includes('Miscellaneous'));}
  },
  "category": "Miscellaneous",
  "eleventyComputed": {
    "title": "Category: {{ category }}"
  },
  "permalink": "categories/{{ category | slugify }}/{% if pagination.pageNumber != 0 %}page-{{ pagination.pageNumber }}/{% endif %}"
}
---

{% include 'pagination-count.html' %}

{{ description }}

<p>This page lists all posts in the category, in reverse chronological order.</p>

<ul class="posts">
  {% for post in catposts %}
    <li>
      <h4>
        <a href="{{post.url}}" style="cursor: pointer">{{ post.data.title }}</a>
      </h4>
      Posted {{ post.date | readableDate }}
      {% if post.data.categories.length > 0 %}
        in
        {% for cat in post.data.categories %}
          <a href="/categories/{{ cat | slugify }}">{{ cat }}</a>
          {%- unless forloop.last %},
          {% endunless %}
        {% endfor %}
      {% endif %}
      <br/>
      {% if post.data.description %}
        {{ post.data.description }}
      {% else %}
        {% excerpt post %}
      {% endif %}
    </li>
  {% endfor %}
</ul>

{% include 'pagination-nav.html' %}
```

The first thing you'll likely notice is that the module converted the front matter from YAML to JSON format. It did this because the ability to have separate paginated pages requires filtering on the fly to only generate pages for the selected category. The module does this using the Eleventy Pagination `before` callback function. 

The `before` callback allows you to programmatically control the posts included in the pagination data set. The template's front matter must be in JSON format for the Eleventy processing tools to execute the `before` function.

In this example, the module generated the following function which is called before Eleventy starts generating the pagination pages: 

```js
function(paginationData, fullData){ 
  return paginationData.filter((item) => item.data.categories.includes('Miscellaneous'));
}
```

The function essentially returns all of the posts filtered by the category name (which in this case is 'Miscellaneous').

**Note:** I could have used a filter function in the project's `eleventy.config.js` file, but that would have added an additional dependency to make this work. Using the `before` callback eliminates the need to make any changes to the `eleventy.config.js` file.

Add an event handler for the Eleventy before event





The options for this configuration file are described below:

| Property           | Description                                   |
| ------------------ | --------------------------------------------- |
| `categoriesFolder`   | The project source folder where the module places the individual category pages. For navigation simplicity, the module defaults to `categories`. |
| `dataFileName`     | The name of the global data file generated by the module. defaults to `category-meta.json`. |
| `dataFolder`       | The project source folder for global data files. Defaults to `src/_data`. Update this value if you use a different structure for your Eleventy projects. |
| `postsFolder`      | The project source folder for post files. Defaults to `src/posts`. Update this value if you use a different structure for your Eleventy projects. |
| `templateFileName` | The file name of the category template file used to generate category pages. |


Execute an Eleventy build

Now, looking in the project folder, you should now see:

1. The global data file (`category-meta.json` in this example) in the project's `src/_data` folder.
2. A separate file for each category in the `src/category` folder

As shown in the following screenshot:

![Project Folder](https://github.com/johnwargo/11ty-cat-pages/blob/main/images/figure-01.png)

If you look in your project's `src/_data/category-meta.json` file, you should see the categories data file as shown below:

```json
[
  {
    "category": "Cats",
    "count": 1,
    "description": ""
  },
  {
    "category": "Dogs",
    "count": 42,
    "description": ""
  },
  {
    "category": "Turtles",
    "count": 8,
    "description": ""
  }  
]
```

As you can see, the description property is blank for each category. You can edit the file, adding descriptions for each of the categories, your edits won't be overwritten by the module unless you remove all of the posts for the particular category and run the module again.

If you add a new category to the site and re-run the module, the new category appears in the file alongside the existing data:

```json
[
  {
    "category": "Cats",
    "count": 1,
    "description": "Strip steak alcatra filet mignon drumstick, doner ham sausage."
  },
  {
    "category": "Dogs",
    "count": 42,
    "description": "Short loin andouille leberkas ball tip, pork belly pork jowl ham flank turducken meatball brisket beef prosciutto boudin."
  },
  {
    "category": "Ferrets",
    "count": 1,
    "description": ""
  },
  {
    "category": "Turtles",
    "count": 8,
    "description": "Short ribs jowl ground round spare ribs swine tenderloin."
  }  
]
```

**Note:** Descriptions provided by the [Bacon Ipsum Generator](https://baconipsum.com/).

When you open one of the files in the `src/category` folder, you should see a generated category page as described above, one for each category.

## Example Categories Page

As an extra bonus, here's a sample Categories page you can use in your site:

```liquid
---
title: Categories
layout: generic
---

{% assign categories = category-meta | sort %}

<p>View all posts for a particular category by clicking on one of the categories listed below. There are {{ categories.length }} categories on the site today.</p>

<ul class="posts">
  {% for catData in categories %}
    <li>
      <h4>
        <a href="{{ "/" | htmlBaseUrl }}categories/{{ catData.category | slugify }}/">{{ catData.category }}</a>
      </h4>
      Count: {{ catData.count }} |
      {% if catData.description %}
        {{ catData.description }}
      {% endif %}
    </li>
  {% endfor %}
</ul>
```
### Getting Help Or Making Changes

Use [GitHub Issues](https://github.com/johnwargo/eleventy-generate-category-pages/issues) to get help with this module.

Pull Requests gladly accepted, but only with complete documentation of what the change is, why you made it, and why you think its important to have in the module.

*** 

If this code helps you, please consider buying me a coffee.

<a href="https://www.buymeacoffee.com/johnwargo" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/default-orange.png" alt="Buy Me A Coffee" height="41" width="174"></a>