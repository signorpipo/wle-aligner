import path from "path";
import { PROCESS_OPTIONS } from "./extract_process_arguments.js";
import { readProjectFile, writeProjectFile } from "./io_utils.js";

export function switchToUUID(sourceProjectPath: string, options: PROCESS_OPTIONS[]) {
    const sourceProject = readProjectFile(sourceProjectPath);

    const uuidTargetProjectPath = path.join(path.dirname(sourceProjectPath), 'uuid-' + path.basename(sourceProjectPath));
    writeProjectFile(uuidTargetProjectPath, sourceProject);
}