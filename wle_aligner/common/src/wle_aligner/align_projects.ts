// #CREDITS https://github.com/playkostudios/wle-cleaner

import { JSONToken, JSONValueToken, ObjectToken, StringToken } from "@playkostudios/jsonc-ast";
import path from "path";
import isUUID from "validator/lib/isUUID.js";
import { ModifiedComponentPropertyRecord } from "../common/bundle/modified_component_property.js";
import { ParentChildTokenPair, areTokensEqual, getEqualJSONToken, replaceParentTokenKey } from "../common/project/jsonast_utils.js";
import { Project } from "../common/project/project.js";
import { getDuplicateIDs, getIDTokens } from "../wle_uuidify/switch_to_uuid.js";
import { AlignProcessReport } from "./process_report.js";

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

    for (const [sourceID, sourceTokenToCheck] of sourceObjectToken.getTokenEntries()) {
        const sourcePropertiesTokensToCheck: Map<string, JSONValueToken | null> = new Map();
        for (const propertyToCheck of propertiesToCheck) {
            sourcePropertiesTokensToCheck.set(propertyToCheck, ObjectToken.assert(sourceTokenToCheck).maybeGetValueTokenOfKey(propertyToCheck));
        }

        let targetIDToReplace: string | null = null;
        let targetTokenToReplace: JSONToken | null = null;
        const equalTargetToken = getEqualJSONToken(sourceTokenToCheck, targetObjectToken, true, processReport.myTokensReplaced);
        if (equalTargetToken != null) {
            if (sourceID != equalTargetToken!.childKey!) {
                targetIDToReplace = equalTargetToken!.childKey;
                targetTokenToReplace = equalTargetToken.child;
            }
        } else if (commanderOptions.strict == null) {
            for (const [targetID, targetTokenToCheck] of targetObjectToken.getTokenEntries()) {
                if (processReport.myTokensReplaced.indexOf(targetTokenToCheck) >= 0) continue;

                if (sourceID != targetID) {
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
                    break;
                }
            }
        }

        if (targetIDToReplace != null && targetTokenToReplace != null) {
            let canReplace = false;
            if (commanderOptions.unsafe != null) {
                canReplace = true;
            } else {
                const isSourceTokenUnique = _isTokenUnique(sourceID, sourceTokenToCheck, sourceObjectToken, propertiesToCheck);

                let isTargetTokenUnique = true;
                if (isSourceTokenUnique) {
                    isTargetTokenUnique = _isTokenUnique(targetIDToReplace, targetTokenToReplace, targetObjectToken, propertiesToCheck);
                }

                canReplace = isSourceTokenUnique && isTargetTokenUnique;
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

function _isTokenUnique(tokenID: string, tokenToCheck: JSONToken, objectToken: ObjectToken, propertiesToCheck: string[]): boolean {
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
                isUnique = false;
                break;
            }
        }
    }

    return isUnique;
}