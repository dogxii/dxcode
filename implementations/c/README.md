# dxcode - C 实现

带有 `dx` 前缀的自定义编码算法的 C 语言实现。

## 文件说明

- `dxcode.h` - 头文件，包含函数声明和常量定义
- `dxcode.c` - 源文件，包含函数实现

## 编译

### 静态库

```bash
gcc -c dxcode.c -o dxcode.o
ar rcs libdxcode.a dxcode.o
```

### 动态库

```bash
# Linux
gcc -shared -fPIC dxcode.c -o libdxcode.so

# macOS
gcc -shared -fPIC dxcode.c -o libdxcode.dylib

# Windows (MinGW)
gcc -shared dxcode.c -o dxcode.dll
```

## 使用方法

### 基本使用

```c
#include <stdio.h>
#include <string.h>
#include "dxcode.h"

int main() {
    const char *original = "你好，Dogxi！";
    char encoded[256];
    char decoded[256];
    size_t decoded_len;

    // 编码
    int result = dx_encode_string(original, encoded, sizeof(encoded));
    if (result == DX_OK) {
        printf("编码: %s\n", encoded);
    }

    // 解码
    result = dx_decode_string(encoded, decoded, sizeof(decoded));
    if (result == DX_OK) {
        printf("解码: %s\n", decoded);
    }

    return 0;
}
```

### 编码字节数据

```c
#include <stdio.h>
#include "dxcode.h"

int main() {
    uint8_t data[] = {0x00, 0x01, 0x02, 0xFE, 0xFF};
    char encoded[64];
    uint8_t decoded[64];
    size_t decoded_len;

    // 编码
    int result = dx_encode(data, sizeof(data), encoded, sizeof(encoded));
    if (result == DX_OK) {
        printf("编码: %s\n", encoded);
    }

    // 解码
    result = dx_decode(encoded, decoded, sizeof(decoded), &decoded_len);
    if (result == DX_OK) {
        printf("解码字节数: %zu\n", decoded_len);
        for (size_t i = 0; i < decoded_len; i++) {
            printf("0x%02X ", decoded[i]);
        }
        printf("\n");
    }

    return 0;
}
```

### 检查是否为 DX 编码

```c
#include <stdio.h>
#include "dxcode.h"

int main() {
    const char *test1 = "dxDXdxDXdxDX";
    const char *test2 = "Hello World";

    if (dx_is_encoded(test1)) {
        printf("%s 是 DX 编码\n", test1);
    }

    if (!dx_is_encoded(test2)) {
        printf("%s 不是 DX 编码\n", test2);
    }

    return 0;
}
```

## API 参考

### `dx_encode()`

将字节数据编码为 DX 格式。

```c
int dx_encode(const uint8_t *input, size_t input_len,
              char *output, size_t output_size);
```

**参数：**

- `input`: 输入数据指针
- `input_len`: 输入数据长度
- `output`: 输出缓冲区指针
- `output_size`: 输出缓冲区大小

**返回值：**

- `DX_OK`: 成功
- `DX_ERROR_BUFFER_TOO_SMALL`: 输出缓冲区太小

### `dx_encode_string()`

将字符串编码为 DX 格式。

```c
int dx_encode_string(const char *input, char *output, size_t output_size);
```

**参数：**

- `input`: 输入字符串（以空字符结尾）
- `output`: 输出缓冲区指针
- `output_size`: 输出缓冲区大小

**返回值：**

- `DX_OK`: 成功
- `DX_ERROR_BUFFER_TOO_SMALL`: 输出缓冲区太小

### `dx_decode()`

将 DX 编码解码为字节数据。

```c
int dx_decode(const char *encoded, uint8_t *output,
              size_t output_size, size_t *output_len);
```

**参数：**

- `encoded`: DX 编码字符串
- `output`: 输出缓冲区指针
- `output_size`: 输出缓冲区大小
- `output_len`: 输出实际解码的字节数

**返回值：**

- `DX_OK`: 成功
- `DX_ERROR_INVALID_INPUT`: 无效输入
- `DX_ERROR_INVALID_PREFIX`: 缺少 dx 前缀
- `DX_ERROR_INVALID_LENGTH`: 长度不正确
- `DX_ERROR_INVALID_CHARACTER`: 包含非法字符
- `DX_ERROR_BUFFER_TOO_SMALL`: 输出缓冲区太小

### `dx_decode_string()`

将 DX 编码解码为字符串。

```c
int dx_decode_string(const char *encoded, char *output, size_t output_size);
```

**参数：**

- `encoded`: DX 编码字符串
- `output`: 输出缓冲区指针
- `output_size`: 输出缓冲区大小

**返回值：**

- 与 `dx_decode()` 相同

### `dx_is_encoded()`

检查字符串是否为有效的 DX 编码。

```c
int dx_is_encoded(const char *str);
```

**参数：**

- `str`: 要检查的字符串

**返回值：**

- `1`: 是有效的 DX 编码
- `0`: 不是有效的 DX 编码

### `dx_get_info()`

获取 DX 编码的信息。

```c
dx_info_t dx_get_info(void);
```

**返回值：**

- `dx_info_t` 结构体，包含版本、作者、字符集等信息

### `dx_error_string()`

获取错误码对应的错误信息。

```c
const char *dx_error_string(int error_code);
```

**参数：**

- `error_code`: 错误码

**返回值：**

- 错误描述字符串

## 辅助函数

### `dx_encode_length()`

计算编码后需要的缓冲区大小。

```c
size_t dx_encode_length(size_t input_len);
```

### `dx_decode_length()`

计算解码后需要的最大缓冲区大小。

```c
size_t dx_decode_length(size_t encoded_len);
```

## 常量

```c
#define DX_CHARSET "DXdx0123456789ABCEFGHIJKLMNOPQRSTUVWYZabcefghijklmnopqrstuvwyz-_"
#define DX_MAGIC 0x44
#define DX_PREFIX "dx"
#define DX_PREFIX_LEN 2
#define DX_PADDING '='
#define DX_CHARSET_LEN 64
```

## 错误码

| 错误码                       | 值  | 说明         |
| ---------------------------- | --- | ------------ |
| `DX_OK`                      | 0   | 成功         |
| `DX_ERROR_INVALID_INPUT`     | -1  | 无效输入     |
| `DX_ERROR_INVALID_PREFIX`    | -2  | 缺少 dx 前缀 |
| `DX_ERROR_INVALID_LENGTH`    | -3  | 长度不正确   |
| `DX_ERROR_INVALID_CHARACTER` | -4  | 包含非法字符 |
| `DX_ERROR_BUFFER_TOO_SMALL`  | -5  | 缓冲区太小   |
| `DX_ERROR_MEMORY`            | -6  | 内存分配失败 |

## 示例程序

完整示例：

```c
#include <stdio.h>
#include <string.h>
#include "dxcode.h"

int main() {
    // 获取编码信息
    dx_info_t info = dx_get_info();
    printf("dxcode v%s by %s\n\n", info.version, info.author);

    // 测试编码解码
    const char *test_strings[] = {
        "Hello, World!",
        "你好，Dogxi！",
        "🎉 Emoji Test 🚀",
    };

    for (int i = 0; i < 3; i++) {
        const char *original = test_strings[i];
        char encoded[256];
        char decoded[256];

        printf("原文: %s\n", original);

        if (dx_encode_string(original, encoded, sizeof(encoded)) == DX_OK) {
            printf("编码: %s\n", encoded);

            if (dx_decode_string(encoded, decoded, sizeof(decoded)) == DX_OK) {
                printf("解码: %s\n", decoded);
                printf("验证: %s\n\n",
                    strcmp(original, decoded) == 0 ? "✅ 成功" : "❌ 失败");
            }
        }
    }

    return 0;
}
```

编译运行：

```bash
gcc -o example example.c dxcode.c
./example
```

## 兼容性

- C99 或更高版本
- 支持所有主流平台（Linux、macOS、Windows）

## 许可证

MIT License © [Dogxi](https://github.com/dogxii)
