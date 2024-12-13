import fs from 'fs';
import path from 'path';

export function getFileInfo(filePath) {
  return {
    fileName: path.basename(filePath),
    fileSize: fs.statSync(filePath).size,
    fullPath: filePath
  };
}

export function validateFilePath(input) {
  return fs.existsSync(input) || 'File does not exist';
}