import { ProcessReport } from "../wle_uuidify/process_report.js";

export class AlignProcessReport extends ProcessReport {
    mySourceProjectLoadFailed: boolean = false;
    myTargetProjectLoadFailed: boolean = false;
    mySourceDuplicatedIDs: string[] = [];
    myTargetDuplicatedIDs: string[] = [];
}