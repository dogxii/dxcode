# dxcode - Rust 实现

由 Dogxi 创造的独特编码算法的 Rust 实现。

## 安装

在 `Cargo.toml` 中添加：

```toml
[dependencies]
dxcode = "1.0"
```

## 使用方法

### 基本使用

```rust
use dxcode::{encode, decode, encode_str, decode_str};

fn main() {
    // 编码字符串
    let encoded = encode_str("你好，Dogxi！");
    println!("{}", encoded); // dxXXXX...

    // 解码
    let decoded = decode_str(&encoded).unwrap();
    println!("{}", decoded); // 你好，Dogxi！
}
```

### 编码字节数据

```rust
use dxcode::{encode, decode};

fn main() {
    // 编码字节切片
    let data: &[u8] = &[0x00, 0x01, 0x02, 0xfe, 0xff];
    let encoded = encode(data);
    println!("{}", encoded);

    // 解码为字节向量
    let decoded = decode(&encoded).unwrap();
    println!("{:?}", decoded); // [0, 1, 2, 254, 255]
}
```

### 检查是否为 DX 编码

```rust
use dxcode::{encode_str, is_encoded};

fn main() {
    let encoded = encode_str("Hello");

    println!("{}", is_encoded(&encoded)); // true
    println!("{}", is_encoded("hello"));   // false
}
```

## API 参考

### `encode(data: &[u8]) -> String`

将字节切片编码为 DX 格式。

**参数：**

- `data`: 要编码的字节数据

**返回值：**

- 以 `dx` 为前缀的编码字符串

### `encode_str(s: &str) -> String`

将字符串编码为 DX 格式。

**参数：**

- `s`: 要编码的字符串

**返回值：**

- 以 `dx` 为前缀的编码字符串

### `decode(encoded: &str) -> Result<Vec<u8>>`

将 DX 编码的字符串解码为字节向量。

**参数：**

- `encoded`: DX 编码的字符串（必须以 `dx` 开头）

**返回值：**

- `Ok(Vec<u8>)` - 解码后的字节向量
- `Err(DxError)` - 如果输入无效

### `decode_str(encoded: &str) -> Result<String>`

将 DX 编码的字符串解码为字符串。

**参数：**

- `encoded`: DX 编码的字符串

**返回值：**

- `Ok(String)` - 解码后的字符串
- `Err(DxError)` - 如果输入无效或不是有效的 UTF-8

### `is_encoded(s: &str) -> bool`

检查字符串是否为有效的 DX 编码。

**参数：**

- `s`: 要检查的字符串

**返回值：**

- 如果是有效的 DX 编码返回 `true`，否则返回 `false`

### `get_info() -> Info`

获取 DX 编码的信息。

**返回值：**

- `Info` 结构体，包含版本、作者、字符集等信息

## 常量

```rust
pub const CHARSET: &str = "DXdx0OGgIi1LlAaBbCcEeFfHhJjKkMmNnPpQqRrSsTtUuVvWwYyZz23456789+/";
pub const MAGIC: u8 = 0x44;
pub const PREFIX: &str = "dx";
pub const PADDING: char = '=';
```

## 错误处理

```rust
use dxcode::{decode, DxError};

fn main() {
    match decode("invalid-string") {
        Ok(data) => println!("解码成功: {:?}", data),
        Err(DxError::InvalidPrefix) => println!("缺少 dx 前缀"),
        Err(DxError::InvalidLength) => println!("长度不正确"),
        Err(DxError::InvalidCharacter(c)) => println!("包含非法字符: {}", c),
        Err(DxError::Utf8Error(e)) => println!("UTF-8 错误: {}", e),
    }
}
```

## 错误类型

- `DxError::InvalidPrefix` - 字符串不以 `dx` 开头
- `DxError::InvalidLength` - 编码字符串长度不正确
- `DxError::InvalidCharacter(char)` - 包含 DX 字符集之外的字符
- `DxError::Utf8Error(String)` - 解码后的数据不是有效的 UTF-8

## 特性 (Features)

- `std` (默认): 启用标准库支持

## 兼容性

- Rust >= 1.70.0 (需要 `LazyLock`)

## 许可证

MIT License © [Dogxi](https://github.com/dogxiii)
