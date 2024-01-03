import { JSONParentToken, JSONTokenType, KeyToken } from "@playkostudios/jsonc-ast";

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