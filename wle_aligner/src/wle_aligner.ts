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
        } else {
            for (const targetProjectPath of targetProjectPaths) {
                alignProject(sourceProjectPath, targetProjectPath, options);
            }
        }
    }
}