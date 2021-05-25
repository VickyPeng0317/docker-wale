// 讀取 file path 參考 https://stackoverflow.com/questions/25460574/find-files-by-extension-html-under-a-folder-in-nodejs
// 讀取 file body 參考 https://dev.to/aminnairi/read-files-using-promises-in-node-js-1mg6

import { of, from } from "rxjs";
import { map, switchMap, tap } from "rxjs/operators";
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
function getAllDockerFileInfo(allDockerFilePath) {
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

/**
 * 取得所有 os 套件
 */
function getOsPackageList(infoList) {
    const allPackge = infoList.flatMap(({fileContent}) => 
        fileContent.split('# os package')[1].split('\n').filter(s => !!s)
    );
    const packgeList = [... new Set(allPackge)];
    return packgeList;
}

/**
 * 取得 Base image
 */
function getBaseImage(infoList) {
    const [firstInfo] = infoList;
    const {fileContent} = firstInfo;
    const baseImage = fileContent.split('\n').find(c => c.includes('FROM'));
    return baseImage;
}

/**
 * 產出 Core image
 */
function generateCoreImage(imagePath, imageName, infoList) {
    // 取得所有 package
    const packageList = getOsPackageList(infoList);
    // Base image 字串
    const baseImage = getBaseImage(infoList);
    // package  套件字串
    const packageContent = packageList.reduce((res, content) => res + content + '\n', '');
    // 組出 Core image content 準備寫檔
    const coreImageContent = `#${imageName}\n${baseImage}\n# os package\n${packageContent}`;
    // 寫檔
    const {promises: {writeFile}} = fs;
    return from(writeFile(imagePath, coreImageContent)).pipe(
        map(() => infoList)
    );
}

/**
 * 論文方法
 */
function WALE() {
    const PROJECTS_PATH = './angular';
    const CORE_IMAGE_PATH = './wale/Dockerfile';
    const CORE_IMAGE_NAME = 'wale-core';
    of(PROJECTS_PATH).pipe(
        switchMap(projectsPath => getAllDockerFilePath(projectsPath)),
        switchMap(allFilePath => getAllDockerFileInfo(allFilePath)),
        switchMap(infoList => generateCoreImage(CORE_IMAGE_PATH, CORE_IMAGE_NAME, infoList))
    ).subscribe(res => console.log(res));
}

WALE();