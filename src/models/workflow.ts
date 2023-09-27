import { createReadStream, promises as fs } from "fs";
import { basename } from "path";
import { createInterface } from "readline";
import { parse } from "yaml";

import { autoImplement, exists } from "../utils/util.js";
import { Component } from "./component.js";

export enum PermissionAccess {
    None = "none",
    Write = "write",
    Read = "read"
}

export const isGreater = (a: PermissionAccess, b?: PermissionAccess): boolean => {
    if (!b) {
        return true;
    }
    switch (a) {
        case PermissionAccess.None:
            return false;
        case PermissionAccess.Read:
            return b === PermissionAccess.None;
        case PermissionAccess.Write:
            return b !== PermissionAccess.Write;
    }
};

export enum PermissionScope {
    Actions = "actions",
    Checks = "checks",
    Contents = "contents",
    Deployments = "deployments",
    Id = "id-token",
    Issues = "issues",
    Discussions = "discussions",
    Packages = "packages",
    Pages = "pages",
    Pull = "pull-requests",
    Repository = "repository-projects",
    Security = "security-events",
    Statuses = "statuses"
}

export interface Job {
    permissions?: Partial<Record<PermissionScope, PermissionAccess>>;
}

export interface WorkflowMetadata {
    id: string;
    readmePath: string;
    workflowManifestFile: string;
}
export interface Workflow extends WorkflowMetadata, Component {
    componentType: "WORKFLOW";
    basename: string;
    name: string;
    description: string; // not actual key on workflow, but used for icons in README docs
    // not actual key on workflow, but used to track permission
    permissions?: Partial<Record<PermissionScope, PermissionAccess>>;
    // not actual key on workflow, but used to track inherited secrets
    inheritedSecrets?: boolean;
    version: string;
    on: {
        workflow_call: {
            inputs?: {
                [key: string]: {
                    description?: string;
                    type: "boolean" | "number" | "string";
                    default?: boolean | number | string;
                    required: boolean;
                    deprecationMessage: string;
                };
            };
            secrets?: {
                [key: string]: {
                    // not actual key on workflow, but used to track inherited secrets
                    inheritedKey?: string;
                    description?: string;
                    required: boolean;
                };
            };
            outputs?: {
                [key: string]: {
                    description?: string;
                    value?: string;
                };
            };
        };
    };
    env: Record<string, boolean | number | string>;
    jobs: Record<string, Job>;
}

/**
 * Represents a GitHub workflow
 */
class workflow extends autoImplement<Workflow>() {
    public readonly componentType = "WORKFLOW";

    constructor(workflowYamlManifestFile: string, props: Workflow) {
        super();
        Object.assign(this, props);
        this.workflowManifestFile = workflowYamlManifestFile;
        this.basename = basename(this.workflowManifestFile);
        this.id = basename(this.basename).replace(/(^\.)|(\.ya?ml)/g, "");
    }

    /**
     * Initialize the workflow by reading the description, setting inherited secrets and permissions properties
     */
    async init() {
        await this.setDescription();
        this.handlePermissions();
    }

    /**
     * Check if the workflow has permissions, and if so, set the permissions property for documentation
     * @private
     */
    private handlePermissions() {
        for (const jobName in this.jobs) {
            const job = this.jobs[jobName];
            if (job.permissions) {
                if (!this.permissions) {
                    this.permissions = {};
                }
                for (const [scope, access] of Object.entries(job.permissions)) {
                    if (isGreater(access, this.permissions[scope as PermissionScope])) {
                        this.permissions[scope as PermissionScope] = access;
                    }
                }
            }
        }
    }

    /**
     * Read the workflow description from the workflow yaml file with removing the lines starting with #
     * @private
     */
    private async setDescription() {
        const rl = createInterface({
            input: createReadStream(this.workflowManifestFile),
            crlfDelay: Infinity
        });
        this.description = "";
        for await (const line of rl) {
            if (!line.startsWith("# ")) {
                break;
            }
            this.description += line.replace(/^# /, "");
            this.description += "\n";
        }
    }
}

/**
 * isWorkflow checks if the given component is a Workflow
 * @param arg the object to check
 * @returns true if the object is an Action, false otherwise
 */
export const isWorkflow = (arg: unknown): arg is Workflow => {
    return typeof arg === "object" && arg !== null && (arg as Workflow)["componentType"] === "WORKFLOW";
};

/**
 * Parse a workflow yaml file and return a Workflow object
 * @param workflowYaml
 * @returns Workflow object
 */
export const parseWorkflow = async (workflowYaml: string): Promise<Workflow | undefined> => {
    const exits = await exists(workflowYaml);
    if (!exits) {
        return undefined;
    }
    const workflowYamlContent = new workflow(workflowYaml, parse(await fs.readFile(workflowYaml, "utf8")));
    await workflowYamlContent.init();
    return workflowYamlContent;
};

/**
 * getWorkflowFiles returns a list of workflow yaml files in the given directory starting with the given prefix (default: "reusable-")
 * @param directory the directory to search for workflow yaml files
 * @param prefix the prefix of the workflow yaml files
 * @returns a list of workflow yaml files
 */
export const getWorkflowFiles = async (directory: string, prefix = "reusable-"): Promise<string[]> => {
    const files = await fs.readdir(directory);
    return files.filter(file => file.startsWith(prefix) && (file.endsWith(".yml") || file.endsWith(".yaml")));
};
