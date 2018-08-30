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

import { injectable, inject, named } from 'inversify';
import { Command, MenuModelRegistry, CommandRegistry } from '@theia/core';
import { UserPreferenceProvider } from './user-preference-provider';
import {
    CommonMenus,
    PreferenceScope,
    PreferenceProvider,
    AbstractViewContribution
} from '@theia/core/lib/browser';
import { WorkspacePreferenceProvider } from './workspace-preference-provider';
import { FileSystem } from '@theia/filesystem/lib/common';
import { UserStorageService } from '@theia/userstorage/lib/browser';
import { PreferencesContainer } from './preferences-tree-widget';
import URI from '@theia/core/lib/common/uri';

export const PREFERENCES_COMMAND: Command = {
    id: 'preferences:open',
    label: 'Open Preferences'
};

@injectable()
export class PreferencesContribution extends AbstractViewContribution<PreferencesContainer> {

    @inject(UserStorageService) protected readonly userStorageService: UserStorageService;
    @inject(PreferenceProvider) @named(PreferenceScope.User) protected readonly userPreferenceProvider: UserPreferenceProvider;
    @inject(PreferenceProvider) @named(PreferenceScope.Workspace) protected readonly workspacePreferenceProvider: WorkspacePreferenceProvider;
    @inject(FileSystem) protected readonly filesystem: FileSystem;

    constructor() {
        super({
            widgetId: PreferencesContainer.ID,
            widgetName: 'Preferences',
            defaultWidgetOptions: { area: 'main' }
        });
    }

    registerCommands(commands: CommandRegistry): void {
        commands.registerCommand(PREFERENCES_COMMAND, {
            isEnabled: () => true,
            execute: () => this.openPreferences()
        });
    }

    registerMenus(menus: MenuModelRegistry): void {
        menus.registerMenuAction(CommonMenus.FILE_SETTINGS_SUBMENU_OPEN, {
            commandId: PREFERENCES_COMMAND.id,
            order: 'a10'
        });
    }

    protected async openPreferences(): Promise<void> {
        await this.createFileIfNotExists(this.userPreferenceProvider.getUri());

        const wsUri = await this.workspacePreferenceProvider.getUri();
        if (!wsUri) {
            return;
        }
        await this.createFileIfNotExists(wsUri);

        super.openView({ activate: true });
    }

    private async createFileIfNotExists(uri: URI) {
        if (!(await this.filesystem.exists(uri.toString()))) {
            await this.filesystem.createFile(uri.toString());
        }
    }
}
