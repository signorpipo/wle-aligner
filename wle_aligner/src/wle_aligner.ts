import { alignProject } from "./align_project.js";
import { PROCESS_OPTIONS, extractProcessOptions, extractProcessSourceProjectPath, extractProcessTargetProjectPaths } from "./extract_process_arguments.js";
import { switchToUUID } from "./switch_to_uuid.js";

export function wleAligner() {
    // eslint-disable-next-line no-undef
    const processArguments = process.argv;

    const options = extractProcessOptions(processArguments);
    const sourceProjectPath = extractProcessSourceProjectPath(processArguments);
    const targetProjectPaths = extractProcessTargetProjectPaths(processArguments);

    if (options.indexOf(PROCESS_OPTIONS.SWITCH_TO_UUID) >= 0) {
        switchToUUID(sourceProjectPath, options);
    } else {
        for (const targetProjectPath of targetProjectPaths) {
            alignProject(sourceProjectPath, targetProjectPath, options);
        }
    }

    debugger;
}