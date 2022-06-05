<p align="center">
  <a href="https://github.com/yokawasa/action-setup-ecctl/actions"><img alt="action-setup-ecctl status" src="https://github.com/yokawasa/action-setup-ecctl/workflows/build-test/badge.svg"></a>
</p>

# action-setup-ecctl

A GitHub action that install a specific version of [ecctl](https://github.com/elastic/ecctl) (Elastic Cloud control tool) and cache it on the runner

## Usage

### Inputs

|Parameter|Required|Default Value|Description|
|:--:|:--:|:--:|:--|
|`version`|`false`|`latest`|Ecctl tool version such as `v1.3.1`. Ecctl vesion can be found [here](https://github.com/elastic/ecctl/releases).|

> Supported Environments: Linux and macOS

### Outputs

|Parameter|Description|
|:--:|:--|
|`ecctl-path`| ecctl command path |


### Sample Workflow

A specific version of ecctl can be setup by giving an input - `version` like this:
```yaml
- uses: yokawasa/action-setup-ecctl@v0.3.1
  with:
    version: 'v1.3.1'   # default is 'latest'
  id: setup
- run: |
  ecctl version
```

The latest version of ecctl will be setup if you don't give an input like this:

```yaml
- uses: yokawasa/action-setup-ecctl@v0.3.1
  id: setup
- run: |
  ecctl version
```

## Developing the action

Install the dependencies  
```bash
npm install
```

Build the typescript and package it for distribution by running [ncc](https://github.com/zeit/ncc)
```bash
npm run build && npm run pack
```

Finally push the resutls
```
git add dist
git commit -a -m "prod dependencies"
git push origin releases/v0.3.1
```

## Contributing
Bug reports and pull requests are welcome on GitHub at https://github.com/yokawasa/action-setup-ecctl
