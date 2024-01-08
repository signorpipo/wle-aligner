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
    const projectComponentDefinitions = getProjectComponentsDefinitions(rootDirPath, processReport);

    if ((processReport.myEditorBundleError || processReport.myEditorCustomBundleError) && options.indexOf(PROCESS_OPTIONS.RISKY) == -1) {
        console.error("Abort process due to editor bundle failure");
        console.error("Use -r risky flag to ignore this error and proceed");
    } else {
        if (uuidify || options.indexOf(PROCESS_OPTIONS.SWITCH_TO_UUID) >= 0) {
            await switchToUUID(sourceProjectPath, projectComponentDefinitions, options, processReport);

            console.log("Process Completed");

            if (processReport.myEditorBundleIgnored) {
                console.log("- editor bundle has been ignored, some properties might have been changed even though they were not an ID");
            } else {
                if (processReport.myEditorBundleError) {
                    console.log("- editor bundle errors have been occurred, some properties might have been changed even though they were not an ID");
                } else if (processReport.myEditorCustomBundleError) {
                    console.log("- editor cistom bundle errors have been occurred, some properties might have been changed even though they were not an ID");
                }
            }

            if (processReport.myDuplicatedIDs.length > 0) {
                console.log("- duplicated ID have been found on different resources, please check these IDs and manually adjust them");
                for (const duplicatedID of processReport.myDuplicatedIDs) {
                    console.log("    - " + duplicatedID);
                }
            }
        } else {
            for (const targetProjectPath of targetProjectPaths) {
                alignProject(sourceProjectPath, targetProjectPath, options);
            }
        }
    }
}