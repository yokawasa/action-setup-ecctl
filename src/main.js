"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const os = __importStar(require("os"));
const path = __importStar(require("path"));
const util = __importStar(require("util"));
const fs = __importStar(require("fs"));
const toolCache = __importStar(require("@actions/tool-cache"));
const core = __importStar(require("@actions/core"));
const fetch = require('node-fetch');
const ecctlCommandName = 'ecctl';
const latestReleaseVersionUrl = 'https://github.com/elastic/ecctl/releases/latest';
function getkubectlDownloadURL(version) {
    switch (os.type()) {
        case 'Linux':
            return util.format('https://download.elastic.co/downloads/ecctl/%s/ecctl_%s_linux_amd64.tar.gz', version, version);
        case 'Darwin':
            return util.format('https://download.elastic.co/downloads/ecctl/%s/ecctl_%s_darwin_amd64.tar.gz', version, version);
        default:
            return util.format('https://download.elastic.co/downloads/ecctl/%s/ecctl_%s_linux_amd64.tar.gz', version, version);
    }
}
function getLatestReleaseVersion() {
    return __awaiter(this, void 0, void 0, function* () {
        let version = '';
        const response = yield fetch(latestReleaseVersionUrl, {
            method: 'GET',
            redirect: 'manual'
        });
        const redirect_target = yield response.headers.get('location');
        if (redirect_target) {
            const matched_urls = redirect_target.match(/https:\/\/github.com\/elastic\/ecctl\/releases\/tag\/(.*)/g);
            if (matched_urls.length > 0) {
                const matched_url = matched_urls[0];
                version = matched_url.split('/')[7];
            }
        }
        return version;
    });
}
function download(version) {
    return __awaiter(this, void 0, void 0, function* () {
        // remove v from version if version starts from v
        let _version = version;
        if (_version.charAt(0) == 'v') {
            _version = version.substring(1);
        }
        let cachedToolpath = toolCache.find(ecctlCommandName, _version);
        //console.log('>>>>>>>>>>>>>>cachedToolpath=' + cachedToolpath)
        let downloadEcctlPath = '';
        if (!cachedToolpath) {
            try {
                const downloadPackagePath = yield toolCache.downloadTool(getkubectlDownloadURL(_version));
                // create dir 
                fs.mkdirSync(downloadPackagePath + '_extracted');
                // https://github.com/actions/toolkit/tree/master/packages/tool-cache
                const extractedDir = yield toolCache.extractTar(downloadPackagePath, downloadPackagePath + '_extracted');
                downloadEcctlPath = util.format('%s/ecctl', extractedDir);
            }
            catch (exception) {
                throw new Error('downloadEcctlFailed');
            }
            cachedToolpath = yield toolCache.cacheFile(downloadEcctlPath, ecctlCommandName, ecctlCommandName, _version);
            //console.log(">>>>>>>> cachedToolpath=" + cachedToolpath)
        }
        const ecctlPath = path.join(cachedToolpath, ecctlCommandName);
        fs.chmodSync(ecctlPath, '777');
        return ecctlPath;
    });
}
function ecctl_setup() {
    return __awaiter(this, void 0, void 0, function* () {
        if (os.type().match(/^Win/)) {
            throw new Error('Windows is not supported OS!');
        }
        let version = core.getInput('version', { 'required': true });
        if (version.toLocaleLowerCase() === 'latest') {
            version = yield getLatestReleaseVersion();
        }
        let cachedPath = yield download(version);
        core.addPath(path.dirname(cachedPath));
        console.log(`Ecctl tool version: '${version}' has been cached at ${cachedPath}`);
        core.setOutput('ecctl-path', cachedPath);
    });
}
ecctl_setup().catch(core.setFailed);
