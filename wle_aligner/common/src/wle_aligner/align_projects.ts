// #CREDITS https://github.com/playkostudios/wle-cleaner

import { JSONValueToken, ObjectToken, StringToken } from "@playkostudios/jsonc-ast";
import path from "path";
import isUUID from "validator/lib/isUUID.js";
import { ModifiedComponentPropertyRecord } from "../common/bundle/modified_component_property.js";
import { ParentChildTokenPair, areTokensEqual, getEqualJSONTokens, replaceParentTokenKey } from "../common/project/jsonast_utils.js";
import { Project } from "../common/project/project.js";
import { getDuplicateIDs, getIDTokens } from "../wle_uuidify/switch_to_uuid.js";
import { AlignProcessReport } from "./align_process_report.js";

export async function alignProjects(sourceProject: Project, targetProject: Project, projectComponentsDefinitions: Map<string, ModifiedComponentPropertyRecord> | null, commanderOptions: Record<string, string>, processReport: AlignProcessReport) {
    if (commanderOptions.align == null || commanderOptions.align.indexOf("ids") >= 0) {
        processReport.mySourceDuplicatedIDs.push(...getDuplicateIDs(sourceProject));
        processReport.myTargetDuplicatedIDs.push(...getDuplicateIDs(targetProject));
    }

    if (processReport.mySourceDuplicatedIDs.length == 0 && processReport.myTargetDuplicatedIDs.length == 0) {
        let targetIDTokens: ParentChildTokenPair[] | null = null;

        if (commanderOptions.align == null || commanderOptions.align.indexOf("ids") >= 0) {
            targetIDTokens = getIDTokens(targetProject, projectComponentsDefinitions!, _isID, commanderOptions, processReport);
        }

        let somethingChanged = false;
        do {
            somethingChanged = false;

            if (commanderOptions.include == null || commanderOptions.include.indexOf("objects") >= 0) {
                const currentChangedSomething = _alignObjects(sourceProject, targetProject, targetIDTokens, commanderOptions, processReport);
                somethingChanged = somethingChanged || currentChangedSomething;
                //if (currentChangedSomething) console.error("objects", somethingChanged);
            }

            if (commanderOptions.include == null || commanderOptions.include.indexOf("meshes") >= 0) {
                const currentChangedSomething = _alignMeshes(sourceProject, targetProject, targetIDTokens, commanderOptions, processReport);
                somethingChanged = somethingChanged || currentChangedSomething;
                //if (currentChangedSomething) console.error("meshes", somethingChanged);
            }

            if (commanderOptions.include == null || commanderOptions.include.indexOf("textures") >= 0) {
                const currentChangedSomething = _alignTextures(sourceProject, targetProject, targetIDTokens, commanderOptions, processReport);
                somethingChanged = somethingChanged || currentChangedSomething;
                //if (currentChangedSomething) console.error("textures", somethingChanged);
            }

            if (commanderOptions.include == null || commanderOptions.include.indexOf("images") >= 0) {
                const currentChangedSomething = _alignImages(sourceProject, targetProject, targetIDTokens, commanderOptions, processReport);
                somethingChanged = somethingChanged || currentChangedSomething;
                //if (currentChangedSomething) console.error("images", somethingChanged);
            }

            if (commanderOptions.include == null || commanderOptions.include.indexOf("materials") >= 0) {
                const currentChangedSomething = _alignMaterials(sourceProject, targetProject, targetIDTokens, commanderOptions, processReport);
                somethingChanged = somethingChanged || currentChangedSomething;
                //if (currentChangedSomething) console.error("materials", somethingChanged);
            }

            if (commanderOptions.include == null || commanderOptions.include.indexOf("shaders") >= 0) {
                const currentChangedSomething = _alignShaders(sourceProject, targetProject, targetIDTokens, commanderOptions, processReport);
                somethingChanged = somethingChanged || currentChangedSomething;
                //if (currentChangedSomething) console.error("shaders", somethingChanged);
            }

            if (commanderOptions.include == null || commanderOptions.include.indexOf("animations") >= 0) {
                const currentChangedSomething = _alignAnimations(sourceProject, targetProject, targetIDTokens, commanderOptions, processReport);
                somethingChanged = somethingChanged || currentChangedSomething;
                //if (currentChangedSomething) console.error("animations", somethingChanged);
            }

            if (commanderOptions.include == null || commanderOptions.include.indexOf("skins") >= 0) {
                const currentChangedSomething = _alignSkins(sourceProject, targetProject, targetIDTokens, commanderOptions, processReport);
                somethingChanged = somethingChanged || currentChangedSomething;
                //if (currentChangedSomething) console.error("skins", somethingChanged);
            }

            if (commanderOptions.include == null || commanderOptions.include.indexOf("pipelines") >= 0) {
                const currentChangedSomething = _alignPipelines(sourceProject, targetProject, targetIDTokens, commanderOptions, processReport);
                somethingChanged = somethingChanged || currentChangedSomething;
                //if (currentChangedSomething) console.error("pipelines", somethingChanged);
            }

            if (commanderOptions.include == null || commanderOptions.include.indexOf("files") >= 0) {
                const currentChangedSomething = _alignFiles(sourceProject, targetProject, targetIDTokens, commanderOptions, processReport);
                somethingChanged = somethingChanged || currentChangedSomething;
                //if (currentChangedSomething) console.error("files", somethingChanged);
            }

            if (commanderOptions.include == null || commanderOptions.include.indexOf("fonts") >= 0) {
                const currentChangedSomething = _alignFonts(sourceProject, targetProject, targetIDTokens, commanderOptions, processReport);
                somethingChanged = somethingChanged || currentChangedSomething;
                //if (currentChangedSomething) console.error("fonts", somethingChanged);
            }

        } while (somethingChanged);

        processReport.mySomethingChanged = somethingChanged;

        processReport.myDuplicatedIDsAfterAlign = getDuplicateIDs(targetProject);
        if (processReport.myDuplicatedIDsAfterAlign.length == 0 || commanderOptions.writeOnFail != null) {
            if (commanderOptions.replace != null) {
                await targetProject.save();
            } else {
                if (commanderOptions.output != null) {
                    await targetProject.save(commanderOptions.output);
                } else {
                    await targetProject.save(path.join(path.dirname(targetProject.myPath), "aligned-" + path.basename(targetProject.myPath)));
                }
            }
            processReport.myProcessCompleted = processReport.myDuplicatedIDsAfterAlign.length == 0;
        }
    }
}



// PRIVATE

function _alignObjects(sourceProject: Project, targetProject: Project, targetIDTokens: ParentChildTokenPair[] | null, commanderOptions: Record<string, string>, processReport: AlignProcessReport): boolean {
    let somethingChanged = false;

    if (commanderOptions.align == null || commanderOptions.align.indexOf("ids") >= 0) {
        somethingChanged = _replaceIDOfTokensWithSameProperties(sourceProject.myObjects, targetProject.myObjects, targetIDTokens, ["link", "name", "parent"], commanderOptions, processReport);
    }

    return somethingChanged;
}

function _alignMeshes(sourceProject: Project, targetProject: Project, targetIDTokens: ParentChildTokenPair[] | null, commanderOptions: Record<string, string>, processReport: AlignProcessReport): boolean {
    let somethingChanged = false;

    if (commanderOptions.align == null || commanderOptions.align.indexOf("ids") >= 0) {
        somethingChanged = _replaceIDOfTokensWithSameProperties(sourceProject.myMeshes, targetProject.myMeshes, targetIDTokens, ["link", "name"], commanderOptions, processReport);
    }

    return somethingChanged;
}

function _alignTextures(sourceProject: Project, targetProject: Project, targetIDTokens: ParentChildTokenPair[] | null, commanderOptions: Record<string, string>, processReport: AlignProcessReport): boolean {
    let somethingChanged = false;

    if (commanderOptions.align == null || commanderOptions.align.indexOf("ids") >= 0) {
        somethingChanged = _replaceIDOfTokensWithSameProperties(sourceProject.myTextures, targetProject.myTextures, targetIDTokens, ["link", "name"], commanderOptions, processReport);
    }

    return somethingChanged;
}

function _alignImages(sourceProject: Project, targetProject: Project, targetIDTokens: ParentChildTokenPair[] | null, commanderOptions: Record<string, string>, processReport: AlignProcessReport): boolean {
    let somethingChanged = false;

    if (commanderOptions.align == null || commanderOptions.align.indexOf("ids") >= 0) {
        somethingChanged = _replaceIDOfTokensWithSameProperties(sourceProject.myImages, targetProject.myImages, targetIDTokens, ["link", "name"], commanderOptions, processReport);
    }

    return somethingChanged;
}

function _alignMaterials(sourceProject: Project, targetProject: Project, targetIDTokens: ParentChildTokenPair[] | null, commanderOptions: Record<string, string>, processReport: AlignProcessReport): boolean {
    let somethingChanged = false;

    if (commanderOptions.align == null || commanderOptions.align.indexOf("ids") >= 0) {
        somethingChanged = _replaceIDOfTokensWithSameProperties(sourceProject.myMaterials, targetProject.myMaterials, targetIDTokens, ["link", "name"], commanderOptions, processReport);
    }

    return somethingChanged;
}

function _alignShaders(sourceProject: Project, targetProject: Project, targetIDTokens: ParentChildTokenPair[] | null, commanderOptions: Record<string, string>, processReport: AlignProcessReport): boolean {
    let somethingChanged = false;

    if (commanderOptions.align == null || commanderOptions.align.indexOf("ids") >= 0) {
        somethingChanged = _replaceIDOfTokensWithSameProperties(sourceProject.myShaders, targetProject.myShaders, targetIDTokens, ["link", "name"], commanderOptions, processReport);
    }

    return somethingChanged;
}

function _alignAnimations(sourceProject: Project, targetProject: Project, targetIDTokens: ParentChildTokenPair[] | null, commanderOptions: Record<string, string>, processReport: AlignProcessReport): boolean {
    let somethingChanged = false;

    if (commanderOptions.align == null || commanderOptions.align.indexOf("ids") >= 0) {
        somethingChanged = _replaceIDOfTokensWithSameProperties(sourceProject.myAnimations, targetProject.myAnimations, targetIDTokens, ["link", "name"], commanderOptions, processReport);
    }

    return somethingChanged;
}

function _alignSkins(sourceProject: Project, targetProject: Project, targetIDTokens: ParentChildTokenPair[] | null, commanderOptions: Record<string, string>, processReport: AlignProcessReport): boolean {
    let somethingChanged = false;

    if (commanderOptions.align == null || commanderOptions.align.indexOf("ids") >= 0) {
        somethingChanged = _replaceIDOfTokensWithSameProperties(sourceProject.mySkins, targetProject.mySkins, targetIDTokens, ["link", "name", "joints"], commanderOptions, processReport);
    }

    return somethingChanged;
}

function _alignPipelines(sourceProject: Project, targetProject: Project, targetIDTokens: ParentChildTokenPair[] | null, commanderOptions: Record<string, string>, processReport: AlignProcessReport): boolean {
    let somethingChanged = false;

    if (commanderOptions.align == null || commanderOptions.align.indexOf("ids") >= 0) {
        somethingChanged = _replaceIDOfTokensWithSameProperties(sourceProject.myPipelines, targetProject.myPipelines, targetIDTokens, ["link", "name", "shader"], commanderOptions, processReport);
    }

    return somethingChanged;
}

function _alignFiles(sourceProject: Project, targetProject: Project, targetIDTokens: ParentChildTokenPair[] | null, commanderOptions: Record<string, string>, processReport: AlignProcessReport): boolean {
    let somethingChanged = false;

    if (commanderOptions.align == null || commanderOptions.align.indexOf("ids") >= 0) {
        somethingChanged = _replaceIDOfTokensWithSameProperties(sourceProject.myFiles, targetProject.myFiles, targetIDTokens, [], commanderOptions, processReport);
    }

    return somethingChanged;
}

function _alignFonts(sourceProject: Project, targetProject: Project, targetIDTokens: ParentChildTokenPair[] | null, commanderOptions: Record<string, string>, processReport: AlignProcessReport): boolean {
    let somethingChanged = false;

    if (commanderOptions.align == null || commanderOptions.align.indexOf("ids") >= 0) {
        somethingChanged = _replaceIDOfTokensWithSameProperties(sourceProject.myFonts, targetProject.myFonts, targetIDTokens, ["link", "name"], commanderOptions, processReport);
    }

    return somethingChanged;
}

function _replaceID(oldID: string, newID: string, idTokens: ParentChildTokenPair[]) {
    for (const idTokenToReplace of idTokens) {
        const childID = StringToken.assert(idTokenToReplace.child).evaluate();
        if (childID == oldID) {
            idTokenToReplace.parent.replaceChild(idTokenToReplace.child, StringToken.fromString(newID));
        }
    }
}

function _isID(idToCheck: string): boolean {
    if (parseInt(idToCheck).toFixed(0) == idToCheck) {
        return true;
    }

    return isUUID(idToCheck);
}

function _replaceIDOfTokensWithSameProperties(sourceObjectToken: ObjectToken, targetObjectToken: ObjectToken, targetIDTokens: ParentChildTokenPair[] | null, propertiesToCheck: string[], commanderOptions: Record<string, string>, processReport: AlignProcessReport): boolean {
    let somethingChanged = false;

    const sourceIDs: string[] = [];
    for (const [sourceID, __sourceTokenToCheck] of sourceObjectToken.getTokenEntries()) {
        sourceIDs.push(sourceID);
    }

    for (const [sourceID, sourceTokenToCheck] of sourceObjectToken.getTokenEntries()) {
        if (processReport.myAlignedIDs.indexOf(sourceID) >= 0) continue;

        let skipSourceID = false;
        for (const [targetID, targetTokenToCheck] of targetObjectToken.getTokenEntries()) {
            if (sourceID == targetID) {
                if (targetTokenToCheck != null && processReport.myTokensReplaced.indexOf(targetTokenToCheck) == -1) {
                    processReport.myTokensReplaced.push(targetTokenToCheck);
                }

                processReport.myAlignedIDs.push(sourceID);
                skipSourceID = true;
                break;
            }
        }
        if (skipSourceID) continue;

        let propertiesToCheckUsed: string[] = [];

        let strictCheckUsed = false;

        let targetIDToReplace: string | null = null;
        let targetTokenToReplace: JSONValueToken | null = null;
        const equalTargetTokens = getEqualJSONTokens(sourceTokenToCheck, targetObjectToken, true);
        if (equalTargetTokens.length > 0) {
            strictCheckUsed = true;

            let validEqualTokens: ParentChildTokenPair[] = [];

            for (const equalTargetToken of equalTargetTokens) {
                if (sourceID == equalTargetToken.childKey!) {
                    validEqualTokens = [];
                    break;
                }

                if (sourceIDs.indexOf(equalTargetToken.childKey!) == -1 && processReport.myTokensReplaced.indexOf(equalTargetToken.child) == -1) {
                    validEqualTokens.push(equalTargetToken);
                }
            }

            if (validEqualTokens.length > 0) {
                targetIDToReplace = validEqualTokens[0]!.childKey;
                targetTokenToReplace = validEqualTokens[0].child;
            }
        } else if (commanderOptions.strict == null && propertiesToCheck.length > 0) {
            const sourcePropertiesTokensToCheck: Map<string, JSONValueToken | null> = new Map();
            for (const propertyToCheck of propertiesToCheck) {
                sourcePropertiesTokensToCheck.set(propertyToCheck, ObjectToken.assert(sourceTokenToCheck).maybeGetValueTokenOfKey(propertyToCheck));
            }

            for (const [targetID, targetTokenToCheck] of targetObjectToken.getTokenEntries()) {
                if (processReport.myTokensReplaced.indexOf(targetTokenToCheck) >= 0) continue;

                if (sourceIDs.indexOf(targetID) == -1) {
                    const targetPropertiesTokensToCheck: Map<string, JSONValueToken | null> = new Map();
                    for (const propertyToCheck of propertiesToCheck) {
                        targetPropertiesTokensToCheck.set(propertyToCheck, ObjectToken.assert(targetTokenToCheck).maybeGetValueTokenOfKey(propertyToCheck));
                    }

                    let areAllTokensEqual = true;
                    const currentPropertiesToCheckUsed: string[] = [];
                    for (const [propertyName, sourcePropertyTokenToCheck] of sourcePropertiesTokensToCheck.entries()) {
                        const targetPropertyTokenToCheck = targetPropertiesTokensToCheck.get(propertyName);
                        const areTokensPropertiesEqual = areTokensEqual(sourcePropertyTokenToCheck, targetPropertiesTokensToCheck.get(propertyName));
                        if (areTokensPropertiesEqual) {
                            if (sourcePropertyTokenToCheck != null && targetPropertyTokenToCheck != null) {
                                currentPropertiesToCheckUsed.push(propertyName);
                            }
                        } else {
                            areAllTokensEqual = false;
                        }
                    }

                    if (areAllTokensEqual) {
                        propertiesToCheckUsed = propertiesToCheck;
                        targetIDToReplace = targetID;
                        targetTokenToReplace = targetTokenToCheck;
                        break;
                    } else if (currentPropertiesToCheckUsed.length > propertiesToCheckUsed.length) {
                        // #TODO there could be a priority management for when the length is the same
                        propertiesToCheckUsed = currentPropertiesToCheckUsed;
                        targetIDToReplace = targetID;
                        targetTokenToReplace = targetTokenToCheck;
                    }
                } else {
                    if (targetTokenToCheck != null) {
                        processReport.myTokensReplaced.push(targetTokenToCheck);
                    }
                }
            }
        }

        if (targetIDToReplace != null && targetTokenToReplace != null) {
            if (sourceID == "32df9139-8e30-4a64-b9b0-0cf3a118a95c") {
                console.error("ID", targetIDToReplace);
            }

            let canReplace = false;

            const isSourceTokenUnique = _isTokenUnique(sourceID, sourceTokenToCheck, sourceObjectToken, targetObjectToken, propertiesToCheckUsed, strictCheckUsed);

            let isTargetTokenUnique = true;
            if (isSourceTokenUnique) {
                isTargetTokenUnique = _isTokenUnique(targetIDToReplace, targetTokenToReplace, targetObjectToken, sourceObjectToken, propertiesToCheckUsed, strictCheckUsed);
            }

            if (commanderOptions.unsafe != null && propertiesToCheckUsed.length == propertiesToCheck.length) {
                canReplace = true;
                if (!isSourceTokenUnique || !isTargetTokenUnique) {
                    processReport.myNotUniqueResourceIDs.push(sourceID);
                }
            } else {
                canReplace = isSourceTokenUnique && isTargetTokenUnique;
            }

            if (canReplace) {
                replaceParentTokenKey(targetIDToReplace, sourceID, targetObjectToken);
                _replaceID(targetIDToReplace, sourceID, targetIDTokens!);

                processReport.myTokensReplaced.push(targetTokenToReplace);
                processReport.myAlignedIDs.push(sourceID);

                somethingChanged = true;
            }
        }
    }

    return somethingChanged;
}

function _isTokenUnique(tokenID: string, tokenToCheck: JSONValueToken, objectToken: ObjectToken, targetObjectToken: ObjectToken, propertiesToCheck: string[], strictCheckUsed: boolean): boolean {
    let isUnique = false;

    if (strictCheckUsed) {
        isUnique = true;

        const equalTargetTokens = getEqualJSONTokens(tokenToCheck, objectToken, true);
        if (equalTargetTokens.length > 0) {
            for (const equalTargetToken of equalTargetTokens) {
                if (tokenID != equalTargetToken.childKey!) {
                    const targetTokenToCheck = targetObjectToken.maybeGetValueTokenOfKey(equalTargetToken.childKey!);
                    // If the ID is also in the other project, it's assumed it must be the same resource and therefore it's not counted as a duplicate
                    if (targetTokenToCheck == null) {
                        isUnique = false;
                        break;
                    }
                }
            }
        }
    } else if (propertiesToCheck.length > 0) {
        isUnique = true;

        const propertiesTokensToCheck: Map<string, JSONValueToken | null> = new Map();
        for (const propertyToCheck of propertiesToCheck) {
            propertiesTokensToCheck.set(propertyToCheck, ObjectToken.assert(tokenToCheck).maybeGetValueTokenOfKey(propertyToCheck));
        }

        for (const [otherID, otherTokenToCheck] of objectToken.getTokenEntries()) {
            if (tokenID != otherID) {
                const otherPropertiesTokensToCheck: Map<string, JSONValueToken | null> = new Map();
                for (const propertyToCheck of propertiesToCheck) {
                    otherPropertiesTokensToCheck.set(propertyToCheck, ObjectToken.assert(otherTokenToCheck).maybeGetValueTokenOfKey(propertyToCheck));
                }

                let areAllTokensEqual = true;
                for (const [propertyName, propertyTokenToCheck] of propertiesTokensToCheck.entries()) {
                    areAllTokensEqual = areAllTokensEqual && areTokensEqual(propertyTokenToCheck, otherPropertiesTokensToCheck.get(propertyName));
                }

                if (areAllTokensEqual) {
                    const targetTokenToCheck = targetObjectToken.maybeGetValueTokenOfKey(otherID);
                    // If the ID is also in the other project, it's assumed it must be the same resource and therefore it's not counted as a duplicate
                    if (targetTokenToCheck == null) {
                        isUnique = false;
                        break;
                    }
                }
            }
        }
    }

    return isUnique;
}