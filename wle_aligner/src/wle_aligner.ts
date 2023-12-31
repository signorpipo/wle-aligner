import { alignProject } from "./align_project.js";
import { PROCESS_OPTIONS, extractProcessOptions, extractProcessSourceProjectPath, extractProcessTargetProjectPaths } from "./extract_process_arguments.js";
import { readProjectFile } from "./io_utils.js";
import { switchToUUID } from "./switch_to_uuid.js";

export async function wleAligner() {
    // eslint-disable-next-line no-undef
    const processArguments = process.argv;

    const options = extractProcessOptions(processArguments);
    const sourceProjectPath = extractProcessSourceProjectPath(processArguments);
    const targetProjectPaths = extractProcessTargetProjectPaths(processArguments);

    const targetProjects: string[] = [];
    for (const targetProjectPath of targetProjectPaths) {
        targetProjects.push(await readProjectFile(targetProjectPath));
    }

    if (options.indexOf(PROCESS_OPTIONS.SWITCH_TO_UUID) >= 0) {
        await switchToUUID(sourceProjectPath, options);
    } else {
        const sourceProject = await readProjectFile(sourceProjectPath);

        for (const targetProjectPath of targetProjectPaths) {
            await alignProject(sourceProject, targetProjectPath, options);
        }
    }

    debugger;
}