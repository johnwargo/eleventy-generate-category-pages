// node modules
import fs from 'fs-extra';
import path from 'path';
//@ts-ignore
import logger from 'cli-logger';
import YAML from 'yaml'

import { CategoryRecord, ConfigObject, ConfigValidation, ProcessResult } from './types';

const UNCATEGORIZED_STRING = 'Uncategorized';
const YAML_PATTERN = /---[\r\n].*?[\r\n]---/s


var conf: any = { console: true, level: logger.INFO };
conf.prefix = function (record: any) {
  return '[Eleventy-Generate-Category-Pages]'
}
var log = logger(conf);

var fileList: String[] = [];
var templateExtension: string;

/**************************************
 * Support Functions
 **************************************/

function compareFunction(a: any, b: any) {
  if (a.category < b.category) {
    return -1;
  }
  if (a.category > b.category) {
    return 1;
  }
  return 0;
}

async function validateConfig(validations: ConfigValidation[]): Promise<ProcessResult> {

  var processResult: ProcessResult;

  processResult = {
    result: true, message: 'Configuration file errors:\n'
  };

  for (var validation of validations) {
    log.debug(`Validating '${validation.filePath}'`);
    if (validation.isFolder) {
      if (!directoryExists(validation.filePath)) {
        processResult.result = false;
        processResult.message += `\nThe '${validation.filePath}' folder is required, but does not exist.`;
      }
    } else {
      if (!fs.existsSync(validation.filePath)) {
        processResult.result = false;
        processResult.message += `\nThe '${validation.filePath}' file is required, but does not exist.`;
      }
    }
  }
  return processResult;
}

function getAllFiles(dirPath: string, arrayOfFiles: string[]) {
  var files = fs.readdirSync(dirPath)
  arrayOfFiles = arrayOfFiles || []
  files.forEach(function (file: string) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles)
    } else {
      arrayOfFiles.push(path.join(process.cwd(), dirPath, file));
    }
  });
  return arrayOfFiles
}

function getFileList(filePath: string, debugMode: boolean): String[] {
  if (debugMode) console.log();
  log.info('Building file list...');
  log.debug(`filePath: ${filePath}`);
  return getAllFiles(filePath, []);
}

function buildCategoryList(
  categories: CategoryRecord[],
  fileList: String[],
  postExtensions: String[],
  debugMode: boolean
): CategoryRecord[] {

  var categoriesString: string;

  if (debugMode) console.log();
  log.info('Building category list...');
  for (var fileName of fileList) {
    log.debug(`Parsing ${fileName}`);
    let fileExt = path.extname(fileName.toString()).toLocaleLowerCase();
    if (postExtensions.includes(fileExt)) {      
      // Read the post file
      var postFile = fs.readFileSync(fileName.toString(), 'utf8');
      // Get the first YAML block from the file
      var YAMLDoc: any[] = YAML.parseAllDocuments(postFile, { logLevel: 'silent' });
      var content = YAMLDoc[0].toJSON();
      if (debugMode) console.dir(content);
      // Does the post have a category?
      if (content.categories) {
        if (content.categories.length > 0) {
          categoriesString = content.categories.toString();
        } else {
          // handle posts with a blank category
          categoriesString = UNCATEGORIZED_STRING;
        }
      } else {
        // handle posts that don't have a category
        categoriesString = UNCATEGORIZED_STRING;
      }
      // split the category list into an array
      var catArray = categoriesString.split(',');
      // loop through the array
      for (var cat of catArray) {
        var category = cat.trim();  // Remove leading and trailing spaces        
        // Does the category already exist in the list?
        var index = categories.findIndex((item) => item.category === category);
        if (index < 0) {
          log.info(`Found category: ${category}`);
          // add the category to the list
          categories.push({ category: category, count: 1, description: '' });
        } else {
          // increment the count for the category
          categories[index].count++;
        }
      }
    } else {
      log.info(`Skipping ${fileName}`);
    }
  }
  return categories;
}

function directoryExists(filePath: string): boolean {
  if (fs.existsSync(filePath)) {
    try {
      return fs.lstatSync(filePath).isDirectory();
    } catch (err) {
      log.error(`checkDirectory error: ${err}`);
      return false;
    }
  }
  return false;
}

/************************************** 
* Start here!
***************************************/

function generateCategoryPages(options: any, quitOnError: boolean = true, debugMode: boolean = false) {

  const configDefaults: ConfigObject = {
    categoriesFolder: 'src/categories',
    dataFileName: 'category-meta.json',
    dataFolder: 'src/_data',
    postExtensions: ['.md', '.njk'],
    postsFolder: 'src/posts',
    templateFileName: '11ty-cat-pages.liquid'
  };

  // merge the defaults (first) with the provided options (second)
  const config: ConfigObject = Object.assign({}, configDefaults, options);

  // set the logger log level
  log.level(debugMode ? log.DEBUG : log.INFO);
  log.debug('Debug mode enabled\n');
  if (debugMode) console.dir(config);


  // we'll create this file when we write it
  // { filePath: configObject.dataFileName, isFolder: false },
  const validations: ConfigValidation[] = [
    { filePath: config.categoriesFolder, isFolder: true },
    { filePath: config.dataFolder, isFolder: true },
    { filePath: config.postsFolder, isFolder: true },
    { filePath: config.templateFileName, isFolder: false }
  ];

  validateConfig(validations)
    .then((res: ProcessResult) => {
      if (res.result) {
        // read the template file
        log.info(`Reading template file ${config.templateFileName}`);
        let templateFile = fs.readFileSync(config.templateFileName, 'utf8');
        // get the YAML frontmatter
        let templateDoc = YAML.parseAllDocuments(templateFile, { logLevel: 'silent' });
        // convert the YAML frontmatter to a JSON object
        let frontmatter = JSON.parse(JSON.stringify(templateDoc))[0];
        // at this point we have the frontmatter as a JSON object
        if (debugMode) console.dir(frontmatter);
        if (!frontmatter.pagination) {
          log.error('The template file does not contain the pagination frontmatter');
          if (quitOnError) process.exit(1);
        }

        // get the file extension for the template file, we'll use it later
        templateExtension = path.extname(config.templateFileName);

        let categories: CategoryRecord[] = [];
        // Read the existing categories file
        let categoriesFile = path.join(process.cwd(), config.dataFolder, config.dataFileName);
        if (fs.existsSync(categoriesFile)) {
          log.info(`Reading existing categories file ${categoriesFile}`);
          let categoryData = fs.readFileSync(categoriesFile, 'utf8');
          categories = JSON.parse(categoryData);
          // zero out all of the categories
          if (categories.length > 0) categories.forEach((item) => item.count = 0);
          if (debugMode) console.table(categories);
        } else {
          log.info('Category data file not found, will create a new one');
        }

        fileList = getFileList(config.postsFolder, debugMode);
        if (fileList.length < 1) {
          log.error('\nNo Post files found in the project, exiting');
          process.exit(0);
        }

        log.info(`Located ${fileList.length} files`);
        if (debugMode) console.dir(fileList);

        // build the categories list
        categories = buildCategoryList(categories, fileList, config.postExtensions, debugMode);
        // do we have any categories?
        if (categories.length > 0) {
          // Delete any with a count of 0
          log.info('Deleting unused categories (from previous runs)');
          categories = categories.filter((item) => item.count > 0);
        }
        log.info(`Identified ${categories.length} categories`);
        categories = categories.sort(compareFunction);
        if (debugMode) console.table(categories);

        log.info(`Writing categories list to ${categoriesFile}`);
        try {
          fs.writeFileSync(categoriesFile, JSON.stringify(categories, null, 2), 'utf8');
        } catch (err) {
          console.log('Error writing file');
          console.error(err)
          if (quitOnError) process.exit(1);
        }

        // empty the categories folder, just in case there are old categories there
        const categoriesFolder = path.join(process.cwd(), config.categoriesFolder);
        log.debug(`Emptying categories folder: ${categoriesFolder}`);
        fs.emptyDirSync(categoriesFolder);

        // create separate pages for each category
        categories.forEach(function (item) {
          // why would this ever happen?
          if (item.category === "")
            return;

          log.debug(`\nProcessing category: ${item.category}`);
          let pos1 = templateFile.search(YAML_PATTERN);
          if (pos1 > -1) {
            // We have a match for the YAML frontmatter (which makes sense)
            // replace the category field in the frontmatter
            frontmatter.category = item.category;
            if (item.description) frontmatter.description = item.description;
            if (item.category == UNCATEGORIZED_STRING) {
              // deal with uncategorized posts differently, categories field is blank
              frontmatter.pagination.before = `function(paginationData, fullData){ let data = paginationData.filter((item) => item.data.categories.length == 0); return Array.from(data).sort((a, b) => { return a.date < b.date ? 1 : -1; });}`
              //  frontmatter.pagination.before = `function(paginationData, fullData){ return paginationData.filter((item) => item.data.categories.length == 0);
              // }`
            } else {
              frontmatter.pagination.before = `function(paginationData, fullData){ let data = paginationData.filter((item) => item.data.categories.includes('${item.category}')); return Array.from(data).sort((a, b) => { return a.date < b.date ? 1 : -1; });}`
            }

            // convert the frontmatter to JSON format
            let tmpFrontmatter: string = JSON.stringify(frontmatter, null, 2);
            // Remove quotes around the `before` callback function
            tmpFrontmatter = tmpFrontmatter.replace(
              `"${frontmatter.pagination.before}"`,
              frontmatter.pagination.before
            );
            // add the JSON frontmatter delimiters
            tmpFrontmatter = `---js\n${tmpFrontmatter}\n---`;
            // replace the content in the file 
            let newFrontmatter = templateFile.replace(YAML_PATTERN, tmpFrontmatter);
            // build the output file name
            // https://stackoverflow.com/questions/1983648/replace-spaces-with-dashes-and-make-all-letters-lower-case
            // str = str.replace(/\s+/g, '-').toLowerCase();
            // let outputFileName: string = path.join(
            //   categoriesFolder,
            //   item.category.toLowerCase().replaceAll(' ', '-') + templateExtension
            // );
            let outputFileName: string = path.join(
              categoriesFolder,
              item.category.replace(/\s+/g, '-').toLowerCase() + templateExtension
            );
            log.info(`Writing category page: ${outputFileName}`);
            fs.writeFileSync(outputFileName, newFrontmatter);
          } else {
            log.error('Unable to match frontmatter in template file');
            if (quitOnError) process.exit(1);
          }
        });
      } else {
        log.error(res.message);
        if (quitOnError) process.exit(1);
      }
    })
    .catch((err) => {
      log.error(err);
      if (quitOnError) process.exit(1);
    });
}

export default generateCategoryPages;
export { generateCategoryPages as generateCategoryPages };

// https://www.npmjs.com/package/outdent?activeTab=code
// In CommonJS environments, enable `var outdent = require('outdent');` by
// replacing the exports object.
// Make sure that our replacement includes the named exports from above.
declare var module: any;
if (typeof module !== "undefined") {
  // In webpack harmony-modules environments, module.exports is read-only,
  // so we fail gracefully.
  try {
    module.exports = generateCategoryPages;
    Object.defineProperty(generateCategoryPages, "__esModule", { value: true });
    (generateCategoryPages as any).default = generateCategoryPages;
    (generateCategoryPages as any).generateCategoryPages = generateCategoryPages;
  } catch (e) { }
}