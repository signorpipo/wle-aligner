import { extractProcessOptions } from "../common/cauldron/process_arguments_utils.js";

export enum PROCESS_OPTIONS {
    RISKY = 0,
    OVERWRITE = 1
}

export function extractSwitchUUIDProcessOptions(processArguments: string[]): PROCESS_OPTIONS[] {
    const processOptionsMap: Map<string, PROCESS_OPTIONS> = new Map();

    processOptionsMap.set("--risky", PROCESS_OPTIONS.RISKY);
    processOptionsMap.set("-r", PROCESS_OPTIONS.RISKY);

    processOptionsMap.set("--overwrite", PROCESS_OPTIONS.OVERWRITE);
    processOptionsMap.set("-o", PROCESS_OPTIONS.OVERWRITE);

    return extractProcessOptions(processArguments, processOptionsMap);
}