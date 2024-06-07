const { readJson, writeJson, walkDir } = require('../common');

const useMachineTl = process.argv[2] == "usetheforceluke";

const translationsDir = "../../../translations/lyrics";
const lyricsDir = "assets/lyrics";
walkDir(translationsDir, entry => {
    let { isDirectory, path } = entry;
    if (isDirectory) return;

    let dict = readJson(path);
    if (!dict.humanTl && !useMachineTl) {
        console.log("Warning: skipping machine translated dict " + path);
        return;
    }

    let newDict = {};
    let empty = true;
    dict.text.forEach(entry => {
        if (!entry.enText) return;
        empty = false;
        newDict[entry.time] = entry.enText;
    });

    if (empty) {
        console.log("Warning: skipping empty dict " + path);
        return;
    }

    writeJson(`${lyricsDir}/m${dict.storyId}_lyrics.json`, newDict);
});
