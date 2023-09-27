import { promises as fs } from "fs";
import { basename, resolve } from "path";
import { parse } from "yaml";

import { autoImplement, existsAny } from "../utils/util.js";
import { Component } from "./component.js";

/**
 * ActionMetadata is the interface for an ActionMetadata object
 * @property path - The path to the action
 * @property id - The id of the action
 * @property readmePath - The path to the action's README.md
 * @property relativeReadmePath - The relative path to the action's README.md
 * @property actionManifestFile - the name of the action's action.yml, or action.yaml file
 */
export interface ActionMetadata {
    path: string;
    id: string;
    readmePath: string;
    relativeReadmePath: string;
    actionManifestFile: string;
}

/**
 * Action is the interface for an Action object
 */
export interface Action extends ActionMetadata, Component {
    componentType: "ACTION";
    version: string; // not actual key on action, but used for icons in README docs
    repo: string; // not actual key on action, but used for icons in README docs
    name: string;
    description: string;
    author?: string;
    inputs?: {
        [key: string]: {
            description: string;
            required: boolean;
            default?: string;
            deprecationMessage?: string;
            example?: string; // not actual key on action, but used for icons in README docs
        };
    };
    outputs?: {
        [key: string]: {
            description?: string;
            value: string;
        };
    };
    runs: {
        using: "composite" | "docker" | "node16";
        main?: string;
        pre?: string;
        post?: string;
        preIf?: string;
        postIf?: string;
    };
    branding: {
        icon?: string;
        color?: string;
        iconPath?: string; //not actual key on action, but used for icons in README docs
    };
}

/**
 * action is the class for an Action object
 * @param actionDirPath the path to the action directory
 * @param actionYaml is the name of the action yaml file
 */
export class action extends autoImplement<Action>() {
    public readonly componentType: "ACTION" = "ACTION" as const;

    constructor(actionDirPath: string, actionMetadataFile: string, props: Action) {
        super();
        Object.assign(this, props);
        this.path = actionDirPath;
        this.actionManifestFile = actionMetadataFile;
        this.id = basename(this.path);
    }
}

/**
 * IsAction checks if the given component is an Action
 * @param arg the object to check
 * @returns true if the object is an Action, false otherwise
 */
export const isAction = (arg: unknown): arg is Action => {
    return typeof arg === "object" && arg !== null && (arg as Action)["componentType"] === "ACTION";
};

/**
 * parseAction parses an action from the given directory
 * @param actionDirPath the path to the action directory
 * @returns the parsed action
 * @throws if the action is invalid
 */
export const parseAction = async (actionDirPath: string): Promise<Action | undefined> => {
    const actionYaml = await existsAny(resolve(actionDirPath, "action.yml"), resolve(actionDirPath, "action.yaml"));
    if (!actionYaml) {
        return undefined;
    }
    const actionYamlContent = await parse(await fs.readFile(actionYaml, "utf8"));
    return new action(actionDirPath, actionYaml, actionYamlContent);
};
