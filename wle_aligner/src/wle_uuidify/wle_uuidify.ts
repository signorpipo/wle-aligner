import path from "path";
import { getProjectComponentsDefinitions } from "../common/bundle/component_utils.js";
import { extractProcessProjectPaths } from "../common/cauldron/process_arguments_utils.js";
import { PROCESS_OPTIONS, extractSwitchUUIDProcessOptions } from "./process_options.js";
import { ProcessReport } from "./process_report.js";
import { switchToUUID } from "./switch_to_uuid.js";

export async function wleUUIDify(uuidify: boolean = false) {
    // eslint-disable-next-line no-undef
    const processArguments = process.argv;

    const processOptions = extractSwitchUUIDProcessOptions(processArguments);
    const projectPath = extractProcessProjectPaths(processArguments)[0];

    if (projectPath == null) {
        console.error("");
        console.error("You need to specify a project path");
        console.error("");
    } else {
        const processReport = new ProcessReport();

        const rootDirPath = path.dirname(projectPath);
        const projectComponentsDefinitions = getProjectComponentsDefinitions(rootDirPath, processReport);

        if ((processReport.myEditorBundleError || processReport.myEditorExtraBundleError) && processOptions.indexOf(PROCESS_OPTIONS.RISKY) == -1) {
            console.error("");
            console.error("Abort process due to editor bundle failure");
            console.error("Use -r risky flag to ignore this error and proceed");
            console.error("");
        } else {
            await switchToUUID(projectPath, projectComponentsDefinitions, processOptions, processReport);
            _logSwitchToUUIDReport(processOptions, processReport);
        }
    }
}



// PRIVATE

function _logSwitchToUUIDReport(processOptions: PROCESS_OPTIONS[], processReport: ProcessReport) {
    console.error("");

    console.log("Process Completed");

    if (processReport.myEditorBundleIgnored) {
        console.error("");
        console.log("- editor bundle has been ignored, some properties might have been changed even though they were not an ID");
    } else {
        if (processReport.myEditorBundleError) {
            console.error("");
            console.log("- editor bundle errors have been occurred, some properties might have been changed even though they were not an ID");
        } else if (processReport.myEditorExtraBundleError) {
            console.error("");
            console.log("- editor extra bundle errors have been occurred, some properties might have been changed even though they were not an ID");
        }
    }

    if (processReport.myComponentsPropertiesAsIDRisky.size > 0) {
        console.error("");

        if (processOptions.indexOf(PROCESS_OPTIONS.RISKY) >= 0) {
            console.log("- some component properties have been considered an ID but might not be");
        } else {
            console.log("- some component properties have been ignored even though they might have been an ID");
            console.log("  you can use the risky flag -r to also switch them");
        }

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