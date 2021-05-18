// var glob = require("glob")
//
// // options is optional
// glob("./angular/*Dockerfile", options, function (er, files) {
//     console.log(er);
//     console.log(files);
//     // files is an array of filenames.
//     // If the `nonull` option is set, and nothing
//     // was found, then files is ["**/*.js"]
//     // er is an error object or null.
// })

const testFolder = '../angular/*Dockerfile';
const fs = require('fs');

fs.readFile(testFolder, (err, files) => {
    if (err) {
        console.log(err);
        return;
    }
    files.forEach(file => {
        console.log(file);
    });
});
