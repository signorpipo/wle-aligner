# wle-aligner & wle-uuidify

This repo actually contains 2 tools:
- [wle-aligner](#wle-aligner)
- [wle-uuidify](#wle-uuidify)

# wle-aligner

Experimental utility tool to align a Wonderland Engine project to another one.  
This means:
- Matching the IDs of the objects/resources if they represent the same thing on both projects

## :warning: Warning
This tool is very experimental.
To perform this alignment it tries to guess which objects/resources might represent the same thing on both projects. This means that there might be mistakes in this process.  
Always verify that the aligned project is OK after using the tool.  
Make sure to use version control.

**This is just a preview of the tool, for now only the [wle-uuidify](#wle-uuidify) tool is available.**

# wle-uuidify

Experimental utility tool to switch incremental number IDs of a Wonderland Engine project to UUIDs.

## :warning: Warning
This tool is very experimental.  
Always verify that the aligned project is OK after using the tool.  
Make sure to use version control.

## Installing

```
npm install --save-dev wle-uuidify
```

## Running

From the command line:
```
npm exec wle-uuidify -- my-project.wlp
```

From an NPM script (in `package.json`):
```
wle-uuidify my-project.wlp
```

### Options

The following options are available:

- `-o | --output <path>`: 
    - where the uuidified project file will be stored
    - defaults to `<project-dir>/uuidified-<project-name>` when this option is not explicitly specified
- `-r | --replace`: 
    - replace the given project file instead, ignoring the output option
- `-u | --unsafe`: 
    - uuidify the project even if there is no bundle, it contains errors, or for component properties that might not be incremental number IDs
    - be sure to out extra care when checking the differences with the original project after performing the operation with this option
- `-d | --duplicates`: 
    - checks if there are duplicated IDs in the project
    - this check is normally performed when uuidifying the project, so you can use this option when you just want to check that your project has no duplicates but do not actually need to uuidify it
- `-b | --editor-bundle <path>`: 
    - path to the project bundle, usually generated by building the project with the Wonderland Engine editor
    - defaults to `cache/js/_editor_bundle.cjs` when this option is not explicitly specified
- `-e | --editor-bundle-extras <path>`: 
    - add extra definitions to the editor bundle via a JS script
    - defaults to `editor-bundle-extras.js` when this option is not explicitly specified
    - this option might be needed when the tool complains for some missing definitions, like `window` or `window.location` not being defined
    - you can fix these issues by adding the missing definitions to the extras script
    - example:
        ```js
        let window = {
            navigator: {},
            location: {}
        };

        class ExampleClass { }

        let ExampleObjectDefinedClass = {
            prototype: {}
        };
        ```
- `-h | --help`: 
    - display help for the command

# Credits

- [wle-cleaner](https://github.com/playkostudios/wle-cleaner), used as a base for these tools
- [playkostudios](https://github.com/playkostudios), for sponsoring the tools