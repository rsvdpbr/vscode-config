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
const fs = require("fs-extra");
const os = require("os");
const vscode_1 = require("vscode");
const terminals = {};
function runInTerminal(command, options) {
    const defaultOptions = { addNewLine: true, name: "default" };
    const { addNewLine, name, cwd } = Object.assign(defaultOptions, options);
    if (terminals[name] === undefined) {
        terminals[name] = vscode_1.window.createTerminal({ name });
    }
    terminals[name].show();
    if (cwd) {
        terminals[name].sendText(getCDCommand(cwd), true);
    }
    terminals[name].sendText(getCommand(command), addNewLine);
}
exports.runInTerminal = runInTerminal;
function getCommand(cmd) {
    if (os.platform() === "win32") {
        const windowsShell = vscode_1.workspace.getConfiguration("terminal").get("integrated.shell.windows")
            .toLowerCase();
        if (windowsShell && windowsShell.indexOf("powershell.exe") > -1) {
            return `& ${cmd}`; // PowerShell
        }
        else {
            return cmd; // others, try using common one.
        }
    }
    else {
        return cmd;
    }
}
exports.getCommand = getCommand;
function getCDCommand(cwd) {
    if (os.platform() === "win32") {
        const windowsShell = vscode_1.workspace.getConfiguration("terminal").get("integrated.shell.windows")
            .toLowerCase();
        if (windowsShell && windowsShell.indexOf("bash.exe") > -1 && windowsShell.indexOf("git") > -1) {
            return `cd "${cwd.replace(/\\+$/, "")}"`; // Git Bash: remove trailing '\'
        }
        else if (windowsShell && windowsShell.indexOf("powershell.exe") > -1) {
            return `cd "${cwd}"`; // PowerShell
        }
        else if (windowsShell && windowsShell.indexOf("cmd.exe") > -1) {
            return `cd /d "${cwd}"`; // CMD
        }
        else {
            return `cd "${cwd}"`; // Unknown, try using common one.
        }
    }
    else {
        return `cd "${cwd}"`;
    }
}
exports.getCDCommand = getCDCommand;
function onDidCloseTerminal(closedTerminal) {
    delete terminals[closedTerminal.name];
}
exports.onDidCloseTerminal = onDidCloseTerminal;
function openDialogForFolder(customOptions) {
    return __awaiter(this, void 0, void 0, function* () {
        const options = {
            canSelectFiles: false,
            canSelectFolders: true,
            canSelectMany: false,
        };
        const result = yield vscode_1.window.showOpenDialog(Object.assign(options, customOptions));
        if (result && result.length) {
            return Promise.resolve(result[0]);
        }
        else {
            return Promise.resolve(null);
        }
    });
}
exports.openDialogForFolder = openDialogForFolder;
function openDialogForFile(customOptions) {
    return __awaiter(this, void 0, void 0, function* () {
        const options = {
            canSelectFiles: true,
            canSelectFolders: false,
            canSelectMany: false,
        };
        const result = yield vscode_1.window.showOpenDialog(Object.assign(options, customOptions));
        if (result && result.length) {
            return Promise.resolve(result[0]);
        }
        else {
            return Promise.resolve(null);
        }
    });
}
exports.openDialogForFile = openDialogForFile;
function openFileIfExists(filepath) {
    return __awaiter(this, void 0, void 0, function* () {
        if (yield fs.pathExists(filepath)) {
            vscode_1.window.showTextDocument(vscode_1.Uri.file(filepath), { preview: false });
        }
    });
}
exports.openFileIfExists = openFileIfExists;
function getQuickPick(itemsSource, labelfunc, descfunc, detailfunc, options) {
    return __awaiter(this, void 0, void 0, function* () {
        const itemWrappersPromise = new Promise((resolve, _reject) => __awaiter(this, void 0, void 0, function* () {
            const ret = (yield itemsSource).map((item) => Object.assign({}, {
                description: (descfunc && descfunc(item)),
                detail: (detailfunc && detailfunc(item)),
                label: (labelfunc && labelfunc(item)),
                value: item,
            }));
            resolve(ret);
        }));
        const selected = yield vscode_1.window.showQuickPick(itemWrappersPromise, Object.assign({ ignoreFocusOut: true }, options));
        return selected && selected.value;
    });
}
exports.getQuickPick = getQuickPick;
function getFromInputBox(options) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield vscode_1.window.showInputBox(Object.assign({ ignoreFocusOut: true }, options));
    });
}
exports.getFromInputBox = getFromInputBox;
//# sourceMappingURL=VSCodeUI.js.map