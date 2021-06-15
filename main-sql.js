import * as mysql from 'mysql';
import * as mssql from 'mssql';
import * as tedious from 'tedious';
import { of, from, identity } from "rxjs";
import { delay, map, switchMap, tap } from "rxjs/operators";
import moment from 'moment'

 
// mysqlConnection.connect();

export function insertDataByMySQL(path, command) {
    const mysqlConnection = mysql.createConnection({
        host     : 'localhost',
        user     : 'root',
        password : '',
        database : 'wale'
    });
    return from(
        new Promise((resolve, reject) => {
            const sql = 'INSERT INTO `os-package`(`appPath`, `packageCommand`) VALUES ' + `('${path}', '${command}')`
            mysqlConnection.query(sql, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        })
    );
}

export function selectAllByMySQL() {
    const mysqlConnection = mysql.createConnection({
        host     : 'localhost',
        user     : 'root',
        password : '',
        database : 'wale'
    });
    return from(
        new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM `os-package`';
            mysqlConnection.query(sql, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        })
    );
}

export function selectAllByMsSQL() {
    var config={
        user:'peng',
        password:'1234',
        server:'localhost\\SQLEXPRESS',
        database:'wale',
        trustServerCertificate: true
     };
    return from(
        new Promise((resolve, reject) => {
            mssql.default.connect(config,function (err) {
                if(err) reject(err);
                mssql.default.query(`SELECT *FROM [wale].[dbo].[os-package] ORDER BY id ASC`).then(res => {
                    resolve(res.recordset);
                })
            });
        })
    );
}

export function insertDataByMsSQL(data) {
    console.log(data);
    var config={
        user:'peng',
        password:'1234',
        server:'localhost\\SQLEXPRESS',
        database:'wale',
        trustServerCertificate: true
     };
    return from(
        new Promise((resolve, reject) => {
            mssql.default.connect(config,function (err) {
                if(err) reject(err);
                const sql = `
                INSERT INTO [dbo].[os-package]
                           ([id]
                           ,[appPath]
                           ,[packageCommand]
                           ,[createBy]
                           ,[createTime])
                     VALUES
                           (${data.id}
                           ,'${data.appPath}'
                           ,'${data.packageCommand}'
                           ,'${data.createBy}'
                           ,'${moment(data.createTime).format('YYYY-MM-DDTHH:MM:SS')}')
                `
                mssql.default.query(sql).then(res => {
                    resolve(res.recordset);
                })
            });
        })
    );
}

// insertData('test', 'test').subscribe()
// selectAllByMySQL().subscribe(res => console.log(res))
// selectAllByMsSQL().subscribe(res => console.log(res))
// insertDataByMsSQL({
//     id: 2,
//     appPath: 'E',
//     packageCommand: 'RUN apt-get update',
//     createBy: 'Peng',
//     createTime: '2021-06-13 21:11:31'
// });

// https://ithelp.ithome.com.tw/articles/10186139
// https://chshman310222.pixnet.net/blog/post/143899584-%5B%E8%B3%87%E6%96%99%E5%BA%AB%5D-sql-server-browser%E6%9C%8D%E5%8B%99%E7%84%A1%E6%B3%95%E5%95%9F%E7%94%A8%E8%A7%A3%E6%B1%BA
// https://holeycc.blogspot.com/2016/05/sql-server-remote-connections.html
