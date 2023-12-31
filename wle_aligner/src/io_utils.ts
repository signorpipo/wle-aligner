import { readFile, writeFile } from "fs/promises";

export async function readProjectFile(filePath: string): Promise<string> {
    return await readFile(filePath, 'utf8');
}

export async function writeProjectFile(filePath: string, data: string): Promise<void> {
    return await writeFile(filePath, data);
}