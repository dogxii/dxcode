# DXCode Homebrew Tap

DX Encoding CLI 的 Homebrew 安装配方。

## 安装

### 推荐方式 (原生 Rust 二进制)

```bash
brew tap dogxii/tap
brew install dxcode
```

或一行命令：

```bash
brew install dogxii/tap/dxcode
```

### 备选方式 (Node.js 版本)

如果你更偏好 Node.js 版本：

```bash
brew install dogxii/tap/dxcode-cli
```

## 性能对比

| 版本                 | 启动时间 | 内存占用 | 依赖    |
| -------------------- | -------- | -------- | ------- |
| Rust (dxcode)        | ~2ms     | ~1MB     | 无      |
| Node.js (dxcode-cli) | ~150ms   | ~30MB    | Node.js |

**强烈推荐使用 Rust 版本**，它是原生编译的二进制文件，启动更快、内存占用更低、无需任何运行时依赖。

## 使用

```bash
# 编码
dxc encode "Hello World"

# 解码
dxc decode "dxQBpXYYdBsRzxnRCLk="

# 检查是否为有效的 DX 编码
dxc check "dxQBpXYYdBsRzxnRCLk="

# 显示编码信息
dxc info

# 查看帮助
dxc --help

# 查看版本
dxc --version
```

## 管道支持

```bash
echo "Hello" | dxc encode
echo "dxQBpXYYdV==" | dxc decode
cat file.txt | dxc encode > encoded.txt
```

## 更新

```bash
brew update
brew upgrade dxcode
```

## 卸载

```bash
brew uninstall dxcode
brew untap dogxii/tap  # 可选：移除 tap
```

## 文件说明

- `dxcode.rb` - 原生 Rust 二进制安装配方 (推荐)
- `dxcode-cli.rb` - Node.js 版本安装配方 (备选)

## 相关链接

- 主页: https://dxc.dogxi.me
- GitHub: https://github.com/dogxii/dxcode
- crates.io: https://crates.io/crates/dxcode
- npm: https://www.npmjs.com/package/dxcode

## 许可证

MIT License - Created by Dogxi
