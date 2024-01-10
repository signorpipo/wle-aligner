import { JSONAST, ObjectToken } from "@playkostudios/jsonc-ast";

export class Project {
    private _myJSONAST: JSONAST;

    myPath: string;

    myRoot: ObjectToken;
    myObjects: ObjectToken;
    myMeshes: ObjectToken;
    myTextures: ObjectToken;
    myImages: ObjectToken;
    myMaterials: ObjectToken;
    myShaders: ObjectToken;
    mySettings: ObjectToken;
    myAnimations: ObjectToken;
    mySkins: ObjectToken;
    myPipelines: ObjectToken;
    myFiles: ObjectToken;
    myFonts: ObjectToken;
    myLanguages: ObjectToken;

    constructor() {

    }

    getAllObjectTokens(): ObjectToken[] {
        const objectTokens: ObjectToken[] = [];

        objectTokens.push(this.myObjects);
        objectTokens.push(this.myMeshes);
        objectTokens.push(this.myTextures);
        objectTokens.push(this.myImages);
        objectTokens.push(this.myMaterials);
        objectTokens.push(this.myShaders);
        objectTokens.push(this.myAnimations);
        objectTokens.push(this.mySkins);
        objectTokens.push(this.myPipelines);
        objectTokens.push(this.myFiles);
        objectTokens.push(this.myFonts);
        objectTokens.push(this.myLanguages);

        return objectTokens;
    }

    async load(projectPath: string) {
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

    async save(newPath: string = "") {
        await this._myJSONAST.writeToFile(newPath.length > 0 ? newPath : this.myPath);
    }
}