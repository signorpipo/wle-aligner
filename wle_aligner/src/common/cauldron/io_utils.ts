import { readFileSync, writeFileSync } from "fs";

export function readProjectFile(filePath: string): string {
    return readFileSync(filePath, 'utf8');
}

export function writeProjectFile(filePath: string, data: string): void {
    return writeFileSync(filePath, data);
}