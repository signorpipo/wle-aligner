import { BundleReport } from "../common/bundle/bundle_report.js";

export class ProcessReport extends BundleReport {
    myDuplicatedIDs: string[] = [];
    myComponentsPropertiesAsIDRisky: Map<string, string[]> = new Map();
    myPipelineShaderPropertiesAsID: Map<string, string[]> = new Map();
}