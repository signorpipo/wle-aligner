export class ProcessReport {
    myEditorBundleError: boolean = false;
    myEditorCustomBundleError: boolean = false;
    myEditorBundleIgnored: boolean = false;
    myDuplicatedIDs: string[] = [];
    myComponentsPropertiesAsIDRisky: Map<string, string[]> = new Map();
    myPipelineShaderPropertiesAsID: Map<string, string[]> = new Map();
}