// 讀取 file path 參考 https://stackoverflow.com/questions/25460574/find-files-by-extension-html-under-a-folder-in-nodejs
// 讀取 file body 參考 https://dev.to/aminnairi/read-files-using-promises-in-node-js-1mg6

import { of, from } from "rxjs";
import { delay, map, switchMap, tap } from "rxjs/operators";
import * as path from 'path';
import * as fs from 'fs';
import * as util from 'util';
import * as child_process from 'child_process';
import moment from 'moment'
import {selectAllByMsSQL, selectAllByMySQL, insertDataByMySQL, insertDataByMsSQL} from './main-sql.js';

function runCmd(cmd) {
    const exec = util.promisify(child_process.exec);
    return exec(cmd);
}

function getContentByTag(tagName, content) {
    return content.split(`## ${tagName}`)[1];
}

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
            const [ folderPath ] = filePath.split('Dockerfile');
            return { fileContent, filePath, folderPath };
        });
    }));
}

/**
 * 取得所有 os 套件
 */
function getOsPackageList() {
    const isMySql = false;
    const obs = isMySql ? selectAllByMySQL() : selectAllByMsSQL();
    return obs.pipe(
        // tap(row => row.forEach(x => insertDataByMsSQL(x))),
        map(row => row.map(x => x.packageCommand)),
        map(commandList => [... new Set(commandList)]),
        tap(res => console.log(res)),
    );
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
 * 產出 Wale Core image
 */
function generateWaleCoreImage(dockerFilePath, imageName, infoList) {
    // 取得所有 package
    return getOsPackageList().pipe(
        map(packageList => {
            // Base image 字串
            const baseImage = getBaseImage(infoList);
            // package  套件字串
            const packageContent = packageList.reduce((res, content) => res + content + '\n', '');
            // 組出 Core image content 準備寫檔
            const coreImageContent = `#${imageName}\n${baseImage}\n# os package\n${packageContent}`;
            // 寫檔
            const {promises: {writeFile}} = fs;
            return from(writeFile(`${dockerFilePath}/Dockerfile`, coreImageContent));
        }),
        map(() => infoList)
    );
}

/**
 * 產出 Wale App image
 */
function generateWaleAppImage(CORE_IMAGE_NAME, infoList) {
    // 定義產出 app image 方法
    const getAppImageFromCore = (content => {
        const from = `FROM ${CORE_IMAGE_NAME}`
        const workdir = getContentByTag('workdir', content);
        const working = getContentByTag('working', content);
        const newContent = `${from}\n${workdir}\n${working}`;
        return newContent;
    });
    // 加入新欄位到 info list
    const newInfoList = infoList.map(info => {
        const { fileContent, folderPath, filePath } = info;
        const waleDockerFileName = 'WaleDockerfile';
        const waleImagePath = folderPath + waleDockerFileName;
        const waleImageContent = getAppImageFromCore(fileContent);
        // image name
        const pathLevel = filePath.toString().split('\\');
        const projectName = pathLevel[pathLevel.length - 2];
        const waleImageName =  `wale/${projectName}`;
        return {...info, waleImagePath, waleImageContent, waleImageName, waleDockerFileName};
    });
    // 產出檔案 
    const {promises: {writeFile}} = fs;
    const promiseList = newInfoList.map(({ waleImagePath, waleImageContent }) => 
        writeFile(waleImagePath, waleImageContent)
    );
    return from(Promise.all(promiseList)).pipe(
        map(() => newInfoList)
    );
}

/**
 * 論文方法
 */
function WALE() {
    // const PROJECTS_PATH = process.cwd() + '/angular';
    const PROJECTS_PATH = 'E:/nutc-project/angular';
    const CORE_DOCKER_FILE_PATH = process.cwd() + '/wale';
    const CORE_IMAGE_NAME = 'wale/core';
    of(PROJECTS_PATH).pipe(
        switchMap(projectsPath => getAllDockerFilePath(projectsPath)),
        switchMap(allFilePath => getAllDockerFileInfo(allFilePath)),
        switchMap(infoList => generateWaleCoreImage(CORE_DOCKER_FILE_PATH, CORE_IMAGE_NAME, infoList)),
        switchMap(infoList => generateWaleAppImage(CORE_IMAGE_NAME, infoList))
    ).subscribe(infoList => {
        // console.log(infoList);
    });
}

WALE();