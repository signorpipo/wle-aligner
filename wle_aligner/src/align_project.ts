import path from "path";
import { PROCESS_OPTIONS } from "./extract_process_arguments.js";
import { readProjectFile, writeProjectFile } from "./io_utils.js";

export async function alignProject(sourceProject: string, targetProjectPath: string, options: PROCESS_OPTIONS[]) {
    const targetProject = await readProjectFile(targetProjectPath);

    const alignedTargetProjectPath = path.join(path.dirname(targetProjectPath), 'aligned-' + path.basename(targetProjectPath));
    await writeProjectFile(alignedTargetProjectPath, targetProject);
}