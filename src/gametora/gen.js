const fs = require('fs');
const outDir = './out';
const base = {
    version: 101,
    type: "mdb"
}

const SRC_LANG = "ja"
const DST_LANG = "en"
const NAME_SRC = "name_" + SRC_LANG
const NAME_DST = "name_" + DST_LANG
const DESC_SRC = "desc_" + SRC_LANG
const DESC_DST = "desc_" + DST_LANG

if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir);
}

function readJson(path) {
    return JSON.parse(fs.readFileSync(path, "utf8"));
}

function writeJson(path, content) {
    fs.writeFileSync(`${outDir}/${path}`, JSON.stringify(content, null, 4), "utf8");
    console.log(path)
}

function readCsvColumns(path) {
    var content = fs.readFileSync(path, "utf8");
    return content.split("\n");
}

function dumbWrap(text, maxPos) {
    var result = ""
    var count = 0
    for (const c of text) {
        // 10 char tolerance (creepy one liner)
        result += (++count >= maxPos - 10 && c == " " && ((count = 0) || true)) ? "\\n" : c
    }
    return result
}

function emptyIfSame(src, dst) {
    return src == dst ? "" : dst
}


function genSkills() {
    const skills = readJson("data/skills.json");
    const rawSkillDesc = readCsvColumns("data/skill_desc_orig.csv");
    const skillDescToOrig = {};
    for (const v of rawSkillDesc) {
        skillDescToOrig[v.replaceAll("\\n", "")] = v;
    };

    var skillName = {};
    var skillDesc = {};
    for (const skill of skills) {
        var nameSrc = skill[NAME_SRC]
        var nameDst = skill[NAME_DST]
        skillName[nameSrc] = emptyIfSame(nameSrc, nameDst);

        var descSrc = skill[DESC_SRC]
        var descOrig = skillDescToOrig[descSrc];
        if (descOrig)
            skillDesc[descOrig] = `<size=22>${dumbWrap(skill[DESC_DST], 48)}</size>`;
        else
            console.log(`Warning: skill desc "${descSrc}" not found`)
    }

    writeJson("skill-name.json",
        {
            ...base,
            lineLength: 32,
            text: skillName
        }
    );

    writeJson("skill-desc.json",
        {
            ...base,
            lineLength: 48,
            textSize: 22,
            text: skillDesc
        }
    );
}

function genCharacters() {
    const characters = readJson("data/characters.json");
    const otherCharNames = readJson("static/other_char_names.json");

    var charName = {}
    for (const char of characters) {
        charName[char[NAME_SRC]] = char[NAME_DST];
    }

    writeJson("char-name.json",
        {
            ...base,
            lineLength: 0,
            text: {
                ...charName,
                ...otherCharNames
            }
        }
    );
}

genSkills();
genCharacters();
