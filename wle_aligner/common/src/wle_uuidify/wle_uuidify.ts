import { getProjectComponentsDefinitions } from "../common/bundle/component_utils.js";
import { ProcessReport } from "./process_report.js";
import { switchToUUID } from "./switch_to_uuid.js";

export async function wleUUIDify(projectPath: string, commanderOptions: Record<string, string>) {
    const processReport = new ProcessReport();

    const projectComponentsDefinitions = getProjectComponentsDefinitions(projectPath, commanderOptions, processReport);

    if ((processReport.myEditorBundleError || processReport.myEditorBundleExtraError) && commanderOptions.unsafe == null) {
        console.error("");
        console.error("Abort process due to editor bundle failure");
        console.error("Use -u unsafe flag to ignore this error and proceed");
        console.error("");
    } else {
        await switchToUUID(projectPath, projectComponentsDefinitions, commanderOptions, processReport);
        _logSwitchToUUIDReport(commanderOptions, processReport);
    }
}



// PRIVATE

function _logSwitchToUUIDReport(commanderOptions: Record<string, string>, processReport: ProcessReport) {
    if (processReport.myProjectLoadFailed) {
        console.error("");
        console.error("Project load failed");
        console.error("");
        return;
    }

    console.error("");

    console.log("Process Completed");

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
            console.log("    - " + componentType);
            for (const propertyName of processReport.myComponentsPropertiesAsIDUnsafe.get(componentType)!) {
                console.log("        - " + propertyName);
            }
        }
    }

    if (processReport.myPipelineShaderPropertiesAsID.size > 0) {
        console.error("");
        console.log("- some pipeline shader properties have been considered an ID but might not be");
        for (const shaderName of processReport.myPipelineShaderPropertiesAsID.keys()) {
            console.log("    - " + shaderName);
            for (const shaderPropertyName of processReport.myPipelineShaderPropertiesAsID.get(shaderName)!) {
                console.log("        - " + shaderPropertyName);
            }
        }
    }
    if (processReport.myDuplicatedIDs.length > 0) {
        console.error("");
        console.log("- duplicated ID have been found on different resources, please check these IDs and manually adjust them");
        for (const duplicatedID of processReport.myDuplicatedIDs) {
            console.log("    - " + duplicatedID);
        }
    }

    console.log("");
}