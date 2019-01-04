"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const extract = require("extract-zip");
const fse = require("fs-extra");
const path = require("path");
const vscode = require("vscode");
const vscode_extension_telemetry_wrapper_1 = require("vscode-extension-telemetry-wrapper");
const DependencyManager_1 = require("../DependencyManager");
const Errors_1 = require("../Errors");
const model_1 = require("../model");
const Utils_1 = require("../Utils");
const VSCodeUI_1 = require("../Utils/VSCodeUI");
class GenerateProjectHandler {
    constructor(projectType) {
        this.projectType = projectType;
    }
    run(operationId) {
        return __awaiter(this, void 0, void 0, function* () {
            // TO REMOVE
            const session = vscode_extension_telemetry_wrapper_1.TelemetryWrapper.currentSession();
            if (session && session.extraProperties) {
                session.extraProperties.finishedSteps = [];
            }
            // UNTIL HERE
            // Step: language
            this.language = yield vscode_extension_telemetry_wrapper_1.instrumentOperationStep(operationId, stepLanguage.name, specifyLanguage)();
            if (this.language === undefined) {
                throw new Errors_1.OperationCanceledError("Language not specified.");
            }
            finishStep(session, stepLanguage);
            // Step: Group Id
            this.groupId = yield vscode_extension_telemetry_wrapper_1.instrumentOperationStep(operationId, stepGroupId.name, specifyGroupId)();
            if (this.groupId === undefined) {
                throw new Errors_1.OperationCanceledError("GroupId not specified.");
            }
            finishStep(session, stepGroupId);
            // Step: Artifact Id
            this.artifactId = yield vscode_extension_telemetry_wrapper_1.instrumentOperationStep(operationId, stepArtifactId.name, specifyArtifactId)();
            if (this.artifactId === undefined) {
                throw new Errors_1.OperationCanceledError("ArtifactId not specified.");
            }
            finishStep(session, stepArtifactId);
            // Step: Packaging
            this.packaging = yield vscode_extension_telemetry_wrapper_1.instrumentOperationStep(operationId, "Packaging", specifyPackaging)();
            if (this.packaging === undefined) {
                throw new Errors_1.OperationCanceledError("Packaging not specified.");
            }
            // Step: bootVersion
            this.bootVersion = yield vscode_extension_telemetry_wrapper_1.instrumentOperationStep(operationId, stepBootVersion.name, specifyBootVersion)();
            if (this.bootVersion === undefined) {
                throw new Errors_1.OperationCanceledError("BootVersion not specified.");
            }
            vscode_extension_telemetry_wrapper_1.sendInfo(operationId, { bootVersion: this.bootVersion });
            finishStep(session, stepBootVersion);
            // Step: Dependencies
            this.dependencies = yield vscode_extension_telemetry_wrapper_1.instrumentOperationStep(operationId, stepDependencies.name, specifyDependencies)(this.bootVersion);
            vscode_extension_telemetry_wrapper_1.sendInfo(operationId, { depsType: this.dependencies.itemType, dependencies: this.dependencies.id });
            // TO REMOVE
            if (session && session.extraProperties) {
                session.extraProperties.depsType = this.dependencies.itemType;
                session.extraProperties.dependencies = this.dependencies.id;
            }
            finishStep(session, stepDependencies);
            // UNTIL HERE
            // Step: Choose target folder
            this.outputUri = yield vscode_extension_telemetry_wrapper_1.instrumentOperationStep(operationId, stepTargetFolder.name, specifyTargetFolder)(this.artifactId);
            if (this.outputUri === undefined) {
                throw new Errors_1.OperationCanceledError("Target folder not specified.");
            }
            finishStep(session, stepTargetFolder);
            // Step: Download & Unzip
            yield vscode_extension_telemetry_wrapper_1.instrumentOperationStep(operationId, stepDownloadUnzip.name, downloadAndUnzip)(this.downloadUrl, this.outputUri.fsPath);
            finishStep(session, stepDownloadUnzip);
            DependencyManager_1.dependencyManager.updateLastUsedDependencies(this.dependencies);
            // Open in new window
            const hasOpenFolder = (vscode.workspace.workspaceFolders !== undefined);
            const candidates = [
                "Open",
                hasOpenFolder ? "Add to Workspace" : undefined,
            ].filter(Boolean);
            const choice = yield vscode.window.showInformationMessage(`Successfully generated. Location: ${this.outputUri.fsPath}`, ...candidates);
            if (choice === "Open") {
                vscode.commands.executeCommand("vscode.openFolder", vscode.Uri.file(path.join(this.outputUri.fsPath, this.artifactId)), hasOpenFolder);
            }
            else if (choice === "Add to Workspace") {
                vscode.workspace.updateWorkspaceFolders(vscode.workspace.workspaceFolders.length, null, { uri: vscode.Uri.file(path.join(this.outputUri.fsPath, this.artifactId)) });
            }
        });
    }
    get downloadUrl() {
        const params = [
            `type=${this.projectType}`,
            `language=${this.language}`,
            `groupId=${this.groupId}`,
            `artifactId=${this.artifactId}`,
            `packaging=${this.packaging}`,
            `bootVersion=${this.bootVersion}`,
            `baseDir=${this.artifactId}`,
            `dependencies=${this.dependencies.id}`,
        ];
        return `${Utils_1.getServiceUrl()}/starter.zip?${params.join("&")}`;
    }
}
exports.GenerateProjectHandler = GenerateProjectHandler;
function specifyLanguage() {
    return __awaiter(this, void 0, void 0, function* () {
        let language = vscode.workspace.getConfiguration("spring.initializr").get("defaultLanguage");
        if (!language) {
            language = yield vscode.window.showQuickPick(["Java", "Kotlin", "Groovy"], { ignoreFocusOut: true, placeHolder: STEP_LANGUAGE_MESSAGE });
        }
        return language && language.toLowerCase();
    });
}
function specifyGroupId() {
    return __awaiter(this, void 0, void 0, function* () {
        const defaultGroupId = vscode.workspace.getConfiguration("spring.initializr").get("defaultGroupId");
        return yield VSCodeUI_1.getFromInputBox({
            placeHolder: "e.g. com.example",
            prompt: STEP_GROUPID_MESSAGE,
            validateInput: Utils_1.groupIdValidation,
            value: defaultGroupId,
        });
    });
}
function specifyArtifactId() {
    return __awaiter(this, void 0, void 0, function* () {
        const defaultArtifactId = vscode.workspace.getConfiguration("spring.initializr").get("defaultArtifactId");
        return yield VSCodeUI_1.getFromInputBox({
            placeHolder: "e.g. demo",
            prompt: STEP_ARTIFACTID_MESSAGE,
            validateInput: Utils_1.artifactIdValidation,
            value: defaultArtifactId,
        });
    });
}
function specifyPackaging() {
    return __awaiter(this, void 0, void 0, function* () {
        let packaging = vscode.workspace.getConfiguration("spring.initializr").get("defaultPackaging");
        if (!packaging) {
            packaging = yield vscode.window.showQuickPick(["JAR", "WAR"], { ignoreFocusOut: true, placeHolder: STEP_PACKAGING_MESSAGE });
        }
        return packaging && packaging.toLowerCase();
    });
}
function specifyBootVersion() {
    return __awaiter(this, void 0, void 0, function* () {
        const bootVersion = yield VSCodeUI_1.getQuickPick(model_1.getBootVersions(), version => version.name, version => version.description, null, { placeHolder: STEP_BOOTVERSION_MESSAGE });
        return bootVersion && bootVersion.id;
    });
}
function specifyDependencies(bootVersion) {
    return __awaiter(this, void 0, void 0, function* () {
        let current = null;
        do {
            current = yield vscode.window.showQuickPick(DependencyManager_1.dependencyManager.getQuickPickItems(bootVersion, { hasLastSelected: true }), { ignoreFocusOut: true, placeHolder: STEP_DEPENDENCY_MESSAGE, matchOnDetail: true, matchOnDescription: true });
            if (current && current.itemType === "dependency") {
                DependencyManager_1.dependencyManager.toggleDependency(current.id);
            }
        } while (current && current.itemType === "dependency");
        if (!current) {
            throw new Errors_1.OperationCanceledError("Canceled on dependency seletion.");
        }
        return current;
    });
}
function specifyTargetFolder(projectName) {
    return __awaiter(this, void 0, void 0, function* () {
        const OPTION_CONTINUE = "Continue";
        const OPTION_CHOOSE_ANOTHER_FOLDER = "Choose another folder";
        const LABEL_CHOOSE_FOLDER = "Generate into this folder";
        const MESSAGE_EXISTING_FOLDER = `A folder [${projectName}] already exists in the selected folder. Continue to overwrite or Choose another folder?`;
        let outputUri = yield VSCodeUI_1.openDialogForFolder({ openLabel: LABEL_CHOOSE_FOLDER });
        while (outputUri && (yield fse.pathExists(path.join(outputUri.fsPath, projectName)))) {
            const overrideChoice = yield vscode.window.showWarningMessage(MESSAGE_EXISTING_FOLDER, OPTION_CONTINUE, OPTION_CHOOSE_ANOTHER_FOLDER);
            if (overrideChoice === OPTION_CHOOSE_ANOTHER_FOLDER) {
                outputUri = yield VSCodeUI_1.openDialogForFolder({ openLabel: LABEL_CHOOSE_FOLDER });
            }
            else {
                break;
            }
        }
        return outputUri;
    });
}
function downloadAndUnzip(targetUrl, targetFolder) {
    return __awaiter(this, void 0, void 0, function* () {
        yield vscode.window.withProgress({ location: vscode.ProgressLocation.Window }, (p) => new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            p.report({ message: "Downloading zip package..." });
            const filepath = yield Utils_1.downloadFile(targetUrl);
            p.report({ message: "Starting to unzip..." });
            extract(filepath, { dir: targetFolder }, (err) => {
                if (err) {
                    return reject(err);
                }
                return resolve();
            });
        })));
    });
}
function finishStep(session, step) {
    if (session && session.extraProperties) {
        session.extraProperties.finishedSteps.push(step.name);
    }
    vscode_extension_telemetry_wrapper_1.TelemetryWrapper.info(step.info);
}
// UNTIL HERE
const STEP_LANGUAGE_MESSAGE = "Specify project language.";
const STEP_PACKAGING_MESSAGE = "Specify packaging type.";
const STEP_GROUPID_MESSAGE = "Input Group Id for your project.";
const STEP_ARTIFACTID_MESSAGE = "Input Artifact Id for your project.";
const STEP_BOOTVERSION_MESSAGE = "Specify Spring Boot version.";
const STEP_DEPENDENCY_MESSAGE = "Search for dependencies.";
const stepLanguage = { name: "Language", info: "Language selected." };
const stepGroupId = { name: "GroupId", info: "GroupId inputed." };
const stepArtifactId = { name: "ArtifactId", info: "ArtifactId inputed." };
const stepBootVersion = { name: "BootVersion", info: "BootVersion selected." };
const stepDependencies = { name: "Dependencies", info: "Dependencies selected." };
const stepTargetFolder = { name: "TargetFolder", info: "Target folder selected." };
const stepDownloadUnzip = { name: "DownloadUnzip", info: "Package unzipped." };
//# sourceMappingURL=GenerateProjectHandler.js.map