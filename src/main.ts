import * as os from 'os'
import * as path from 'path'
import * as util from 'util'
import * as fs from 'fs'
import fetch from 'node-fetch'

import * as toolCache from '@actions/tool-cache'
import * as core from '@actions/core'

const defaultVesrion = 'latest'
const ecctlCommandName = 'ecctl'
const latestReleaseVersionUrl =
  'https://github.com/elastic/ecctl/releases/latest'

function getEcctlDownloadURL(version: string): string {
  switch (os.type()) {
    case 'Linux':
      return util.format(
        'https://download.elastic.co/downloads/ecctl/%s/ecctl_%s_linux_amd64.tar.gz',
        version,
        version
      )
    case 'Darwin':
      return util.format(
        'https://download.elastic.co/downloads/ecctl/%s/ecctl_%s_darwin_amd64.tar.gz',
        version,
        version
      )
    default:
      return util.format(
        'https://download.elastic.co/downloads/ecctl/%s/ecctl_%s_linux_amd64.tar.gz',
        version,
        version
      )
  }
}

async function getLatestReleaseVersion(): Promise<string> {
  let version = ''
  const response = await fetch(latestReleaseVersionUrl, {
    method: 'GET',
    redirect: 'manual'
  })
  const redirectTarget = response.headers.get('location')
  if (redirectTarget) {
    const matchedUrls = redirectTarget.match(
      /https:\/\/github.com\/elastic\/ecctl\/releases\/tag\/(.*)/g
    )
    if (matchedUrls != null && matchedUrls.length > 0) {
      const matchedUrl = matchedUrls[0]
      version = matchedUrl.split('/')[7]
    }
  }
  return version
}

async function download(version: string): Promise<string> {
  // remove v from version if version starts from v
  let _version = version
  if (_version.startsWith('v')) {
    _version = version.substring(1)
  }
  let cachedToolpath = toolCache.find(ecctlCommandName, _version)
  let downloadEcctlPath = ''
  if (!cachedToolpath) {
    try {
      const downloadPackagePath = await toolCache.downloadTool(
        getEcctlDownloadURL(_version)
      )
      fs.mkdirSync(`${downloadPackagePath}_extracted`)
      const extractedDir = await toolCache.extractTar(
        downloadPackagePath,
        `${downloadPackagePath}_extracted`
      )
      downloadEcctlPath = util.format('%s/ecctl', extractedDir)
    } catch (exception) {
      throw new Error('downloadEcctlFailed')
    }
    cachedToolpath = await toolCache.cacheFile(
      downloadEcctlPath,
      ecctlCommandName,
      ecctlCommandName,
      _version
    )
  }

  const ecctlPath = path.join(cachedToolpath, ecctlCommandName)
  fs.chmodSync(ecctlPath, '777')
  return ecctlPath
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
async function run() {
  if (os.type().match(/^Win/)) {
    throw new Error('Windows is not supported OS!')
  }
  let version = core.getInput('version', {required: false})
  if (!version) {
    version = defaultVesrion
  }
  if (version.toLocaleLowerCase() === 'latest') {
    version = await getLatestReleaseVersion()
  }
  const cachedPath = await download(version)
  core.addPath(path.dirname(cachedPath))
  console.log(
    `Ecctl tool version: '${version}' has been cached at ${cachedPath}`
  )
  core.setOutput('ecctl-path', cachedPath)
}

run().catch(core.setFailed)
