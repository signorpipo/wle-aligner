import path from "path";
import { alignProject } from "./align_project.js";
import { PROCESS_OPTIONS, extractProcessOptions, extractProcessSourceProjectPath, extractProcessTargetProjectPaths } from "./process_options.js";
import { ProcessReport } from "./process_report.js";
import { switchToUUID } from "./switch_to_uuid.js";
import { getProjectComponentsDefinitions } from "./bundle/component_utils.js";

export async function wleAligner(uuidify: boolean = false) {
    // eslint-disable-next-line no-undef
    const processArguments = process.argv;

    const options = extractProcessOptions(processArguments);
    const sourceProjectPath = extractProcessSourceProjectPath(processArguments);
    const targetProjectPaths = extractProcessTargetProjectPaths(processArguments);

    const processReport = new ProcessReport();

    const rootDirPath = path.dirname(sourceProjectPath);
    const projectComponentsDefinitions = getProjectComponentsDefinitions(rootDirPath, processReport);

    if ((processReport.myEditorBundleError || processReport.myEditorCustomBundleError) && options.indexOf(PROCESS_OPTIONS.RISKY) == -1) {
        console.error("");
        console.error("Abort process due to editor bundle failure");
        console.error("Use -r risky flag to ignore this error and proceed");
        console.error("");
    } else {
        if (uuidify || options.indexOf(PROCESS_OPTIONS.SWITCH_TO_UUID) >= 0) {
            await switchToUUID(sourceProjectPath, projectComponentsDefinitions, options, processReport);
            _logSwitchToUUIDReport(processReport);
        } else {
            for (const targetProjectPath of targetProjectPaths) {
                alignProject(sourceProjectPath, targetProjectPath, options);
            }
        }
    }
}



// PRIVATE

function _logSwitchToUUIDReport(processReport: ProcessReport) {
    console.error("");

    console.log("Process Completed");

    if (processReport.myEditorBundleIgnored) {
        console.error("");
        console.log("- editor bundle has been ignored, some properties might have been changed even though they were not an ID");
    } else {
        if (processReport.myEditorBundleError) {
            console.error("");
            console.log("- editor bundle errors have been occurred, some properties might have been changed even though they were not an ID");
        } else if (processReport.myEditorCustomBundleError) {
            console.error("");
            console.log("- editor custom bundle errors have been occurred, some properties might have been changed even though they were not an ID");
        }
    }

    if (processReport.myComponentsPropertiesAsIDRisky.size > 0) {
        console.error("");
        console.log("- some component properties have been considered an ID but might not be");
        for (const componentType of processReport.myComponentsPropertiesAsIDRisky.keys()) {
            console.log("    - " + componentType);
            for (const propertyName of processReport.myComponentsPropertiesAsIDRisky.get(componentType)!) {
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