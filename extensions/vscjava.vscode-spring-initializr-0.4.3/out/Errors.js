"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_extension_telemetry_wrapper_1 = require("vscode-extension-telemetry-wrapper");
// tslint:disable-next-line:export-name
class OperationCanceledError extends Error {
    constructor(msg) {
        super(msg);
        vscode_extension_telemetry_wrapper_1.setUserError(this);
    }
}
exports.OperationCanceledError = OperationCanceledError;
//# sourceMappingURL=Errors.js.map