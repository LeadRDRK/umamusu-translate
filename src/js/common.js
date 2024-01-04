const fs = require('fs');
const outDir = './out';

exports.commonInit = () => {
    if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir);
    }
}

exports.readJson = (path) => {
    return JSON.parse(fs.readFileSync(path, "utf8"));
}

exports.writeJson = (path, content) => {
    fs.writeFileSync(`${outDir}/${path}`, JSON.stringify(content, null, 4), "utf8");
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
