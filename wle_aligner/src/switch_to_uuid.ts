// #CREDITS https://github.com/playkostudios/wle-cleaner

import { ArrayToken, JSONParentToken, JSONToken, JSONTokenType, JSONValueToken, ObjectToken, StringToken } from "@playkostudios/jsonc-ast";
import { Type } from "@wonderlandengine/api";
import { customPhysxMeshOptsType } from "./bundle/component_utils.js";
import { ModifiedComponentProperty, ModifiedComponentPropertyRecord } from "./bundle/modified_component_property.js";
import { PROCESS_OPTIONS } from "./process_options.js";
import { ProcessReport } from "./process_report.js";
import { replaceParentTokenKey } from "./project/jsonast_utils.js";
import { Project } from "./project/project.js";

export async function switchToUUID(sourceProjectPath: string, projectComponentDefinitions: Map<string, ModifiedComponentPropertyRecord>, options: PROCESS_OPTIONS[], processReport: ProcessReport) {
    const sourceProject = new Project();
    await sourceProject.load(sourceProjectPath);

    const idTokens = _getIDTokens(sourceProject, projectComponentDefinitions, options);

    debugger;

    replaceParentTokenKey("18", "ciao", sourceProject.myObjects);

    sourceProject.save("uuid");
}



// PRIVATE

class _ParentChildTokenPair {
    parent: JSONParentToken;
    child: JSONToken;

    constructor(parent: JSONParentToken, child: JSONToken) {
        this.parent = parent;
        this.child = child;
    }
}

function _getIDTokens(project: Project, projectComponentDefinitions: Map<string, ModifiedComponentPropertyRecord>, options: PROCESS_OPTIONS[]): _ParentChildTokenPair[] {
    const idTokens: _ParentChildTokenPair[] = [];

    idTokens.push(..._getIDTokensFromObjects(project, projectComponentDefinitions, options));

    return idTokens;
}

function _getIDTokensFromObjects(project: Project, projectComponentDefinitions: Map<string, ModifiedComponentPropertyRecord>, options: PROCESS_OPTIONS[]): _ParentChildTokenPair[] {
    const idTokens: _ParentChildTokenPair[] = [];

    for (const [__objectID, objectTokenToCheck] of project.myObjects.getTokenEntries()) {
        const objectToken = ObjectToken.assert(objectTokenToCheck);

        const parentTokenToCheck = objectToken.maybeGetValueTokenOfKey("parent");
        if (parentTokenToCheck) {
            idTokens.push(new _ParentChildTokenPair(objectToken, StringToken.assert(parentTokenToCheck)));
        }

        const componentsTokenToCheck = objectToken.maybeGetValueTokenOfKey("components");
        if (componentsTokenToCheck) {
            const componentsToken = ArrayToken.assert(componentsTokenToCheck);
            const components = componentsToken.getTokenEntries();
            for (const componentTokenToCheck of components) {
                const componentToken = ObjectToken.assert(componentTokenToCheck);
                if (!componentToken) continue;

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
                                idTokens.push(new _ParentChildTokenPair(componentPropertiesToken, propertyValueTokenToCheck));
                            } else if (_isPhysXMeshToken(componentTypeToken, propertyKey, propertyValueTokenToCheck, componentProperties, options)) {
                                const objectPropertyValue = ObjectToken.assert(propertyValueTokenToCheck);
                                const meshPropertyValueTokenToCheck = objectPropertyValue.maybeGetValueTokenOfKey("mesh");
                                if (meshPropertyValueTokenToCheck) {
                                    idTokens.push(new _ParentChildTokenPair(objectPropertyValue, StringToken.assert(meshPropertyValueTokenToCheck)));
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