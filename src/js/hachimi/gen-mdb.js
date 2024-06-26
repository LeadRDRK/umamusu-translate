const sqlite3 = require("sqlite3");
const { readJson, writeJson, replaceLineBreaksWithSpace, removeSizeTags } = require('../common');
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

const db = new sqlite3.Database(mdbPath);

function select(columns, table, field, text) {
    return new Promise((resolve, reject) => {
        db.all(`SELECT ${columns.map(name => `"${name}"`).join(",")} FROM ${table} WHERE ${field} = ?`, text, (err, rows) => {
            if (err) {
                reject();
                return;
            }
            resolve(rows);
        });
    });
}

const mdbIndex = readJson("../../mdb/index.json");
const translationsDir = "../../../translations/mdb";
const removeBrFiles = new Set([
    "presents-desc",
    "uma-profile-tagline",
    "uma-secrets",
    "scenario-desc",
    "skill-desc",
    "missions",
    "4koma-titles"
]);

const removeSizeFiles = new Set([
    "skill-desc",
    "missions"
]);

async function genDicts() {
    for (const info of mdbIndex) {
        const { table, field, subdir } = info;
        const files = info.files ? Object.keys(info.files) : [info.file];
        const tableRemoveBr = table == "character_system_text";

        const dict = {};
        for (const name of files) {
            const removeBr = tableRemoveBr || removeBrFiles.has(name);
            const removeSize = removeSizeFiles.has(name);
            const path = `${translationsDir}/${subdir ? info.table + "/" : ""}${name}.json`;
            const columns = dictColumns[table];
            const { text } = readJson(path);

            for (const jpText in text) {
                let enText = text[jpText];
                if (enText == "") continue;

                const rows = await select(columns, table, field, jpText);
                if (rows.length == 0) {
                    console.log(`Warning: ${jpText} not found`);
                    continue;
                }

                if (removeBr) {
                    enText = replaceLineBreaksWithSpace(enText);
                }

                if (removeSize) {
                    enText = removeSizeTags(enText);
                }

                for (const row of rows) {
                    const category = row[columns[0]];
                    if (columns.length == 2) {
                        const index = row[columns[1]];
                        console.log(`category: ${category}, index: ${index}`);
                        if (!dict[category]) dict[category] = {};
                        dict[category][index] = enText;
                    }
                    else {
                        console.log(`id: ${category}`);
                        dict[category] = enText;
                    }
                }
            }
        }

        writeJson(table + "_dict.json", dict)
    }
}
genDicts();
