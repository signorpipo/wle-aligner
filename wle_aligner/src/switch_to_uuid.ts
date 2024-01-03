import path from "path";
import { ModifiedComponentPropertyRecord } from "./bundle_utils/modified_component_property.js";
import { PROCESS_OPTIONS } from "./process_options.js";
import { readProjectFile, writeProjectFile } from "./io_utils.js";
import { ProcessReport } from "./process_report.js";

export function switchToUUID(sourceProjectPath: string, projectComponentDefinitions: Map<string, ModifiedComponentPropertyRecord>, options: PROCESS_OPTIONS[], processReport: ProcessReport) {
    const sourceProject = readProjectFile(sourceProjectPath);
    const uuidTargetProjectPath = path.join(path.dirname(sourceProjectPath), 'uuid-' + path.basename(sourceProjectPath));
    writeProjectFile(uuidTargetProjectPath, sourceProject);
}