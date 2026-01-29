# 📦 dxcode 发布教程

本文档详细介绍如何将 dxcode 发布到各个包管理平台。

---

## 📋 目录

- [NPM - JavaScript 库 (dxcode)](#npm---javascript-库-dxcode)
- [NPM - CLI 工具 (dxcode-cli)](#npm---cli-工具-dxcode-cli)
- [Homebrew (macOS)](#homebrew-macos)
- [PyPI (Python)](#pypi-python)
- [Go Modules](#go-modules)
- [Crates.io (Rust)](#cratesio-rust)
- [Vercel (网站部署)](#vercel-网站部署)

---

## NPM - JavaScript 库 (dxcode)

### 1. 准备工作

```bash
# 进入 JavaScript 实现目录
cd implementations/javascript

# 确保已安装 Node.js 和 npm
node -v
npm -v
```

### 2. 注册 NPM 账号

如果还没有 NPM 账号，前往 [npmjs.com](https://www.npmjs.com/) 注册。

```bash
# 登录 NPM
npm login

# 验证登录状态
npm whoami
```

### 3. 检查包名是否可用

```bash
npm search dxcode
# 或者直接访问 https://www.npmjs.com/package/dxcode
```

### 4. 确认 package.json

```json
{
  "name": "dxcode",
  "version": "1.0.0",
  "description": "[dxcode] A distinctive, URL‑safe binary encoder with the signature `dx` prefix.",
  "main": "dx-encoding.js",
  "types": "dx-encoding.d.ts",
  "author": "Dogxi",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/dogxiii/dxcode.git"
  },
  "keywords": ["dx", "dxcode", "encoding", "base64", "dogxi"]
}
```

### 5. 运行测试

```bash
npm test
```

### 6. 发布

```bash
# 首次发布
npm publish

# 如果包名带有 scope（如 @dogxi/dxcode），需要设置为公开
npm publish --access public
```

### 7. 更新版本

```bash
# 补丁版本 (1.0.0 -> 1.0.1)
npm version patch

# 次版本 (1.0.0 -> 1.1.0)
npm version minor

# 主版本 (1.0.0 -> 2.0.0)
npm version major

# 发布新版本
npm publish
```

---

## NPM - CLI 工具 (dxcode-cli)

### 1. 准备工作

```bash
# 进入 CLI 目录
cd implementations/javascript/cli

# 确认 package.json
cat package.json
```

### 2. 确认 package.json

```json
{
  "name": "dxcode-cli",
  "version": "1.0.0",
  "description": "DX Encoding CLI - 命令行编码解码工具",
  "bin": {
    "dxc": "./index.js"
  },
  "dependencies": {
    "dxcode-lib": "^1.0.0"
  }
}
```

**注意**：CLI 依赖主库 `dxcode-lib`，所以需要先发布主库！

### 3. 发布顺序

```bash
# 1. 先发布主库
cd implementations/javascript
npm publish

# 2. 再发布 CLI
cd cli
npm publish
```

### 4. 用户安装方式

```bash
# 全局安装 CLI
npm i -g dxcode-cli

# 然后可以使用 dxc 命令
dxc --help
```

---

## Homebrew (macOS)

### 方式一：创建自己的 Tap（推荐）

1. **创建 tap 仓库**

在 GitHub 上创建一个名为 `homebrew-tap` 的仓库。

2. **复制 formula 文件**

将 `homebrew/dxcode-cli.rb` 复制到 tap 仓库根目录。

3. **发布 npm 包后更新 SHA256**

```bash
# 获取 npm tarball 的 SHA256
curl -sL https://registry.npmjs.org/dxcode-cli/-/dxcode-cli-1.0.0.tgz | shasum -a 256
```

4. **更新 formula 中的 sha256**

```ruby
class DxcodeCli < Formula
  desc "DX Encoding CLI - A unique encoding algorithm by Dogxi"
  homepage "https://dxc.dogxi.me"
  url "https://registry.npmjs.org/dxcode-cli/-/dxcode-cli-1.0.0.tgz"
  sha256 "实际的哈希值"  # 替换为实际值
  license "MIT"

  depends_on "node"

  def install
    system "npm", "install", *std_npm_args
    bin.install_symlink Dir["#{libexec}/bin/*"]
  end

  test do
    encoded = shell_output("#{bin}/dxc encode test").strip
    assert_match(/^dx/, encoded)
  end
end
```

5. **提交并推送**

```bash
git add dxcode-cli.rb
git commit -m "Add dxcode-cli formula v1.0.0"
git push
```

### 用户安装方式

```bash
# 添加 tap
brew tap dogxi/tap

# 安装
brew install dxcode-cli

# 或者一行命令
brew install dogxi/tap/dxcode-cli
```

### 方式二：使用 curl 安装脚本

项目已包含 `install.sh` 脚本，用户可以通过以下方式安装：

```bash
curl -fsSL https://raw.githubusercontent.com/dogxiii/dxcode/main/install.sh | sh
```

---

## PyPI (Python)

### 1. 准备工作

```bash
# 进入 Python 实现目录
cd implementations/python

# 安装构建工具
pip install build twine
```

### 2. 注册 PyPI 账号

前往 [pypi.org](https://pypi.org/) 注册账号。

### 3. 创建 pyproject.toml（推荐）

创建 `pyproject.toml` 文件：

```toml
[build-system]
requires = ["setuptools>=61.0", "wheel"]
build-backend = "setuptools.build_meta"

[project]
name = "dxcode"
version = "1.0.0"
description = "[dxcode] A distinctive, URL‑safe binary encoder with the signature `dx` prefix."
readme = "README.md"
license = {text = "MIT"}
authors = [
    {name = "Dogxi", email = "hi@dogxi.me"}
]
keywords = ["dx", "dxcode", "encoding", "base64", "dogxi", "binary", "text"]
classifiers = [
    "Development Status :: 5 - Production/Stable",
    "Intended Audience :: Developers",
    "License :: OSI Approved :: MIT License",
    "Programming Language :: Python :: 3",
    "Programming Language :: Python :: 3.7",
    "Programming Language :: Python :: 3.8",
    "Programming Language :: Python :: 3.9",
    "Programming Language :: Python :: 3.10",
    "Programming Language :: Python :: 3.11",
    "Programming Language :: Python :: 3.12",
]
requires-python = ">=3.7"

[project.urls]
Homepage = "https://dxc.dogxi.me"
Repository = "https://github.com/dogxii/dxcode"
Documentation = "https://github.com/dogxii/dxcode#readme"

[tool.setuptools]
py-modules = ["dxcode"]
```

### 4. 构建包

```bash
# 清理旧的构建文件
rm -rf dist/ build/ *.egg-info/

# 构建
python -m build
```

这会在 `dist/` 目录下生成：

- `dxcode-1.0.0.tar.gz` (源码包)
- `dxcode-1.0.0-py3-none-any.whl` (wheel 包)

### 5. 上传到 TestPyPI（可选，用于测试）

```bash
# 上传到测试服务器
twine upload --repository testpypi dist/*

# 测试安装
pip install --index-url https://test.pypi.org/simple/ dxcode
```

### 6. 发布到 PyPI

```bash
# 上传到正式服务器
twine upload dist/*
```

### 7. 使用 API Token（推荐）

为了安全，建议使用 API Token：

1. 登录 PyPI → Account Settings → API tokens
2. 创建 token
3. 创建 `~/.pypirc` 文件：

```ini
[pypi]
username = __token__
password = pypi-xxxxxxxxxxxxx
```

---

## Go Modules

Go 模块不需要发布到中央仓库，只需推送到 GitHub 即可。

### 1. 确保 go.mod 正确

```bash
cd implementations/go

# 检查 go.mod
cat go.mod
```

`go.mod` 内容：

```go
module github.com/dogxii/dxcode

go 1.18
```

### 2. 创建 Git Tag

```bash
# 回到项目根目录
cd ../..

# 为 Go 模块创建 tag（需要加路径前缀）
git tag implementations/go/v1.0.0
git push origin implementations/go/v1.0.0

# 或者如果整个仓库就是 Go 模块
git tag v1.0.0
git push origin v1.0.0
```

### 3. 用户安装方式

```bash
go get github.com/dogxii/dxcode@v1.0.0
```

### 4. 使用 pkg.go.dev

发布后，包会自动出现在 [pkg.go.dev](https://pkg.go.dev/)。

可以手动请求索引：

```
https://pkg.go.dev/github.com/dogxii/dxcode
```

### 5. 版本更新

```bash
# 更新版本
git tag v1.0.1
git push origin v1.0.1
```

---

## Crates.io (Rust)

### 1. 准备工作

```bash
cd implementations/rust

# 确保 Rust 已安装
cargo --version
```

### 2. 注册 Crates.io

前往 [crates.io](https://crates.io/) 使用 GitHub 登录。

### 3. 获取 API Token

1. 登录 crates.io
2. 点击右上角 Account Settings
3. 点击 API Tokens → New Token
4. 登录 cargo：

```bash
cargo login your-api-token
```

### 4. 检查 Cargo.toml

```toml
[package]
name = "dxcode"
version = "1.0.0"
edition = "2021"
authors = ["Dogxi"]
description = "[dxcode] A distinctive, URL‑safe binary encoder with the signature `dx` prefix."
license = "MIT"
repository = "https://github.com/dogxii/dxcode"
homepage = "https://dxc.dogxi.me"
documentation = "https://docs.rs/dxcode"
readme = "README.md"
keywords = ["dx", "encoding", "base64", "binary"]
categories = ["encoding", "no-std"]
```

### 5. 检查包

```bash
# 检查是否可以发布
cargo publish --dry-run

# 打包预览
cargo package --list
```

### 6. 发布

```bash
cargo publish
```

### 7. 更新版本

修改 `Cargo.toml` 中的 version，然后：

```bash
cargo publish
```

---

## Vercel (网站部署)

### 方式一：通过 Vercel CLI

```bash
# 安装 Vercel CLI
npm i -g vercel

# 进入 web 目录
cd web

# 安装依赖
npm install

# 部署
vercel

# 生产部署
vercel --prod
```

### 方式二：通过 GitHub 集成（推荐）

1. 访问 [vercel.com](https://vercel.com/) 并登录
2. 点击 "Add New Project"
3. 选择 GitHub 仓库 `dxcode`
4. 配置项目：
   - **Framework Preset**: SvelteKit
   - **Root Directory**: `web`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.svelte-kit`
5. 点击 "Deploy"

### 设置自定义域名

1. 在 Vercel 项目设置中点击 "Domains"
2. 添加 `dxc.dogxi.me`
3. 在你的域名 DNS 设置中添加：
   - **类型**: CNAME
   - **名称**: dx
   - **值**: cname.vercel-dns.com

---

## 🔄 CI/CD 自动发布（可选）

### GitHub Actions 配置

创建 `.github/workflows/publish.yml`:

```yaml
name: Publish Packages

on:
  release:
    types: [created]

jobs:
  publish-npm-lib:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'
      - run: cd implementations/javascript && npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}

  publish-npm-cli:
    runs-on: ubuntu-latest
    needs: publish-npm-lib # CLI 依赖主库
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'
      - run: cd implementations/javascript/cli && npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}

  publish-pypi:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - run: |
          pip install build twine
          cd implementations/python
          python -m build
          twine upload dist/*
        env:
          TWINE_USERNAME: __token__
          TWINE_PASSWORD: ${{ secrets.PYPI_TOKEN }}

  publish-crates:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions-rs/toolchain@v1
        with:
          toolchain: stable
      - run: cd implementations/rust && cargo publish
        env:
          CARGO_REGISTRY_TOKEN: ${{ secrets.CRATES_TOKEN }}

  update-homebrew:
    runs-on: ubuntu-latest
    needs: publish-npm-cli
    steps:
      - uses: actions/checkout@v4
        with:
          repository: dogxi/homebrew-tap
          token: ${{ secrets.TAP_GITHUB_TOKEN }}
      - name: Update formula
        run: |
          VERSION="${{ github.event.release.tag_name }}"
          VERSION="${VERSION#v}"
          SHA256=$(curl -sL "https://registry.npmjs.org/dxcode-cli/-/dxcode-cli-${VERSION}.tgz" | shasum -a 256 | cut -d' ' -f1)

          sed -i "s|url \".*\"|url \"https://registry.npmjs.org/dxcode-cli/-/dxcode-cli-${VERSION}.tgz\"|" dxcode-cli.rb
          sed -i "s|sha256 \".*\"|sha256 \"${SHA256}\"|" dxcode-cli.rb
      - name: Commit and push
        run: |
          git config user.name "GitHub Actions"
          git config user.email "actions@github.com"
          git add dxcode-cli.rb
          git commit -m "Update dxcode-cli to ${{ github.event.release.tag_name }}"
          git push
```

### 设置 Secrets

在 GitHub 仓库设置中添加以下 Secrets：

- `NPM_TOKEN`: NPM access token
- `PYPI_TOKEN`: PyPI API token
- `CRATES_TOKEN`: Crates.io API token
- `TAP_GITHUB_TOKEN`: GitHub token (用于更新 Homebrew tap)

---

## 📝 发布检查清单

发布前确保：

- [ ] 所有测试通过
- [ ] README.md 更新
- [ ] CHANGELOG.md 更新（如有）
- [ ] 版本号正确（所有包版本一致）
- [ ] 许可证文件存在
- [ ] 代码已推送到 GitHub
- [ ] npm 库 `dxcode` 先于 CLI `dxcode-cli` 发布

---

## 🎉 完成！

发布后，用户可以通过以下方式安装：

```bash
# CLI 命令行工具
npm i -g dxcode-cli
curl -fsSL https://raw.githubusercontent.com/dogxiii/dxcode/main/install.sh | sh
brew install dogxi/tap/dxcode-cli

# JavaScript 库
npm install dxcode-lib

# Python
pip install dxcode

# Go
go get github.com/dogxiii/dxcode

# Rust
cargo add dxcode
```

如有问题，请查阅各平台官方文档或提交 Issue。
