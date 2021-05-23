# 第一階段產生dist資料夾
FROM ubuntu:16.04

# 指定預設/工作資料夾
WORKDIR /usr/app

# os 套件
RUN apt-get update
RUN apt-get -y install curl
RUN apt-get -y install nodejs
RUN apt-get install npm -y
RUN ln -s /usr/bin/nodejs /usr/bin/node
RUN npm install n --global

# 指定 node 版本
RUN n 10.13

# 只copy package.json檔案
COPY ./package*.json ./
# 安裝dependencies
RUN npm install

# copy其餘目錄及檔案
COPY ./ ./

COPY src src

# 指定建立build output資料夾，--prod為Production Mode
RUN npm run build --output-path=./dist/frontend --prod


# pull nginx image
#FROM nginx:alpine

## 從第一階段的檔案copy
#COPY --from=builder /usr/app/dist/frontend /usr/share/nginx/html
#
## 覆蓋image裡的設定檔
#COPY ./nginx-custom.conf /etc/nginx/conf.d/default.conf
