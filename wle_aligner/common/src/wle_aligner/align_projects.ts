// #CREDITS https://github.com/playkostudios/wle-cleaner

import { ModifiedComponentPropertyRecord } from "../common/bundle/modified_component_property.js";
import { Project } from "../common/project/project.js";
import { ProcessReport } from "./process_report.js";

export async function alignProjects(sourceProject: Project, targetProject: Project, projectComponentsDefinitions: Map<string, ModifiedComponentPropertyRecord>, commanderOptions: Record<string, string>, processReport: ProcessReport) {

    let changedSomething = false;
    do {
        if (commanderOptions.filter == null || commanderOptions.filter.indexOf("objects") >= 0) {
            changedSomething = changedSomething || _alignObjects();
        }

    } while (changedSomething);
}



// PRIVATE

function _alignObjects(): boolean {
    const changedSomething = false;

    return changedSomething;

}