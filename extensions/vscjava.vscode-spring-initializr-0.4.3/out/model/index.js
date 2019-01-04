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
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const Utils_1 = require("../Utils");
const VersionHelper_1 = require("../Utils/VersionHelper");
let overview;
const starters = {};
function getStarters(bootVersion) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!starters[bootVersion]) {
            const rawJSONString = yield Utils_1.downloadFile(`${Utils_1.getServiceUrl()}dependencies?bootVersion=${bootVersion}`, true, { Accept: "application/vnd.initializr.v2.1+json" });
            starters[bootVersion] = JSON.parse(rawJSONString);
        }
        return _.cloneDeep(starters[bootVersion]);
    });
}
exports.getStarters = getStarters;
function getBootVersions() {
    return __awaiter(this, void 0, void 0, function* () {
        if (!overview) {
            yield update();
        }
        if (!overview.bootVersion) {
            return [];
        }
        else {
            return overview.bootVersion.values.filter(x => x.id === overview.bootVersion.default)
                .concat(overview.bootVersion.values.filter(x => x.id !== overview.bootVersion.default));
        }
    });
}
exports.getBootVersions = getBootVersions;
function getAvailableDependencies(bootVersion) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!overview) {
            yield update();
        }
        if (!overview.dependencies) {
            return [];
        }
        else {
            const ret = [];
            for (const grp of overview.dependencies.values) {
                const group = grp.name;
                ret.push(...grp.values.filter(dep => isCompatible(dep, bootVersion)).map(dep => Object.assign({ group }, dep)));
            }
            return ret;
        }
    });
}
exports.getAvailableDependencies = getAvailableDependencies;
function isCompatible(dep, bootVersion) {
    if (bootVersion && dep && dep.versionRange) {
        return VersionHelper_1.matchRange(bootVersion, dep.versionRange);
    }
    else {
        return true;
    }
}
function update() {
    return __awaiter(this, void 0, void 0, function* () {
        const rawJSONString = yield Utils_1.downloadFile(Utils_1.getServiceUrl(), true, { Accept: "application/vnd.initializr.v2.1+json" });
        overview = JSON.parse(rawJSONString);
    });
}
__export(require("./Interfaces"));
__export(require("./pomxml/BomNode"));
__export(require("./pomxml/DependencyNode"));
__export(require("./pomxml/PomXml"));
__export(require("./pomxml/RepositoryNode"));
//# sourceMappingURL=index.js.map