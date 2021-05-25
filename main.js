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

function getOsPackageList(infoList) {
    const allPackge = infoList.flatMap(({fileContent}) => 
        fileContent.split('# os package')[1].split('\n').filter(s => !!s)
    );
    const packgeList = [... new Set(allPackge)];
    return packgeList;
}

function getBaseImage(infoList) {
    const [firstInfo] = infoList;
    const {fileContent} = firstInfo;
    const baseImage = fileContent.split('\n').find(c => c.includes('FROM'));
    return baseImage;
}

function generateCoreImage(packageList, baseImage) {
    const packageContent = packageList.reduce((res, content) => res + content + '\n', '');
    return `# Core image\n${baseImage}\n# os package\n${packageContent}`
}

function WALE() {
    const projectsPath = './angular';
    of(projectsPath).pipe(
        switchMap(projectsPath => getAllDockerFilePath(projectsPath)),
        switchMap(allePath => getAllDockerFileInfo(allePath)),
        switchMap(infoList => {
            const packageList = getOsPackageList(infoList);
            const baseImage = getBaseImage(infoList);
            const coreImageFileContent = generateCoreImage(packageList, baseImage);
            return of(coreImageFileContent)
        })
    ).subscribe(res => console.log(res));
}

WALE();