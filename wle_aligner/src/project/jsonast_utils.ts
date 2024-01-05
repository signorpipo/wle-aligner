import { JSONParentToken, JSONToken, JSONTokenType, KeyToken } from "@playkostudios/jsonc-ast";

export class ParentChildTokenPair {
    parent: JSONParentToken;
    child: JSONToken;

    constructor(parent: JSONParentToken, child: JSONToken) {
        this.parent = parent;
        this.child = child;
    }
}

export function replaceParentTokenKey(oldKey: string, newKey: string, parentToken: JSONParentToken): boolean {
    let found = false;

    for (const childToken of parentToken.children) {
        if (childToken.type === JSONTokenType.Key && (childToken as KeyToken).getString() === oldKey) {
            parentToken.replaceChild(childToken, KeyToken.fromString(newKey));
            found = true;
            break;
        }
    }

    return found;
}
/*
export function getJSONTokenByKeyHierarchy(jsonTokenKey: string, parentToken: JSONParentToken): ParentChildTokenPair {
    let found = false;

    for (const childToken of parentToken.children) {
        if (childToken.type === JSONTokenType.Key && (childToken as KeyToken).getString() === oldKey) {
            parentToken.replaceChild(childToken, KeyToken.fromString(newKey));
            found = true;
            break;
        }
    }

    return found;
}*/