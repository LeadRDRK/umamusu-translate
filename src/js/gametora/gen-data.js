const fs = require("fs");
const sqlite3 = require("sqlite3");
const mdbPath = process.argv[2];

if (!mdbPath) {
    console.log("usage: gen-data.js <path to master.mdb>");
    return;
}

const db = new sqlite3.Database(mdbPath);

function getTextDataForCategory(category) {
    return new Promise((resolve, reject) => {
        db.all("SELECT text FROM text_data WHERE category = ?", category, (err, rows) => {
            if (err) {
                reject();
                return;
            }
            resolve(rows.map(r => r.text));
        });
    });
}

function writeCsvRows(path, rows) {
    fs.writeFileSync(path, rows.join("\n"), "utf8");
    console.log(path);
}

const categories = {
    skillDesc: 48
};

async function genOrigSkillDesc() {
    const rows = await getTextDataForCategory(categories.skillDesc);
    writeCsvRows("data/skill_desc_orig.csv", rows);
}

genOrigSkillDesc();
