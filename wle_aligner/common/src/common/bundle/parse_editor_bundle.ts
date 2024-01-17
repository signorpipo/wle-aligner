// #CREDITS https://github.com/playkostudios/wle-cleaner

import { readFileSync } from "fs";
import ivm from "isolated-vm";
import { parse as parsePath, resolve as resolvePath } from 'node:path';
import path from "path";
import { BundleReport } from "./bundle_report.js";
import { ModifiedComponentPropertyRecord } from "./modified_component_property.js";

const BUNDLE_PREAMBLE = `
function _registerEditor(regExports) {
    for (const possibleComponent of Object.values(regExports)) {
        const typeName = possibleComponent.TypeName;
        if (typeof typeName === "string") {
            const properties = {};
            if (possibleComponent.Properties) {
                for (const [propName, propType] of Object.entries(possibleComponent.Properties)) {
                    properties[propName] = propType;
                }
            }
            __marshalled__registerEditor(typeName, properties);
        }
    }
}
`;

export function parseEditorBundle(projectPath: string, commanderOptions: Record<string, string>, bundleReport: BundleReport, ignoreEditorBundle: boolean = false): Map<string, ModifiedComponentPropertyRecord> {
    const isolate = new ivm.Isolate({ memoryLimit: 128 });
    const context = isolate.createContextSync();
    const jail = context.global;
    let componentDefinitions = new Map<string, ModifiedComponentPropertyRecord>();

    jail.setSync("__marshalled__registerEditor", function (typeName: string, properties: ModifiedComponentPropertyRecord) {
        componentDefinitions.set(typeName, properties);
    });

    const rootDirPath = path.dirname(projectPath);

    let editorBundleText = "";
    if (!ignoreEditorBundle) {
        let editorBundlePath = commanderOptions.editorBundle;
        if (editorBundlePath == null) {
            editorBundlePath = resolvePath(parsePath(projectPath).dir, "cache/js/_editor_bundle.cjs");
        } else {
            editorBundlePath = resolvePath(editorBundlePath);
        }

        try {
            editorBundleText = readFileSync(editorBundlePath, { encoding: "utf8" });
        } catch (error) {
            bundleReport.myEditorBundleError = true;
            console.error("Could not read the editor bundle: " + editorBundlePath);
        }
    }

    let editorBundleExtrasText = "";
    let editorBundleExtrasPath = commanderOptions.editorBundleExtras;
    if (editorBundleExtrasPath == null) {
        editorBundleExtrasPath = resolvePath(parsePath(projectPath).dir, "editor-bundle-extras.js");
    } else {
        editorBundleExtrasPath = resolvePath(editorBundleExtrasPath);
    }

    try {
        editorBundleExtrasText = readFileSync(editorBundleExtrasPath, { encoding: "utf8" });
    } catch (error) {
        // Do nothing
    }

    const adjustedEditorBundleText = `${BUNDLE_PREAMBLE}\n${editorBundleExtrasText}\n${editorBundleText}`;

    try {
        const editorIndexModule = isolate.compileModuleSync(adjustedEditorBundleText);
        editorIndexModule.instantiateSync(context, (specifier) => {
            throw new Error(`Unexpected import in editor bundle: ${specifier}`);
        });
        editorIndexModule.evaluateSync();

        context.release();
        isolate.dispose();
    } catch (error) {
        context.release();
        isolate.dispose();

        console.error(error);

        console.error("");
        console.error("Could not evaluate the editor bundle");

        if (editorBundleText.length > 0) {
            bundleReport.myEditorBundleError = true;
        } else if (editorBundleExtrasText.length > 0) {
            bundleReport.myEditorBundleExtrasError = true;
        }

        if (!ignoreEditorBundle && editorBundleText.length > 0 && editorBundleExtrasText.length > 0) {
            console.error("A second attempt will be performed using only the bundle extras script");

            componentDefinitions = parseEditorBundle(rootDirPath, commanderOptions, bundleReport, true);
        } else {
            console.error("You might have to specify some extra definitions through the editor bundle extras option");

            bundleReport.myEditorBundleIgnored = true;

            componentDefinitions = new Map<string, ModifiedComponentPropertyRecord>();
        }
    }

    return componentDefinitions;
}