// 讀取 file path 參考 https://stackoverflow.com/questions/25460574/find-files-by-extension-html-under-a-folder-in-nodejs
// 讀取 file body 參考 https://dev.to/aminnairi/read-files-using-promises-in-node-js-1mg6

import { of, from } from "rxjs";
import { switchMap, tap } from "rxjs/operators";
import * as path from 'path';
import * as fs from 'fs';

/**
 * 取得目錄內的所有 Dockerfile path
 */
function getAllDockerFilePath(projectsPath) {
    // 驗證路徑是否存在
    const validPath = fs.existsSync(projectsPath);
    if (!validPath){
        console.log(`路徑不存在: ${projectsPath}`);
        return;
    }
    // 所有專案資料夾名稱 
    const allProjectDirectoryName = fs.readdirSync(projectsPath);
    // 組合 Docker file path 
    const allDockerFilePath = allProjectDirectoryName.map(projectDirectoryName =>
        path.join(projectsPath, projectDirectoryName, 'Dockerfile')
    )
    return of(allDockerFilePath);
};

/**
 * 讀取目錄內的所有 Dockerfile 內容
 */
function readAllDockerFileContent(allDockerFilePath) {
    const {promises: {readFile}} = fs;
    const readPromiseList = allDockerFilePath.map(filePath => readFile(filePath));
    return from(Promise.all(readPromiseList).then(allFileContent => {
        return allFileContent.map((content, index) => {
            const fileContent = content.toString();
            const filePath = allDockerFilePath[index];
            return { fileContent, filePath };
        });
    }));
}

const projectsPath = './angular';
of(projectsPath).pipe(
    switchMap(projectsPath => getAllDockerFilePath(projectsPath)),
    switchMap(allDockerFilePath => readAllDockerFileContent(allDockerFilePath)),
).subscribe(res => console.log(res[2].filePath));