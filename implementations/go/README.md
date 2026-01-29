# DXCode - Go 实现

由 Dogxi 创造的独特编码算法的 Go 实现。

## 安装

```bash
go get github.com/dogxiii/dxcode/go
```

## 使用方法

### 基本使用

```go
package main

import (
    "fmt"
    dx "github.com/dogxiii/dxcode/go"
)

func main() {
    // 编码字符串
    encoded := dx.EncodeString("你好，Dogxi！")
    fmt.Println(encoded) // dxXXXX...

    // 解码
    decoded, err := dx.DecodeString(encoded)
    if err != nil {
        panic(err)
    }
    fmt.Println(decoded) // 你好，Dogxi！

    // 检查是否为 DX 编码
    fmt.Println(dx.IsEncoded(encoded)) // true
    fmt.Println(dx.IsEncoded("hello")) // false
}
```

### 编码字节数据

```go
package main

import (
    "fmt"
    dx "github.com/dogxiii/dxcode/go"
)

func main() {
    // 编码字节切片
    data := []byte{0x00, 0x01, 0x02, 0xfe, 0xff}
    encoded := dx.Encode(data)
    fmt.Println(encoded)

    // 解码为字节切片
    decoded, err := dx.Decode(encoded)
    if err != nil {
        panic(err)
    }
    fmt.Printf("%v\n", decoded) // [0 1 2 254 255]
}
```

### 处理文件

```go
package main

import (
    "io/ioutil"
    dx "github.com/dogxiii/dxcode/go"
)

func main() {
    // 读取并编码文件
    data, _ := ioutil.ReadFile("secret.txt")
    encoded := dx.Encode(data)
    ioutil.WriteFile("secret.dx", []byte(encoded), 0644)

    // 解码文件
    encodedData, _ := ioutil.ReadFile("secret.dx")
    decoded, _ := dx.Decode(string(encodedData))
    ioutil.WriteFile("secret_decoded.txt", decoded, 0644)
}
```

## API 参考

### `Encode(data []byte) string`

将字节切片编码为 DX 格式。

**参数：**

- `data`: 要编码的字节数据

**返回值：**

- 以 `dx` 为前缀的编码字符串

### `EncodeString(s string) string`

将字符串编码为 DX 格式。

**参数：**

- `s`: 要编码的字符串

**返回值：**

- 以 `dx` 为前缀的编码字符串

### `Decode(encoded string) ([]byte, error)`

将 DX 编码的字符串解码为字节切片。

**参数：**

- `encoded`: DX 编码的字符串（必须以 `dx` 开头）

**返回值：**

- 解码后的字节切片
- 错误（如果输入无效）

### `DecodeString(encoded string) (string, error)`

将 DX 编码的字符串解码为字符串。

**参数：**

- `encoded`: DX 编码的字符串

**返回值：**

- 解码后的字符串
- 错误（如果输入无效）

### `IsEncoded(s string) bool`

检查字符串是否为有效的 DX 编码。

**参数：**

- `s`: 要检查的字符串

**返回值：**

- 如果是有效的 DX 编码返回 `true`，否则返回 `false`

### `GetInfo() Info`

获取 DX 编码的信息。

**返回值：**

- `Info` 结构体，包含版本、作者、字符集等信息

## 常量

```go
const Charset = "DXdx0OGgIi1LlAaBbCcEeFfHhJjKkMmNnPpQqRrSsTtUuVvWwYyZz23456789+/"
const Magic = 0x44
const Prefix = "dx"
const Padding = '='
```

## 错误处理

```go
import dx "github.com/dogxiii/dxcode/go"

decoded, err := dx.Decode("invalid-string")
if err != nil {
    switch err {
    case dx.ErrInvalidPrefix:
        fmt.Println("缺少 dx 前缀")
    case dx.ErrInvalidLength:
        fmt.Println("长度不正确")
    case dx.ErrInvalidCharacter:
        fmt.Println("包含非法字符")
    default:
        fmt.Println("未知错误:", err)
    }
}
```

## 错误类型

- `ErrInvalidPrefix` - 字符串不以 `dx` 开头
- `ErrInvalidLength` - 编码字符串长度不正确
- `ErrInvalidCharacter` - 包含 DX 字符集之外的字符

## 兼容性

- Go >= 1.16

## 许可证

MIT License © [Dogxi](https://github.com/dogxiii)
