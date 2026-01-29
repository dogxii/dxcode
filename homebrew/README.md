# Homebrew Tap for DXCode CLI

这是 DXCode CLI 的 Homebrew tap 仓库配置。

## 安装方法

### 方法一：添加 tap 后安装

```bash
brew tap dogxi/tap
brew install dxcode-cli
```

### 方法二：一行命令安装

```bash
brew install dogxi/tap/dxcode-cli
```

## 更新

```bash
brew update
brew upgrade dxcode-cli
```

## 卸载

```bash
brew uninstall dxcode-cli
brew untap dogxi/tap  # 可选：移除 tap
```

## 设置自己的 Homebrew Tap

如果你想维护自己的 tap，请按照以下步骤操作：

### 1. 创建 tap 仓库

在 GitHub 上创建一个名为 `homebrew-tap` 的仓库（必须以 `homebrew-` 开头）。

```bash
# 仓库名格式: username/homebrew-tap
# 用户安装时使用: brew tap username/tap
```

### 2. 复制 formula 文件

将 `dxcode-cli.rb` 复制到你的 tap 仓库根目录：

```
homebrew-tap/
├── dxcode-cli.rb
└── README.md
```

### 3. 更新 SHA256 哈希

发布 npm 包后，获取 tarball 的 SHA256：

```bash
# 方法一：从 npm 获取
curl -sL https://registry.npmjs.org/dxcode-cli/-/dxcode-cli-1.0.0.tgz | shasum -a 256

# 方法二：使用 npm pack
cd implementations/javascript/cli
npm pack
shasum -a 256 dxcode-cli-1.0.0.tgz
```

然后更新 `dxcode-cli.rb` 中的 `sha256` 字段。

### 4. 测试 formula

```bash
# 本地测试
brew install --build-from-source ./dxcode-cli.rb

# 审计
brew audit --strict dxcode-cli.rb

# 测试
brew test dxcode-cli
```

### 5. 提交并推送

```bash
git add dxcode-cli.rb
git commit -m "Add dxcode-cli formula v1.0.0"
git push
```

## 自动更新（可选）

可以设置 GitHub Actions 在发布新版本时自动更新 formula：

```yaml
# .github/workflows/update-homebrew.yml
name: Update Homebrew Formula

on:
  release:
    types: [published]

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          repository: dogxi/homebrew-tap
          token: ${{ secrets.TAP_GITHUB_TOKEN }}

      - name: Update formula
        run: |
          VERSION="${{ github.event.release.tag_name }}"
          VERSION="${VERSION#v}"  # 移除 v 前缀
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

## 相关链接

- **官网**: https://dxc.dogxi.me
- **GitHub**: https://github.com/dogxii/dxcode
- **npm**: https://www.npmjs.com/package/dxcode-cli

---

由 [Dogxi](https://github.com/dogxii) 创建
