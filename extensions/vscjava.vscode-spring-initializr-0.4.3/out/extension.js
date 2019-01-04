// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const vscode = require("vscode");
const vscode_extension_telemetry_wrapper_1 = require("vscode-extension-telemetry-wrapper");
const handler_1 = require("./handler");
const Utils_1 = require("./Utils");
const VSCodeUI_1 = require("./Utils/VSCodeUI");
function activate(context) {
    return __awaiter(this, void 0, void 0, function* () {
        yield vscode_extension_telemetry_wrapper_1.initializeFromJsonFile(context.asAbsolutePath("./package.json"), true);
        yield vscode_extension_telemetry_wrapper_1.instrumentOperation("activation", initializeExtension)(context);
    });
}
exports.activate = activate;
function initializeExtension(_operationId, context) {
    return __awaiter(this, void 0, void 0, function* () {
        yield Utils_1.loadPackageInfo(context);
        yield vscode_extension_telemetry_wrapper_1.TelemetryWrapper.initilizeFromJsonFile(context.asAbsolutePath("package.json"));
        context.subscriptions.push(instrumentAndRegisterCommand("spring.initializr.maven-project", (operationId) => __awaiter(this, void 0, void 0, function* () { return yield new handler_1.GenerateProjectHandler("maven-project").run(operationId); }), true), instrumentAndRegisterCommand("spring.initializr.gradle-project", (operationId) => __awaiter(this, void 0, void 0, function* () { return yield new handler_1.GenerateProjectHandler("gradle-project").run(operationId); }), true));
        context.subscriptions.push(instrumentAndRegisterCommand("spring.initializr.generate", () => __awaiter(this, void 0, void 0, function* () {
            const projectType = yield VSCodeUI_1.getQuickPick(["maven-project", "gradle-project"], _.capitalize, null, null, { placeHolder: "Select project type." });
            yield vscode.commands.executeCommand(`spring.initializr.${projectType}`);
        })));
        context.subscriptions.push(instrumentAndRegisterCommand("spring.initializr.editStarters", (entry) => __awaiter(this, void 0, void 0, function* () {
            const targetFile = entry || (yield Utils_1.getTargetPomXml());
            if (targetFile) {
                yield vscode.window.showTextDocument(targetFile);
                yield new handler_1.EditStartersHandler().run(targetFile);
            }
            else {
                vscode.window.showInformationMessage("No pom.xml found in the workspace.");
            }
        })));
    });
}
function deactivate() {
    return __awaiter(this, void 0, void 0, function* () {
        yield vscode_extension_telemetry_wrapper_1.dispose();
    });
}
exports.deactivate = deactivate;
function instrumentAndRegisterCommand(name, cb, withOperationIdAhead) {
    const instrumented = vscode_extension_telemetry_wrapper_1.instrumentOperation(name, (_operationId, ...args) => __awaiter(this, void 0, void 0, function* () {
        withOperationIdAhead ? yield cb(_operationId, ...args) : yield cb(...args);
    }));
    return vscode_extension_telemetry_wrapper_1.TelemetryWrapper.registerCommand(name, instrumented);
}
//# sourceMappingURL=extension.js.map