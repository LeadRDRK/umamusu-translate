const fs = require('fs');
const { commonInit, readJson, writeJson, readCsvRows } = require('../common');
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
const TITLE_SRC = "title_" + SRC_LANG
const TITLE_DST = "title_" + DST_LANG

commonInit();

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
    const rawSkillDesc = readCsvRows("data/skill_desc_orig.csv");
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
        if (descOrig) {
            var descDst = skill[DESC_DST];
            if (descDst) skillDesc[descOrig] = `<size=22>${dumbWrap(descDst, 48)}</size>`;
        }
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

function appendBrackets(str) {
    if (str[0] != "[" && str[str.length - 1] != "]") {
        return `[${str}]`
    }
    return str
}

function genUmaTitle() {
    const cards = readJson("data/character_cards.json");

    var text = {}
    for (const card of cards) {
        var titleSrc = appendBrackets(card[TITLE_SRC])
        var titleDstOrig = card[TITLE_DST]
        if (!titleDstOrig) continue;
        var titleDst = appendBrackets(titleDstOrig)
        text[titleSrc] = emptyIfSame(titleSrc, titleDst);
    }

    writeJson("uma-title.json",
        {
            ...base,
            lineLength: 0,
            text: text
        }
    );
}

genSkills();
genCharacters();
genUmaTitle();
