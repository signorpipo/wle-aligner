import { CommanderError, program } from "commander";
import { globSync } from "glob";
import { parse as parsePath, resolve as resolvePath } from "node:path";
import { getProjectComponentsDefinitions } from "../common/bundle/component_utils.js";
import { Project } from "../common/project/project.js";
import { ProcessReport } from "./process_report.js";
import { getDuplicateIDs, switchToUUID } from "./switch_to_uuid.js";

export async function wleUUIDifyProjects(projectGlobPaths: string, commanderOptions: Record<string, string>) {
    try {
        const projectPaths: string[] = [];
        for (const projectGlobRaw of projectGlobPaths) {
            const projectPathsRaw = globSync(projectGlobRaw);
            for (const projectPathRaw of projectPathsRaw) {
                const projectPath = resolvePath(projectPathRaw);
                if (projectPaths.indexOf(projectPath) < 0) projectPaths.push(projectPath);
            }
        }

        if (commanderOptions.output != null) {
            if (commanderOptions.replace != null) {
                throw new CommanderError(1, "output-replace-clash", "--output option cannot be used with --replace flag\n");
            }

            if (projectPaths.length > 1) {
                throw new CommanderError(1, "output-multiple-proj-clash", "--output option cannot be used when multiple projects are specified\n");
            }
        }

        for (let i = 0; i < projectPaths.length; i++) {
            if (i > 0) {
                console.log("-");
                console.log("");
            }

            const projectPath = projectPaths[i];

            let uuidifyPrefix = parsePath(projectPath).base;
            if (projectPaths.length > 1) {
                uuidifyPrefix = (i + 1) + " / " + projectPaths.length + " - " + parsePath(projectPath).base;
            }

            await wleUUIDify(projectPath, uuidifyPrefix, commanderOptions);
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

export async function wleUUIDify(projectPath: string, uuidifyPrefix: string, commanderOptions: Record<string, string>) {
    if (uuidifyPrefix.length > 0) {
        console.log("UUIDIFY " + uuidifyPrefix);
    }

    const processReport = new ProcessReport();

    const project = new Project();
    try {
        await project.load(projectPath);
    } catch (error) {
        processReport.myProjectLoadFailed = true;
    }

    if (!processReport.myProjectLoadFailed) {
        const projectComponentsDefinitions = getProjectComponentsDefinitions(projectPath, commanderOptions, processReport);

        if ((processReport.myEditorBundleError || processReport.myEditorBundleExtrasError) && commanderOptions.unsafe == null) {
            console.log("");
            console.log("Abort process due to editor bundle failure");
            console.log("Use -u unsafe flag to ignore this error and proceed");
            console.log("");
        } else if (commanderOptions.duplicates != null) {
            processReport.myDuplicatedIDs.push(...getDuplicateIDs(project));

            if (processReport.myDuplicatedIDs.length > 0) {
                console.log("");
                console.log("Duplicated IDs have been found on different resources");
                console.log("Please check these IDs and manually adjust them before attempting again to uuidify the project");
                for (const duplicatedID of processReport.myDuplicatedIDs) {
                    console.log("- " + duplicatedID);
                }
            } else {
                console.log("");
                console.log("No duplicated IDs have been found");
            }

            console.log("");
        } else {
            await switchToUUID(project, projectComponentsDefinitions, commanderOptions, processReport);
            _logSwitchToUUIDReport(uuidifyPrefix, commanderOptions, processReport);
        }
    } else {
        console.log("");
        console.log("Project load failed");
        console.log("");
    }
}



// PRIVATE

function _logSwitchToUUIDReport(uuidifyPrefix: string, commanderOptions: Record<string, string>, processReport: ProcessReport) {
    if (processReport.myDuplicatedIDAfterSwitch) {
        console.log("");
        console.log("- after the switch to UUIDs some duplicated IDs have been found");
        console.log("  this might be due to a rare coincidence where a UUID have been generated that was already present in the project");
        console.log("  run the process again");
    } else if (processReport.myDuplicatedIDs.length > 0) {
        console.log("");
        console.log("- duplicated IDs have been found on different resources");
        console.log("  please check these IDs and manually adjust them before attempting again to uuidify the project");
        for (const duplicatedID of processReport.myDuplicatedIDs) {
            console.log("  - " + duplicatedID);
        }
    } else {
        if (processReport.myEditorBundleIgnored) {
            console.log("");
            console.log("- editor bundle has been ignored, some properties might have been changed even though they were not an ID");
        } else {
            if (processReport.myEditorBundleError) {
                console.log("");
                console.log("- editor bundle errors have been occurred, some properties might have been changed even though they were not an ID");
            } else if (processReport.myEditorBundleExtrasError) {
                console.log("");
                console.log("- editor bundle extras errors have been occurred, some properties might have been changed even though they were not an ID");
            }
        }

        if (processReport.myComponentsPropertiesAsIDUnsafe.size > 0) {
            console.log("");

            if (commanderOptions.unsafe != null) {
                console.log("- some component properties have been considered an ID but might not be");
            } else {
                console.log("- some component properties have been ignored even though they might have been an ID");
                console.log("  you can use the unsafe flag -u to also switch them");
            }

            for (const componentType of processReport.myComponentsPropertiesAsIDUnsafe.keys()) {
                console.log("  - " + componentType);
                for (const propertyName of processReport.myComponentsPropertiesAsIDUnsafe.get(componentType)!) {
                    console.log("    - " + propertyName);
                }
            }
        }

        if (processReport.myPipelineShaderPropertiesAsID.size > 0) {
            console.log("");
            console.log("- some pipeline shader properties have been considered an ID but might not be");
            for (const shaderName of processReport.myPipelineShaderPropertiesAsID.keys()) {
                console.log("  - " + shaderName);
                for (const shaderPropertyName of processReport.myPipelineShaderPropertiesAsID.get(shaderName)!) {
                    console.log("    - " + shaderPropertyName);
                }
            }
        }
    }

    console.log("");
    if (processReport.myProcessCompleted) {
        console.log("UUIDIFY Completed " + uuidifyPrefix);
    } else {
        console.log("UUIDIFY Failed " + uuidifyPrefix);
    }
    console.log("");
}