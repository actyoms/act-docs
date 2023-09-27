import { promises as fs } from "fs";

/**
 * Creates a base class with default values for properties specified in the generic type `T`.
 * This function returns a class that can be used as a base class for other classes.
 * @param defaults An object containing default values for properties in the class.
 * @returns A class that can be used as a base class with default property values.
 */
export function autoImplement<T>(defaults?: Partial<T>) {
    return class {
        constructor() {
            Object.assign(this, defaults || {});
        }
    } as new () => T;
}

/**
 * Checks if any of the specified paths exist on the file system.
 * @param paths A variable number of string paths to check for existence.
 * @returns A Promise that resolves to the first existing path from the provided paths.
 * If none of the paths exist, the Promise resolves to `false`.
 * @remarks The function sequentially checks each path in the order they are provided.
 * Once it finds an existing path, it immediately resolves the Promise with that path.
 * If none of the paths exist, the Promise resolves to `false`.
 * The function uses asynchronous access checks to determine the existence of each path.
 * If any error occurs during the access check (e.g., permissions issue, non-existing path),
 * it will be caught, and the function will continue checking the next path.
 */
export const existsAny = async (...paths: string[]): Promise<string | false> => {
    for (const path of paths) {
        try {
            await fs.access(path);
            return path;
        } catch {
            // nothing to do here
        }
    }
    return false;
};

/**
 * Checks if the specified path exists on the file system.
 * @param path The path to check for existence.
 * @returns A Promise that resolves to `true` if the path exists, or `false` if it does not.
 */
export const exists = async (path: string): Promise<boolean> => {
    try {
        await fs.access(path);
        return true;
    } catch {
        return false;
    }
};
