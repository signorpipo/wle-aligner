import { getProjectComponentsDefinitions } from "../common/bundle/component_utils.js";
import { Project } from "../common/project/project.js";
import { ProcessReport } from "./process_report.js";
import { getDuplicateIDs, switchToUUID } from "./switch_to_uuid.js";

export async function wleUUIDify(projectPath: string, commanderOptions: Record<string, string>) {
    const processReport = new ProcessReport();

    const project = new Project();
    try {
        await project.load(projectPath);
    } catch (error) {
        processReport.myProjectLoadFailed = true;
    }

    if (!processReport.myProjectLoadFailed) {
        const projectComponentsDefinitions = getProjectComponentsDefinitions(projectPath, commanderOptions, processReport);

        if ((processReport.myEditorBundleError || processReport.myEditorBundleExtraError) && commanderOptions.unsafe == null) {
            console.error("");
            console.error("Abort process due to editor bundle failure");
            console.error("Use -u unsafe flag to ignore this error and proceed");
            console.error("");
        } else if (commanderOptions.duplicates != null) {
            processReport.myDuplicatedIDs.push(...getDuplicateIDs(project));

            if (processReport.myDuplicatedIDs.length > 0) {
                console.error("");
                console.log("Duplicated IDs have been found on different resources");
                console.log("Please check these IDs and manually adjust them before attempting again to uuidify the project");
                for (const duplicatedID of processReport.myDuplicatedIDs) {
                    console.log("- " + duplicatedID);
                }
            } else {
                console.error("");
                console.log("No duplicated IDs have been found");
            }

            console.error("");
        } else {
            await switchToUUID(project, projectComponentsDefinitions, commanderOptions, processReport);
            _logSwitchToUUIDReport(commanderOptions, processReport);
        }
    } else {
        console.error("");
        console.error("Project load failed");
        console.error("");
    }
}



// PRIVATE

function _logSwitchToUUIDReport(commanderOptions: Record<string, string>, processReport: ProcessReport) {
    console.error("");

    if (processReport.myProjectCompleted) {
        console.log("UUIDIFY Completed");
    } else {
        console.log("UUIDIFY Failed");
    }

    if (processReport.myDuplicatedIDAfterSwitch) {
        console.error("");
        console.log("- after the switch to UUIDs some duplicated IDs have been found");
        console.log("  this might be due to a rare coincidence where a UUID have been generated that was already present in the project");
        console.log("  run the process again");
    } else if (processReport.myDuplicatedIDs.length > 0) {
        console.error("");
        console.log("- duplicated IDs have been found on different resources");
        console.log("  please check these IDs and manually adjust them before attempting again to uuidify the project");
        for (const duplicatedID of processReport.myDuplicatedIDs) {
            console.log("  - " + duplicatedID);
        }
    } else {
        if (processReport.myEditorBundleIgnored) {
            console.error("");
            console.log("- editor bundle has been ignored, some properties might have been changed even though they were not an ID");
        } else {
            if (processReport.myEditorBundleError) {
                console.error("");
                console.log("- editor bundle errors have been occurred, some properties might have been changed even though they were not an ID");
            } else if (processReport.myEditorBundleExtraError) {
                console.error("");
                console.log("- editor bundle extra errors have been occurred, some properties might have been changed even though they were not an ID");
            }
        }

        if (processReport.myComponentsPropertiesAsIDUnsafe.size > 0) {
            console.error("");

            if (commanderOptions.unsafe != null) {
                console.log("- some component properties have been considered an ID but might not be");
            } else {
                console.log("- some component properties have been ignored even though they might have been an ID");
                console.log("  you can use the unsafe flag -u to also switch them");
            }

            for (const componentType of processReport.myComponentsPropertiesAsIDUnsafe.keys()) {
                console.log("  - " + componentType);
                for (const propertyName of processReport.myComponentsPropertiesAsIDUnsafe.get(componentType)!) {
                    console.log("    - " + propertyName);
                }
            }
        }

        if (processReport.myPipelineShaderPropertiesAsID.size > 0) {
            console.error("");
            console.log("- some pipeline shader properties have been considered an ID but might not be");
            for (const shaderName of processReport.myPipelineShaderPropertiesAsID.keys()) {
                console.log("  - " + shaderName);
                for (const shaderPropertyName of processReport.myPipelineShaderPropertiesAsID.get(shaderName)!) {
                    console.log("    - " + shaderPropertyName);
                }
            }
        }
    }

    console.log("");
}