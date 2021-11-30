import os
import UnityPy
import common
from common import GAME_ASSET_ROOT, TranslationFile

# Globals & Parameter parsing
args = common.Args().parse()
if args.getArg("-h"):
    common.usage("[-g <group>] [-id <id>] [-src <game asset root>] [-dst <asset save path>] [-O(verwrite)] [-S(ilently skip unchanged)]",
                 "Saves all files to <project root>/dat by default")

IMPORT_TYPE = args.getArg("-t", "story").lower()
IMPORT_GROUP = args.getArg("-g", False)
IMPORT_ID = args.getArg("-id", False)
GAME_ASSET_ROOT = args.getArg("-src", GAME_ASSET_ROOT)
SAVE_DIR = args.getArg("-dst", os.path.realpath("dat/"))
OVERWRITE_GAME_DATA = args.getArg("-O", False)
SILENT_UNCHANGEDS = args.getArg("-S", False)


def get_meta(filePath: str) -> tuple[UnityPy.environment.Environment, UnityPy.environment.files.ObjectReader]:
    env = UnityPy.load(filePath)
    return env, next(iter(env.container.values())).get_obj()

# Main import controller
def swapAssetData(tlFile: TranslationFile):
    bundle = tlFile.getBundle()
    textList = tlFile.getTextBlocks()
    assetType = tlFile.getType()
    assetPath = os.path.join(GAME_ASSET_ROOT, bundle[0:2], bundle)

    if not os.path.exists(assetPath):
        return f"AssetBundle {bundle} does not exist in your game data, skipping..."

    try:
        env, mainFile = get_meta(assetPath)
    except Exception as e:
        return f"UnityPy Error: {repr(e)}, skipping {bundle}..."

    assetList = mainFile.assets_file.files
    textBlocksSkipped = 0
    lockAsset = False

    for textIdx, textData in enumerate(textList):
        if not textData['enText']:
            textBlocksSkipped += 1
            continue

        if assetType == "race":
            if not lockAsset:
                asset = mainFile
                assetData = asset.read_typetree()
                lockAsset = True
        else:
            try:
                asset = assetList[textData['pathId']]
            except KeyError:
                print(f"Skipping block {textData['blockIdx']} in {bundle}: Can't find pathId in original asset")
                continue
            assetData = asset.read_typetree()

        if assetType == "race":
            assetData['textData'][textIdx]['text'] = textData['enText']
        else:
            assetData['Text'] = textData['enText']
            assetData['Name'] = textData['enName'] or assetData['Name']

            if 'choices' in textData:
                jpChoices, enChoices = assetData['ChoiceDataList'], textData['choices']
                if len(jpChoices) != len(enChoices):
                    print("Choice lenghts do not match, skipping...")
                else:
                    for idx, choice in enumerate(textData['choices']):
                        # ? Not sure if guaranteed same order. Maybe do a search on jpText instead?
                        if choice['enText']:
                            jpChoices[idx]['Text'] = choice['enText']

            if 'coloredText' in textData:
                jpColored, enColored = assetData['ColorTextInfoList'], textData['coloredText']
                if len(jpColored) != len(enColored):
                    print("Colored text lenghts do not match, skipping...")
                else:
                    for idx, text in enumerate(textData['coloredText']):
                        if text['enText']:
                            jpColored[idx]['Text'] = text['enText']
            asset.save_typetree(assetData)
    if assetType == "race": asset.save_typetree(assetData)

    if textBlocksSkipped == len(textList):
        env = None

    return env


def saveAsset(env):
    b = env.file.save() #! packer="original" or any compression doesn't seem to work, the game will crash or get stuck loading forever
    fn = env.file.name
    fp = os.path.join(GAME_ASSET_ROOT if OVERWRITE_GAME_DATA else SAVE_DIR, fn[0:2], fn)
    os.makedirs(os.path.dirname(fp), exist_ok=True)
    with open(fp, "wb") as f:
        f.write(b)

def main():
    print(f"Importing group {IMPORT_GROUP or 'all'}, id {IMPORT_ID or 'all'} from translations\{IMPORT_TYPE} to {GAME_ASSET_ROOT if OVERWRITE_GAME_DATA else SAVE_DIR}")
    files = common.searchFiles(IMPORT_TYPE, IMPORT_GROUP, IMPORT_ID)
    processedFiles = len(files)
    print(f"Found {processedFiles} files.")

    for file in files:
        try:
            data = TranslationFile(file)
        except:
            print(f"Couldn't load translation data from {file}, skipping...")
            processedFiles -= 1
            continue

        modifiedBundle = swapAssetData(data)
        if isinstance(modifiedBundle, UnityPy.environment.Environment):
            saveAsset(modifiedBundle)
        else:
            if modifiedBundle is None and not SILENT_UNCHANGEDS:
                print(f"Bundle {data.getBundle()} not changed, skipping...")
            else:
                print(modifiedBundle)
            processedFiles -= 1

    print(f"Imported {processedFiles} files.")

main()