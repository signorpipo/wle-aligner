import path from "path";
import { PROCESS_OPTIONS } from "./extract_process_arguments.js";
import { readProjectFile, writeProjectFile } from "./io_utils.js";

export async function switchToUUID(sourceProjectPath: string, options: PROCESS_OPTIONS[]) {
    const sourceProject = await readProjectFile(sourceProjectPath);

    const uuidTargetProjectPath = path.join(path.dirname(sourceProjectPath), 'uuid-' + path.basename(sourceProjectPath));
    await writeProjectFile(uuidTargetProjectPath, sourceProject);
}