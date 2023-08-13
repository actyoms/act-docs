/**
 * Handlebars helper to iterate over an object's keys in sorted order.
 * @param context
 * @param options
 */
export const EachSorted = <T>(context: Record<string, T>, options: Handlebars.HelperOptions) => {
    let ret = "";
    const keys = Object.keys(context).sort();
    let index = 0;
    for (const key of keys) {
        const retIt = options.fn(context[key], {
            data: { key, index, first: index === 0, last: index === keys.length - 1 }
        });
        ret += retIt;
        index++;
    }
    return ret;
};

/**
 * HandleNewLines is a handlebars helper that adds padding to each line of a string
 * @param context
 * @param padding
 * @param newline
 * @example
 * ```handlebars
 * {{HandleNewLines "This is a string with a \n newline" 4 true}}
 * ```
 */
export const HandleNewLines = (context: unknown, padding: number, newline: boolean) => {
    if (typeof context === "string" && context.includes("\n")) {
        const paddingStr = " ".repeat(padding);
        return context
            .trim()
            .split("\n")
            .map((line, index) => {
                if (index === 0) {
                    if (newline) {
                        return `|\n${paddingStr}${line}`;
                    }
                    return `${paddingStr}${line}`;
                }
                return `${paddingStr}${line}`;
            })
            .join("\n");
    }
    return context;
};

/**
 * ReplaceNewLines is a handlebars helper that replaces newlines with <br> tags
 * @param context
 * @param breakLine
 * @returns
 * @example
 * ```handlebars
 * {{ReplaceNewLines "This is a string with a \n newline" true}}
 * ```
 */
export const ReplaceNewLines = (context: unknown, breakLine: boolean) => {
    if (typeof context === "string" && context.includes("\n")) {
        if (breakLine) {
            return context.trim().split("\n").join("<br>");
        }
        return context.trim().split("\n").join(" ");
    }
    return context;
};

/**
 * Handlebars helper to check if a value is defined.
 * @param context
 */
export const isDefined = (context: unknown): boolean => {
    return typeof context !== "undefined";
};

/**
 * eq is a handlebars helper that checks if two values are equal
 */
export const eq = (a: unknown, b: unknown): boolean => {
    return a === b;
};

/**
 * emptyString is a handlebars helper that checks if a string is empty
 */
export const emptyString = (a: string): boolean => {
    return a === "";
};

/**
 * and is a handlebars helper that checks if two values are truthy
 */
export const and = (...args: []): boolean => {
    return args.every(Boolean);
};

/**
 * or is a handlebars helper that checks if at least one of the values is truthy
 */
export const or = (...args: []): boolean => {
    return args.some(Boolean);
};

/**
 * not is a handlebars helper that checks if a value is falsy
 * @param a
 * @returns
 * @example
 * ```handlebars
 * {{#if (not (eq action.name "my-action"))}}
 * ```
 * @example
 * ```handlebars
 * {{#if (not action.name)}}
 * ```
 */
export const not = (a: unknown): boolean => {
    return !a;
};

/**
 * len is a handlebars helper that returns the length of an array
 * @param context
 * @returns
 * @example
 * ```handlebars
 * {{len action.inputs}}
 * ```
 */
export const len = (context: unknown[]): number => {
    return Object.keys(context).length;
};

/**
 * gt is a handlebars helper that checks if a value is greater than another value
 * @param a
 * @param b
 * @returns
 * @example
 * ```handlebars
 * {{#if (gt (len action.inputs) 0)}}
 * ```
 */
export const gt = (a: number, b: number): boolean => {
    return a > b;
};

/**
 * lt is a handlebars helper that checks if a value is less than another value
 * @param a
 * @param b
 * @returns
 * @example
 * ```handlebars
 * {{#if (lt (len action.inputs) 0)}}
 * ```
 */
export const lt = (a: number, b: number): boolean => {
    return a < b;
};
