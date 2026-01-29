# dxcode-cli

> DX Encoding 命令行工具 ⚡

简洁的命令行编码解码工具，支持自动检测、文件操作和管道输入。

## 安装

```bash
# npm
npm i -g dxcode-cli

# curl 一键安装
curl -fsSL https://raw.githubusercontent.com/dogxiii/dxcode/main/install.sh | sh

# Homebrew (macOS)
brew install dogxi/tap/dxcode-cli
```

## 用法

安装后使用 `dxc` 命令：

```bash
# 编码
dxc encode "Hello World"
dxc -e "Hello World"

# 解码
dxc decode "dxQBpXRwZXQBxdVwJdQBp="
dxc -d "dxQBpXRwZXQBxdVwJdQBp="

# 自动检测（智能判断编码/解码）
dxc "Hello World"              # 编码
dxc "dxQBpXRwZXQBxdVwJdQBp="   # 解码
```

### 文件操作

```bash
# 编码文件
dxc -f input.txt -o output.dx

# 解码文件
dxc -d -f output.dx

# 编码文件内容输出到终端
dxc -f input.txt
```

### 管道

```bash
echo "Hello" | dxc
cat file.txt | dxc -e
```

### 其他命令

```bash
# 检查是否为有效 DX 编码
dxc -c "dxQBpXRwZXQBxdVwJdQBp="

# 查看编码信息
dxc -i

# 帮助
dxc -h

# 版本
dxc -v
```

## 选项

| 选项                  | 说明                   |
| --------------------- | ---------------------- |
| `-e, --encode`        | 强制编码模式           |
| `-d, --decode`        | 强制解码模式           |
| `-f, --file <path>`   | 从文件读取输入         |
| `-o, --output <path>` | 输出到文件             |
| `-c, --check`         | 检查是否为有效 DX 编码 |
| `-i, --info`          | 显示 DX 编码信息       |
| `-v, --version`       | 显示版本               |
| `-h, --help`          | 显示帮助               |

## 相关

- [dxcode](https://www.npmjs.com/package/dxcode) - Node.js 库
- [dxcode-cli](https://www.npmjs.com/package/dxcode-cli) - CLI 工具 (本包)
- [dxc.dogxi.me](https://dxc.dogxi.me) - 在线编码解码

## License

MIT © [Dogxi](https://github.com/dogxii)
