const sqlite3 = require("sqlite3");
const { commonInit, readJson, writeJson } = require('../common');
const dictColumns = {
    text_data: ["category", "index"],
    race_jikkyo_comment: ["id"],
    race_jikkyo_message: ["id"],
    character_system_text: ["character_id", "voice_id"]
}

const mdbPath = process.argv[2];
if (!mdbPath) {
    console.log("usage: gen-mdb.js <path to master.mdb>");
    return;
}

commonInit();
const db = new sqlite3.Database(mdbPath);

function select(columns, table, field, text) {
    return new Promise((resolve, reject) => {
        db.get(`SELECT ${columns.map(name => `"${name}"`).join(",")} FROM ${table} WHERE ${field} = ?`, text, (err, row) => {
            if (err) {
                reject();
                return;
            }
            resolve(row);
        });
    });
}

const mdbIndex = readJson("../../mdb/index.json");
const translationsDir = "../../../translations/mdb";

async function genDicts() {
    for (const info of mdbIndex) {
        const { table, field, subdir } = info;
        const files = info.files ? Object.keys(info.files) : [info.file];

        const dict = {};
        for (const name of files) {
            const path = `${translationsDir}/${subdir ? info.table + "/" : ""}${name}.json`;
            const columns = dictColumns[table];
            const { text } = readJson(path);

            for (const jpText in text) {
                const enText = text[jpText];
                if (enText == "") continue;

                const row = await select(columns, table, field, jpText);
                if (!row) {
                    console.log(`Warning: ${jpText} not found`);
                    continue;
                }

                const category = row[columns[0]];
                if (columns.length == 2) {
                    const index = row[columns[1]];
                    if (!dict[category]) dict[category] = {};
                    dict[category][index] = enText;
                }
                else {
                    dict[category] = enText;
                }
            }
        }

        writeJson(table + ".json", dict)
    }
}
genDicts();
