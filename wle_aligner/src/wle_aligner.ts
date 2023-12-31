import path from "path";
import { extractProcessOptions, extractProcessSourceProjectPath, extractProcessTargetProjectPaths } from "./extract_process_arguments.js";
import { readProjectFile, writeProjectFile } from "./io_utils.js";

export async function alignProject() {
    // eslint-disable-next-line no-undef
    const processArguments = process.argv;

    const options = extractProcessOptions(processArguments);
    const sourceProjectPath = extractProcessSourceProjectPath(processArguments);
    const targetProjectPaths = extractProcessTargetProjectPaths(processArguments);

    const sourceProject = await readProjectFile(sourceProjectPath);

    const alignedTargetProjectPath = path.join(path.dirname(sourceProjectPath), 'aligned-' + path.basename(sourceProjectPath));
    await writeProjectFile(alignedTargetProjectPath, sourceProject);
}