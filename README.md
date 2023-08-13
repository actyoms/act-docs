# actions-docs
`actions-docs` tool designed to automate the process of generating detailed and standardized README files for GitHub Actions and Workflows.

## Usage

```bash
actions-docs <command>

Commands:
  actions-docs generate <type>  Generate documentation for actions or workflows

Options:
  --help     Show help                                                 [boolean]
  --version  Show version number                                       [boolean]

Examples:
  actions-docs generate action    Generate action documentation
  actions-docs generate workflow  Generate workflow documentation
```

### Generate Action Documentation

```bash
actions-docs generate action

Generate action documentation

Options:
  --help          Show help                                            [boolean]
  --version       Show version number                                  [boolean]
  --actionRoot    actions directory path
  [string] [default: "cwd"]
  --templateRoot  the template path                       [string] [default: ""]
  --readmeOut     the readme output path                  [string] [default: ""]
```

### Generate Workflow Documentation

```bash
actions-docs generate workflow

Generate workflow documentation

Options:
  --help          Show help                                            [boolean]
  --version       Show version number                                  [boolean]
  --workflowRoot  workflows directory path
  [string] [default: "/Users/malsharbaji/Travix/Projects/Tooling/Github/actyoms/
                                           actions-docs-test/.github/workflows"]
  --templateRoot  the template path                       [string] [default: ""]
  --readmeOut     the readme output path                  [string] [default: ""]
```

## Templates

The tool uses [Handlebars](https://handlebarsjs.com/) templates to generate the documentation. The templates are located in the `templates` directory.

You can override the default templates by providing the `--templateRoot` option.

## Setup

### Install

```bash
npm install -g actions-docs # install globally
npm install --save-dev actions-docs # install as dev dependency
```

### Configure

Add the following to your `package.json` file:

```json
{
  "scripts": {
    "docs:action": "actions-docs generate action",
    "docs:workflow": "actions-docs generate workflow"
  }
}
```

### Run

```bash
npm run docs
```
