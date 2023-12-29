import { extractProcessOptions, extractProcessSourceProjectPath, extractProcessTargetProjectPaths } from "./extract_process_arguments.js";

export async function alignProject() {
    // eslint-disable-next-line no-undef
    const processArguments = process.argv;

    const options = extractProcessOptions(processArguments);
    const sourceProjectPath = extractProcessSourceProjectPath(processArguments);
    const targetProjectPaths = extractProcessTargetProjectPaths(processArguments);

    console.error(processArguments, options, sourceProjectPath, targetProjectPaths);
}