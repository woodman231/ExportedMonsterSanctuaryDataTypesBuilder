const fs = require('fs/promises');
const path = require('path');

const JsonToTS = require('json-to-ts')
const TypeScriptFormatter = require('typescript-formatter');

const inputPath = path.join(process.cwd(), 'node_modules', '@woodman231', 'exportedmonstersanctuarydata');
const outputPath = path.join(process.cwd(), 'out');

const getTypesFromObject = (inputObject, inputRootName) => {
    return JsonToTS(inputObject, { rootName: inputRootName })
}

const getEnumType = (enumName, enumKeyValueObjects) => {
    let results = 'export enum ' + enumName + ' {\n';
    enumKeyValueObjects.forEach((enumKeyValueObject) => {
        results += '  ' + enumKeyValueObject.Key + ' = ' + enumKeyValueObject.Value + ',\n';
    });

    results += '}'

    return results;
}

const getAllEnumTypes = async () => {
    const enumsDirectory = path.join(inputPath, 'Enums');
    const enumFiles = await fs.readdir(enumsDirectory);

    var results = [];

    const readFilePromises = enumFiles.map(async (enumFile) => {
        const fullFileName = path.join(enumsDirectory, enumFile);
        const fileStats = await fs.stat(fullFileName);
        if (fileStats.isFile()) {
            const enumName = enumFile.replace('.json', '');
            const enumFileContents = await fs.readFile(fullFileName, 'utf8');
            const enumFileObjects = JSON.parse(enumFileContents);

            if (enumFileObjects.KeyValueObjects) {
                results.push(getEnumType(enumName, enumFileObjects.KeyValueObjects));
            }
        }
    });

    await Promise.all(readFilePromises);

    return results;
}

const getAllSkillsFromMonsters = async () => {
    const monsterFilesDirectory = path.join(inputPath, 'Monsters');
    const monsterFiles = await fs.readdir(monsterFilesDirectory);

    let skillResults = [];

    const readMonsterFilePromises = monsterFiles.map(async (monsterFile) => {
        const fileName = path.join(monsterFilesDirectory, monsterFile);
        const fileStats = await fs.stat(fileName);
        if (fileStats.isFile()) {
            const fileContents = await fs.readFile(fileName, 'utf8');
            const monsterDetails = JSON.parse(fileContents);

            if (monsterDetails["LightShiftPassive"]) {
                skillResults.push(monsterDetails["LightShiftPassive"]);
            }

            if (monsterDetails["DarkShiftPassive"]) {
                skillResults.push(monsterDetails["DarkShiftPassive"])
            }

            if (monsterDetails["BaseSkills"]) {
                monsterDetails["BaseSkills"].forEach((baseSkill) => {
                    skillResults.push(baseSkill);
                })
            }

            if (monsterDetails["SkillTrees"]) {
                monsterDetails["SkillTrees"].forEach((skillTree) => {
                    for (let i = 1; i <= 5; i++) {
                        if (skillTree[`Tier${i}Skills`]) {
                            skillTree[`Tier${i}Skills`].forEach((skill) => {
                                skillResults.push(skill);
                            })
                        }
                    }
                })
            }

            if (monsterDetails["Ultimates"]) {
                monsterDetails["Ultimates"].forEach((ultimate) => {
                    skillResults.push(ultimate);
                })
            }
        }
    })

    await Promise.all(readMonsterFilePromises);

    return skillResults;
}

const getAllObjectsFromDirectory = async (directoryName) => {
    const fullDirectoryName = path.join(inputPath, directoryName);

    var results = [];

    const filesInDirectory = await fs.readdir(fullDirectoryName);

    const readFilePromises = filesInDirectory.map(async (fileInDirectory) => {
        const fullFileName = path.join(fullDirectoryName, fileInDirectory);
        const fileStats = await fs.stat(fullFileName);
        if (fileStats.isFile()) {
            const objectDetails = await getObjectFromFile(fullFileName);

            results.push(objectDetails);
        }
    });

    await Promise.all(readFilePromises);

    return results;
}

const getObjectFromFile = async (fullFileName) => {
    const fileContents = await fs.readFile(fullFileName, 'utf8');
    return JSON.parse(fileContents);
}

const changeNumbersToEnums = (interfacesToWrite) => {
    var results = [];

    for (let i = 0; i < interfacesToWrite.length; i++) {
        let interfaceDetails = interfacesToWrite[i];

        // Target specific types
        if (interfaceDetails.startsWith('interface Monster {')) {
            interfaceDetails = interfaceDetails.replace('TypesArray: number[];', 'TypesArray: EMonsterType[];');
        }

        if (interfaceDetails.startsWith('interface ActionDamageProperties {')) {
            interfaceDetails = interfaceDetails.replace('Type: number;', 'Type: EDamageType;');
        }

        if (interfaceDetails.startsWith('interface EquipmentProperties {')) {
            interfaceDetails = interfaceDetails.replace('Type: number;', 'Type: EquipmentType;');
        }

        if (interfaceDetails.startsWith('interface ActionTypeRestrictionProperties {')) {
            interfaceDetails = interfaceDetails.replace('Types: number[];', 'Types: EMonsterType[];');
        }

        if (interfaceDetails.startsWith('interface PassiveSkillProperties {')) {
            interfaceDetails = interfaceDetails.replace('OverlayDebuffs?: number[];', 'OverlayDebuffs?: DebuffType[];')
            interfaceDetails = interfaceDetails.replace('OverlayBuffs?: number[];', 'OverlayBuffs?: BuffType[];')
        }

        if (interfaceDetails.startsWith('interface OverlaySpecialBuff {')) {
            interfaceDetails = interfaceDetails.replace('BuffType: number;', 'BuffType: ESpecialBuff;');
        }

        if(interfaceDetails.startsWith('interface ActionSpecialBuffProperties {')) {
            interfaceDetails = interfaceDetails.replace('Buff: number;', 'Buff: ESpecialBuff;');            
        }

        if(interfaceDetails.startsWith('interface PassiveSpecialBuffChanceProperties {')) {
            interfaceDetails = interfaceDetails.replace('Buff: number;', 'Buff: ESpecialBuff;');            
        }

        if(interfaceDetails.startsWith('interface PassiveSpecialBuffOnGettingHitProperties {')) {
            interfaceDetails = interfaceDetails.replace('Buff: number;', 'Buff: ESpecialBuff;');            
        }

        if(interfaceDetails.startsWith('interface PassiveSpecialBuffDamageModifierProperties {')) {
            interfaceDetails = interfaceDetails.replace('Buff: number;', 'Buff: ESpecialBuff;');            
        }

        if (interfaceDetails.startsWith('interface PassiveShockChargingProperties {')) {
            interfaceDetails = interfaceDetails.replace('Buff: number;', 'Buff: ESpecialBuff;')
        }

        if (interfaceDetails.startsWith('interface PassiveDebuffTriggersDebuffProperties {')) {
            interfaceDetails = interfaceDetails.replace('DebuffTrigger: number;', 'DebuffTrigger: DebuffType;');
            interfaceDetails = interfaceDetails.replace('AppliedDebuff: number;', 'AppliedDebuff: DebuffType;');
        }

        // target specific fields
        if (interfaceDetails.includes('Element: number;')) {
            interfaceDetails = interfaceDetails.replace('Element: number;', 'Element: EElement;');
        }

        if (interfaceDetails.includes('Debuff2: number;')) {
            interfaceDetails = interfaceDetails.replace('Debuff2: number;', 'Debuff2: DebuffType;');
        }

        if (interfaceDetails.includes('Debuff1: number;')) {
            interfaceDetails = interfaceDetails.replace('Debuff1: number;', 'Debuff1: DebuffType;');
        }

        if (interfaceDetails.includes('Debuff: number;')) {
            interfaceDetails = interfaceDetails.replace('Debuff: number;', 'Debuff: DebuffType;');
        }

        if (interfaceDetails.includes('Debuffs: number[];')) {
            interfaceDetails = interfaceDetails.replace('Debuffs: number[];', 'Debuffs: DebuffType[];');
        }

        if (interfaceDetails.includes('DebuffType: number;')) {
            interfaceDetails = interfaceDetails.replace('DebuffType: number;', 'DebuffType: DebuffType;');
        }

        if (interfaceDetails.includes('Stat: number;')) {
            interfaceDetails = interfaceDetails.replace('Stat: number;', 'Stat: EStat;');
        }

        if (interfaceDetails.includes('TypeRestriction2: number;')) {
            interfaceDetails = interfaceDetails.replace('TypeRestriction2: number;', 'TypeRestriction2: EMonsterType;');
        }

        if (interfaceDetails.includes('TypeRestriction1: number;')) {
            interfaceDetails = interfaceDetails.replace('TypeRestriction1: number;', 'TypeRestriction1: EMonsterType;');
        }

        if (interfaceDetails.includes('TypeRestriction: number;')) {
            interfaceDetails = interfaceDetails.replace('TypeRestriction: number;', 'TypeRestriction: EMonsterType;');
        }

        if(interfaceDetails.includes('MonsterType: number;')) {
            interfaceDetails = interfaceDetails.replace('MonsterType: number;', 'MonsterType: EMonsterType;');            
        }

        if(interfaceDetails.includes('MonsterType2: number;')) {
            interfaceDetails = interfaceDetails.replace('MonsterType2: number;', 'MonsterType2: EMonsterType;');            
        }

        if (interfaceDetails.includes('Buff2: number;')) {
            interfaceDetails = interfaceDetails.replace('Buff2: number;', 'Buff2: BuffType;');
        }

        if (interfaceDetails.includes('Buff1: number;')) {
            interfaceDetails = interfaceDetails.replace('Buff1: number;', 'Buff1: BuffType;');
        }

        if (interfaceDetails.includes('Buff: number;')) {
            interfaceDetails = interfaceDetails.replace('Buff: number;', 'Buff: BuffType;');
        }

        if (interfaceDetails.includes('Buffs: number[];')) {
            interfaceDetails = interfaceDetails.replace('Buffs: number[];', 'Buffs: BuffType[];');
        }

        if (interfaceDetails.includes('BuffType: number;')) {
            interfaceDetails = interfaceDetails.replace('BuffType: number;', 'BuffType: BuffType;');
        }

        if (interfaceDetails.includes('TargetType: number;')) {
            interfaceDetails = interfaceDetails.replace('TargetType: number;', 'TargetType: ETargetType;');
        }

        results.push(interfaceDetails);
    }

    return results;
}

const putTypesInToNameSpace = (interfacesToWrite, namespaceName) => {
    let results = 'export namespace ' + namespaceName + ' {\n'

    interfacesToWrite.forEach((interfaceToWrite) => {
        let interfaceDetails = interfaceToWrite.replace('interface ', 'export interface ');
        results += interfaceDetails + '\n';
    })

    results += '}';

    return results;
}

const main = async () => {
    // When using JsonToTS it returns an array of interface types as a string. Create a place holder for all of the results that contain the types we want, or after they have been modified
    let interfacesToWrite = [];

    // First create Enums that will be used in the types. JsonToTS detects a number or array of numbers when an Enum value is used. These Enums will be used in the Typescript file later
    const allEnumsAsEnums = await getAllEnumTypes();

    allEnumsAsEnums.forEach((enumDetails) => {
        interfacesToWrite.push(enumDetails);
    });

    // Enums exported by the export package are of type {[key:string]:number}, {Key: string; Value: number}, and {[key:string]:string} (for inverted key values) we will get those types here
    const allEnums = await getAllObjectsFromDirectory('Enums');
    const enumTypes = await getTypesFromObject(allEnums, 'EnumDetails');

    let enumTypesToWrite = [];

    for (let enumTypeIndex = 0; enumTypeIndex < enumTypes.length; enumTypeIndex++) {
        let enumTypeDetails = enumTypes[enumTypeIndex];
        let addType = false;

        if (enumTypeDetails.startsWith('interface EnumDetail {')) {
            enumTypeDetails = enumTypeDetails.replace('KeyValues: KeyValues;', 'KeyValues:{[key:string]: number}');
            enumTypeDetails = enumTypeDetails.replace('InvertedKeyValues: InvertedKeyValues;', 'InvertedKeyValues:{[key:string]: string}');

            addType = true;
        }

        if (enumTypeDetails.startsWith('interface KeyValueObject {')) {
            addType = true;
        }

        if (addType) {
            enumTypesToWrite.push(enumTypeDetails);
        }
    }

    enumTypesToWrite.forEach((enumType) => {
        interfacesToWrite.push(enumType);
    });

    // The Buffs enum needed extra properties. This will be imported. Most commonly this will be used to make lists of Buffs for a client application
    const allBuffs = await getAllObjectsFromDirectory('Buffs');
    const buffTypes = getTypesFromObject(allBuffs, 'Buff');

    buffTypes.forEach((buffType) => {
        interfacesToWrite.push(buffType);
    });

    // The Debuffs enum needed extra properties. This will be imported. Most commonly this will be used to make lists of Buffs for a client application
    const allDebuffs = await getAllObjectsFromDirectory('Debuffs');
    const debuffTypes = getTypesFromObject(allDebuffs, 'Debuff');

    debuffTypes.forEach((debuffType) => {
        interfacesToWrite.push(debuffType);
    });

    // The SpecialBuffs enum needed extra properties. This will be imported. Most commonly this will be used to make lists of Buffs for a client application
    const specialBuffs = await getAllObjectsFromDirectory('SpecialBuffs');
    const specialBuffTypes = getTypesFromObject(specialBuffs, 'SpecialBuff');

    specialBuffTypes.forEach((specialBuffType) => {
        interfacesToWrite.push(specialBuffType);
    });

    // After some trial and error with JsonToTS it was determined to make arrays of similar objects to come up with the closest types that we want to use.
    // Import all Item types and use JsonToTS to get the Item and EquipmentTypes
    const allItems = await getAllObjectsFromDirectory('Items');
    const itemTypes = getTypesFromObject(allItems, 'Item');

    let itemTypesToWrite = [];

    // Fix some of the irregularites that come as a result of JsonToTS for items...
    // Rename Item2 to Item, and get rid of Item
    for (let itemTypesIndex = 0; itemTypesIndex < itemTypes.length; itemTypesIndex++) {
        let thisItemTypeInterface = itemTypes[itemTypesIndex];
        let addToResults = true;

        if (thisItemTypeInterface.startsWith('interface Item {')) {
            addToResults = false;
        }

        if (thisItemTypeInterface.startsWith('interface Item2 {')) {
            thisItemTypeInterface = thisItemTypeInterface.replace('Item2', 'Item');
        }

        if (addToResults) {
            itemTypesToWrite.push(thisItemTypeInterface);
        }
    }

    itemTypesToWrite.forEach((itemType) => {
        interfacesToWrite.push(itemType);
    });

    // Because of the complexities around Skills, and Drops associated with the Monster Object it was determined that it would be best to just make Skills it's own type, then specify that type were necessary
    const allSkills = await getAllSkillsFromMonsters();
    const skillTypes = getTypesFromObject(allSkills, 'Skill');

    skillTypes.forEach((skillType) => {
        interfacesToWrite.push(skillType);
    });

    // Because we cleaned up most of the complexity of the Monster object by getting the Skill and Item objects we can focus on just reading one monster to get the base properties, and then do some clean up
    const monster = await getObjectFromFile(path.join(inputPath, 'Monsters', 'Aazerach.json'));
    const monsterTypes = getTypesFromObject(monster, 'Monster');

    // Clean up some of the irregularities associated with the Monster object that is generated by JsonToTS
    let monsterTypesToWrite = [];

    for (let monsterTypesIndex = 0; monsterTypesIndex < monsterTypes.length; monsterTypesIndex++) {
        let typeDetails = monsterTypes[monsterTypesIndex];
        let addType = false;

        if (typeDetails.startsWith('interface Monster {')) {
            typeDetails = typeDetails.replace('LightShiftPassive: LightShiftPassive;', 'LightShiftPassive: Skill;');
            typeDetails = typeDetails.replace('DarkShiftPassive: DarkShiftPassive;', 'DarkShiftPassive: Skill;');
            typeDetails = typeDetails.replace('BaseSkills: BaseSkill[];', 'BaseSkills: Skill[];');
            typeDetails = typeDetails.replace('Ultimates: Ultimate[];', 'Ultimates: Skill[];');
            typeDetails = typeDetails.replace('RewardsCommon: RewardsCommon[];', 'RewardsCommon: Item[]');
            typeDetails = typeDetails.replace('RewardsRare: RewardsRare[];', 'RewardsRare: Item[]');

            addType = true;
        }

        if (typeDetails.startsWith('interface Appearance {')) {
            addType = true;
        }

        if (typeDetails.startsWith('interface BaseStats {')) {
            addType = true;
        }

        if (typeDetails.startsWith('interface SkillTree {')) {
            typeDetails = typeDetails.replace('Tier1Skills: (Tier1Skill | Tier1Skills2)[];', 'Tier1Skills: Skill[]');
            typeDetails = typeDetails.replace('Tier2Skills: Tier2Skill[];', 'Tier2Skills: Skill[]');
            typeDetails = typeDetails.replace('Tier3Skills: Tier3Skill[];', 'Tier3Skills: Skill[]');
            typeDetails = typeDetails.replace('Tier4Skills: Tier4Skill[];', 'Tier4Skills: Skill[]');
            typeDetails = typeDetails.replace('Tier5Skills: Tier5Skill[];', 'Tier5Skills: Skill[]');

            addType = true;
        }

        if (addType) {
            monsterTypesToWrite.push(typeDetails);
        }
    }

    monsterTypesToWrite.forEach((monsterType) => {
        interfacesToWrite.push(monsterType);
    });

    // At this point interfacesToWrite has the types that we want.
    // Change some of the number; and number[]; types to known Enums
    const interfacesWithEnums = changeNumbersToEnums(interfacesToWrite);

    // Wrap everything in a Namespace
    const interfacesInNamespace = putTypesInToNameSpace(interfacesWithEnums, 'ExportedMonsterSanctuaryDataTypes')

    // Write the Namespace File
    const namespaceFileName = path.join(outputPath, 'ExportedMonsterSanctuaryDataTypes.ts');
    await fs.writeFile(namespaceFileName, interfacesInNamespace, 'utf8');

    // Make the Namespace File pretty. (I tried to use the processStringMethod here but couldn't get it to work. Ideally I would have corrected the string in memory before writing the file, but this works OK too)
    await TypeScriptFormatter.processFiles([namespaceFileName], {
        tsfmt: true,
        replace: true,
    });

}

main();