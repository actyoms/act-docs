#!/usr/bin/env node
import { resolve } from "path";
import yargs, { Arguments, Argv } from "yargs";

import DocGenerator from "./generators/doc-generator.js";
import { Action, isAction, parseAction } from "./models/action.js";
import { getWorkflowFiles, isWorkflow, parseWorkflow, Workflow } from "./models/workflow.js";

/**
 * Yargs options for action commands
 */

const cwd = process.cwd();
const yargsActionOptions = {
    actionRoot: { string: true, description: "actions directory path", default: resolve(cwd)},
    templateRoot: { string: true, description: "the template path", default: "" },
    readmeOut: { string: true, description: "the readme output path", default: "" }
};

const yargsWorkflowOptions = {
    workflowRoot: { string: true, description: "workflows directory path", default: resolve(cwd, ".github/workflows") },
    templateRoot: { string: true, description: "the template path", default: "" },
    readmeOut: { string: true, description: "the readme output path", default: "" }
};

/**
 * Generate action documentation handler
 * @param {Arguments} argv
 * @returns {Promise<void>}
 */
const actionHandler = async (argv: Arguments): Promise<void> => {
    const { actionRoot, templateRoot, readmeOut } = argv;
    if (typeof actionRoot === "string" && typeof templateRoot === "string" && typeof readmeOut === "string") {
        const docGenerator = new DocGenerator(actionRoot, templateRoot);
        const action: Action | undefined = await parseAction(actionRoot);
        if (isAction(action)) {
            await docGenerator.generateReadme(action, readmeOut);
        }
    } else {
        throw new Error("Invalid arguments");
    }
};

/**
 * Generate workflow documentation handler
 * @param {Arguments} argv
 * @returns {Promise<void>}
 */
const workflowHandler = async (argv: Arguments): Promise<void> => {
    const { workflowRoot, templateRoot, readmeOut } = argv;
    if (typeof workflowRoot === "string" && typeof templateRoot === "string" && typeof readmeOut === "string") {
        const docGenerator = new DocGenerator(workflowRoot, templateRoot);
        const workflowFiles = await getWorkflowFiles(workflowRoot);
        for (const workflowFile of workflowFiles) {
            const workflow: Workflow | undefined = await parseWorkflow(workflowRoot + "/" + workflowFile);
            if (isWorkflow(workflow)) {
                await docGenerator.generateReadme(workflow, readmeOut);
            }
        }
    } else {
        throw new Error("Invalid arguments");
    }
};

yargs(process.argv.slice(2))
    .scriptName("actions-docs")
    .example("actions-docs generate action", "Generate action documentation")
    .example("actions-docs generate workflow", "Generate workflow documentation")
    .command("generate <type>", "Generate documentation for actions or workflows", (yargs: Argv) => {
        yargs.example("action-docs generate action", "Generate action documentation");
        yargs.example("action-docs generate workflow", "Generate workflow documentation");
        yargs.command(
            "action",
            "Generate action documentation",
            (yargs: Argv) => {
                yargs.options(yargsActionOptions);
            },
            actionHandler
        );
        yargs.command(
            "workflow",
            "Generate workflow documentation",
            (yargs: Argv) => {
                yargs.options(yargsWorkflowOptions);
            },
            workflowHandler
        );
    })
    .demandCommand(1, "Please provide a valid command. Use --help for assistance.")
    .strict()
    .help()
    .version()
    .parse();
