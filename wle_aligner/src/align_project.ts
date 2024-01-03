import path from "path";
import { PROCESS_OPTIONS } from "./process_options.js";
import { readProjectFile, writeProjectFile } from "./io_utils.js";

export function alignProject(sourceProjectPath: string, targetProjectPath: string, options: PROCESS_OPTIONS[]) {
    const sourceProject = readProjectFile(sourceProjectPath);
    const targetProject = readProjectFile(targetProjectPath);

    const alignedTargetProjectPath = path.join(path.dirname(targetProjectPath), 'aligned-' + path.basename(targetProjectPath));
    writeProjectFile(alignedTargetProjectPath, targetProject);
}