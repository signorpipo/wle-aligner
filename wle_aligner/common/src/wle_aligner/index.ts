#!/usr/bin/env node

import { Option, program } from "commander";
import { wleAligner } from "./wle_aligner.js";

program
    .argument("<source-project-path>", "file path to the source Wonderland Engine project file")
    .argument("<target-project-path>", "file path to the target Wonderland Engine project file, that will be aligned to the source one\rit's assumed that the project does not have IDs in common, or, if it does, those IDs already represent the same resources on the source project")
    .option("-o, --output <path>", "where the aligned target project file will be stored\r (default: \"<target-project-dir>/target-<target-project-name>\")")
    .option("-r, --replace", "replace the original target project, ignoring the output option, if specified")
    .option("-u, --unsafe", "align the projects properties even if they might not represent the same on both projects")
    .option("-s, --strict", "align only the resources that contains the same value for all their properties, instead of guessing it just through the name, linked assets, or similar \"identifiers\" properties")
    .addOption(new Option("-a, --align <properties...>", "align only the specified resource properties\r")
        .choices(["ids"]))
    .addOption(new Option("-f, --filter <resources...>", "align only the specified project resources\r")
        .choices(["objects", "meshes", "textures", "images", "materials", "shaders", "animations", "skins", "pipelines", "files", "fonts", "languages"]))
    .option("-b, --editor-bundle <path>", "path to the source/target project bundle, usually generated by building the project with the Wonderland Engine editor\r", "cache/js/_editor_bundle.cjs")
    .option("-e, --editor-bundle-extras <path>", "add extra definitions to the editor bundle via a JS script\r", "editor-bundle-extras.js")
    .action(wleAligner);

program.parseAsync();