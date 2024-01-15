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
        changedSomething = _replaceUniqueTokenWithSameProperties(sourceProject.myMeshes, targetProject.myMeshes, targetIDTokens, ["link", "name"], commanderOptions, processReport);
    }

    return changedSomething;
}

function _alignTextures(sourceProject: Project, targetProject: Project, targetIDTokens: ParentChildTokenPair[] | null, commanderOptions: Record<string, string>, processReport: AlignProcessReport): boolean {
    let changedSomething = false;

    if (commanderOptions.align == null || commanderOptions.align.indexOf("ids") >= 0) {
        changedSomething = _replaceUniqueTokenWithSameProperties(sourceProject.myTextures, targetProject.myTextures, targetIDTokens, ["link", "name"], commanderOptions, processReport);
    }

    return changedSomething;
}

function _alignImages(sourceProject: Project, targetProject: Project, targetIDTokens: ParentChildTokenPair[] | null, commanderOptions: Record<string, string>, processReport: AlignProcessReport): boolean {
    let changedSomething = false;

    if (commanderOptions.align == null || commanderOptions.align.indexOf("ids") >= 0) {
        changedSomething = _replaceUniqueTokenWithSameProperties(sourceProject.myImages, targetProject.myImages, targetIDTokens, ["link", "name"], commanderOptions, processReport);
    }

    return changedSomething;
}

function _alignMaterials(sourceProject: Project, targetProject: Project, targetIDTokens: ParentChildTokenPair[] | null, commanderOptions: Record<string, string>, processReport: AlignProcessReport): boolean {
    let changedSomething = false;

    if (commanderOptions.align == null || commanderOptions.align.indexOf("ids") >= 0) {
        changedSomething = _replaceUniqueTokenWithSameProperties(sourceProject.myMaterials, targetProject.myMaterials, targetIDTokens, ["link", "name"], commanderOptions, processReport);
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

function _replaceUniqueTokenWithSameProperties(sourceObjectToken: ObjectToken, targetObjectToken: ObjectToken, targetIDTokens: ParentChildTokenPair[] | null, propertiesToCheck: string[], commanderOptions: Record<string, string>, processReport: AlignProcessReport): boolean {
    let changedSomething = false;

    for (const [sourceID, sourceTokenToCheck] of sourceObjectToken.getTokenEntries()) {
        const equalTargetToken = getEqualJSONToken(sourceTokenToCheck, targetObjectToken, true, processReport.myTokensReplaced);
        if (equalTargetToken != null) {
            if (sourceID != equalTargetToken!.childKey!) {
                replaceParentTokenKey(equalTargetToken!.childKey!, sourceID, targetObjectToken);
                _replaceID(equalTargetToken!.childKey!, sourceID, targetIDTokens!);
                changedSomething = true;

                processReport.myTokensReplaced.push(equalTargetToken.child);
            }
        } else if (commanderOptions.strict == null) {
            const sourcePropertiesTokensToCheck: Map<string, JSONValueToken | null> = new Map();
            for (const propertyToCheck of propertiesToCheck) {
                sourcePropertiesTokensToCheck.set(propertyToCheck, ObjectToken.assert(sourceTokenToCheck).maybeGetValueTokenOfKey(propertyToCheck));
            }

            let targetIDToReplace: string | null = null;
            let targetTokenToReplace: JSONToken | null = null;
            let tokenIDFound = false;
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
                        if (tokenIDFound) {
                            // More than one with the same name have been found, do not risk aligning this 
                            targetIDToReplace = null;
                            break;
                        } else {
                            tokenIDFound = true;
                            targetIDToReplace = targetID;
                            targetTokenToReplace = targetTokenToCheck;
                        }
                    }
                } else {
                    targetIDToReplace = null;
                    break;
                }
            }

            if (targetIDToReplace != null) {
                replaceParentTokenKey(targetIDToReplace!, sourceID, targetObjectToken);
                _replaceID(targetIDToReplace!, sourceID, targetIDTokens!);

                changedSomething = true;

                processReport.myTokensReplaced.push(targetTokenToReplace!);
            }
        }
    }

    return changedSomething;
}