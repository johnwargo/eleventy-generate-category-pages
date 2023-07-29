export type ConfigObject = {
  categoriesFolder?: string;
  dataFileName?: string;
  dataFolder?: string;
  postExtensions?: string[];
  postsFolder?: string;  
  templateFileName?: string;
  debugMode?: boolean;
  quitOnError?: boolean;
  imageProperties?: boolean;
}

export type CategoryRecord = {
  category: string;
  count: number;
  description: string;
  imageFilePath?: string;
  imageAltText?: string;
  imageAttribution?: string;
}

export type ConfigValidation = {
  filePath: string;
  isFolder: boolean;
}

export type ProcessResult = {
  result: boolean;
  message: string;
}
