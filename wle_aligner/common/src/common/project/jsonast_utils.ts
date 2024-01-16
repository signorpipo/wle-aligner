import { ArrayToken, JSONParentToken, JSONToken, JSONTokenType, JSONValueToken, KeyToken, ObjectToken } from "@playkostudios/jsonc-ast";

export class ParentChildTokenPair {
    parent: JSONParentToken;
    child: JSONToken;
    childKey: string | null;

    constructor(parent: JSONParentToken, child: JSONToken, childKey: string | null = null) {
        this.parent = parent;
        this.child = child;
        this.childKey = childKey;
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
    return getJSONTokensHierarchy((tokenKey: string, tokenToCheck: JSONValueToken) => tokenKey == tokenKeyToFind && tokenToCheck.type === tokenTypeToFind, parentObjectToken);
}

export function getJSONTokensHierarchy(findCallback: (tokenKey: string, tokenToCheck: JSONValueToken) => boolean, parentObjectToken: ObjectToken): ParentChildTokenPair[] {
    const jsonTokensByKey: ParentChildTokenPair[] = [];

    const parentObjectTokens = [parentObjectToken];
    while (parentObjectTokens.length > 0) {
        const currentParentObjectToken = parentObjectTokens.shift();
        if (currentParentObjectToken) {
            for (const [tokenKey, tokenToCheck] of currentParentObjectToken.getTokenEntries()) {
                if (findCallback(tokenKey, tokenToCheck)) {
                    jsonTokensByKey.push(new ParentChildTokenPair(currentParentObjectToken, tokenToCheck, tokenKey));
                }

                if (tokenToCheck.type == JSONTokenType.Object) {
                    parentObjectTokens.push(ObjectToken.assert(tokenToCheck));
                }
            }
        }
    }

    return jsonTokensByKey;
}

export function getEqualJSONTokens(tokenToCheck: JSONValueToken, parentObjectToken: ObjectToken, ignorePropertiesOrder = true, tokensToIgnore: JSONToken[] = []): ParentChildTokenPair[] {
    const equalTokens: ParentChildTokenPair[] = [];

    for (const [otherTokenKey, otherTokenToCheck] of parentObjectToken.getTokenEntries()) {
        if (tokensToIgnore.indexOf(otherTokenToCheck) == -1 && areTokensEqual(tokenToCheck, otherTokenToCheck, ignorePropertiesOrder)) {
            equalTokens.push(new ParentChildTokenPair(parentObjectToken, otherTokenToCheck, otherTokenKey));
        }
    }

    return equalTokens;
}

export function areTokensEqual(firstToken: JSONValueToken | null | undefined, secondToken: JSONValueToken | null | undefined, ignorePropertiesOrder = true): boolean {
    if (firstToken == null || secondToken == null) {
        return firstToken == secondToken;
    }

    if (!ignorePropertiesOrder || (firstToken.type != JSONTokenType.Object && firstToken.type != JSONTokenType.Array)) {
        return firstToken.evaluate() == secondToken.evaluate();
    }

    if (firstToken.type != secondToken.type) {
        return false;
    }

    if (firstToken.type == JSONTokenType.Object) {
        const firstObjectToken = ObjectToken.assert(firstToken);
        const secondObjectToken = ObjectToken.assert(secondToken);

        if (firstObjectToken.getTokenEntries().length != secondObjectToken.getTokenEntries().length) {
            return false;
        }

        for (const [firstTokenKey, firstTokenToCheck] of firstObjectToken.getTokenEntries()) {
            let tokenFound = false;
            for (const [secondTokenKey, secondTokenToCheck] of secondObjectToken.getTokenEntries()) {
                if (firstTokenKey == secondTokenKey) {
                    tokenFound = true;

                    if (!areTokensEqual(firstTokenToCheck, secondTokenToCheck, true)) {
                        return false;
                    }

                    break;
                }
            }

            if (!tokenFound) {
                return false;
            }
        }
    } else if (firstToken.type == JSONTokenType.Array) {
        const firstObjectToken = ArrayToken.assert(firstToken);
        const secondObjectToken = ArrayToken.assert(secondToken);

        const firstTokenEntries = firstObjectToken.getTokenEntries();
        const secondTokenEntries = secondObjectToken.getTokenEntries();

        if (firstTokenEntries.length != secondTokenEntries.length) {
            return false;
        }

        for (let i = 0; i < firstTokenEntries.length; i++) {
            let tokenFound = false;
            for (let j = 0; j < secondTokenEntries.length; j++) {
                if (areTokensEqual(firstTokenEntries[i], secondTokenEntries[i], true)) {
                    tokenFound = true;
                    break;
                }
            }

            if (!tokenFound) {
                return false;
            }
        }
    }

    return true;
}