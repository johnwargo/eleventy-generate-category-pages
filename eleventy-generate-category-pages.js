"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCategoryPages = void 0;
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const cli_logger_1 = __importDefault(require("cli-logger"));
const yaml_1 = __importDefault(require("yaml"));
const UNCATEGORIZED_STRING = 'Uncategorized';
const YAML_PATTERN = /---[\r\n].*?[\r\n]---/s;
var conf = { console: true, level: cli_logger_1.default.INFO };
conf.prefix = function (record) {
    return '[Eleventy-Generate-Category-Pages]';
};
var log = (0, cli_logger_1.default)(conf);
var fileList = [];
var templateExtension;
function _compareFunction(a, b) {
    if (a.category < b.category) {
        return -1;
    }
    if (a.category > b.category) {
        return 1;
    }
    return 0;
}
async function _validateConfig(validations) {
    var processResult;
    processResult = {
        result: true, message: 'Configuration file errors:\n'
    };
    for (var validation of validations) {
        log.debug(`Validating '${validation.filePath}'`);
        if (validation.isFolder) {
            if (!_directoryExists(validation.filePath)) {
                processResult.result = false;
                processResult.message += `\nThe '${validation.filePath}' folder is required, but does not exist.`;
            }
        }
        else {
            if (!fs_extra_1.default.existsSync(validation.filePath)) {
                processResult.result = false;
                processResult.message += `\nThe '${validation.filePath}' file is required, but does not exist.`;
            }
        }
    }
    return processResult;
}
function _getAllFiles(dirPath, arrayOfFiles) {
    var files = fs_extra_1.default.readdirSync(dirPath);
    arrayOfFiles = arrayOfFiles || [];
    files.forEach(function (file) {
        if (fs_extra_1.default.statSync(dirPath + "/" + file).isDirectory()) {
            arrayOfFiles = _getAllFiles(dirPath + "/" + file, arrayOfFiles);
        }
        else {
            arrayOfFiles.push(path_1.default.join(process.cwd(), dirPath, file));
        }
    });
    return arrayOfFiles;
}
function _getFileList(filePath, debugMode) {
    log.info('Building file list...');
    log.debug(`filePath: ${filePath}`);
    return _getAllFiles(filePath, []);
}
function _buildCategoryList(categories, fileList, postExtensions, debugMode, imageProperties = false) {
    var categoriesString;
    log.info('Building category list...');
    for (var fileName of fileList) {
        log.debug(`Parsing ${fileName}`);
        let fileExt = path_1.default.extname(fileName.toString()).toLocaleLowerCase();
        if (postExtensions.includes(fileExt)) {
            var postFile = fs_extra_1.default.readFileSync(fileName.toString(), 'utf8');
            var YAMLDoc = yaml_1.default.parseAllDocuments(postFile, { logLevel: 'silent' });
            var content = YAMLDoc[0].toJSON();
            if (debugMode)
                console.dir(content);
            if (content.categories) {
                if (content.categories.length > 0) {
                    categoriesString = content.categories.toString();
                }
                else {
                    categoriesString = UNCATEGORIZED_STRING;
                }
            }
            else {
                categoriesString = UNCATEGORIZED_STRING;
            }
            var catArray = categoriesString.split(',');
            for (var cat of catArray) {
                var category = cat.trim();
                var index = categories.findIndex((item) => item.category === category);
                if (index < 0) {
                    log.info(`Found category: ${category}`);
                    if (imageProperties) {
                        categories.push({ category: category, count: 1, description: '', imageFilePath: '', imageAltText: '', imageAttribution: '' });
                    }
                    else {
                        categories.push({ category: category, count: 1, description: '' });
                    }
                }
                else {
                    categories[index].count++;
                }
            }
        }
        else {
            log.debug(`Skipping ${fileName}`);
        }
    }
    return categories;
}
function _directoryExists(filePath) {
    if (fs_extra_1.default.existsSync(filePath)) {
        try {
            return fs_extra_1.default.lstatSync(filePath).isDirectory();
        }
        catch (err) {
            log.error(`checkDirectory error: ${err}`);
            return false;
        }
    }
    return false;
}
function generateCategoryPages(options = {}) {
    const configDefaults = {
        categoriesFolder: 'src/categories',
        dataFileName: 'category-meta.json',
        dataFolder: 'src/_data',
        postExtensions: ['.md', '.njk'],
        postsFolder: 'src/posts',
        templateFileName: '11ty-cat-pages.liquid',
        quitOnError: false,
        debugMode: false,
        imageProperties: false
    };
    const config = Object.assign({}, configDefaults, options);
    const debugMode = options.debugMode || false;
    log.level(debugMode ? log.DEBUG : log.INFO);
    log.debug('Debug mode enabled\n');
    if (debugMode)
        console.dir(config);
    const validations = [
        { filePath: config.categoriesFolder, isFolder: true },
        { filePath: config.dataFolder, isFolder: true },
        { filePath: config.postsFolder, isFolder: true },
        { filePath: config.templateFileName, isFolder: false }
    ];
    _validateConfig(validations)
        .then((res) => {
        if (res.result) {
            log.debug(`Reading template file ${config.templateFileName}`);
            let templateFile = fs_extra_1.default.readFileSync(config.templateFileName, 'utf8');
            let templateDoc = yaml_1.default.parseAllDocuments(templateFile, { logLevel: 'silent' });
            let frontmatter = JSON.parse(JSON.stringify(templateDoc))[0];
            if (debugMode)
                console.dir(frontmatter);
            if (!frontmatter.pagination) {
                log.error('The template file does not contain the pagination frontmatter');
                if (options.quitOnError)
                    process.exit(1);
            }
            templateExtension = path_1.default.extname(config.templateFileName);
            let categories = [];
            let categoriesFile = path_1.default.join(process.cwd(), config.dataFolder, config.dataFileName);
            if (fs_extra_1.default.existsSync(categoriesFile)) {
                log.debug(`Reading existing categories file ${categoriesFile}`);
                let categoryData = fs_extra_1.default.readFileSync(categoriesFile, 'utf8');
                categories = JSON.parse(categoryData);
                if (categories.length > 0)
                    categories.forEach((item) => item.count = 0);
                if (debugMode)
                    console.table(categories);
            }
            else {
                log.info('Category data file not found, creating...');
            }
            fileList = _getFileList(config.postsFolder, debugMode);
            if (fileList.length < 1) {
                log.error('\nNo Post files found in the project, exiting');
                process.exit(0);
            }
            log.info(`Processing ${fileList.length} files`);
            if (debugMode)
                console.dir(fileList);
            categories = _buildCategoryList(categories, fileList, config.postExtensions, debugMode, config.imageProperties);
            if (categories.length > 0) {
                log.debug('Deleting unused categories (from previous runs)');
                categories = categories.filter((item) => item.count > 0);
            }
            log.info(`Identified ${categories.length} categories`);
            categories = categories.sort(_compareFunction);
            if (debugMode)
                console.table(categories);
            log.info(`Writing categories to ${categoriesFile}`);
            try {
                fs_extra_1.default.writeFileSync(categoriesFile, JSON.stringify(categories, null, 2), 'utf8');
            }
            catch (err) {
                console.log('Error writing file');
                console.error(err);
                if (options.quitOnError)
                    process.exit(1);
            }
            const categoriesFolder = path_1.default.join(process.cwd(), config.categoriesFolder);
            log.debug(`Emptying categories folder: ${categoriesFolder}`);
            fs_extra_1.default.emptyDirSync(categoriesFolder);
            categories.forEach(function (item) {
                if (item.category === "")
                    return;
                log.debug(`Processing category: ${item.category}`);
                let pos1 = templateFile.search(YAML_PATTERN);
                if (pos1 > -1) {
                    frontmatter.category = item.category;
                    frontmatter.description = item.description ? item.description : '';
                    if (item.category == UNCATEGORIZED_STRING) {
                        frontmatter.pagination.before = `function(paginationData, fullData){ let data = paginationData.filter((item) => !item.data.categories || item.data.categories.length == 0); return Array.from(data).sort((a, b) => { return a.date < b.date ? 1 : -1; });}`;
                    }
                    else {
                        frontmatter.pagination.before = `function(paginationData, fullData){ let data = paginationData.filter((item) => item.data.categories && item.data.categories.includes('${item.category}')); return Array.from(data).sort((a, b) => { return a.date < b.date ? 1 : -1; });}`;
                    }
                    let tmpFrontmatter = JSON.stringify(frontmatter, null, 2);
                    tmpFrontmatter = tmpFrontmatter.replace(`"${frontmatter.pagination.before}"`, frontmatter.pagination.before);
                    tmpFrontmatter = `---js\n${tmpFrontmatter}\n---`;
                    let newFrontmatter = templateFile.replace(YAML_PATTERN, tmpFrontmatter);
                    let outputFileName = path_1.default.join(categoriesFolder, item.category.replace(/\s+/g, '-').toLowerCase() + templateExtension);
                    log.debug(`Writing category page: ${outputFileName}`);
                    fs_extra_1.default.writeFileSync(outputFileName, newFrontmatter);
                }
                else {
                    log.error('Unable to match frontmatter in template file');
                    if (options.quitOnError)
                        process.exit(1);
                }
            });
        }
        else {
            log.error(res.message);
            if (options.quitOnError)
                process.exit(1);
        }
        log.info('Finished writing category documents');
    })
        .catch((err) => {
        log.error(err);
        if (options.quitOnError)
            process.exit(1);
    });
}
exports.generateCategoryPages = generateCategoryPages;
exports.default = generateCategoryPages;
if (typeof module !== "undefined") {
    try {
        module.exports = generateCategoryPages;
        Object.defineProperty(generateCategoryPages, "__esModule", { value: true });
        generateCategoryPages.default = generateCategoryPages;
        generateCategoryPages.generateCategoryPages = generateCategoryPages;
    }
    catch (e) { }
}
