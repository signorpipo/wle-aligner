// #CREDITS https://github.com/playkostudios/wle-cleaner

import { readFileSync } from "fs";
import ivm from "isolated-vm";
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

let window = {
    navigator: {},
    location: {}
};

class URL {}

let HowlerGlobal = {
    prototype: {}
};

let Howl = {
    prototype: {}
};

let Sound = {
    prototype: {}
};
`;

export function parseEditorBundle(rootDirPath: string, bundleReport: BundleReport, ignoreEditorBundle: boolean = false): Map<string, ModifiedComponentPropertyRecord> {
    const isolate = new ivm.Isolate({ memoryLimit: 128 });
    const context = isolate.createContextSync();
    const jail = context.global;
    let componentDefinitions = new Map<string, ModifiedComponentPropertyRecord>();

    jail.setSync("__marshalled__registerEditor", function (typeName: string, properties: ModifiedComponentPropertyRecord) {
        componentDefinitions.set(typeName, properties);
    });

    let editorBundleText = "";
    if (!ignoreEditorBundle) {
        const editorBundlePath = path.join(rootDirPath, "cache/js/_editor_bundle.cjs");
        try {
            editorBundleText = readFileSync(editorBundlePath, { encoding: "utf8" });
        } catch (error) {
            bundleReport.myEditorBundleError = true;
            console.error("Could not read the editor bundle: " + editorBundlePath);
        }
    }

    let editorCustomBundleText = "";
    const editorCustomBundlePath = path.join(rootDirPath, "editor_custom_bundle.js");
    try {
        editorCustomBundleText = readFileSync(editorCustomBundlePath, { encoding: "utf8" });
    } catch (error) {
        // Do nothing
    }

    const adjustedEditorBundleText = `${BUNDLE_PREAMBLE}\n${editorCustomBundleText}\n${editorBundleText}`;

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

        console.error("Could not evaluate the editor bundle.");

        if (editorBundleText.length > 0) {
            bundleReport.myEditorBundleError = true;
        } else if (editorCustomBundleText.length > 0) {
            bundleReport.myEditorCustomBundleError = true;
        }

        if (!ignoreEditorBundle && editorBundleText.length > 0 && editorCustomBundleText.length > 0) {
            console.error("Trying again with the custom bundle only");

            componentDefinitions = parseEditorBundle(rootDirPath, bundleReport, true);
        } else {
            bundleReport.myEditorBundleIgnored = true;

            componentDefinitions = new Map<string, ModifiedComponentPropertyRecord>();
        }
    }

    return componentDefinitions;
}