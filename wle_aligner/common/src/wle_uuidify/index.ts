#!/usr/bin/env node

import { program } from "commander";
import { wleUUIDify } from "./wle_uuidify.js";

program
    .argument("<project-path>", "file path to the Wonderland Engine project file that needs to be uuidified")
    .option("-o, --output <path>", "where the uuidified project file will be stored\r (default: \"<project-dir>/uuidified-<project-name>\")")
    .option("-r, --replace", "replace the original project, ignoring the output option, if specified")
    .option("-u, --unsafe", "uuidify the project even if there is no bundle, it contains errors, or for component properties that might not be incremental number IDs")
    .option("-b, --editor-bundle <path>", "path to the project bundle\r", "cache/js/_editor_bundle.cjs")
    .option("-e, --editor-bundle-extra <path>", "add extra definitions to the editor bundle via a JS script\r", "editor-bundle-extra.js")
    .option("-d, --duplicates", "checks if there are duplicated IDs in the project")
    .action(wleUUIDify);

program.parseAsync();