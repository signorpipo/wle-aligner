import { JSONParentToken, JSONToken, JSONTokenType, KeyToken, ObjectToken } from "@playkostudios/jsonc-ast";

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

export function getJSONTokensByKeyByTypeHierarchy(tokenKeyToFind: string, tokenTypeToFind: JSONTokenType, parentObjectToken: ObjectToken): ParentChildTokenPair[] {
    const jsonTokensByKey: ParentChildTokenPair[] = [];

    const parentObjectTokens = [parentObjectToken];
    while (parentObjectTokens.length > 0) {
        const currentParentObjectToken = parentObjectTokens.shift();
        if (currentParentObjectToken) {
            for (const [tokenKey, tokenToCheck] of currentParentObjectToken.getTokenEntries()) {
                if (tokenKey == tokenKeyToFind && tokenToCheck.type == tokenTypeToFind) {
                    jsonTokensByKey.push(new ParentChildTokenPair(currentParentObjectToken, tokenToCheck));
                }

                if (tokenToCheck.type == JSONTokenType.Object) {
                    parentObjectTokens.push(ObjectToken.assert(tokenToCheck));
                }
            }
        }
    }

    return jsonTokensByKey;
}