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

/**
 * Modified code from https://github.com/palantir/tslint/blob/master/src/rules/noImplicitDependenciesRule.ts
 *
 * @license
 * Copyright 2017 Palantir Technologies, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as builtins from 'builtin-modules';
import * as fs from 'fs';
import * as path from 'path';
import { findImports, ImportKind } from 'tsutils';
import * as ts from 'typescript';

import * as Lint from 'tslint';

interface Options {
    dev: boolean;
    optional: boolean;
}

const OPTION_DEV = 'dev';
const OPTION_OPTIONAL = 'optional';

export class Rule extends Lint.Rules.AbstractRule {
    /* tslint:disable:object-literal-sort-keys */
    public static metadata: Lint.IRuleMetadata = {
        ruleName: 'no-missing-theia-dependencies',
        description: "Disallows importing Theia modules that are not listed as dependency in the project's package.json",
        descriptionDetails: Lint.Utils.dedent`
            Disallows importing transient dependencies and modules from Theia installed above your package's root directory.
        `,
        optionsDescription: Lint.Utils.dedent`
            By default the rule looks at \`"dependencies"\` and \`"peerDependencies"\`.
            By adding the \`"${OPTION_DEV}"\` option the rule also looks at \`"devDependencies"\`.
            By adding the \`"${OPTION_OPTIONAL}"\` option the rule also looks at \`"optionalDependencies"\`.
        `,
        options: {
            type: 'array',
            items: [
                {
                    type: 'string',
                    enum: [OPTION_DEV, OPTION_OPTIONAL],
                },
            ],
            minItems: 0,
            maxItems: 2,
        },
        type: 'functionality',
        typescriptOnly: false,
    };
    /* tslint:enable:object-literal-sort-keys */

    public static FAILURE_STRING_FACTORY(module: string) {
        return `Module '${module}' is not listed as dependency in package.json.`;
    }

    public apply(sourceFile: ts.SourceFile): Lint.RuleFailure[] {
        return this.applyWithFunction(sourceFile, walk, {
            dev: this.ruleArguments.indexOf(OPTION_DEV) !== - 1,
            optional: this.ruleArguments.indexOf(OPTION_OPTIONAL) !== -1,
        });
    }
}

function walk(ctx: Lint.WalkContext<Options>) {
    const { options } = ctx;
    let dependencies: Set<string> | undefined;
    for (const name of findImports(ctx.sourceFile, ImportKind.All)) {
        if (!ts.isExternalModuleNameRelative(name.text)) {
            const packageName = getPackageName(name.text);
            if (builtins.indexOf(packageName) === -1 && /^@theia/.test(packageName) && !hasDependency(packageName)) {
                ctx.addFailureAtNode(name, Rule.FAILURE_STRING_FACTORY(packageName));
            }
        }
    }

    function hasDependency(module: string): boolean {
        if (dependencies === undefined) {
            dependencies = getDependencies(ctx.sourceFile.fileName, options);
        }
        return dependencies.has(module);
    }
}

function getPackageName(name: string): string {
    const parts = name.split(/\//g);
    if (name[0] !== '@') {
        return parts[0];
    }
    return `${parts[0]}/${parts[1]}`;
}

interface Dependencies extends Object {
    [name: string]: any;
}

interface PackageJson {
    dependencies?: Dependencies;
    devDependencies?: Dependencies;
    peerDependencies?: Dependencies;
    optionalDependencies?: Dependencies;
}

function getDependencies(fileName: string, options: Options): Set<string> {
    const result = new Set<string>();
    const packageJsonPath = findPackageJson(path.resolve(path.dirname(fileName)));
    if (packageJsonPath !== undefined) {
        try {
            // don't use require here to avoid caching
            // remove BOM from file content before parsing
            const content = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8').replace(/^\uFEFF/, '')) as PackageJson;
            if (content.dependencies !== undefined) {
                addDependencies(result, content.dependencies);
            }
            if (content.peerDependencies !== undefined) {
                addDependencies(result, content.peerDependencies);
            }
            if (options.dev && content.devDependencies !== undefined) {
                addDependencies(result, content.devDependencies);
            }
            if (options.optional && content.optionalDependencies !== undefined) {
                addDependencies(result, content.optionalDependencies);
            }
        } catch {
            // treat malformed package.json files as empty
        }
    }

    return result;
}

function addDependencies(result: Set<string>, dependencies: Dependencies) {
    for (const name in dependencies) {
        if (dependencies.hasOwnProperty(name)) {
            result.add(name);
        }
    }
}

function findPackageJson(current: string): string | undefined {
    let prev: string;
    do {
        const fileName = path.join(current, 'package.json');
        if (fs.existsSync(fileName)) {
            return fileName;
        }
        prev = current;
        current = path.dirname(current);
    } while (prev !== current);
    return undefined;
}
