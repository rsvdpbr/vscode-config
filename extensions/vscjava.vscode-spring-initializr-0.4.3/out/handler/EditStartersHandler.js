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
const fse = require("fs-extra");
const vscode = require("vscode");
const vscode_extension_telemetry_wrapper_1 = require("vscode-extension-telemetry-wrapper");
const DependencyManager_1 = require("../DependencyManager");
const model_1 = require("../model");
const Utils_1 = require("../Utils");
class EditStartersHandler {
    run(entry) {
        return __awaiter(this, void 0, void 0, function* () {
            // TO REMOVE
            const session = vscode_extension_telemetry_wrapper_1.TelemetryWrapper.currentSession();
            if (session && session.extraProperties) {
                session.extraProperties.finishedSteps = [];
            }
            // UNTIL HERE
            const deps = []; // gid:aid
            // Read pom.xml for $bootVersion, $dependencies(gid, aid)
            const content = yield fse.readFile(entry.fsPath);
            const xml = yield Utils_1.readXmlContent(content.toString());
            const bootVersion = model_1.getBootVersion(xml.project);
            if (!bootVersion) {
                vscode.window.showErrorMessage("Not a valid Spring Boot project.");
                return;
            }
            if (session && session.extraProperties) {
                session.extraProperties.bootVersion = bootVersion;
            }
            model_1.getDependencyNodes(xml.project).forEach(elem => {
                deps.push(`${elem.groupId[0]}:${elem.artifactId[0]}`);
            });
            finishStep(session, stepBootVersion);
            // [interaction] Step: Dependencies, with pre-selected deps
            const starters = yield vscode.window.withProgress({ location: vscode.ProgressLocation.Window }, (p) => __awaiter(this, void 0, void 0, function* () {
                p.report({ message: `Fetching metadata for version ${bootVersion} ...` });
                return yield model_1.getStarters(bootVersion);
            }));
            const oldStarterIds = [];
            Object.keys(starters.dependencies).forEach(key => {
                const elem = starters.dependencies[key];
                if (deps.indexOf(`${elem.groupId}:${elem.artifactId}`) >= 0) {
                    oldStarterIds.push(key);
                }
            });
            DependencyManager_1.dependencyManager.selectedIds = [].concat(oldStarterIds);
            let current = null;
            do {
                current = yield vscode.window.showQuickPick(DependencyManager_1.dependencyManager.getQuickPickItems(bootVersion), {
                    ignoreFocusOut: true,
                    matchOnDescription: true,
                    matchOnDetail: true,
                    placeHolder: "Select dependencies.",
                });
                if (current && current.itemType === "dependency") {
                    DependencyManager_1.dependencyManager.toggleDependency(current.id);
                }
            } while (current && current.itemType === "dependency");
            if (!current) {
                return;
            }
            if (session && session.extraProperties) {
                session.extraProperties.dependencies = current.id;
            }
            finishStep(session, stepDependencies);
            // Diff deps for add/remove
            const toRemove = oldStarterIds.filter(elem => DependencyManager_1.dependencyManager.selectedIds.indexOf(elem) < 0);
            const toAdd = DependencyManager_1.dependencyManager.selectedIds.filter(elem => oldStarterIds.indexOf(elem) < 0);
            if (toRemove.length + toAdd.length === 0) {
                vscode.window.showInformationMessage("No changes.");
                return;
            }
            const msgRemove = (toRemove && toRemove.length) ? `Removing: [${toRemove.map(d => DependencyManager_1.dependencyManager.dict[d] && DependencyManager_1.dependencyManager.dict[d].name).filter(Boolean).join(", ")}].` : "";
            const msgAdd = (toAdd && toAdd.length) ? `Adding: [${toAdd.map(d => DependencyManager_1.dependencyManager.dict[d] && DependencyManager_1.dependencyManager.dict[d].name).filter(Boolean).join(", ")}].` : "";
            const choice = yield vscode.window.showWarningMessage(`${msgRemove} ${msgAdd} Proceed?`, "Proceed", "Cancel");
            if (choice !== "Proceed") {
                finishStep(session, stepCancel);
                return;
            }
            else {
                finishStep(session, stepProceed);
            }
            // add spring-boot-starter if no selected starters
            if (DependencyManager_1.dependencyManager.selectedIds.length === 0) {
                toAdd.push("spring-boot-starter");
                starters.dependencies["spring-boot-starter"] = {
                    artifactId: "spring-boot-starter",
                    groupId: "org.springframework.boot",
                };
            }
            // modify xml object
            const newXml = getUpdatedPomXml(xml, starters, toRemove, toAdd);
            // re-generate a pom.xml
            const output = Utils_1.buildXmlContent(newXml);
            yield fse.writeFile(entry.fsPath, output);
            vscode.window.showInformationMessage("Pom file successfully updated.");
            finishStep(session, stepWriteFile);
            return;
        });
    }
}
exports.EditStartersHandler = EditStartersHandler;
function getUpdatedPomXml(xml, starters, toRemove, toAdd) {
    const ret = Object.assign({}, xml);
    toRemove.forEach(elem => {
        model_1.removeDependencyNode(ret.project, starters.dependencies[elem].groupId, starters.dependencies[elem].artifactId);
    });
    toAdd.forEach(elem => {
        const dep = starters.dependencies[elem];
        const newDepNode = new model_1.DependencyNode(dep.groupId, dep.artifactId, dep.version, dep.scope);
        model_1.addDependencyNode(ret.project, newDepNode.node);
        if (dep.bom) {
            const bom = starters.boms[dep.bom];
            const newBomNode = new model_1.BomNode(bom.groupId, bom.artifactId, bom.version);
            model_1.addBomNode(ret.project, newBomNode.node);
        }
        if (dep.repository) {
            const repo = starters.repositories[dep.repository];
            const newRepoNode = new model_1.RepositoryNode(dep.repository, repo.name, repo.url, repo.snapshotEnabled);
            model_1.addRepositoryNode(ret.project, newRepoNode.node);
        }
    });
    return ret;
}
const stepBootVersion = { name: "BootVersion", info: "BootVersion identified." };
const stepDependencies = { name: "Dependencies", info: "Dependencies selected." };
const stepCancel = { name: "Cancel", info: "Canceled by user." };
const stepProceed = { name: "Proceed", info: "Confirmed by user." };
const stepWriteFile = { name: "WriteFile", info: "Pom file updated." };
function finishStep(session, step) {
    if (session && session.extraProperties) {
        session.extraProperties.finishedSteps.push(step.name);
    }
    vscode_extension_telemetry_wrapper_1.TelemetryWrapper.info(step.info);
}
//# sourceMappingURL=EditStartersHandler.js.map