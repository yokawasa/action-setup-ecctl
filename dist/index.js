/******/ /* webpack/runtime/compat */
/******/ 
/******/ if (typeof __nccwpck_require__ !== 'undefined') __nccwpck_require__.ab = new URL('.', import.meta.url).pathname.slice(import.meta.url.match(/^file:\/\/\/\w:/) ? 1 : 0, -1) + "/";
/******/ 
/************************************************************************/
var __webpack_exports__ = {};

var __createBinding = (undefined && undefined.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (undefined && undefined.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (undefined && undefined.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (undefined && undefined.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const os = __importStar(require("os"));
const path = __importStar(require("path"));
const util = __importStar(require("util"));
const fs = __importStar(require("fs"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const toolCache = __importStar(require("@actions/tool-cache"));
const core = __importStar(require("@actions/core"));
const defaultVesrion = 'latest';
const ecctlCommandName = 'ecctl';
const latestReleaseVersionUrl = 'https://github.com/elastic/ecctl/releases/latest';
function getEcctlDownloadURL(version) {
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
        const response = yield (0, node_fetch_1.default)(latestReleaseVersionUrl, {
            method: 'GET',
            redirect: 'manual'
        });
        const redirectTarget = response.headers.get('location');
        if (redirectTarget) {
            const matchedUrls = redirectTarget.match(/https:\/\/github.com\/elastic\/ecctl\/releases\/tag\/(.*)/g);
            if (matchedUrls != null && matchedUrls.length > 0) {
                const matchedUrl = matchedUrls[0];
                version = matchedUrl.split('/')[7];
            }
        }
        return version;
    });
}
function download(version) {
    return __awaiter(this, void 0, void 0, function* () {
        // remove v from version if version starts from v
        let _version = version;
        if (_version.startsWith('v')) {
            _version = version.substring(1);
        }
        let cachedToolpath = toolCache.find(ecctlCommandName, _version);
        let downloadEcctlPath = '';
        if (!cachedToolpath) {
            try {
                const downloadPackagePath = yield toolCache.downloadTool(getEcctlDownloadURL(_version));
                fs.mkdirSync(`${downloadPackagePath}_extracted`);
                const extractedDir = yield toolCache.extractTar(downloadPackagePath, `${downloadPackagePath}_extracted`);
                downloadEcctlPath = util.format('%s/ecctl', extractedDir);
            }
            catch (exception) {
                throw new Error('downloadEcctlFailed');
            }
            cachedToolpath = yield toolCache.cacheFile(downloadEcctlPath, ecctlCommandName, ecctlCommandName, _version);
        }
        const ecctlPath = path.join(cachedToolpath, ecctlCommandName);
        fs.chmodSync(ecctlPath, '777');
        return ecctlPath;
    });
}
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        if (os.type().match(/^Win/)) {
            throw new Error('Windows is not supported OS!');
        }
        let version = core.getInput('version', { required: false });
        if (!version) {
            version = defaultVesrion;
        }
        if (version.toLocaleLowerCase() === 'latest') {
            version = yield getLatestReleaseVersion();
        }
        const cachedPath = yield download(version);
        core.addPath(path.dirname(cachedPath));
        console.log(`Ecctl tool version: '${version}' has been cached at ${cachedPath}`);
        core.setOutput('ecctl-path', cachedPath);
    });
}
run().catch(core.setFailed);

