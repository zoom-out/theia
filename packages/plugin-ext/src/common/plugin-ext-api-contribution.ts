/********************************************************************************
 * Copyright (C) 2018 Red Hat, Inc. and others.
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
import { RPCProtocol } from '../api/rpc-protocol';
import { PluginManager, Plugin } from '../api/plugin-api';
import { interfaces } from 'inversify';

export const ExtPluginApiProvider = 'extPluginApi';
export interface ExtPluginApiProvider {
    provideApi(): ExtPluginApi;
}

export interface ExtPluginApi {

    /**
     * Path to the script which should do some initialization before backend plugin is loaded.
     */
    backendInitPath?: string;

    frontendExtApi?: FrontendExtPluginApi;
}

export interface ExtPluginApiFrontendInitializationFn {
    (rpc: RPCProtocol, plugins: Map<string, Plugin>): void;
}

export interface ExtPluginApiBackendInitializationFn {
    (rpc: RPCProtocol, pluginManager: PluginManager): void;
}

export interface FrontendExtPluginApi {
    initPath: string;
    initVariable: string;
    initFunction: string;
}

export const MainPluginApiProvider = Symbol('mainPluginApi');
export interface MainPluginApiProvider {
    initialize(rpc: RPCProtocol, container: interfaces.Container): void;
}
