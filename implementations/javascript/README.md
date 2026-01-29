# dxcode - JavaScript/TypeScript 实现

带有 `dx` 前缀的自定义编码算法的 JavaScript/TypeScript 实现。

## 安装

```bash
npm install dxcode-lib
```

或使用其他包管理器：

```bash
yarn add dxcode-lib
pnpm add dxcode-lib
bun add dxcode-lib
```

## 使用方法

### ES Modules

```javascript
import { dxEncode, dxDecode, isDxEncoded } from 'dxcode-lib'

// 编码
const encoded = dxEncode('你好，Dogxi！')
console.log(encoded) // dxXXXX...

// 解码
const decoded = dxDecode(encoded)
console.log(decoded) // 你好，Dogxi！

// 检查是否为 DX 编码
console.log(isDxEncoded(encoded)) // true
console.log(isDxEncoded('hello')) // false
```

### CommonJS

```javascript
const { dxEncode, dxDecode, isDxEncoded } = require('dxcode-lib')

// 编码
const encoded = dxEncode('Hello, World!')
console.log(encoded)

// 解码
const decoded = dxDecode(encoded)
console.log(decoded)
```

### TypeScript

```typescript
import { dxEncode, dxDecode, isDxEncoded } from 'dxcode-lib'

const message: string = '这是一条秘密消息'
const encoded: string = dxEncode(message)
const decoded: string = dxDecode(encoded)

console.log(encoded)
console.log(decoded)
```

### 编码字节数组

```javascript
import { dxEncode, dxDecode } from 'dxcode-lib'

// 编码字节数组
const bytes = new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f])
const encoded = dxEncode(bytes)

// 解码为字节数组
const decodedBytes = dxDecode(encoded, { asString: false })
console.log(decodedBytes) // Uint8Array [72, 101, 108, 108, 111]
```

## API

### `dxEncode(input)`

将输入编码为 DX 格式。

- **参数**
  - `input`: `string | Uint8Array | number[]` - 要编码的数据
- **返回值**: `string` - 以 `dx` 为前缀的编码字符串

### `dxDecode(encoded, options?)`

将 DX 编码的字符串解码。

- **参数**
  - `encoded`: `string` - DX 编码的字符串（必须以 `dx` 开头）
  - `options`: `object` - 可选配置
    - `asString`: `boolean` - 是否返回字符串（默认 `true`）
- **返回值**: `string | Uint8Array` - 解码后的数据

### `isDxEncoded(str)`

检查字符串是否为有效的 DX 编码。

- **参数**
  - `str`: `string` - 要检查的字符串
- **返回值**: `boolean`

### `getDxInfo()`

获取 DX 编码的信息。

- **返回值**: `object` - 包含版本、作者、字符集等信息

## 常量

- `DX_CHARSET` - DX 编码使用的 64 字符表
- `PREFIX` - 编码前缀 (`'dx'`)
- `MAGIC` - XOR 变换魔数 (`0x44`)
- `PADDING` - 填充字符 (`'='`)

## 浏览器使用

可以直接在浏览器中使用：

```html
<script type="module">
  import { dxEncode, dxDecode } from './dxcode.js'

  const encoded = dxEncode('Hello from browser!')
  document.body.textContent = encoded
</script>
```

## 错误处理

```javascript
import { dxDecode } from 'dxcode-lib'

try {
  dxDecode('invalid-string')
} catch (error) {
  console.error(error.message) // 无效的 DX 编码：缺少 dx 前缀
}
```

## 相关

- [dxcode-cli](https://www.npmjs.com/package/dxcode-cli) - CLI 命令行工具
- [dxc.dogxi.me](https://dxc.dogxi.me) - 在线编码解码

## 兼容性

- Node.js >= 12.0.0
- 现代浏览器（支持 TextEncoder/TextDecoder）

## 许可证

MIT License © [Dogxi](https://github.com/dogxii)
