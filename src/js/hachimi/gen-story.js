const { readJson, writeJson, walkDir, replaceLineBreaksWithSpace } = require('../common');

const useMachineTl = process.argv[2] == "usetheforceluke";

const homeTlDir = "../../../translations/home";
const storyTlDir = "../../../translations/story";

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
            if (block.enText) newBlock.text = replaceLineBreaksWithSpace(block.enText);

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

        let newDict = {text_block_list};
        writeJson(getOutputPath(dict.storyId), newDict);
    });
}

genStoryDicts(homeTlDir, storyId => {
    let p1 = storyId.slice(0, 5);
    let p2 = storyId.slice(5, 7);
    let p3 = storyId.slice(7);
    return `assets/home/data/${p1}/${p2}/hometimeline_${p1}_${p2}_${p3}.json`;
});

genStoryDicts(storyTlDir, storyId =>
    `assets/story/data/${storyId.slice(0, 2)}/${storyId.slice(2, 6)}/storytimeline_${storyId}.json`
);
