import { CommanderError, program } from "commander";
import { globSync } from "glob";
import { parse as parsePath, resolve as resolvePath } from "node:path";
import { getProjectComponentsDefinitions } from "../common/bundle/component_utils.js";
import { ModifiedComponentPropertyRecord } from "../common/bundle/modified_component_property.js";
import { Project } from "../common/project/project.js";
import { alignProjects } from "./align_projects.js";
import { AlignProcessReport } from "./align_process_report.js";

export async function wleAlignProjects(sourceProjectGlobPath: string, targetProjectGlobPaths: string[], commanderOptions: Record<string, string>) {
    try {
        const targetProjectPaths: string[] = [];
        for (const targetProjectGlobRaw of targetProjectGlobPaths) {
            const targetProjectPathsRaw = globSync(targetProjectGlobRaw);
            for (const targetProjectPathRaw of targetProjectPathsRaw) {
                const targetProjectPath = resolvePath(targetProjectPathRaw);
                if (targetProjectPaths.indexOf(targetProjectPath) < 0) targetProjectPaths.push(targetProjectPath);
            }
        }

        if (commanderOptions.output != null) {
            if (commanderOptions.replace != null) {
                throw new CommanderError(1, "output-replace-clash", "--output option cannot be used with --replace option\n");
            }

            if (targetProjectPaths.length > 1) {
                throw new CommanderError(1, "output-multiple-projects-clash", "--output option cannot be used when multiple projects are specified\n");
            }
        }

        if (commanderOptions.allCombinations != null && commanderOptions.replace == null) {
            throw new CommanderError(1, "all-combinations-replace-clash", "--all-combinations option can be used only when the --replace option is also specified\n");
        }

        let sourceProjectPaths: string[] = [];
        if (commanderOptions.allCombinations == null) {
            sourceProjectPaths.push(resolvePath(sourceProjectGlobPath));
        } else {
            const sourceProjectPathIndex = targetProjectPaths.indexOf(resolvePath(sourceProjectGlobPath));
            if (sourceProjectPathIndex >= 0) {
                targetProjectPaths.splice(sourceProjectPathIndex, 1);
            }
            targetProjectPaths.unshift(resolvePath(sourceProjectGlobPath));

            sourceProjectPaths = targetProjectPaths.slice(0);
        }

        let totalAlignToPerform = 0;
        const alignProjectPathMap = new Map<string, string[]>();
        for (let i = 0; i < sourceProjectPaths.length; i++) {
            const sourceProjectPath = sourceProjectPaths[i];
            const sourceIndex = targetProjectPaths.indexOf(sourceProjectPath);
            if (sourceIndex >= 0) {
                targetProjectPaths.splice(sourceIndex, 1);
            }
            totalAlignToPerform += targetProjectPaths.length;
            alignProjectPathMap.set(sourceProjectPath, targetProjectPaths.slice(0));
        }

        let currentAlignCount = 1;
        let lastTargetProjectPath = "";
        const failedProjectPathPairs: string[][] = [];
        for (const [sourceProjectPath, sourceTargetProjectPaths] of alignProjectPathMap.entries()) {
            for (let i = 0; i < sourceTargetProjectPaths.length; i++) {
                if (currentAlignCount > 1) {
                    console.log("-");
                    console.log("");
                }

                const targetProjectPath = sourceTargetProjectPaths[i];
                if (targetProjectPath == lastTargetProjectPath) {
                    // #WARN This is done to hotfix an issue where waiting for the file to be written does not actually wait until it's over
                    await new Promise(resolve => setTimeout(resolve, 4000));
                }

                lastTargetProjectPath = targetProjectPath;

                let alignPrefix = " - source: " + parsePath(sourceProjectPath).base + " / " + "target: " + parsePath(targetProjectPath).base;
                if (totalAlignToPerform > 1) {
                    alignPrefix = currentAlignCount + " / " + totalAlignToPerform + alignPrefix;
                }

                currentAlignCount++;

                if (!await wleAlign(sourceProjectPath, targetProjectPath, alignPrefix, commanderOptions)) {
                    failedProjectPathPairs.push([parsePath(sourceProjectPath).base, parsePath(targetProjectPath).base]);
                }
            }
        }

        if (failedProjectPathPairs.length > 0) {
            console.log("-");
            console.log("");
            console.log("ALIGN failed for the following project pairs");
            for (const failedProjectPathPair of failedProjectPathPairs) {
                console.log("  - source: " + failedProjectPathPair[0] + " / " + "target: " + failedProjectPathPair[1]);
            }
            console.log("");
        } else if (totalAlignToPerform > 1) {
            console.log("-");
            console.log("");
            console.log("ALIGN completed for all projects");
            console.log("");
        }
    } catch (error) {
        if (error instanceof CommanderError) {
            program.error(error.message, { exitCode: error.exitCode, code: error.code });
        } else {
            console.log(error);
            console.log("");
            program.error("Unexpected error occurred", { exitCode: 63, code: "unexpected" });
        }
    }
}

export async function wleAlign(sourceProjectPath: string, targetProjectPath: string, alignPrefix: string, commanderOptions: Record<string, string>): Promise<boolean> {
    if (alignPrefix.length > 0) {
        console.log("ALIGN " + alignPrefix);
    }

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
        console.error(error);
        processReport.myTargetProjectLoadFailed = true;
    }

    if (!processReport.mySourceProjectLoadFailed && !processReport.myTargetProjectLoadFailed) {
        let projectComponentsDefinitions: Map<string, ModifiedComponentPropertyRecord> | null = null;

        if (commanderOptions.align == null || commanderOptions.align.indexOf("ids") >= 0) {
            projectComponentsDefinitions = getProjectComponentsDefinitions(sourceProjectPath, commanderOptions, processReport);
        }

        if ((processReport.myEditorBundleError || processReport.myEditorBundleExtrasError) && commanderOptions.unsafe == null) {
            console.log("");
            console.log("Abort process due to editor bundle failure");
            console.log("Use -u unsafe flag to ignore this error and proceed");
            console.log("");
        } else {
            await alignProjects(sourceProject, targetProject, projectComponentsDefinitions, commanderOptions, processReport);
            _logAlignProjectsReport(alignPrefix, commanderOptions, processReport);
        }
    } else {
        console.log("");
        if (processReport.mySourceProjectLoadFailed) {
            console.log("Source project load failed");
        }
        if (processReport.myTargetProjectLoadFailed) {
            console.log("Target project load failed");
        }
        console.log("");
    }

    return processReport.myProcessCompleted;
}



// PRIVATE

function _logAlignProjectsReport(alignPrefix: string, commanderOptions: Record<string, string>, processReport: AlignProcessReport) {
    if (processReport.myDuplicatedIDsAfterAlign.length > 0) {
        console.log("");
        console.log("- after the align some duplicated IDs have been found");
        console.log("  this might be due to an ID which is used in the source project been already used in the target project, even though not for the same resource");
        console.log("  please check these IDs and manually adjust them before attempting again to align the projects");
        for (const duplicatedID of processReport.myDuplicatedIDsAfterAlign) {
            console.log("  - " + duplicatedID);
        }
    } else if (processReport.mySourceDuplicatedIDs.length > 0 || processReport.myTargetDuplicatedIDs.length > 0) {
        if (processReport.mySourceDuplicatedIDs.length > 0) {
            console.log("");
            console.log("- duplicated IDs have been found on the source project on different resources");
            console.log("  please check these IDs and manually adjust them before attempting again to align the projects");
            for (const duplicatedID of processReport.mySourceDuplicatedIDs) {
                console.log("  - " + duplicatedID);
            }
        }

        if (processReport.myTargetDuplicatedIDs.length > 0) {
            console.log("");
            console.log("- duplicated IDs have been found on the target project on different resources");
            console.log("  please check these IDs and manually adjust them before attempting again to align the projects");
            for (const duplicatedID of processReport.myTargetDuplicatedIDs) {
                console.log("  - " + duplicatedID);
            }
        }
    } else {
        if (processReport.myEditorBundleIgnored) {
            console.log("");
            console.log("- editor bundle has been ignored, some properties might have been aligned even though they were not an ID");
        } else {
            if (processReport.myEditorBundleError) {
                console.log("");
                console.log("- editor bundle errors have been occurred, some properties might have been aligned even though they were not an ID");
            } else if (processReport.myEditorBundleExtrasError) {
                console.log("");
                console.log("- editor bundle extras errors have been occurred, some properties might have been aligned even though they were not an ID");
            }
        }

        if (processReport.myNotUniqueResourceIDs.length > 0) {
            console.log("");
            console.log("- some resources have been aligned even if they were not unique");
            console.log("  the way they have been aligned is to just align them in order (first found in the source with the first found in the target, and so on)");
            console.log("  the following IDs have been aligned this way, you might want to check other similar resources in the project to be sure they have been properly aligned");
            for (const notUniqueResourceID of processReport.myNotUniqueResourceIDs) {
                console.log("  - " + notUniqueResourceID);
            }
        }
    }

    console.log("");
    if (processReport.myProcessCompleted) {
        console.log("ALIGN Completed " + alignPrefix);
    } else {
        console.log("ALIGN Failed " + alignPrefix);
    }
    console.log("");
}