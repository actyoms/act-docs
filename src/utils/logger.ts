import { Chalk } from "chalk";
import { relative } from "path";

declare type Level = "debug" | "info" | "warn" | "error";

const chalk = new Chalk({ level: 3 });

export default class Logger {
    private readonly component: string;
    private readonly cwd: string;
    constructor(component: string) {
        this.component = component;
        this.cwd = process.cwd();
    }
    debug = (message: string | unknown, ...optionalParams: unknown[]): void => {
        this.doLog("debug", message, ...optionalParams);
    };

    info = (message: string | unknown, ...optionalParams: unknown[]): void => {
        this.doLog("info", message, ...optionalParams);
    };

    warn = (message: string | unknown, ...optionalParams: unknown[]): void => {
        this.doLog("warn", message, ...optionalParams);
    };

    error = (message: string | unknown, ...optionalParams: unknown[]): void => {
        this.doLog("error", message, ...optionalParams);
    };

    doLog = (level: Level, message: string | unknown, ...optionalParams: unknown[]): void => {
        if (typeof message === "string") {
            for (let i = 0; i < optionalParams.length; i++) {
                const arg = optionalParams[i];
                if (typeof arg === "string" && arg.startsWith(this.cwd)) {
                    optionalParams[i] = chalk.yellow(relative(this.cwd, arg));
                }
            }
            console[level](this.group(message, level), ...optionalParams);
            return;
        }
        console[level](message, ...optionalParams);
    };

    private group(message: string, level: Level): string {
        switch (level) {
            case "debug":
                return `[${chalk.gray(this.component)}] ` + message;
            case "info":
                return `[${chalk.cyan(this.component)}] ` + message;
            case "warn":
                return `[${chalk.red(this.component)}] ` + message;
            case "error":
                return `[${chalk.redBright(this.component)}] ` + message;
            default:
                // should not reach hear
                throw new Error("unsupported log level: " + level);
        }
    }
}
