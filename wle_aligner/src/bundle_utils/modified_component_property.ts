// #CREDITS https://github.com/playkostudios/wle-cleaner

import { type ComponentProperty, type Type } from "@wonderlandengine/api";

export interface ModifiedComponentProperty extends Omit<ComponentProperty, "type"> {
    type: Type | symbol,
}

export type ModifiedComponentPropertyRecord = Record<string, ModifiedComponentProperty>;
