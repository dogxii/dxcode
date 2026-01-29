# dxcode

**🔮 带有 `dx` 前缀的 URL 安全二进制编码方案 🔮**

<p>
  <img src="https://img.shields.io/badge/Algorithm-DX-black?style=for-the-badge" alt="DX Algorithm">
  <img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge" alt="License">
  <img src="https://img.shields.io/badge/Version-2.3.0-white?style=for-the-badge" alt="Version">
</p>

## 🌟 简介

**DX 编码** 是一种自定义的二进制到文本编码方案。它将二进制数据转换为独特的 ASCII 字符串表示，并带有强制性的 `dx` 前缀。与标准 Base64 不同，DX 使用专门设计的字符集和变换逻辑，生成易于识别且 URL 安全的编码字符串。

## 🆕 v2.3 新特性

- **TTL 过期时间**：支持设置编码数据的有效期，过期后自动拒绝解码
- **时间戳嵌入**：自动记录创建时间，便于审计追踪
- **灵活的过期策略**：支持秒级精度的过期时间，或设置为永不过期
- **新增 `ttl` / `expired` 命令**：CLI 支持查看和验证过期状态

## 📋 版本历史

| 版本 | 主要特性                      |
| ---- | ----------------------------- |
| v2.3 | TTL 过期时间支持              |
| v2.2 | JavaScript 引入 pako 真实压缩 |
| v2.1 | 智能 DEFLATE 压缩             |
| v2.0 | CRC16-CCITT 校验和            |
| v1.0 | 基础编解码                    |

## 🎯 特性

- **可识别前缀**：所有编码字符串均以 `dx` 开头，便于识别数据类型。
- **智能压缩**：自动使用 DEFLATE 压缩大于 32 字节的数据，节省空间。
- **数据完整性**：内置 CRC16-CCITT 校验和，确保数据传输可靠。
- **TTL 过期支持**：可选的时间限制功能，适用于临时令牌、验证码等场景。
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
dxc encode "Hello World"           # 编码（自动压缩）
dxc encode --no-compress "Hello"   # 编码（禁用压缩）
dxc encode --ttl 3600 "Secret"     # 编码（1小时后过期）
dxc decode "dxQBpX..."             # 解码（自动解压缩）
dxc decode --ignore-ttl "dx..."    # 解码（忽略过期检查）
dxc verify "dxQBpX..."             # 验证校验和
dxc ttl "dx..."                    # 查看 TTL 信息
dxc expired "dx..."                # 检查是否过期
dxc check "dxQBpX..."              # 检查有效性
dxc info                           # 显示算法信息
dxc --help                         # 查看帮助
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
dxcode = "2.3"
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

### 编码格式 (v2.3)

```
DX编码字符串 = "dx" + 编码(flags + CRC16 + [TTL头部] + [orig_size] + 数据) + 填充

其中：
  - "dx"        : 固定 2 字符前缀
  - flags       : 1 字节标志位（bit0=压缩, bit1-2=压缩算法, bit2=有TTL）
  - CRC16       : 2 字节校验和（大端序，针对原始数据）
  - TTL头部     : 8 字节（仅当 flags & 0x04 时存在）
    - created_at  : 4 字节 Unix 时间戳（大端序）
    - ttl_seconds : 4 字节过期秒数（大端序，0=永不过期）
  - orig_size   : 2 字节原始大小（仅压缩时存在）
  - 数据        : 原始数据或压缩后的数据
  - 填充        : 0、1 或 2 个 '=' 字符
```

### 编码流程

1. **输入**：原始字节数据（字符串转换为 UTF-8 字节）。
2. **计算校验和**：对原始数据计算 CRC16-CCITT 校验和。
3. **智能压缩**：如果数据 >= 32 字节，尝试 DEFLATE 压缩，若压缩有效则使用。
4. **构建头部**：flags(1) + CRC16(2) + [TTL头部(8)] + [orig_size(2)]。
5. **分组**：每 3 字节（24位）为一组。
6. **分割**：将 24 位数据分割为 4 个 6 位值。
7. **变换**：对每个 6 位值与魔数 `0x44` 进行 XOR 运算，增加混淆性。
8. **映射**：将变换后的值映射到 DX 字符集。
9. **填充**：若输入长度不能被 3 整除，使用 `=` 进行填充。
10. **前缀**：最终结果添加 `dx` 前缀。

## 🚀 快速开始

### JavaScript

```javascript
import {
  dxEncode,
  dxDecode,
  dxVerify,
  dxEncodeWithTtl,
  getTtlInfo,
  isExpired,
} from 'dxcode-lib'

// 基础编解码
const encoded = dxEncode('Hello World')
console.log(encoded) // dx...

// 验证完整性
console.log(dxVerify(encoded)) // true

const decoded = dxDecode(encoded)
console.log(decoded) // Hello World

// TTL 过期编码（1小时后过期）
const token = dxEncodeWithTtl('session-data', 3600)

// 检查过期状态
const ttlInfo = getTtlInfo(token)
console.log(ttlInfo) // { createdAt: 1234567890, ttlSeconds: 3600, expiresAt: 1234571490, isExpired: false }

// 检查是否过期
console.log(isExpired(token)) // false
```

### Python

```python
from dxcode import dx_encode, dx_decode, dx_verify, dx_encode_with_ttl, get_ttl_info, is_expired

# 基础编解码
encoded = dx_encode('Hello World')
print(encoded)

# 验证完整性
print(dx_verify(encoded))  # True

decoded = dx_decode(encoded)
print(decoded)

# TTL 过期编码（1小时后过期）
token = dx_encode_with_ttl('session-data', 3600)

# 检查 TTL 信息
ttl_info = get_ttl_info(token)
print(ttl_info)  # {'created_at': 1234567890, 'ttl_seconds': 3600, 'expires_at': 1234571490, 'is_expired': False}

# 检查是否过期
print(is_expired(token))  # False
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

    // 验证完整性
    fmt.Println(dx.Verify(encoded))

    decoded, _ := dx.Decode(encoded)
    fmt.Println(string(decoded))

    // TTL 过期编码
    token := dx.EncodeWithTtl([]byte("session-data"), 3600)

    // 检查 TTL 信息
    ttlInfo, _ := dx.GetTtlInfo(token)
    fmt.Printf("Expires at: %d, Is expired: %v\n", ttlInfo.ExpiresAt, ttlInfo.IsExpired)
}
```

### Rust

```rust
use dxcode::{encode, decode, verify, encode_with_ttl, get_ttl_info, is_expired};

fn main() {
    let encoded = encode("Hello World".as_bytes());
    println!("{}", encoded);

    // 验证完整性
    println!("{}", verify(&encoded).unwrap());

    let decoded = decode(&encoded).unwrap();
    println!("{}", String::from_utf8(decoded).unwrap());

    // TTL 过期编码（1小时后过期）
    let token = encode_with_ttl("session-data".as_bytes(), 3600);

    // 检查 TTL 信息
    if let Some(info) = get_ttl_info(&token).unwrap() {
        println!("Created at: {}, TTL: {}s, Expired: {}",
            info.created_at, info.ttl_seconds, info.is_expired);
    }

    // 检查是否过期
    println!("Is expired: {}", is_expired(&token).unwrap());
}
```

### 命令行

```bash
# 编码
dxc encode "Hello"

# 带 TTL 编码（1小时后过期）
dxc encode --ttl 3600 "临时令牌"

# 解码
dxc decode "dxnei8QFqcSp=="

# 解码（忽略过期检查）
dxc decode --ignore-ttl "dx..."

# 验证完整性
dxc verify "dxnei8QFqcSp=="

# 查看 TTL 信息
dxc ttl "dx..."

# 检查是否过期
dxc expired "dx..."

# 管道操作
echo "Hello" | dxc encode
cat file.txt | dxc encode > encoded.txt
```

## 📊 与 Base64 对比

| 特性         | DX 编码 v2.3             | Base64       |
| :----------- | :----------------------- | :----------- |
| **字符集**   | 自定义 64 字符           | 标准 64 字符 |
| **前缀标识** | `dx`                     | 无           |
| **混淆处理** | 是 (XOR 0x44)            | 否           |
| **校验和**   | CRC16-CCITT              | 无           |
| **压缩**     | 智能 DEFLATE             | 无           |
| **TTL 支持** | 内置                     | 无           |
| **大小开销** | ~1.37x + 5 字节 (可压缩) | ~1.33x       |
| **识别性**   | 高 (dx 前缀)             | 低           |
| **完整性**   | 内置验证                 | 无           |

## 🔐 安全提示

**DX 编码不是加密算法。** 它仅用于数据的表示和轻度混淆。校验和功能用于检测意外损坏或篡改，但不能防止恶意攻击。TTL 功能仅提供时间限制，不提供加密保护。对于敏感数据，请务必在编码前使用标准的加密算法（如 AES、RSA 等）进行加密。

## 📁 项目结构

```
dxcode/
├── README.md           # 说明文档
├── SPEC.md             # 算法详细规范
├── install.sh          # 安装脚本
├── homebrew/           # Homebrew配方
├── implementations/    # 多语言实现
│   ├── javascript/     # JS/TS (npm: dxcode-lib)
│   ├── python/         # Python (pip: dxcode)
│   ├── go/             # Go
│   ├── rust/           # Rust (crates.io: dxcode)
│   └── c/              # C
└── web/                # 官网源码
```

## 📜 许可证

MIT License
