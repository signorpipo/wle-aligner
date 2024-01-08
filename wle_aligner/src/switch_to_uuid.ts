// #CREDITS https://github.com/playkostudios/wle-cleaner

import { ArrayToken, JSONTokenType, JSONValueToken, ObjectToken, StringToken } from "@playkostudios/jsonc-ast";
import { Type } from "@wonderlandengine/api";
import crypto from "crypto";
import { customPhysxMeshOptsType } from "./bundle/component_utils.js";
import { ModifiedComponentProperty, ModifiedComponentPropertyRecord } from "./bundle/modified_component_property.js";
import { PROCESS_OPTIONS } from "./process_options.js";
import { ProcessReport } from "./process_report.js";
import { ParentChildTokenPair, getJSONTokensByKeyByTypeHierarchy, replaceParentTokenKey } from "./project/jsonast_utils.js";
import { Project } from "./project/project.js";

export async function switchToUUID(sourceProjectPath: string, projectComponentDefinitions: Map<string, ModifiedComponentPropertyRecord>, options: PROCESS_OPTIONS[], processReport: ProcessReport) {
    const sourceProject = new Project();
    await sourceProject.load(sourceProjectPath);

    const idTokens = _getIDTokens(sourceProject, projectComponentDefinitions, options);

    for (const [id, __tokenToCheck] of sourceProject.myObjects.getTokenEntries()) {
        if (_isIncrementalNumberID(id)) {
            const uuid = _randomUUID();
            replaceParentTokenKey(id, uuid, sourceProject.myObjects);
            for (const idTokenToReplace of idTokens) {
                const childID = StringToken.assert(idTokenToReplace.child).evaluate();
                if (childID == id) {
                    idTokenToReplace.parent.replaceChild(idTokenToReplace.child, StringToken.fromString(uuid));
                }
            }
        }
    }

    sourceProject.save("uuid");
}



// PRIVATE

function _getIDTokens(project: Project, projectComponentDefinitions: Map<string, ModifiedComponentPropertyRecord>, options: PROCESS_OPTIONS[]): ParentChildTokenPair[] {
    const idTokens: ParentChildTokenPair[] = [];

    idTokens.push(..._getIDTokensFromObjects(project, projectComponentDefinitions, options));
    idTokens.push(..._getIDTokensFromMaterials(project, options));
    idTokens.push(..._getIDTokensFromSkins(project, options));
    idTokens.push(..._getIDTokensFromPipelines(project, options));
    idTokens.push(..._getIDTokensFromSettings(project, options));

    return idTokens;
}

function _getIDTokensFromMaterials(project: Project, options: PROCESS_OPTIONS[]): ParentChildTokenPair[] {
    const idTokens: ParentChildTokenPair[] = [];

    for (const [__materialID, materialTokenToCheck] of project.myMaterials.getTokenEntries()) {
        const materialToken = ObjectToken.assert(materialTokenToCheck);

        const pipelineTokenToCheck = materialToken.maybeGetValueTokenOfKey("pipeline");
        if (pipelineTokenToCheck) {
            if (pipelineTokenToCheck.type === JSONTokenType.String) {
                idTokens.push(new ParentChildTokenPair(materialToken, StringToken.assert(pipelineTokenToCheck)));
            }
        }

        for (const [__materialPropertyID, materialPropertyTokenToCheck] of materialToken.getTokenEntries()) {
            if (materialPropertyTokenToCheck.type == JSONTokenType.Object) {
                const materialPropertyToken = ObjectToken.assert(materialPropertyTokenToCheck);
                for (const [__materialPropertyPropertyID, materialPropertyPropertyTokenToCheck] of materialPropertyToken.getTokenEntries()) {
                    if (materialPropertyPropertyTokenToCheck.type == JSONTokenType.String) {
                        const materialPropertyPropertyValue = StringToken.assert(materialPropertyPropertyTokenToCheck).evaluate();
                        if (_isIncrementalNumberID(materialPropertyPropertyValue)) {
                            idTokens.push(new ParentChildTokenPair(materialPropertyToken, StringToken.assert(materialPropertyPropertyTokenToCheck)));
                        }
                    }
                }
            }
        }
    }

    return idTokens;
}

function _getIDTokensFromSettings(project: Project, options: PROCESS_OPTIONS[]): ParentChildTokenPair[] {
    const idTokens: ParentChildTokenPair[] = [];

    idTokens.push(...getJSONTokensByKeyByTypeHierarchy("viewObject", JSONTokenType.String, project.mySettings));
    idTokens.push(...getJSONTokensByKeyByTypeHierarchy("leftEyeObject", JSONTokenType.String, project.mySettings));
    idTokens.push(...getJSONTokensByKeyByTypeHierarchy("rightEyeObject", JSONTokenType.String, project.mySettings));
    idTokens.push(...getJSONTokensByKeyByTypeHierarchy("appIcon", JSONTokenType.String, project.mySettings));
    idTokens.push(...getJSONTokensByKeyByTypeHierarchy("material", JSONTokenType.String, project.mySettings));

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
                    if (jointIDTokenToCheck.type == JSONTokenType.String) {
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
            if (shaderTokenToCheck.type === JSONTokenType.String) {
                idTokens.push(new ParentChildTokenPair(pipelineToken, StringToken.assert(shaderTokenToCheck)));
            }
        }
    }

    return idTokens;
}

function _getIDTokensFromObjects(project: Project, projectComponentDefinitions: Map<string, ModifiedComponentPropertyRecord>, options: PROCESS_OPTIONS[]): ParentChildTokenPair[] {
    const idTokens: ParentChildTokenPair[] = [];

    for (const [__objectID, objectTokenToCheck] of project.myObjects.getTokenEntries()) {
        const objectToken = ObjectToken.assert(objectTokenToCheck);

        const parentTokenToCheck = objectToken.maybeGetValueTokenOfKey("parent");
        if (parentTokenToCheck) {
            if (parentTokenToCheck.type === JSONTokenType.String) {
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

                const componentTypeTokenToCheck = componentToken.maybeGetValueTokenOfKey("type");
                if (!componentTypeTokenToCheck) continue;

                const componentTypeToken = StringToken.assert(componentTypeTokenToCheck).evaluate();
                const componentProperties = projectComponentDefinitions.get(componentTypeToken);
                if (!componentProperties && options.indexOf(PROCESS_OPTIONS.RISKY) == -1) continue;

                for (const [componentKey, componentPropertiesTokenToCheck] of componentToken.getTokenEntries()) {
                    if (componentKey === componentTypeToken) {
                        const componentPropertiesToken = ObjectToken.assert(componentPropertiesTokenToCheck);
                        for (const [propertyKey, propertyValueTokenToCheck] of componentPropertiesToken.getTokenEntries()) {
                            if (_isPropertyValueTokenID(propertyKey, propertyValueTokenToCheck, componentProperties, options)) {
                                idTokens.push(new ParentChildTokenPair(componentPropertiesToken, propertyValueTokenToCheck));
                            } else if (_isPhysXMeshToken(componentTypeToken, propertyKey, propertyValueTokenToCheck, componentProperties, options)) {
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
    return function (propertyKey: string, propertyValueTokenToCheck: JSONValueToken, projectComponentDefinitions: ModifiedComponentPropertyRecord | undefined, options: PROCESS_OPTIONS[]): boolean {
        let isID = false;

        let propertyDefinition: ModifiedComponentProperty | null = null;

        if (projectComponentDefinitions) {
            propertyDefinition = projectComponentDefinitions[propertyKey];
        }

        if (!propertyDefinition) {
            if (options.indexOf(PROCESS_OPTIONS.RISKY) >= 0) {
                // If the risky flag is set and there is no definition, consider it as an ID
                return propertyValueTokenToCheck.type === JSONTokenType.String;
            } else {
                return false;
            }
        }

        if (idTypes.indexOf(propertyDefinition.type) >= 0) {
            isID = propertyValueTokenToCheck.type === JSONTokenType.String;
        }

        return isID;
    };
}();

function _isPhysXMeshToken(componentTypeToken: string, propertyKey: string, propertyValueTokenToCheck: JSONValueToken, projectComponentDefinitions: ModifiedComponentPropertyRecord | undefined, options: PROCESS_OPTIONS[]): boolean {
    let isPhysXMesh = false;

    let propertyDefinition: ModifiedComponentProperty | null = null;

    if (projectComponentDefinitions) {
        propertyDefinition = projectComponentDefinitions[propertyKey];
    }

    if (!propertyDefinition) {
        if (options.indexOf(PROCESS_OPTIONS.RISKY) >= 0) {
            // If the risky flag is set and there is no definition, consider it as an ID
            if (componentTypeToken == "physx") {
                if (propertyKey == "convexMesh" || propertyKey == "triangleMesh") {
                    if (propertyValueTokenToCheck.type == JSONTokenType.Object) {
                        const objectPropertyValue = propertyValueTokenToCheck as ObjectToken;
                        const meshPropertyValueTokenToCheck = objectPropertyValue.maybeGetValueTokenOfKey("mesh");
                        if (meshPropertyValueTokenToCheck != null) {
                            return meshPropertyValueTokenToCheck.type === JSONTokenType.String;
                        }
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
                isPhysXMesh = meshPropertyValueTokenToCheck.type === JSONTokenType.String;
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