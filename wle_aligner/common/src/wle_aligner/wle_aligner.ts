import { getProjectComponentsDefinitions } from "../common/bundle/component_utils.js";
import { Project } from "../common/project/project.js";
import { alignProjects } from "./align_projects.js";
import { ProcessReport } from "./process_report.js";

export async function wleAligner(sourceProjectPath: string, targetProjectPath: string, commanderOptions: Record<string, string>) {
    const processReport = new ProcessReport();

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
        const projectComponentsDefinitions = getProjectComponentsDefinitions(sourceProjectPath, commanderOptions, processReport);

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

function _logAlignProjectsReport(commanderOptions: Record<string, string>, processReport: ProcessReport) {
    console.error("");

    if (processReport.myProcessCompleted) {
        console.log("ALIGN Completed");
    } else {
        console.log("ALIGN Failed");
    }

    if (processReport.myEditorBundleIgnored) {
        console.error("");
        console.log("- editor bundle has been ignored, some properties might have been aligned even though they might have not represented the same on both projects");
    } else {
        if (processReport.myEditorBundleError) {
            console.error("");
            console.log("- editor bundle errors have been occurred, some properties might have been aligned even though they might have not represented the same on both projects");
        } else if (processReport.myEditorBundleExtrasError) {
            console.error("");
            console.log("- editor bundle extras errors have been occurred, some properties might have been aligned even though they might have not represented the same on both projects");
        }
    }

    console.log("");
}