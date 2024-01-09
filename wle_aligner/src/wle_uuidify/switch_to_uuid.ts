// #CREDITS https://github.com/playkostudios/wle-cleaner

import { ArrayToken, JSONTokenType, JSONValueToken, ObjectToken, StringToken } from "@playkostudios/jsonc-ast";
import { Type } from "@wonderlandengine/api";
import crypto from "crypto";
import { customPhysxMeshOptsType } from "../common/bundle/component_utils.js";
import { ModifiedComponentProperty, ModifiedComponentPropertyRecord } from "../common/bundle/modified_component_property.js";
import { ParentChildTokenPair, getJSONTokensHierarchy, replaceParentTokenKey } from "../common/project/jsonast_utils.js";
import { Project } from "../common/project/project.js";
import { PROCESS_OPTIONS } from "./process_options.js";
import { ProcessReport } from "./process_report.js";

export async function switchToUUID(projectPath: string, projectComponentsDefinitions: Map<string, ModifiedComponentPropertyRecord>, options: PROCESS_OPTIONS[], processReport: ProcessReport) {
    const project = new Project();
    await project.load(projectPath);

    const idTokens = _getIDTokens(project, projectComponentsDefinitions, options, processReport);

    _switchTokenToUUID(project.myObjects, idTokens, processReport);
    _switchTokenToUUID(project.myMeshes, idTokens, processReport);
    _switchTokenToUUID(project.myTextures, idTokens, processReport);
    _switchTokenToUUID(project.myImages, idTokens, processReport);
    _switchTokenToUUID(project.myMaterials, idTokens, processReport);
    _switchTokenToUUID(project.myShaders, idTokens, processReport);
    _switchTokenToUUID(project.myAnimations, idTokens, processReport);
    _switchTokenToUUID(project.mySkins, idTokens, processReport);
    _switchTokenToUUID(project.myPipelines, idTokens, processReport);
    _switchTokenToUUID(project.myFiles, idTokens, processReport);
    _switchTokenToUUID(project.myFonts, idTokens, processReport);
    _switchTokenToUUID(project.myLanguages, idTokens, processReport);

    if (options.indexOf(PROCESS_OPTIONS.OVERWRITE) >= 0) {
        project.save();
    } else {
        project.save("uuid");
    }
}



// PRIVATE

function _getIDTokens(project: Project, projectComponentsDefinitions: Map<string, ModifiedComponentPropertyRecord>, options: PROCESS_OPTIONS[], processReport: ProcessReport): ParentChildTokenPair[] {
    const idTokens: ParentChildTokenPair[] = [];

    idTokens.push(..._getIDTokensFromObjects(project, projectComponentsDefinitions, options, processReport));
    idTokens.push(..._getIDTokensFromMaterials(project, options, processReport));
    idTokens.push(..._getIDTokensFromSkins(project, options));
    idTokens.push(..._getIDTokensFromPipelines(project, options));
    idTokens.push(..._getIDTokensFromSettings(project, options));

    return idTokens;
}

function _getIDTokensFromMaterials(project: Project, options: PROCESS_OPTIONS[], processReport: ProcessReport): ParentChildTokenPair[] {
    const idTokens: ParentChildTokenPair[] = [];

    for (const [__materialID, materialTokenToCheck] of project.myMaterials.getTokenEntries()) {
        const materialToken = ObjectToken.assert(materialTokenToCheck);

        const pipelineTokenToCheck = materialToken.maybeGetValueTokenOfKey("pipeline");
        if (pipelineTokenToCheck) {
            if (pipelineTokenToCheck.type === JSONTokenType.String && _isIncrementalNumberID(StringToken.assert(pipelineTokenToCheck).evaluate())) {
                idTokens.push(new ParentChildTokenPair(materialToken, StringToken.assert(pipelineTokenToCheck)));
            }
        }

        for (const [materialPropertyID, materialPropertyTokenToCheck] of materialToken.getTokenEntries()) {
            if (materialPropertyTokenToCheck.type == JSONTokenType.Object) {
                const materialPropertyToken = ObjectToken.assert(materialPropertyTokenToCheck);
                for (const [materialPropertyPropertyID, materialPropertyPropertyTokenToCheck] of materialPropertyToken.getTokenEntries()) {
                    if (materialPropertyPropertyTokenToCheck.type === JSONTokenType.String && _isIncrementalNumberID(StringToken.assert(materialPropertyPropertyTokenToCheck).evaluate())) {
                        let pipelineShaderPropertiesAsID = processReport.myPipelineShaderPropertiesAsID.get(materialPropertyID);
                        if (pipelineShaderPropertiesAsID == null) {
                            processReport.myPipelineShaderPropertiesAsID.set(materialPropertyID, []);
                            pipelineShaderPropertiesAsID = processReport.myPipelineShaderPropertiesAsID.get(materialPropertyID);
                        }

                        if (pipelineShaderPropertiesAsID?.indexOf(materialPropertyPropertyID) == -1) {
                            pipelineShaderPropertiesAsID?.push(materialPropertyPropertyID);
                        }

                        idTokens.push(new ParentChildTokenPair(materialPropertyToken, StringToken.assert(materialPropertyPropertyTokenToCheck)));
                    }
                }
            }
        }
    }

    return idTokens;
}

function _getIDTokensFromSettings(project: Project, options: PROCESS_OPTIONS[]): ParentChildTokenPair[] {
    const idTokens: ParentChildTokenPair[] = [];

    idTokens.push(...getJSONTokensHierarchy(function (tokenKey: string, tokenToCheck: JSONValueToken): boolean {
        return tokenKey == "viewObject" && tokenToCheck.type === JSONTokenType.String && _isIncrementalNumberID(StringToken.assert(tokenToCheck).evaluate());
    }, project.mySettings));
    idTokens.push(...getJSONTokensHierarchy(function (tokenKey: string, tokenToCheck: JSONValueToken): boolean {
        return tokenKey == "leftEyeObject" && tokenToCheck.type === JSONTokenType.String && _isIncrementalNumberID(StringToken.assert(tokenToCheck).evaluate());
    }, project.mySettings));
    idTokens.push(...getJSONTokensHierarchy(function (tokenKey: string, tokenToCheck: JSONValueToken): boolean {
        return tokenKey == "rightEyeObject" && tokenToCheck.type === JSONTokenType.String && _isIncrementalNumberID(StringToken.assert(tokenToCheck).evaluate());
    }, project.mySettings));
    idTokens.push(...getJSONTokensHierarchy(function (tokenKey: string, tokenToCheck: JSONValueToken): boolean {
        return tokenKey == "appIcon" && tokenToCheck.type === JSONTokenType.String && _isIncrementalNumberID(StringToken.assert(tokenToCheck).evaluate());
    }, project.mySettings));
    idTokens.push(...getJSONTokensHierarchy(function (tokenKey: string, tokenToCheck: JSONValueToken): boolean {
        return tokenKey == "material" && tokenToCheck.type === JSONTokenType.String && _isIncrementalNumberID(StringToken.assert(tokenToCheck).evaluate());
    }, project.mySettings));

    return idTokens;
}

function _getIDTokensFromSkins(project: Project, options: PROCESS_OPTIONS[]): ParentChildTokenPair[] {
    const idTokens: ParentChildTokenPair[] = [];

    for (const [__skinID, skinTokenToCheck] of project.mySkins.getTokenEntries()) {
        const skinToken = ObjectToken.assert(skinTokenToCheck);

        const jointsTokenToCheck = skinToken.maybeGetValueTokenOfKey("joints");
        if (jointsTokenToCheck) {
            if (jointsTokenToCheck.type === JSONTokenType.Array) {
                const jointsToken = ArrayToken.assert(jointsTokenToCheck);
                const jointIDTokensToCheck = jointsToken.getTokenEntries();
                for (const jointIDTokenToCheck of jointIDTokensToCheck) {
                    if (jointIDTokenToCheck.type == JSONTokenType.String && _isIncrementalNumberID(StringToken.assert(jointIDTokenToCheck).evaluate())) {
                        idTokens.push(new ParentChildTokenPair(jointsToken, StringToken.assert(jointIDTokenToCheck)));
                    }
                }
            }
        }
    }

    return idTokens;
}

function _getIDTokensFromPipelines(project: Project, options: PROCESS_OPTIONS[]): ParentChildTokenPair[] {
    const idTokens: ParentChildTokenPair[] = [];

    for (const [__pipelineID, pipelineTokenToCheck] of project.myPipelines.getTokenEntries()) {
        const pipelineToken = ObjectToken.assert(pipelineTokenToCheck);

        const shaderTokenToCheck = pipelineToken.maybeGetValueTokenOfKey("shader");
        if (shaderTokenToCheck) {
            if (shaderTokenToCheck.type === JSONTokenType.String && _isIncrementalNumberID(StringToken.assert(shaderTokenToCheck).evaluate())) {
                idTokens.push(new ParentChildTokenPair(pipelineToken, StringToken.assert(shaderTokenToCheck)));
            }
        }
    }

    return idTokens;
}

function _getIDTokensFromObjects(project: Project, projectComponentsDefinitions: Map<string, ModifiedComponentPropertyRecord>, options: PROCESS_OPTIONS[], processReport: ProcessReport): ParentChildTokenPair[] {
    const idTokens: ParentChildTokenPair[] = [];

    for (const [__objectID, objectTokenToCheck] of project.myObjects.getTokenEntries()) {
        const objectToken = ObjectToken.assert(objectTokenToCheck);

        const parentTokenToCheck = objectToken.maybeGetValueTokenOfKey("parent");
        if (parentTokenToCheck) {
            if (parentTokenToCheck.type === JSONTokenType.String && _isIncrementalNumberID(StringToken.assert(parentTokenToCheck).evaluate())) {
                idTokens.push(new ParentChildTokenPair(objectToken, StringToken.assert(parentTokenToCheck)));
            }
        }

        const componentsTokenToCheck = objectToken.maybeGetValueTokenOfKey("components");
        if (componentsTokenToCheck) {
            const componentsToken = ArrayToken.assert(componentsTokenToCheck);
            const components = componentsToken.getTokenEntries();
            for (const componentTokenToCheck of components) {
                if (componentTokenToCheck.type !== JSONTokenType.Object) continue;

                const componentToken = ObjectToken.assert(componentTokenToCheck);
                for (const [componentKey, componentPropertiesTokenToCheck] of componentToken.getTokenEntries()) {
                    if (componentPropertiesTokenToCheck.type == JSONTokenType.Object) {
                        const componentProperties = projectComponentsDefinitions.get(componentKey);
                        if (!componentProperties && options.indexOf(PROCESS_OPTIONS.RISKY) == -1) continue;

                        const componentPropertiesToken = ObjectToken.assert(componentPropertiesTokenToCheck);
                        for (const [propertyKey, propertyValueTokenToCheck] of componentPropertiesToken.getTokenEntries()) {
                            if (_isPropertyValueTokenID(propertyKey, propertyValueTokenToCheck, componentKey, componentProperties, options, processReport)) {
                                idTokens.push(new ParentChildTokenPair(componentPropertiesToken, propertyValueTokenToCheck));
                            } else if (_isPhysXMeshToken(componentKey, propertyKey, propertyValueTokenToCheck, componentProperties, options, processReport)) {
                                const objectPropertyValue = ObjectToken.assert(propertyValueTokenToCheck);
                                const meshPropertyValueTokenToCheck = objectPropertyValue.maybeGetValueTokenOfKey("mesh");
                                if (meshPropertyValueTokenToCheck) {
                                    idTokens.push(new ParentChildTokenPair(objectPropertyValue, StringToken.assert(meshPropertyValueTokenToCheck)));
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    return idTokens;
}

const _isPropertyValueTokenID = function () {
    const idTypes: (Type | symbol)[] = [Type.Mesh, Type.Texture, Type.Animation, Type.Material, Type.Object, Type.Skin];
    return function (propertyKey: string, propertyValueTokenToCheck: JSONValueToken, componentType: string, projectComponentDefinitions: ModifiedComponentPropertyRecord | undefined, options: PROCESS_OPTIONS[], processReport: ProcessReport): boolean {
        let isID = false;

        let propertyDefinition: ModifiedComponentProperty | null = null;

        if (projectComponentDefinitions) {
            propertyDefinition = projectComponentDefinitions[propertyKey];
        }

        if (!propertyDefinition) {
            const isRisky = options.indexOf(PROCESS_OPTIONS.RISKY) >= 0;

            isID = propertyKey != "name" && propertyValueTokenToCheck.type === JSONTokenType.String && _isIncrementalNumberID(StringToken.assert(propertyValueTokenToCheck).evaluate());

            if (isID) {
                let componentPropertiesAsIDRisky = processReport.myComponentsPropertiesAsIDRisky.get(componentType);
                if (componentPropertiesAsIDRisky == null) {
                    processReport.myComponentsPropertiesAsIDRisky.set(componentType, []);
                    componentPropertiesAsIDRisky = processReport.myComponentsPropertiesAsIDRisky.get(componentType);
                }

                if (componentPropertiesAsIDRisky?.indexOf(propertyKey) == -1) {
                    componentPropertiesAsIDRisky?.push(propertyKey);
                }
            }

            // If the risky flag is set and there is no definition, consider it as an ID
            return isID && isRisky;
        }

        if (idTypes.indexOf(propertyDefinition.type) >= 0) {
            isID = propertyValueTokenToCheck.type === JSONTokenType.String && _isIncrementalNumberID(StringToken.assert(propertyValueTokenToCheck).evaluate());
        }

        return isID;
    };
}();

function _isPhysXMeshToken(componentTypeToken: string, propertyKey: string, propertyValueTokenToCheck: JSONValueToken, projectComponentDefinitions: ModifiedComponentPropertyRecord | undefined, options: PROCESS_OPTIONS[], processReport: ProcessReport): boolean {
    let isPhysXMesh = false;

    let propertyDefinition: ModifiedComponentProperty | null = null;

    if (projectComponentDefinitions) {
        propertyDefinition = projectComponentDefinitions[propertyKey];
    }

    if (!propertyDefinition) {
        if (componentTypeToken == "physx") {
            if (propertyKey == "convexMesh" || propertyKey == "triangleMesh") {
                if (propertyValueTokenToCheck.type == JSONTokenType.Object) {
                    const objectPropertyValue = propertyValueTokenToCheck as ObjectToken;
                    const meshPropertyValueTokenToCheck = objectPropertyValue.maybeGetValueTokenOfKey("mesh");
                    if (meshPropertyValueTokenToCheck != null) {
                        const isRisky = options.indexOf(PROCESS_OPTIONS.RISKY) >= 0;
                        const isID = meshPropertyValueTokenToCheck.type === JSONTokenType.String && _isIncrementalNumberID(StringToken.assert(meshPropertyValueTokenToCheck).evaluate());

                        if (isID) {
                            let physxPropertiesAsIDRisky = processReport.myComponentsPropertiesAsIDRisky.get("physx");
                            if (physxPropertiesAsIDRisky == null) {
                                processReport.myComponentsPropertiesAsIDRisky.set("physx", []);
                                physxPropertiesAsIDRisky = processReport.myComponentsPropertiesAsIDRisky.get("physx");
                            }

                            if (physxPropertiesAsIDRisky?.indexOf(propertyKey) == -1) {
                                physxPropertiesAsIDRisky?.push(propertyKey);
                            }
                        }

                        return isID && isRisky;
                    }
                }
            }

            return false;
        } else {
            return false;
        }
    }

    if (propertyDefinition.type == customPhysxMeshOptsType) {
        if (propertyValueTokenToCheck.type == JSONTokenType.Object) {
            const objectPropertyValue = propertyValueTokenToCheck as ObjectToken;
            const meshPropertyValueTokenToCheck = objectPropertyValue.maybeGetValueTokenOfKey("mesh");
            if (meshPropertyValueTokenToCheck != null) {
                isPhysXMesh = meshPropertyValueTokenToCheck.type === JSONTokenType.String && _isIncrementalNumberID(StringToken.assert(meshPropertyValueTokenToCheck).evaluate());
            }
        }
    }

    return isPhysXMesh;
}

function _isIncrementalNumberID(id: string): boolean {
    return parseInt(id).toFixed(0) == id;
}

const _randomUUID = function () {
    const uuidRandomValues = new Uint8Array(1);
    const uuidSkeleton = (1e7 + "-" + 1e3 + "-" + 4e3 + "-" + 8e3 + "-" + 1e11);
    const replaceUUIDSkeletonRegex = new RegExp("[018]", "g");
    const replaceUUIDSkeletonCallback = function (charString: string): string {
        const digit = parseInt(charString.charAt(0));
        return (digit ^ ((crypto.getRandomValues(uuidRandomValues)[0] & 15)) >> (digit / 4)).toString(16);
    };
    return function _randomUUID(): string {
        let uuid = "";

        if (crypto.randomUUID != null) {
            uuid = crypto.randomUUID();
        } else {
            uuid = uuidSkeleton.replace(replaceUUIDSkeletonRegex, replaceUUIDSkeletonCallback);
        }

        return uuid;
    };
}();

function _switchTokenToUUID(tokenToSwitch: ObjectToken, idTokens: ParentChildTokenPair[], processReport: ProcessReport) {
    for (const [id, __tokenToCheck] of tokenToSwitch.getTokenEntries()) {
        if (_isIncrementalNumberID(id)) {
            const uuid = _randomUUID();
            replaceParentTokenKey(id, uuid, tokenToSwitch);
            for (const idTokenToReplace of idTokens) {
                const childID = StringToken.assert(idTokenToReplace.child).evaluate();
                if (childID == id) {
                    try {
                        idTokenToReplace.parent.replaceChild(idTokenToReplace.child, StringToken.fromString(uuid));
                    } catch (error) {
                        if (processReport.myDuplicatedIDs.indexOf(id) == -1) {
                            processReport.myDuplicatedIDs.push(id);
                        }
                    }
                }
            }
        }
    }
}