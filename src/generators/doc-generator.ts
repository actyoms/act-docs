import { existsSync, promises as fs, readFileSync } from "fs";
import Handlebars from "handlebars";
import { join, relative, resolve } from "path";
import { fileURLToPath } from "url";

import {
    and,
    EachSorted,
    emptyString,
    eq,
    gt,
    HandleNewLines,
    isDefined,
    len,
    lt,
    not,
    or,
    ReplaceNewLines
} from "../helpers/handelbars-helper.js";
import { Action, isAction } from "../models/action.js";
import { Component } from "../models/component.js";
import { isWorkflow, Workflow } from "../models/workflow.js";
import Logger from "../utils/logger.js";

interface Readme {
    path: string;
    content: string;
}

/**
 * DocGenerator - Generate documentation for components (actions, workflows)
 * @export
 * @class DocGenerator
 * @example
 * ```typescript
 * const docGenerator = new DocGenerator(componentRoot, templateRoot);
 * const action: Action | undefined = await parseAction(componentRoot);
 * const readme = await docGenerator.generateReadme(action);
 * ```
 * @example
 * ```typescript
 * const docGenerator = new DocGenerator(componentRoot, templateRoot);
 * const workflow: Workflow | undefined = await parseWorkflow(componentRoot);
 * const readme = await docGenerator.generateReadme(workflow);
 */
export default class DocGenerator {
    private readonly logger = new Logger("DocGenerator");
    private readonly componentRoot: string;
    private readonly templateRoot: string;
    private readonly handlebars: typeof Handlebars;
    private readonly readmeTemplate: HandlebarsTemplateDelegate<unknown>;

    constructor(componentRoot: string, templateRoot: string) {
        this.componentRoot = componentRoot;
        this.templateRoot = templateRoot;
        // Create handlebars instance
        this.handlebars = Handlebars.create();
        if (componentRoot.includes("workflows")) {
            this.registerHandlebarsPartials(this.handlebars, this.templateRoot, true);
        } else {
            this.registerHandlebarsPartials(this.handlebars, this.templateRoot, false);
        }
        // Register custom helper
        this.registerHandlebarsHelpers(this.handlebars);
        // Compile readme template
        this.readmeTemplate = this.handlebars.compile("{{> readme}}", { noEscape: true });
    }

    /**
     * registerHandlebarsPartials - Register handlebars partials
     * @private
     * @memberof DocGenerator
     */
    private registerHandlebarsPartials = (
        handlebars: typeof Handlebars,
        templateRoot: string,
        isWorkflow: boolean
    ): void => {
        try {
            const __filename = fileURLToPath(import.meta.url);
            const actionTemplateDir = resolve(__filename, "../../templates/actions");
            const workflowTemplateDir = resolve(__filename, "../../templates/workflows");

            const partials = isWorkflow
                ? ["header", "usage", "inputs", "outputs", "readme", "permissions", "secrets"]
                : ["header", "usage", "inputs", "outputs", "readme"];

            const templateDir = isWorkflow ? workflowTemplateDir : actionTemplateDir;

            for (const partialName of partials) {
                let partialPath: string;

                // Check if the user has a custom template in their project's 'templates' folder
                const userTemplatePath = resolve(templateRoot, `_${partialName}.hbs`);
                if (existsSync(userTemplatePath)) {
                    // Use the custom template if it exists
                    partialPath = userTemplatePath;
                } else {
                    // Otherwise, use the default path based on the partial name and template type
                    partialPath = resolve(templateDir, `_${partialName}.hbs`);
                }

                try {
                    const partialContent = readFileSync(partialPath, { encoding: "utf-8" });
                    handlebars.registerPartial(partialName, partialContent);
                    this.logger.debug(`Registered partial '${partialName}' from ${partialPath}`);
                } catch (readError) {
                    this.logger.error(`Error reading partial '${partialName}' from ${partialPath}:`, readError);
                }
            }
        } catch (error) {
            this.logger.error("Error while registering Handlebars partials:", error);
            throw error;
        }
    };

    /**
     * Register custom handlebars helpers
     * @private
     * @memberof DocGenerator
     */
    private registerHandlebarsHelpers = (handlebars: typeof Handlebars): void => {
        handlebars.registerHelper("EachSorted", EachSorted);
        handlebars.registerHelper("HandleNewLines", HandleNewLines);
        handlebars.registerHelper("ReplaceNewLines", ReplaceNewLines);
        handlebars.registerHelper("isDefined", isDefined);
        handlebars.registerHelper("emptyString", emptyString);
        handlebars.registerHelper("and", and);
        handlebars.registerHelper("not", not);
        handlebars.registerHelper("or", or);
        handlebars.registerHelper("eq", eq);
        handlebars.registerHelper("len", len);
        handlebars.registerHelper("gt", gt);
        handlebars.registerHelper("lt", lt);
    };

    /**
     * generateActionReadme - Generate README.md for an action
     * @private
     * @memberof DocGenerator
     * @param action
     * @param readmeOutputPath
     */
    private generateActionReadme = async (action: Action, readmeOutputPath: string): Promise<Readme> => {
        if (readmeOutputPath === this.componentRoot) {
            action.readmePath = resolve(readmeOutputPath, `README.md`);
        } else {
            action.readmePath = resolve(readmeOutputPath, `${action.id}.md`);
        }
        action.relativeReadmePath = relative(this.componentRoot, action.readmePath);

        this.logger.debug(`Generating README.md for action using default template for %s`, action.id);
        let readmeContent = `[//]: # (This file is auto generated from ${this.templateRoot}. Do not edit)\n`;
        readmeContent += this.readmeTemplate(action);
        return { path: action.readmePath, content: readmeContent };
    };

    /**
     * generateWorkflowReadme - Generate README.md for a workflow
     * @param workflow
     * @param readmeOutputPath
     */
    private generateWorkflowReadme = async (workflow: Workflow, readmeOutputPath: string): Promise<Readme> => {
        workflow.readmePath = resolve(readmeOutputPath, `${workflow.id}.md`);
        workflow.workflowManifestFile = relative(readmeOutputPath, workflow.workflowManifestFile);
        this.logger.debug(`Generating README.md for workflow using default template for %s`, workflow.id);
        let readmeContent = `[//]: # (This file is auto generated from ${this.templateRoot}. Do not edit)\n`;
        readmeContent += this.readmeTemplate(workflow);
        return { path: workflow.readmePath, content: readmeContent };
    };

    /**
     * generateReadme - Generate README.md for a component (action, workflow)
     * @memberof DocGenerator
     * @param component
     * @param readmeOutputPath
     */
    public generateReadme = async <T extends Component>(component: T, readmeOutputPath?: string): Promise<void> => {
        let readme: Readme = { path: "", content: "" };

        if (isAction(component)) {
            if (readmeOutputPath == undefined || readmeOutputPath === "") {
                component.path = resolve(join(this.componentRoot));
                readmeOutputPath = component.path;
            }
            try {
                const directoryState = await fs.stat(readmeOutputPath);
                if (!directoryState.isDirectory()) {
                    this.logger.error("Invalid argument passed to generateReadme, expected directory path");
                    return;
                }
            } catch (error) {
                const fileSystemError = error as NodeJS.ErrnoException;
                if (fileSystemError.code === "ENOENT") {
                    try {
                        await fs.mkdir(readmeOutputPath, { recursive: true });
                    } catch (mkdirError) {
                        this.logger.error("Error creating directory:", mkdirError);
                        return;
                    }
                } else {
                    this.logger.error("Error while checking directory state:", error);
                    return;
                }
            }
            readme = await this.generateActionReadme(component, readmeOutputPath);
        } else if (isWorkflow(component)) {
            if (readmeOutputPath === undefined || readmeOutputPath === "") {
                console.log("here");
                readmeOutputPath = resolve(this.componentRoot);
            }

            try {
                const directoryState = await fs.stat(readmeOutputPath);
                if (!directoryState.isDirectory()) {
                    this.logger.error("Invalid argument passed to generateReadme, expected directory path");
                    return;
                }
            } catch (error) {
                const fileSystemError = error as NodeJS.ErrnoException;
                if (fileSystemError.code === "ENOENT") {
                    try {
                        await fs.mkdir(readmeOutputPath, { recursive: true });
                    } catch (mkdirError) {
                        this.logger.error("Error creating directory:", mkdirError);
                        return;
                    }
                } else {
                    this.logger.error("Error while checking directory state:", fileSystemError);
                    return;
                }
            }

            readme = await this.generateWorkflowReadme(component, readmeOutputPath);
        }

        await fs.writeFile(readme.path, readme.content);
    };
}
