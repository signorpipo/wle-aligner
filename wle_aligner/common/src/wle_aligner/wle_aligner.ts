import { getProjectComponentsDefinitions } from "../common/bundle/component_utils.js";
import { ModifiedComponentPropertyRecord } from "../common/bundle/modified_component_property.js";
import { Project } from "../common/project/project.js";
import { alignProjects } from "./align_projects.js";
import { AlignProcessReport } from "./process_report.js";

export async function wleAligner(sourceProjectPath: string, targetProjectPath: string, commanderOptions: Record<string, string>) {
    const processReport = new AlignProcessReport();

    const sourceProject = new Project();
    try {
        await sourceProject.load(sourceProjectPath);
    } catch (error) {
        processReport.mySourceProjectLoadFailed = true;
    }

    const targetProject = new Project();
    try {
        await targetProject.load(targetProjectPath);
    } catch (error) {
        processReport.myTargetProjectLoadFailed = true;
    }

    if (!processReport.mySourceProjectLoadFailed && !processReport.myTargetProjectLoadFailed) {
        let projectComponentsDefinitions: Map<string, ModifiedComponentPropertyRecord> | null = null;

        if (commanderOptions.align == null || commanderOptions.align.indexOf("ids") >= 0) {
            projectComponentsDefinitions = getProjectComponentsDefinitions(sourceProjectPath, commanderOptions, processReport);
        }

        if ((processReport.myEditorBundleError || processReport.myEditorBundleExtrasError) && commanderOptions.unsafe == null) {
            console.error("");
            console.error("Abort process due to editor bundle failure");
            console.error("Use -u unsafe flag to ignore this error and proceed");
            console.error("");
        } else {
            await alignProjects(sourceProject, targetProject, projectComponentsDefinitions, commanderOptions, processReport);
            _logAlignProjectsReport(commanderOptions, processReport);
        }
    } else {
        console.error("");
        if (processReport.mySourceProjectLoadFailed) {
            console.error("Source project load failed");
        }
        if (processReport.myTargetProjectLoadFailed) {
            console.error("Target project load failed");
        }
        console.error("");
    }
}



// PRIVATE

function _logAlignProjectsReport(commanderOptions: Record<string, string>, processReport: AlignProcessReport) {
    console.error("");

    if (processReport.myProcessCompleted) {
        console.log("ALIGN Completed");
    } else {
        console.log("ALIGN Failed");
    }
    if (processReport.myDuplicatedIDsAfterAlign.length > 0) {
        console.error("");
        console.log("- after the align some duplicated IDs have been found");
        console.log("  this might be due to an ID which is used in the source project been already used in the target project, even though not for the same resource");
        console.log("  please check these IDs and manually adjust them before attempting again to align the projects");
        for (const duplicatedID of processReport.myDuplicatedIDsAfterAlign) {
            console.log("  - " + duplicatedID);
        }
    } else if (processReport.mySourceDuplicatedIDs.length > 0 || processReport.myTargetDuplicatedIDs.length > 0) {
        if (processReport.mySourceDuplicatedIDs.length > 0) {
            console.error("");
            console.log("- duplicated IDs have been found on the source project on different resources");
            console.log("  please check these IDs and manually adjust them before attempting again to align the projects");
            for (const duplicatedID of processReport.mySourceDuplicatedIDs) {
                console.log("  - " + duplicatedID);
            }
        }

        if (processReport.myTargetDuplicatedIDs.length > 0) {
            console.error("");
            console.log("- duplicated IDs have been found on the target project on different resources");
            console.log("  please check these IDs and manually adjust them before attempting again to align the projects");
            for (const duplicatedID of processReport.myTargetDuplicatedIDs) {
                console.log("  - " + duplicatedID);
            }
        }
    } else {
        if (processReport.myEditorBundleIgnored) {
            console.error("");
            console.log("- editor bundle has been ignored, some properties might have been aligned even though they were not an ID");
        } else {
            if (processReport.myEditorBundleError) {
                console.error("");
                console.log("- editor bundle errors have been occurred, some properties might have been aligned even though they were not an ID");
            } else if (processReport.myEditorBundleExtrasError) {
                console.error("");
                console.log("- editor bundle extras errors have been occurred, some properties might have been aligned even though they were not an ID");
            }
        }
    }

    console.log("");
}