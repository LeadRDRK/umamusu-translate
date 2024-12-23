const { readJson, writeJson, walkDir } = require('../common');
const { wrapText, initSync: hachimiInitSync } = require("hachimi_lib");
const fs = require("fs");
const path = require("path");

const useMachineTl = process.argv[2] == "usetheforceluke";

const homeTlDir = "../../../translations/home";
const storyTlDir = "../../../translations/story";

// config
const LINE_WIDTH_MULTIPLIER = 1.75;
const STORY_LINE_COUNT_OFFSET = 1;
const TEXT_FRAME_FONT_SIZE_MULTIPLIER = 0.9;

// hachimi/src/il2cpp/hook/umamusume/StoryTimelineData.rs
const CLIP_TEXT_LINE_WIDTH = 21;
const CLIP_TEXT_LINE_COUNT = 3;
const CLIP_TEXT_FONT_SIZE_DEFAULT = 42;

const STORY_VIEW_CLIP_TEXT_LINE_WIDTH = 32;

// calculated parameters
const PARAMS = {
    lineCount: CLIP_TEXT_LINE_COUNT + STORY_LINE_COUNT_OFFSET,
    fontSize: Math.round(CLIP_TEXT_FONT_SIZE_DEFAULT * TEXT_FRAME_FONT_SIZE_MULTIPLIER),
    lineWidth: Math.round(CLIP_TEXT_LINE_WIDTH / TEXT_FRAME_FONT_SIZE_MULTIPLIER),
    storyViewLineWidth: Math.round(STORY_VIEW_CLIP_TEXT_LINE_WIDTH / TEXT_FRAME_FONT_SIZE_MULTIPLIER),
};

// extras
const STORY_VIEW_MAX_LINES = 3;

function genStoryDicts(dir, getOutputPath) {
    walkDir(dir, entry => {
        let { isDirectory, path } = entry;
        if (isDirectory) return;

        let dict = readJson(path);
        if (!dict.humanTl && !useMachineTl) {
            console.log("Warning: skipping machine translated dict " + path);
            return;
        }

        let text_block_list = [];
        let empty = true;
        let i = 1;
        let validated = true;
        dict.text.forEach(block => {
            if (block.blockIdx != i++) {
                validated = false;
            }

            // this is how import.py check whether to skip a block or not
            if (!block.enName && !block.enText) {
                text_block_list.push({});
                return;
            }
            empty = false;

            let newBlock = {};
            if (block.enName) newBlock.name = block.enName;
            if (block.enText) {
                let isStoryView = dict.storyId.length == 9 && (
                    dict.storyId.startsWith("02") ||
                    dict.storyId.startsWith("04") ||
                    dict.storyId.startsWith("09")
                );

                const text = block.enText.replace(/ {2,}/g, " "); // Remove duplicate spaces
                const lines = text.split(/ *(?:\n|\\n) */);

                // If used in story view, only wrap if line count exceeds limit, there's plenty of horizontal space.
                // Otherwise (in training event view), wrap if the lines are too long, no need to care about line count.
                const needsWrap = isStoryView ?
                    lines.length > STORY_VIEW_MAX_LINES :
                    lines.some(line => line.length > Math.round(PARAMS.lineWidth * LINE_WIDTH_MULTIPLIER));
                const lineWidth = isStoryView ? PARAMS.storyViewLineWidth : PARAMS.lineWidth;

                newBlock.text = needsWrap ?
                    wrapText(lines.join(" "), lineWidth, LINE_WIDTH_MULTIPLIER).join(isStoryView ? " \n" : "\n") :
                    text;
            }

            if (block.choices) {
                let empty = true;
                newBlock.choice_data_list = block.choices.map(choice => {
                    if (choice.enText) {
                        empty = false;
                        return choice.enText;
                    }
                    else ""
                });
                if (empty) delete newBlock.choice_data_list;
            }

            if (block.coloredText) {
                let empty = true;
                newBlock.color_text_info_list = block.coloredText.map(info => {
                    if (info.enText) {
                        empty = false;
                        return info.enText;
                    }
                    else ""
                });
                if (empty) delete newBlock.color_text_info_list;
            }

            text_block_list.push(newBlock);
        });

        if (empty) {
            console.log("Warning: skipping empty dict " + path);
            return;
        }

        if (!validated) {
            console.log("Warning: validation failed for " + path);
        }

        let newDict = {
            no_wrap: true,
            text_block_list
        };
        writeJson(getOutputPath(dict.storyId), newDict);
    });
}

hachimiInitSync(fs.readFileSync(path.join(require.resolve("hachimi_lib"), "..", "hachimi_lib_bg.wasm")));

genStoryDicts(homeTlDir, storyId => {
    let p1 = storyId.slice(0, 5);
    let p2 = storyId.slice(5, 7);
    let p3 = storyId.slice(7);
    return `assets/home/data/${p1}/${p2}/hometimeline_${p1}_${p2}_${p3}.json`;
});

genStoryDicts(storyTlDir, storyId =>
    `assets/story/data/${storyId.slice(0, 2)}/${storyId.slice(2, 6)}/storytimeline_${storyId}.json`
);
