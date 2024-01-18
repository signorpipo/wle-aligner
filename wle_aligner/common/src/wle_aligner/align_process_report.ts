import { JSONToken } from "@playkostudios/jsonc-ast";
import { ProcessReport } from "../wle_uuidify/process_report.js";

export class AlignProcessReport extends ProcessReport {
    mySourceProjectLoadFailed: boolean = false;
    myTargetProjectLoadFailed: boolean = false;
    mySourceDuplicatedIDs: string[] = [];
    myTargetDuplicatedIDs: string[] = [];
    myDuplicatedIDsAfterAlign: string[] = [];
    myTokensReplaced: JSONToken[] = [];
    myNotUniqueResourceIDs: string[] = [];
    mySomethingChanged: boolean = false;
    myAlignedIDs: string[] = [];
}