import path from "path";
import { getProjectComponentsDefinitions } from "./bundle_utils/component_utils.js";
import { PROCESS_OPTIONS } from "./extract_process_arguments.js";
import { readProjectFile, writeProjectFile } from "./io_utils.js";
import { ProcessReport } from "./process_report.js";

export function switchToUUID(sourceProjectPath: string, options: PROCESS_OPTIONS[]) {
    const processReport = new ProcessReport();

    const rootDirPath = path.dirname(sourceProjectPath);
    const projectComponentDefinitions = getProjectComponentsDefinitions(rootDirPath, processReport);

    console.error(processReport);
    console.error(projectComponentDefinitions);

    const sourceProject = readProjectFile(sourceProjectPath);
    const uuidTargetProjectPath = path.join(path.dirname(sourceProjectPath), 'uuid-' + path.basename(sourceProjectPath));
    writeProjectFile(uuidTargetProjectPath, sourceProject);
}