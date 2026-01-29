# dxcode 编码算法规范

**版本：** 2.1  
**作者：** Dogxi  
**状态：** 稳定版

---

## 概述

DX 编码是由 Dogxi 设计的一种自定义二进制转文本编码方案。它将二进制数据转换为可打印的 ASCII 字符串格式，概念上类似于 Base64，但具有独特的字符集和转换过程。

**v2.0 新增**：内置 CRC16-CCITT 校验和，支持数据完整性验证。
**v2.1 新增**：智能 DEFLATE 压缩，自动压缩大数据以节省空间。

## 设计目标

1. **独特性** - 使用与标准编码不同的独特字符集
2. **简洁性** - 易于在多种编程语言中实现
3. **可识别性** - 编码字符串以 `dx` 为前缀，便于识别
4. **可逆性** - 任何二进制数据都能无损编码/解码
5. **完整性** - 内置校验和，可检测数据损坏或篡改（v2.0）
6. **高效性** - 智能压缩减少大数据的编码长度（v2.1）

---

## 字符集

DX 编码使用自定义的 64 字符表：

```
位置:     0         1         2         3         4         5         6
          0123456789012345678901234567890123456789012345678901234567890123

字符表:   DXdx0123456789ABCEFGHIJKLMNOPQRSTUVWYZabcefghijklmnopqrstuvwyz-_
```

**字符对照表：**

| 索引 | 字符 | 索引 | 字符 | 索引 | 字符 | 索引 | 字符 |
| ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- |
| 0    | D    | 16   | B    | 32   | U    | 48   | i    |
| 1    | X    | 17   | C    | 33   | V    | 49   | j    |
| 2    | d    | 18   | E    | 34   | W    | 50   | k    |
| 3    | x    | 19   | F    | 35   | Y    | 51   | l    |
| 4    | 0    | 20   | G    | 36   | Z    | 52   | m    |
| 5    | 1    | 21   | H    | 37   | a    | 53   | n    |
| 6    | 2    | 22   | I    | 38   | b    | 54   | o    |
| 7    | 3    | 23   | J    | 39   | c    | 55   | p    |
| 8    | 4    | 24   | K    | 40   | e    | 56   | q    |
| 9    | 5    | 25   | L    | 41   | f    | 57   | r    |
| 10   | 6    | 26   | M    | 42   | g    | 58   | s    |
| 11   | 7    | 27   | N    | 43   | h    | 59   | t    |
| 12   | 8    | 28   | O    | 44   | i    | 60   | u    |
| 13   | 9    | 29   | P    | 45   | j    | 61   | v    |
| 14   | A    | 30   | Q    | 46   | k    | 62   | -    |
| 15   | B    | 31   | R    | 47   | l    | 63   | \_   |

**设计理念**：

- 以 `DXdx` 开头作为算法签名（前4个字符）
- 接着是数字 0-9（10个字符）
- 然后是大写字母 A-Z（去掉 D 和 X，24个字符）
- 接着是小写字母 a-z（去掉 d 和 x，24个字符）
- 最后是 URL 安全的特殊字符 `-` 和 `_`（2个字符）
- 总计：4 + 10 + 24 + 24 + 2 = 64 个唯一字符

---

## 格式规范 (v2.1)

```
DX编码字符串 = "dx" + 编码(头部 + 数据) + 填充

其中：
  - "dx"     : 固定 2 字符前缀
  - 头部     : 1 字节 flags + 2 字节 CRC16-CCITT 校验和
  - 数据     : 原始数据或压缩数据（含原始大小）
  - 填充     : 0、1 或 2 个 '=' 字符
```

### 头部结构

| 偏移 | 大小   | 描述                         |
| ---- | ------ | ---------------------------- |
| 0    | 1 字节 | flags 标志位                 |
| 1    | 2 字节 | CRC16-CCITT 校验和（大端序） |

### Flags 标志位

```
bit 0: 压缩标志 (0=未压缩, 1=已压缩)
bit 1: 压缩算法 (0=reserved, 1=DEFLATE)
bit 2-7: 保留 (必须为 0)
```

有效的 flags 值：

- `0x00`: 未压缩
- `0x03`: DEFLATE 压缩 (FLAG_COMPRESSED | FLAG_ALGO_DEFLATE)

### 数据部分结构

**未压缩时 (flags = 0x00)**：

```
[原始数据]
```

**已压缩时 (flags = 0x03)**：

```
[原始大小 (2字节, 大端序)] + [DEFLATE 压缩数据]
```

校验和以大端序（Big-Endian）存储，针对原始数据计算：

```
字节 0: flags
字节 1: (checksum >> 8) & 0xFF  // CRC16 高字节
字节 2: checksum & 0xFF          // CRC16 低字节
```

---

## CRC16-CCITT 校验和

### 算法参数

- **多项式**: 0x1021
- **初始值**: 0xFFFF
- **字节顺序**: 大端序（MSB first）
- **无反转**: 输入输出均不反转

### 计算方法

```
CRC16(data):
  crc = 0xFFFF
  for byte in data:
    index = ((crc >> 8) ^ byte) & 0xFF
    crc = ((crc << 1) ^ TABLE[index]) & 0xFFFF
  return crc
```

### 查找表生成

```
for i in 0..256:
  crc = i << 8
  for _ in 0..8:
    if crc & 0x8000:
      crc = ((crc << 1) ^ 0x1021) & 0xFFFF
    else:
      crc = (crc << 1) & 0xFFFF
  TABLE[i] = crc
```

### 已知测试向量

| 输入        | CRC16  |
| ----------- | ------ |
| (空)        | 0xFFFF |
| "123456789" | 0x29B1 |

---

## 智能压缩 (v2.1)

### 压缩策略

1. **压缩阈值**：仅当原始数据 >= 32 字节时考虑压缩
2. **压缩算法**：使用 DEFLATE (raw deflate，无 zlib 头)
3. **压缩决策**：仅当 `压缩后大小 + 2 < 原始大小` 时使用压缩
4. **大小限制**：原始数据最大 65535 字节（2字节存储大小）

### 压缩数据格式

```
[原始大小高字节] [原始大小低字节] [DEFLATE压缩数据...]
```

### 解压缩流程

1. 检查 flags 的 bit 0
2. 如果已压缩，提取前 2 字节作为原始大小
3. 使用 DEFLATE 解压剩余数据
4. 验证解压后的大小与存储的原始大小一致

---

## 编码流程

### 第一步：计算校验和

对原始输入数据计算 CRC16-CCITT 校验和。

```
原始数据: [B0, B1, B2, ..., Bn]
校验和:   CRC16(原始数据)
```

### 第二步：智能压缩 (v2.1)

```
如果 n >= 32:
    compressed = DEFLATE(原始数据)
    如果 len(compressed) + 2 < n 且 n <= 65535:
        flags = 0x03  // 使用压缩
        payload = [n_high, n_low] + compressed
    否则:
        flags = 0x00  // 不压缩
        payload = 原始数据
否则:
    flags = 0x00  // 不压缩
    payload = 原始数据
```

### 第三步：构建带头部的数据

将 flags 和校验和（大端序）放在数据前面。

```
combined = [flags, CRC_HIGH, CRC_LOW] + payload
```

### 第四步：分组处理

将 combined 数据按 3 字节为一组进行处理：

```
输入字节:      [xxxxxxxx] [yyyyyyyy] [zzzzzzzz]
                    ↓
6位分组:       [xxxxxx] [xxyyyy] [yyyyzz] [zzzzzz]
```

### 第五步：XOR 变换

对每个 6 位值应用 XOR 变换，增加独特性：

```
魔数 = 0x44 (68，即 ASCII 'D')
每个 6 位值 XOR 0x44 后再映射到字符
```

### 第六步：字符映射

将每个变换后的 6 位值（0-63）映射到 DX 字符表中对应的字符。

### 第七步：填充

如果输入长度不能被 3 整除：

- 剩余 1 字节：添加 `==` （2 个填充字符）
- 剩余 2 字节：添加 `=` （1 个填充字符）

### 第八步：添加前缀

最终编码字符串以 `dx` 为前缀：

```
输出 = "dx" + 编码字符串
```

---

## 解码流程

1. **验证前缀** - 检查并移除 `dx` 前缀
2. **移除填充** - 去除末尾的 `=` 字符并记录数量
3. **字符转索引** - 将每个字符转换回其 6 位值
4. **XOR 逆变换** - 每个 6 位值 XOR 0x44 还原
5. **重建字节** - 将 6 位值组合回 8 位字节
6. **提取头部** - 从解码数据中提取 flags 和 2 字节校验和
7. **解压缩** - 如果 flags 指示压缩，则解压数据
8. **验证校验和** - 计算原始数据的 CRC16 并与头部比较
9. **返回数据** - 如果校验和匹配，返回原始数据

---

## 长度计算

对于 `n` 字节的输入（未压缩时）：

```
header_length = 3  // 1字节flags + 2字节CRC16
combined_length = 3 + n
编码长度 = 2 + ceil(combined_length * 4 / 3) + 填充数量
         = 2 + ceil((n + 3) * 4 / 3) + padding
```

### 示例（未压缩）

| 输入长度 | 头部 | 总字节 | 编码字符 | 填充 | 总长度 |
| -------- | ---- | ------ | -------- | ---- | ------ |
| 0        | 3    | 3      | 4        | 0    | 6      |
| 1        | 3    | 4      | 6        | 2    | 10     |
| 2        | 3    | 5      | 7        | 1    | 10     |
| 3        | 3    | 6      | 8        | 0    | 10     |
| 5        | 3    | 8      | 11       | 1    | 14     |

### 压缩时的长度

压缩时额外增加 2 字节存储原始大小：

```
combined_length = 3 + 2 + compressed_size
               = 5 + compressed_size
```

---

## 数学表示

```
编码过程：
  // 构建 combined = [CRC_H, CRC_L] + data
  对于每 3 字节 [B0, B1, B2]：
    V0 = (B0 >> 2) & 0x3F
    V1 = ((B0 & 0x03) << 4 | B1 >> 4) & 0x3F
    V2 = ((B1 & 0x0F) << 2 | B2 >> 6) & 0x3F
    V3 = B2 & 0x3F
    C0 = CHARSET[V0 ^ 0x44]
    C1 = CHARSET[V1 ^ 0x44]
    C2 = CHARSET[V2 ^ 0x44]
    C3 = CHARSET[V3 ^ 0x44]

解码过程：
  对于每 4 字符 [C0, C1, C2, C3]：
    V0 = INDEX[C0] ^ 0x44
    V1 = INDEX[C1] ^ 0x44
    V2 = INDEX[C2] ^ 0x44
    V3 = INDEX[C3] ^ 0x44
    B0 = (V0 << 2) | (V1 >> 4)
    B1 = ((V1 & 0x0F) << 4) | (V2 >> 2)
    B2 = ((V2 & 0x03) << 6) | V3
  // 从 combined 中提取校验和并验证
```

---

## 示例

### 示例 1：简单字符串 "Hello"

**输入：** `Hello`

```
步骤 1 - UTF-8 字节：
  H=0x48, e=0x65, l=0x6C, l=0x6C, o=0x6F
  数据: [0x48, 0x65, 0x6C, 0x6C, 0x6F]

步骤 2 - 计算 CRC16：
  CRC16([0x48, 0x65, 0x6C, 0x6C, 0x6F]) = 0xDADA

步骤 3 - 构建 combined：
  [0xDA, 0xDA, 0x48, 0x65, 0x6C, 0x6C, 0x6F]
  (7 字节)

步骤 4-6 - 编码 combined...

步骤 7 - 添加前缀
```

**输出：** `dxnei8QFqcSp==`

### 示例 2：空字符串

**输入：** `""`

```
步骤 1 - 数据为空: []

步骤 2 - CRC16([]) = 0xFFFF

步骤 3 - combined: [0xFF, 0xFF]

步骤 4-7 - 编码并添加前缀
```

**输出：** `dxwwt=`

---

## 错误处理

解码器应处理以下错误情况：

1. **缺少前缀** - 字符串不以 `dx` 开头
2. **无效字符** - 字符不在 DX 字符表中（填充字符除外）
3. **无效填充** - 填充字符数量或位置不正确
4. **无效长度** - 编码后字符数不是 4 的倍数
5. **头部过短** - 解码后数据少于 2 字节（无法提取校验和）
6. **校验和不匹配** - 计算的 CRC16 与存储的不一致
7. **无效 flags** - flags 字节包含保留位或无效值
8. **解压缩失败** - DEFLATE 解压缩错误

### 错误类型

| 错误码 | 描述         | 处理建议           |
| ------ | ------------ | ------------------ |
| E001   | 缺少 dx 前缀 | 检查输入格式       |
| E002   | 无效字符     | 检查是否有非法字符 |
| E003   | 长度不正确   | 检查是否被截断     |
| E004   | 头部无效     | 数据可能严重损坏   |
| E005   | 校验和不匹配 | 数据已损坏或被篡改 |
| E006   | 无效 flags   | 检查 flags 字节    |
| E007   | 解压缩失败   | 压缩数据可能已损坏 |

---

## 安全说明

⚠️ **DX 编码不是加密！**

- 它只提供混淆，而非安全保护
- 算法是公开且可逆的
- 请勿用于保护真正敏感的数据
- 校验和仅用于检测意外损坏，不能防止恶意攻击
- 适用于需要一定程度模糊化和完整性检查的场景

---

## 实现指南

### 必需函数

1. `encode(data: bytes, allow_compression: bool = true) -> string` - 编码（含校验和，智能压缩）
2. `decode(encoded: string) -> bytes` - 解码并验证校验和（自动解压缩）
3. `is_encoded(string) -> boolean` - 检查字符串是否为 DX 编码

### 推荐函数

4. `verify(encoded: string) -> boolean` - 仅验证校验和
5. `get_checksum(encoded: string) -> (stored, computed)` - 获取校验和信息
6. `crc16(data: bytes) -> uint16` - 计算 CRC16-CCITT
7. `is_compressed(encoded: string) -> boolean` - 检查是否使用了压缩（v2.1）

### 推荐特性

- 支持 UTF-8 字符串输入
- 支持大文件流式处理
- 提供清晰的错误信息
- 区分校验和错误和格式错误
- 支持禁用压缩选项

---

## 版本历史

| 版本 | 日期 | 变更                        |
| ---- | ---- | --------------------------- |
| 1.0  | 2024 | 初始规范                    |
| 2.0  | 2026 | 新增 CRC16-CCITT 校验和支持 |
| 2.1  | 2026 | 新增智能 DEFLATE 压缩支持   |

---

## 许可证

本规范及参考实现采用 MIT 许可证发布。

```
MIT License

Copyright (c) 2024 Dogxi

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
