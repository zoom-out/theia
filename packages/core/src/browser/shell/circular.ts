/********************************************************************************
 * Copyright (C) 2018 Ericsson and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * This Source Code may also be made available under the following Secondary
 * Licenses when the conditions for such availability set forth in the Eclipse
 * Public License v. 2.0 are satisfied: GNU General Public License, version 2
 * with the GNU Classpath Exception which is available at
 * https://www.gnu.org/software/classpath/license.html.
 *
 * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0
 ********************************************************************************/

// Based on: https://stackoverflow.com/questions/47917417/how-to-detect-circular-references-in-javascript

// This function is going to return an array of paths
// that point to the cycles in the object
export function getDups(object: any) {
    if (!object) {
        return;
    }

    const references = new Set();
    const objectToPaths = new Map<any, string[]>();

    // Recursive function to go over objects/arrays
    const traverse = function (currentObj: any, path: string) {

        const paths = objectToPaths.get(currentObj) || [];
        objectToPaths.set(currentObj, paths);
        paths.push(path);

        // If we saw a node it's a cycle, no need to travers it's entries
        if (references.has(currentObj)) {
            return;
        }
        references.add(currentObj);

        // Traversing the entries
        for (const key in currentObj) {
            if (currentObj.hasOwnProperty(key)) {
                const value = currentObj[key];
                if (!value) {
                    continue;
                }
                // We don't want to care about the falsy values
                // Only objects and arrays can produce the cycles and they are truthy
                if (value.constructor === Object) {
                    // We'd like to save path as parent[0] in case when parent obj is an array
                    // and parent.prop in case it's an object
                    const parentIsArray = currentObj.constructor === Array;
                    traverse(value, parentIsArray ? `${path}[${key}]` : `${path}.${key}`);

                } else if (value.constructor === Array) {
                    for (let i = 0; i < value.length; i += 1) {
                        traverse(value[i], `${path}.${key}[${i}]`);
                    }
                }

                // We don't care of any other values except Arrays and objects.
            }
        }
    };

    traverse(object, 'root');
    return new Map(Array.from(objectToPaths.entries()).filter((entry: [any, string[]]) => entry[1].length > 1));
}

// This function is going to return an array of paths
// that point to the cycles in the object
export function getCycles(object: any) {
    if (!object) {
        return;
    }

    const cycles: string[] = [];

    // Recursive function to go over objects/arrays
    const traverse = function (currentObj: any, path: string, parentReferences: Set<any> = new Set()) {
        const references = new Set(parentReferences);

        // If we saw a node it's a cycle, no need to travers it's entries
        if (references.has(currentObj)) {
            cycles.push(path);
            return;
        }

        references.add(currentObj);

        // Traversing the entries
        for (const key in currentObj) {
            if (currentObj.hasOwnProperty(key)) {
                const value = currentObj[key];
                if (!value) {
                    continue;
                }
                // We don't want to care about the falsy values
                // Only objects and arrays can produce the cycles and they are truthy
                if (value.constructor === Object) {
                    // We'd like to save path as parent[0] in case when parent obj is an array
                    // and parent.prop in case it's an object
                    const parentIsArray = currentObj.constructor === Array;
                    traverse(value, parentIsArray ? `${path}[${key}]` : `${path}.${key}`, references);

                } else if (value.constructor === Array) {
                    for (let i = 0; i < value.length; i += 1) {
                        traverse(value[i], `${path}.${key}[${i}]`, references);
                    }
                }

                // We don't care of any other values except Arrays and objects.
            }
        }
    };

    traverse(object, 'root');
    return cycles;
}
