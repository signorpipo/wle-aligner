// #CREDITS https://github.com/playkostudios/wle-cleaner

import { Type } from "@wonderlandengine/api";
import { ModifiedComponentPropertyRecord } from "./modified_component_property.js";
import { parseEditorBundle } from "./parse_editor_bundle.js";
import { BundleReport } from "./bundle_report.js";

export const NATIVE_COMPONENTS = ["animation", "collision", "input", "light", "mesh", "physx", "text", "view"];

export const customCollisionRadiusOptsType = Symbol("collision-radius-options");
export const customCollisionExtentsOptsType = Symbol("collision-extents-options");
export const customPhysxCapsuleOptsType = Symbol("physx-capsule-options");
export const customPhysxMeshOptsType = Symbol("physx-mesh-options");
export const customOpaqueColorType = Symbol("opaque-color");

export function getProjectComponentsDefinitions(rootDirPath: string, bundleReport: BundleReport): Map<string, ModifiedComponentPropertyRecord> {
    const componentsDefinitions = parseEditorBundle(rootDirPath, bundleReport);

    // Normalize default values of components and panic on unexpected properties
    for (const [compType, compConfig] of componentsDefinitions) {
        if (NATIVE_COMPONENTS.includes(compType)) {
            throw new Error("Unexpected component with native name " + compType + " in editor bundle");
        }

        for (const [propName, propConfig] of Object.entries(compConfig)) {
            if (propConfig.type !== Type.Enum) {
                continue;
            }

            if (propConfig.default === undefined) {
                if (!propConfig.values || propConfig.values.length === 0) {
                    throw new Error("Enum property " + propName + " in component with native name " + compType + " has no values");
                }

                propConfig.default = propConfig.values[0];
            }
        }
    }

    // Add native components to bundle components. note that we can't automate
    // this because the properties of native components are defined with the
    // "Native" type, instead of a concrete type like "Int" or "Bool"
    componentsDefinitions.set("animation", {
        animation: { type: Type.Animation, default: null },
        playCount: { type: Type.Int, default: 0 },
        speed: { type: Type.Float, default: 1 },
        autoplay: { type: Type.Bool, default: false },
        retarget: { type: Type.Bool, default: false },
        preview: { type: Type.Bool, default: false },
    });

    // #WARN @CollisionComponents also work like component properties; they have
    // a sphere property which is an object with a radius, an aabb and a box
    // property which is an object with extents
    componentsDefinitions.set("collision", {
        groups: { type: Type.Int, default: 255 },
        collider: { type: Type.Enum, default: "sphere", values: ["sphere", "aabb", "box"] },
        sphere: { type: customCollisionRadiusOptsType, default: 1 },
        aabb: { type: customCollisionExtentsOptsType, default: [1, 1, 1] },
        box: { type: customCollisionExtentsOptsType, default: [1, 1, 1] },
    });

    componentsDefinitions.set("input", {
        type: { type: Type.Enum, default: "head", values: ["head", "eye left", "eye right", "hand left", "hand right", "ray left", "ray right"] },
    });

    componentsDefinitions.set("light", {
        type: { type: Type.Enum, default: "point", values: ["point", "spot", "sun"] },
        color: { type: customOpaqueColorType, default: [1, 1, 1] },
        intensity: { type: Type.Float, default: 1 },
        outerAngle: { type: Type.Float, default: 90 },
        innerAngle: { type: Type.Float, default: 45 },
        shadows: { type: Type.Bool, default: false },
        shadowRange: { type: Type.Float, default: 10 },
        shadowBias: { type: Type.Float, default: 0.001 },
        shadowNormalBias: { type: Type.Float, default: 0.001 },
        shadowTexelSize: { type: Type.Float, default: 1 },
    });

    componentsDefinitions.set("mesh", {
        mesh: { type: Type.Mesh, default: null },
        material: { type: Type.Material, default: null },
        skin: { type: Type.Skin, default: null },
    });

    componentsDefinitions.set("physx", {
        shape: { type: Type.Enum, default: "sphere", values: ["none", "sphere", "capsule", "box", "plane", "convexMesh", "triangleMesh"] },
        sphere: { type: customCollisionRadiusOptsType, default: 0.25 },
        capsule: { type: customPhysxCapsuleOptsType, default: { radius: 0.15, halfHeight: 0.25 } },
        box: { type: customCollisionExtentsOptsType, default: [0.25, 0.25, 0.25] },
        convexMesh: { type: customPhysxMeshOptsType, default: { mesh: null, scaling: [1, 1, 1] } },
        triangleMesh: { type: customPhysxMeshOptsType, default: { mesh: null, scaling: [1, 1, 1] } },
        allowSimulation: { type: Type.Bool, default: true },
        trigger: { type: Type.Bool, default: false },
        allowQuery: { type: Type.Bool, default: true },
        simulate: { type: Type.Bool, default: true },
        static: { type: Type.Bool, default: false },
        gravity: { type: Type.Bool, default: true },
        kinematic: { type: Type.Bool, default: false },
        mass: { type: Type.Float, default: 1 },
        linearDamping: { type: Type.Float, default: 1 },
        angularDamping: { type: Type.Float, default: 0.05 },
        staticFriction: { type: Type.Float, default: 0.5 },
        dynamicFriction: { type: Type.Float, default: 0.5 },
        bounciness: { type: Type.Float, default: 0.5 },
        groups: { type: Type.Int, default: 255 },
        block: { type: Type.Int, default: 255 },
        lockAxis: { type: Type.Int, default: 0 },
        solverPositionIterations: { type: Type.Int, default: 4 },
        solverVelocityIterations: { type: Type.Int, default: 1 },
    });

    componentsDefinitions.set("text", {
        alignment: { type: Type.Enum, default: "center", values: ["left", "center", "right"] },
        justification: { type: Type.Enum, default: "middle", values: ["line", "middle", "top", "bottom"] },
        characterSpacing: { type: Type.Float, default: 0 },
        lineSpacing: { type: Type.Float, default: 1.2 },
        effect: { type: Type.Enum, default: "none", values: ["none", "outline"] },
        text: { type: Type.String, default: "Wonderland Engine" },
        material: { type: Type.Material }, // #WARN No default, can't be auto-cleaned
    });

    componentsDefinitions.set("view", {
        fov: { type: Type.Float, default: 90 },
        near: { type: Type.Float, default: 0.01 },
        far: { type: Type.Float, default: 100 },
    });

    return componentsDefinitions;
}