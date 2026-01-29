# dxcode 编码算法

<p align="center">
  <img src="https://img.shields.io/badge/算法-DX-black?style=for-the-badge" alt="DX Algorithm">
  <img src="https://img.shields.io/badge/作者-Dogxi-gray?style=for-the-badge" alt="Author">
  <img src="https://img.shields.io/badge/版本-1.0.0-white?style=for-the-badge" alt="Version">
</p>

<p align="center">
  <b>🔮 带有 `dx` 前缀的自定义编码算法 🔮</b>
</p>

---

## 🌟 简介

**DX 编码** 是由 Dogxi 设计的自定义编码算法。它将二进制数据转换为独特的 ASCII 字符串表示，带有标志性的 `dx` 前缀。与标准 Base64 不同，DX 使用自定义字符集并结合特殊变换，创造出真正独一无二的编码方式。

## 🎯 特性

- **独特字符集**：基于 "Dogxi" 理念的自定义 64 字符表
- **标志性前缀**：所有编码字符串以 `dx` 开头，便于识别
- **双向转换**：完全可逆的编码/解码
- **多语言支持**：提供 JavaScript、Python、Go、Rust 等语言实现
- **在线工具**：访问 [dxc.dogxi.me](https://dxc.dogxi.me) 使用在线编解码器

## 📦 安装

### CLI 命令行工具 (原生 Rust 二进制，高性能)

```bash
# Homebrew (macOS/Linux) - 推荐
brew install dogxii/tap/dxcode

# Cargo (需要 Rust)
cargo install dxcode

# curl 一键安装 (自动下载预编译二进制)
curl -fsSL https://dxc.dogxi.me/install.sh | sh
```

安装后使用 `dxc` 命令：

```bash
dxc encode "Hello World"    # 编码
dxc decode "dxQBpX..."      # 解码
dxc check "dxQBpX..."       # 检查是否有效
dxc info                    # 显示编码信息
dxc --help                  # 查看帮助
```

### JavaScript / TypeScript

```bash
npm install dxcode
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

**设计理念**：

- 以 `DXdx` 开头 - 算法的签名（4 字符）
- 数字 0-9（10 字符）
- 大写字母 A-Z（去掉 D 和 X，24 字符）
- 小写字母 a-z（去掉 d 和 x，24 字符）
- URL 安全的特殊字符 `-` 和 `_`（2 字符）
- 总计 64 个唯一字符

### 编码流程

1. **输入**：原始字节（字符串使用 UTF-8 编码）
2. **分组**：每 3 字节为一组处理
3. **位分割**：将 24 位分成四个 6 位组
4. **XOR 变换**：与魔数 `0x44`（'D'）进行异或运算，增加独特性
5. **映射**：将每个 6 位值映射到 DX 字符集
6. **填充**：当输入长度不能被 3 整除时，使用 `=` 填充
7. **前缀**：在结果前添加 `dx`

### 解码流程

1. **前缀检查**：验证并移除 `dx` 前缀
2. **字符映射**：将每个字符转换回 6 位值
3. **XOR 变换**：与 `0x44` 进行异或运算以还原
4. **位合并**：将四个 6 位值合并为 3 字节
5. **输出**：返回原始字节

## 🚀 快速开始

### JavaScript

```javascript
import { dxEncode, dxDecode } from 'dxcode'

const encoded = dxEncode('你好，Dogxi！')
console.log(encoded) // dxXXXX...

const decoded = dxDecode(encoded)
console.log(decoded) // 你好，Dogxi！
```

### Python

```python
from dxcode import dx_encode, dx_decode

encoded = dx_encode('你好，Dogxi！')
print(encoded)  # dxXXXX...

decoded = dx_decode(encoded)
print(decoded)  # 你好，Dogxi！
```

### Go

```go
package main

import (
    "fmt"
    dx "github.com/dogxii/dxcode"
)

func main() {
    encoded := dx.Encode([]byte("你好，Dogxi！"))
    fmt.Println(encoded) // dxXXXX...

    decoded, _ := dx.Decode(encoded)
    fmt.Println(string(decoded)) // 你好，Dogxi！
}
```

### Rust

```rust
use dxcode::{encode, decode};

fn main() {
    let encoded = encode("你好，Dogxi！".as_bytes());
    println!("{}", encoded); // dxXXXX...

    let decoded = decode(&encoded).unwrap();
    println!("{}", String::from_utf8(decoded).unwrap()); // 你好，Dogxi！
}
```

### 命令行

```bash
# 编码文本
dxc encode "Hello World"
dxc -e "Hello World"

# 解码
dxc decode "dxQBpXRwZXQBxdVwJdQBp="
dxc -d "dxQBpXRwZXQBxdVwJdQBp="

# 自动检测
dxc "Hello World"              # 编码
dxc "dxQBpXRwZXQBxdVwJdQBp="   # 解码

# 文件操作
dxc -f input.txt -o output.dx
dxc -d -f output.dx

# 管道
echo "Hello" | dxc
cat file.txt | dxc -e
```

## 🌐 在线工具

访问 [dxc.dogxi.me](https://dxc.dogxi.me) 使用在线编解码工具。

## 📊 与 Base64 对比

| 特性     | DX 编码         | Base64       |
| -------- | --------------- | ------------ |
| 字符集   | 自定义 64 字符  | 标准 64 字符 |
| 前缀     | `dx`            | 无           |
| XOR 变换 | 是 (0x44)       | 否           |
| 扩展比率 | ~1.37x + 2 字节 | ~1.33x       |
| 可识别性 | 是 (dx 前缀)    | 否           |

## 🔐 安全提示

**DX 编码不是加密！** 它只是一种编码方案，用于混淆数据。如需保护敏感信息，请始终先使用正规加密算法（如 AES、RSA 等）进行加密，然后再编码。

## 📁 项目结构

```
dxcode/
├── README.md           # 本文档
├── SPEC.md             # 算法规范
├── install.sh          # curl 安装脚本
├── homebrew/           # Homebrew formula
├── implementations/    # 各语言实现
│   ├── javascript/     # JavaScript/TypeScript 实现 (npm: dxcode)
│   │   └── cli/        # CLI 工具 (npm: dxcode-cli)
│   ├── python/         # Python 实现 (pip: dxcode)
│   ├── go/             # Go 实现
│   ├── rust/           # Rust 实现
│   └── c/              # C 实现
├── examples/           # 使用示例
└── web/                # dxc.dogxi.me 网站源码
```

## 📜 许可证

MIT License - 由 Dogxi 创建

## 🤝 贡献

欢迎贡献！请随时提交 Pull Request。

---

<p align="center">
  由 <a href="https://github.com/dogxii">Dogxi</a> 用 ❤️ 制作
</p>
