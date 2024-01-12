import { BundleReport } from "../common/bundle/bundle_report.js";

export class ProcessReport extends BundleReport {
    mySourceProjectLoadFailed: boolean = false;
    myTargetProjectLoadFailed: boolean = false;
    myProcessCompleted: boolean = false;
}