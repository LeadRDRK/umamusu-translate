const fs = require('fs');
const outDir = './out';

exports.readJson = (path) => {
    return JSON.parse(fs.readFileSync(path, "utf8"));
}

exports.writeJson = (path, content) => {
    let fullPath = `${outDir}/${path}`;
    let parentDirs = fullPath.slice(0, fullPath.lastIndexOf("/"));
    fs.mkdirSync(parentDirs, { recursive: true });
    fs.writeFileSync(fullPath, JSON.stringify(content, null, 4), "utf8");
    console.log(path)
}

exports.readCsvRows = (path) => {
    var content = fs.readFileSync(path, "utf8");
    return content.split("\n");
}

exports.writeCsvRows = (path, rows) => {
    fs.writeFileSync(path, rows.join("\n"), "utf8");
    console.log(path);
}

exports.walkDir = function(dir, callback) {
    var files = fs.readdirSync(dir);
    files.forEach(function(file) {
        var path = dir + "/" + file;
        if (fs.statSync(path).isDirectory()) {
            callback({isDirectory: true, path});
            exports.walkDir(path, callback);
        }
        else {
            callback({isDirectory: false, path});
        }
    });
};

exports.replaceLineBreaksWithSpace = function(str) {
    return str.replace(/ *(\n|\\n) */g, " ");
}

exports.removeSizeTags = function(str) {
    return str.replace(/<\/?size(=\d+)?>/g, "");
}
