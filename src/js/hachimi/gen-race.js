const { readJson, writeJson, walkDir } = require('../common');

const useMachineTl = process.argv[2] == "usetheforceluke";

const translationsDir = "../../../translations/race";
const raceStoryTextDir = "assets/race/storyrace/text";
walkDir(translationsDir, entry => {
    let { isDirectory, path } = entry;
    if (isDirectory) return;

    let dict = readJson(path);
    if (!dict.humanTl && !useMachineTl) {
        console.log("Warning: skipping machine translated dict " + path);
        return;
    }

    let newDict = dict.text.map(v => v.enText);
    writeJson(`${raceStoryTextDir}/storyrace_${dict.storyId}.json`, newDict);
});
