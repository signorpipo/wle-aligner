// #CREDITS https://github.com/playkostudios/wle-cleaner

import { JSONToken, JSONValueToken, ObjectToken, StringToken } from "@playkostudios/jsonc-ast";
import path from "path";
import isUUID from "validator/lib/isUUID.js";
import { ModifiedComponentPropertyRecord } from "../common/bundle/modified_component_property.js";
import { ParentChildTokenPair, areTokensEqual, getEqualJSONTokens, replaceParentTokenKey } from "../common/project/jsonast_utils.js";
import { Project } from "../common/project/project.js";
import { getDuplicateIDs, getIDTokens } from "../wle_uuidify/switch_to_uuid.js";
import { AlignProcessReport } from "./process_report.js";
import { equal } from "assert";

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

        let changedSomething = false;
        do {
            changedSomething = false;

            if (commanderOptions.filter == null || commanderOptions.filter.indexOf("objects") >= 0) {
                changedSomething = changedSomething || _alignObjects();
            }

            if (commanderOptions.filter == null || commanderOptions.filter.indexOf("meshes") >= 0) {
                changedSomething = changedSomething || _alignMeshes(sourceProject, targetProject, targetIDTokens, commanderOptions, processReport);
            }

            if (commanderOptions.filter == null || commanderOptions.filter.indexOf("textures") >= 0) {
                changedSomething = changedSomething || _alignTextures(sourceProject, targetProject, targetIDTokens, commanderOptions, processReport);
            }

            if (commanderOptions.filter == null || commanderOptions.filter.indexOf("images") >= 0) {
                changedSomething = changedSomething || _alignImages(sourceProject, targetProject, targetIDTokens, commanderOptions, processReport);
            }

            if (commanderOptions.filter == null || commanderOptions.filter.indexOf("materials") >= 0) {
                changedSomething = changedSomething || _alignMaterials(sourceProject, targetProject, targetIDTokens, commanderOptions, processReport);
            }

            if (commanderOptions.filter == null || commanderOptions.filter.indexOf("shaders") >= 0) {
                changedSomething = changedSomething || _alignShaders(sourceProject, targetProject, targetIDTokens, commanderOptions, processReport);
            }

        } while (changedSomething);

        processReport.myDuplicatedIDsAfterAlign = getDuplicateIDs(targetProject);
        if (processReport.myDuplicatedIDsAfterAlign.length == 0) {
            if (commanderOptions.replace != null) {
                targetProject.save();
            } else {
                if (commanderOptions.output != null) {
                    targetProject.save(commanderOptions.output);
                } else {
                    targetProject.save(path.join(path.dirname(targetProject.myPath), "aligned-" + path.basename(targetProject.myPath)));
                }
            }
            processReport.myProcessCompleted = true;
        }
    }
}



// PRIVATE

function _alignObjects(): boolean {
    const changedSomething = false;

    return changedSomething;

}

function _alignMeshes(sourceProject: Project, targetProject: Project, targetIDTokens: ParentChildTokenPair[] | null, commanderOptions: Record<string, string>, processReport: AlignProcessReport): boolean {
    let changedSomething = false;

    if (commanderOptions.align == null || commanderOptions.align.indexOf("ids") >= 0) {
        changedSomething = _replaceIDOfTokensWithSameProperties(sourceProject.myMeshes, targetProject.myMeshes, targetIDTokens, ["link", "name"], commanderOptions, processReport);
    }

    return changedSomething;
}

function _alignTextures(sourceProject: Project, targetProject: Project, targetIDTokens: ParentChildTokenPair[] | null, commanderOptions: Record<string, string>, processReport: AlignProcessReport): boolean {
    let changedSomething = false;

    if (commanderOptions.align == null || commanderOptions.align.indexOf("ids") >= 0) {
        changedSomething = _replaceIDOfTokensWithSameProperties(sourceProject.myTextures, targetProject.myTextures, targetIDTokens, ["link", "name"], commanderOptions, processReport);
    }

    return changedSomething;
}

function _alignImages(sourceProject: Project, targetProject: Project, targetIDTokens: ParentChildTokenPair[] | null, commanderOptions: Record<string, string>, processReport: AlignProcessReport): boolean {
    let changedSomething = false;

    if (commanderOptions.align == null || commanderOptions.align.indexOf("ids") >= 0) {
        changedSomething = _replaceIDOfTokensWithSameProperties(sourceProject.myImages, targetProject.myImages, targetIDTokens, ["link", "name"], commanderOptions, processReport);
    }

    return changedSomething;
}

function _alignMaterials(sourceProject: Project, targetProject: Project, targetIDTokens: ParentChildTokenPair[] | null, commanderOptions: Record<string, string>, processReport: AlignProcessReport): boolean {
    let changedSomething = false;

    if (commanderOptions.align == null || commanderOptions.align.indexOf("ids") >= 0) {
        changedSomething = _replaceIDOfTokensWithSameProperties(sourceProject.myMaterials, targetProject.myMaterials, targetIDTokens, ["link", "name"], commanderOptions, processReport);
    }

    return changedSomething;
}

function _alignShaders(sourceProject: Project, targetProject: Project, targetIDTokens: ParentChildTokenPair[] | null, commanderOptions: Record<string, string>, processReport: AlignProcessReport): boolean {
    let changedSomething = false;

    if (commanderOptions.align == null || commanderOptions.align.indexOf("ids") >= 0) {
        changedSomething = _replaceIDOfTokensWithSameProperties(sourceProject.myShaders, targetProject.myShaders, targetIDTokens, ["link", "name"], commanderOptions, processReport);
    }

    return changedSomething;
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
    let changedSomething = false;

    const sourceIDs: string[] = [];
    for (const [sourceID, __sourceTokenToCheck] of sourceObjectToken.getTokenEntries()) {
        sourceIDs.push(sourceID);
    }

    for (const [sourceID, sourceTokenToCheck] of sourceObjectToken.getTokenEntries()) {
        const sourcePropertiesTokensToCheck: Map<string, JSONValueToken | null> = new Map();
        for (const propertyToCheck of propertiesToCheck) {
            sourcePropertiesTokensToCheck.set(propertyToCheck, ObjectToken.assert(sourceTokenToCheck).maybeGetValueTokenOfKey(propertyToCheck));
        }

        let targetIDToReplace: string | null = null;
        let targetTokenToReplace: JSONToken | null = null;
        const equalTargetTokens = getEqualJSONTokens(sourceTokenToCheck, targetObjectToken, true);
        if (equalTargetTokens.length > 0) {
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
        } else if (commanderOptions.strict == null) {
            for (const [targetID, targetTokenToCheck] of targetObjectToken.getTokenEntries()) {
                if (processReport.myTokensReplaced.indexOf(targetTokenToCheck) >= 0) continue;

                if (sourceIDs.indexOf(targetID) == -1) {
                    const targetPropertiesTokensToCheck: Map<string, JSONValueToken | null> = new Map();
                    for (const propertyToCheck of propertiesToCheck) {
                        targetPropertiesTokensToCheck.set(propertyToCheck, ObjectToken.assert(targetTokenToCheck).maybeGetValueTokenOfKey(propertyToCheck));
                    }

                    let areAllTokensEqual = true;
                    for (const [propertyName, sourcePropertyTokenToCheck] of sourcePropertiesTokensToCheck.entries()) {
                        areAllTokensEqual = areAllTokensEqual && areTokensEqual(sourcePropertyTokenToCheck, targetPropertiesTokensToCheck.get(propertyName));
                    }

                    if (areAllTokensEqual) {
                        targetIDToReplace = targetID;
                        targetTokenToReplace = targetTokenToCheck;
                        break;
                    }
                } else {
                    if (targetTokenToCheck != null) {
                        processReport.myTokensReplaced.push(targetTokenToCheck);
                    }

                    break;
                }
            }
        }

        if (targetIDToReplace != null && targetTokenToReplace != null) {
            let canReplace = false;

            const isSourceTokenUnique = _isTokenUnique(sourceID, sourceTokenToCheck, sourceObjectToken, targetObjectToken, propertiesToCheck);

            let isTargetTokenUnique = true;
            if (isSourceTokenUnique) {
                isTargetTokenUnique = _isTokenUnique(targetIDToReplace, targetTokenToReplace, targetObjectToken, sourceObjectToken, propertiesToCheck);
            }

            if (commanderOptions.unsafe != null) {
                canReplace = true;
                if (!isSourceTokenUnique || !isTargetTokenUnique) {
                    processReport.myNotUniqueResourceIDs.push(sourceID);
                }
            } else {
                canReplace = isSourceTokenUnique && isTargetTokenUnique;
                // skippare quelli che hanno stesso ID
            }

            if (canReplace) {
                replaceParentTokenKey(targetIDToReplace, sourceID, targetObjectToken);
                _replaceID(targetIDToReplace, sourceID, targetIDTokens!);

                processReport.myTokensReplaced.push(targetTokenToReplace);

                changedSomething = true;
            }
        }
    }

    return changedSomething;
}

function _isTokenUnique(tokenID: string, tokenToCheck: JSONToken, objectToken: ObjectToken, targetObjectToken: ObjectToken, propertiesToCheck: string[]): boolean {
    let isUnique = true;

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
                if (targetTokenToCheck != null) {
                    const targetPropertiesTokensToCheck: Map<string, JSONValueToken | null> = new Map();
                    for (const propertyToCheck of propertiesToCheck) {
                        targetPropertiesTokensToCheck.set(propertyToCheck, ObjectToken.assert(targetTokenToCheck).maybeGetValueTokenOfKey(propertyToCheck));
                    }

                    let areAllTokensEqualTarget = true;
                    for (const [propertyName, propertyTokenToCheck] of otherPropertiesTokensToCheck.entries()) {
                        areAllTokensEqualTarget = areAllTokensEqualTarget && areTokensEqual(propertyTokenToCheck, targetPropertiesTokensToCheck.get(propertyName));
                    }

                    if (!areAllTokensEqualTarget) {
                        isUnique = false;
                        break;
                    }
                } else {
                    isUnique = false;
                    break;
                }
            }
        }
    }

    return isUnique;
}