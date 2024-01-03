import { ModifiedComponentPropertyRecord } from "./bundle/modified_component_property.js";
import { PROCESS_OPTIONS } from "./process_options.js";
import { ProcessReport } from "./process_report.js";
import { replaceParentTokenKey } from "./project/jsonast_utils.js";
import { Project } from "./project/project.js";

export async function switchToUUID(sourceProjectPath: string, projectComponentDefinitions: Map<string, ModifiedComponentPropertyRecord>, options: PROCESS_OPTIONS[], processReport: ProcessReport) {
    const sourceProject = new Project();
    await sourceProject.load(sourceProjectPath);

    replaceParentTokenKey("18", "ciao", sourceProject.myObjects);

    sourceProject.save("uuid");
}