# dxcode

**🔮 带有 `dx` 前缀的 URL 安全二进制编码方案 🔮**

<p>
  <img src="https://img.shields.io/badge/Algorithm-DX-black?style=for-the-badge" alt="DX Algorithm">
  <img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge" alt="License">
  <img src="https://img.shields.io/badge/Version-1.0.0-white?style=for-the-badge" alt="Version">
</p>

## 🌟 简介

**DX 编码** 是一种自定义的二进制到文本编码方案。它将二进制数据转换为独特的 ASCII 字符串表示，并带有强制性的 `dx` 前缀。与标准 Base64 不同，DX 使用专门设计的字符集和变换逻辑，生成易于识别且 URL 安全的编码字符串。

## 🎯 特性

- **可识别前缀**：所有编码字符串均以 `dx` 开头，便于识别数据类型。
- **自定义字符集**：优化的 64 字符表，兼顾 URL 安全性与独特性。
- **双向转换**：支持任意二进制数据的无损编码与解码。
- **多语言支持**：提供 Rust、JavaScript、Python、Go 等主流语言实现。
- **在线工具**：提供在线编解码服务 [dxc.dogxi.me](https://dxc.dogxi.me)。

## 📦 安装

### CLI 命令行工具 (Rust 原生高性能版)

```bash
# Homebrew (macOS/Linux) - 推荐
brew install dogxii/tap/dxcode

# Cargo (需要 Rust 环境)
cargo install dxcode

# curl 一键安装 (自动下载预编译二进制)
curl -fsSL https://cdn.dogxi.me/dxcode_install.sh | sh
```

使用示例：

```bash
dxc encode "Hello World"    # 编码
dxc decode "dxQBpX..."      # 解码
dxc check "dxQBpX..."       # 检查有效性
dxc info                    # 显示算法信息
dxc --help                  # 查看帮助
```

### JavaScript / TypeScript

```bash
npm install dxcode-lib
```

### Python

```bash
pip install dxcode
```

### Go

```bash
go get github.com/dogxii/dxcode
```

### Rust

```toml
[dependencies]
dxcode = "1.0"
```

## 🔧 算法规范

### 字符集

DX 编码使用自定义的 64 字符表：

```
DXdx0123456789ABCEFGHIJKLMNOPQRSTUVWYZabcefghijklmnopqrstuvwyz-_
```

**构成**：

- **签名字符**：`DXdx` (4 字符)
- **数字**：`0-9` (10 字符)
- **大写字母**：`A-Z` (排除 `D`, `X`，24 字符)
- **小写字母**：`a-z` (排除 `d`, `x`，24 字符)
- **安全符号**：`-` 和 `_` (2 字符)

### 编码流程

1. **输入**：原始字节数据（字符串转换为 UTF-8 字节）。
2. **分组**：每 3 字节（24位）为一组。
3. **分割**：将 24 位数据分割为 4 个 6 位值。
4. **变换**：对每个 6 位值与魔数 `0x44` 进行 XOR 运算，增加混淆性。
5. **映射**：将变换后的值映射到 DX 字符集。
6. **填充**：若输入长度不能被 3 整除，使用 `=` 进行填充。
7. **前缀**：最终结果添加 `dx` 前缀。

## 🚀 快速开始

### JavaScript

```javascript
import { dxEncode, dxDecode } from 'dxcode-lib'

const encoded = dxEncode('Hello World')
console.log(encoded) // dx...

const decoded = dxDecode(encoded)
console.log(decoded) // Hello World
```

### Python

```python
from dxcode import dx_encode, dx_decode

encoded = dx_encode('Hello World')
print(encoded)

decoded = dx_decode(encoded)
print(decoded)
```

### Go

```go
package main

import (
    "fmt"
    dx "github.com/dogxii/dxcode"
)

func main() {
    encoded := dx.Encode([]byte("Hello World"))
    fmt.Println(encoded)

    decoded, _ := dx.Decode(encoded)
    fmt.Println(string(decoded))
}
```

### Rust

```rust
use dxcode::{encode, decode};

fn main() {
    let encoded = encode("Hello World".as_bytes());
    println!("{}", encoded);

    let decoded = decode(&encoded).unwrap();
    println!("{}", String::from_utf8(decoded).unwrap());
}
```

### 命令行

```bash
# 管道操作
echo "Hello" | dxc encode
cat file.txt | dxc encode > encoded.txt
```

## 📊 与 Base64 对比

| 特性         | DX 编码         | Base64       |
| :----------- | :-------------- | :----------- |
| **字符集**   | 自定义 64 字符  | 标准 64 字符 |
| **前缀标识** | `dx`            | 无           |
| **混淆处理** | 是 (XOR 0x44)   | 否           |
| **大小开销** | ~1.37x + 2 字节 | ~1.33x       |
| **识别性**   | 高 (dx 前缀)    | 低           |

## 🔐 安全提示

**DX 编码不是加密算法。** 它仅用于数据的表示和轻度混淆。对于敏感数据，请务必在编码前使用标准的加密算法（如 AES、RSA 等）进行加密。

## 📁 项目结构

```
dxcode/
├── README.md           # 说明文档
├── SPEC.md             # 算法详细规范
├── install.sh          # 安装脚本
├── homebrew/           # Homebrew配方
├── implementations/    # 多语言实现
│   ├── javascript/     # JS/TS (npm: dxcode)
│   ├── python/         # Python (pip: dxcode)
│   ├── go/             # Go
│   ├── rust/           # Rust (crates.io: dxcode)
│   └── c/              # C
└── web/                # 官网源码
```

## 📜 许可证

MIT License
