// #CREDITS https://github.com/playkostudios/wle-cleaner

import { StringToken } from "@playkostudios/jsonc-ast";
import { ModifiedComponentPropertyRecord } from "../common/bundle/modified_component_property.js";
import { ParentChildTokenPair, getEqualJSONToken, replaceParentTokenKey } from "../common/project/jsonast_utils.js";
import { Project } from "../common/project/project.js";
import { getDuplicateIDs, getIDTokens } from "../wle_uuidify/switch_to_uuid.js";
import { AlignProcessReport } from "./process_report.js";
import path from "path";

export async function alignProjects(sourceProject: Project, targetProject: Project, projectComponentsDefinitions: Map<string, ModifiedComponentPropertyRecord> | null, commanderOptions: Record<string, string>, processReport: AlignProcessReport) {
    if (commanderOptions.align == null || commanderOptions.align.indexOf("ids") >= 0) {
        processReport.mySourceDuplicatedIDs.push(...getDuplicateIDs(sourceProject));
        processReport.myTargetDuplicatedIDs.push(...getDuplicateIDs(targetProject));
    }

    if (processReport.mySourceDuplicatedIDs.length == 0 && processReport.myTargetDuplicatedIDs.length == 0) {
        let targetIDTokens: ParentChildTokenPair[] | null = null;

        if (commanderOptions.align == null || commanderOptions.align.indexOf("ids") >= 0) {
            targetIDTokens = getIDTokens(targetProject, projectComponentsDefinitions!, commanderOptions, processReport);
        }

        let changedSomething = false;
        do {
            if (commanderOptions.filter == null || commanderOptions.filter.indexOf("objects") >= 0) {
                changedSomething = changedSomething || _alignObjects();
            }

            if (commanderOptions.filter == null || commanderOptions.filter.indexOf("meshes") >= 0) {
                changedSomething = changedSomething || _alignMeshes(sourceProject, targetProject, targetIDTokens, commanderOptions, processReport);
            }

        } while (changedSomething);

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



// PRIVATE

function _alignObjects(): boolean {
    const changedSomething = false;

    return changedSomething;

}

function _alignMeshes(sourceProject: Project, targetProject: Project, targetIDTokens: ParentChildTokenPair[] | null, commanderOptions: Record<string, string>, processReport: AlignProcessReport): boolean {
    const changedSomething = false;

    if (commanderOptions.align == null || commanderOptions.align.indexOf("ids") >= 0) {
        for (const [sourceID, sourceTokenToCheck] of sourceProject.myMeshes.getTokenEntries()) {

            const equalTargetToken = getEqualJSONToken(sourceTokenToCheck, targetProject.myMeshes);
            if (equalTargetToken != null) {
                replaceParentTokenKey(equalTargetToken.childKey!, sourceID, targetProject.myMeshes);
                for (const idTokenToReplace of targetIDTokens!) {
                    const childID = StringToken.assert(idTokenToReplace.child).evaluate();
                    if (childID == equalTargetToken.childKey) {
                        idTokenToReplace.parent.replaceChild(idTokenToReplace.child, StringToken.fromString(sourceID));
                    }
                }
            }
        }
    }

    return changedSomething;
}