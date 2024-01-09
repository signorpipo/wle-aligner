export function extractProcessOptions<T>(processArguments: string[], processOptionsMap: Map<string, T>): T[] {
    const options: T[] = [];

    for (let i = 2; i < processArguments.length; i++) {
        const processArgument = processArguments[i];

        if (processArgument.startsWith("--") || processArgument.startsWith("-")) {
            const processOption = processOptionsMap.get(processArgument);
            if (processOption != null) {
                options.push(processOption);
            }
        }
    }

    return options;
}

export function extractProcessProjectPaths(processArguments: string[]): string[] {
    const projectPaths: string[] = [];

    for (let i = 2; i < processArguments.length; i++) {
        const processArgument = processArguments[i];

        if (_isProjectPath(processArgument)) {
            projectPaths.push(processArgument);
        }
    }

    return projectPaths;
}



// PRIVATE

function _isProjectPath(value: string): boolean {
    let isProjectPath = false;

    isProjectPath = value.match(new RegExp(".wlp$")) != null;

    return isProjectPath;
}