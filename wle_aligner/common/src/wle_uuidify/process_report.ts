import { BundleReport } from "../common/bundle/bundle_report.js";

export class ProcessReport extends BundleReport {
    myDuplicatedIDs: string[] = [];
    myProjectLoadFailed: boolean = false;
    myComponentsPropertiesAsIDUnsafe: Map<string, string[]> = new Map();
    myPipelineShaderPropertiesAsID: Map<string, string[]> = new Map();
}