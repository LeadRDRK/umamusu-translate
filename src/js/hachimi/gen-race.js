const { readJson, writeJson, walkDir } = require('../common');
const { wrapText, initSync: hachimiInitSync } = require("hachimi_lib");
const fs = require("fs");
const path = require("path");

const useMachineTl = process.argv[2] == "usetheforceluke";

const translationsDir = "../../../translations/race";
const raceStoryTextDir = "assets/race/storyrace/text";

// config
const LINE_WIDTH_MULTIPLIER = 1.75;

const LINE_WIDTH = 32;

hachimiInitSync({ module: fs.readFileSync(path.join(require.resolve("hachimi_lib"), "..", "hachimi_lib_bg.wasm")) });

walkDir(translationsDir, entry => {
    let { isDirectory, path } = entry;
    if (isDirectory) return;

    let dict = readJson(path);
    if (!dict.humanTl && !useMachineTl) {
        console.log("Warning: skipping machine translated dict " + path);
        return;
    }

    let newDict = dict.text.map(v => {
        const text = v.enText;
        const lines = text.split(/ *(?:\n|\\n) */);
        if (lines.some(line => line.length > Math.round(LINE_WIDTH * LINE_WIDTH_MULTIPLIER))) {
            return wrapText(lines.join(" "), LINE_WIDTH, LINE_WIDTH_MULTIPLIER).join(" \n");
        }
        else {
            return text;
        }
    });
    writeJson(`${raceStoryTextDir}/storyrace_${dict.storyId}.json`, newDict);
});
