import { JSONAST, ObjectToken } from "@playkostudios/jsonc-ast";

export class Project {
    private _myJSONAST: JSONAST | null = null;

    myPath: string | null = null;

    myRoot: ObjectToken | null = null;
    myObjects: ObjectToken | null = null;
    myMeshes: ObjectToken | null = null;
    myTextures: ObjectToken | null = null;
    myImages: ObjectToken | null = null;
    myMaterials: ObjectToken | null = null;
    myShaders: ObjectToken | null = null;
    mySettings: ObjectToken | null = null;
    myAnimations: ObjectToken | null = null;
    mySkins: ObjectToken | null = null;
    myPipelines: ObjectToken | null = null;
    myFiles: ObjectToken | null = null;
    myFonts: ObjectToken | null = null;
    myLanguages: ObjectToken | null = null;

    constructor() {

    }

    getProjectName(): string | null {
        let projectName = null;

        if (this._myJSONAST != null) {
            const projectSettingsToCheck = this.mySettings!.maybeGetValueTokenOfKey("project");
            if (projectSettingsToCheck != null) {
                const projectSettings = ObjectToken.assert(projectSettingsToCheck);
                projectName = (projectSettings.maybeGetValueOfKey("name") ?? null) as (string | null);
            }
        }

        return projectName;
    }

    getAllObjectTokens(): ObjectToken[] {
        const objectTokens: ObjectToken[] = [];

        if (this._myJSONAST != null) {
            objectTokens.push(this.myObjects!);
            objectTokens.push(this.myMeshes!);
            objectTokens.push(this.myTextures!);
            objectTokens.push(this.myImages!);
            objectTokens.push(this.myMaterials!);
            objectTokens.push(this.myShaders!);
            objectTokens.push(this.myAnimations!);
            objectTokens.push(this.mySkins!);
            objectTokens.push(this.myPipelines!);
            objectTokens.push(this.myFiles!);
            objectTokens.push(this.myFonts!);
            objectTokens.push(this.myLanguages!);
        }

        return objectTokens;
    }

    async load(projectPath: string): Promise<void> {
        this.myPath = projectPath;

        this._myJSONAST = new JSONAST();
        this.myRoot = ObjectToken.assert((await this._myJSONAST.parse(this.myPath)).getValueToken());
        this.myObjects = ObjectToken.assert(this.myRoot.getValueTokenOfKey("objects"));
        this.myMeshes = ObjectToken.assert(this.myRoot.getValueTokenOfKey("meshes"));
        this.myTextures = ObjectToken.assert(this.myRoot.getValueTokenOfKey("textures"));
        this.myImages = ObjectToken.assert(this.myRoot.getValueTokenOfKey("images"));
        this.myMaterials = ObjectToken.assert(this.myRoot.getValueTokenOfKey("materials"));
        this.myShaders = ObjectToken.assert(this.myRoot.getValueTokenOfKey("shaders"));
        this.mySettings = ObjectToken.assert(this.myRoot.getValueTokenOfKey("settings"));
        this.myAnimations = ObjectToken.assert(this.myRoot.getValueTokenOfKey("animations"));
        this.mySkins = ObjectToken.assert(this.myRoot.getValueTokenOfKey("skins"));
        this.myPipelines = ObjectToken.assert(this.myRoot.getValueTokenOfKey("pipelines"));
        this.myFiles = ObjectToken.assert(this.myRoot.getValueTokenOfKey("files"));
        this.myFonts = ObjectToken.assert(this.myRoot.getValueTokenOfKey("fonts"));
        this.myLanguages = ObjectToken.assert(this.myRoot.getValueTokenOfKey("languages"));
    }

    async save(newPath: string = ""): Promise<void> {
        if (this._myJSONAST != null) {
            await this._myJSONAST.writeToFile(newPath.length > 0 ? newPath : this.myPath!);
        }
    }
}