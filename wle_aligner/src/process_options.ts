export enum PROCESS_OPTIONS {
    SWITCH_TO_UUID = 0,
    RISKY = 1
}

export function extractProcessOptions(processArguments: string[]): PROCESS_OPTIONS[] {
    const options: PROCESS_OPTIONS[] = [];

    for (let i = 2; i < processArguments.length; i++) {
        const processArgument = processArguments[i];

        switch (processArgument) {
            case "--uuid":
            case "-u":
                options.push(PROCESS_OPTIONS.SWITCH_TO_UUID);
                break;
            case "--risky":
            case "-r":
                options.push(PROCESS_OPTIONS.RISKY);
                break;
        }
    }

    return options;
}

export function extractProcessSourceProjectPath(processArguments: string[]): string {
    let sourceProjectPath = "";

    for (let i = 2; i < processArguments.length; i++) {
        const processArgument = processArguments[i];

        if (_isProjectPath(processArgument)) {
            sourceProjectPath = processArgument;
            break;
        }
    }

    return sourceProjectPath;
}

export function extractProcessTargetProjectPaths(processArguments: string[]): string[] {
    const targetProjectPaths: string[] = [];

    let sourceProjectPathSkipped = false;
    for (let i = 2; i < processArguments.length; i++) {
        const processArgument = processArguments[i];

        if (_isProjectPath(processArgument)) {
            if (!sourceProjectPathSkipped) {
                sourceProjectPathSkipped = true;
            } else {
                targetProjectPaths.push(processArgument);
            }
        }
    }

    return targetProjectPaths;
}



function _isProjectPath(value: string): boolean {
    let isProjectPath = false;

    isProjectPath = value.match(new RegExp(".wlp$")) != null;

    return isProjectPath;
}