import path from "path";
import { alignProject } from "./align_project.js";
import { PROCESS_OPTIONS, extractProcessOptions, extractProcessSourceProjectPath, extractProcessTargetProjectPaths } from "./process_options.js";
import { ProcessReport } from "./process_report.js";
import { switchToUUID } from "./switch_to_uuid.js";
import { getProjectComponentsDefinitions } from "./bundle/component_utils.js";

export async function wleAligner() {
    // eslint-disable-next-line no-undef
    const processArguments = process.argv;

    const options = extractProcessOptions(processArguments);
    const sourceProjectPath = extractProcessSourceProjectPath(processArguments);
    const targetProjectPaths = extractProcessTargetProjectPaths(processArguments);

    const processReport = new ProcessReport();

    const rootDirPath = path.dirname(sourceProjectPath);
    const projectComponentDefinitions = getProjectComponentsDefinitions(rootDirPath, processReport);

    console.error(projectComponentDefinitions);
    console.error(processReport);

    if ((processReport.myEditorBundleError || processReport.myEditorCustomBundleError) && options.indexOf(PROCESS_OPTIONS.FAIL_ON_BUNDLE_FAILURE) >= 0) {
        console.error("Abort process due to editor bundle failure");
    } else {
        if (options.indexOf(PROCESS_OPTIONS.SWITCH_TO_UUID) >= 0) {
            await switchToUUID(sourceProjectPath, projectComponentDefinitions, options, processReport);
        } else {
            for (const targetProjectPath of targetProjectPaths) {
                alignProject(sourceProjectPath, targetProjectPath, options);
            }
        }
    }

    debugger;
}