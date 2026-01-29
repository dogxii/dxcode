/**
 * DX Encoding - 由 Dogxi 创造的独特编码算法
 *
 * @author Dogxi
 * @version 1.0.0
 * @license MIT
 */

// DX 字符集 - 以 DXdx 开头作为签名，共64个字符
const DX_CHARSET =
	"DXdx0123456789ABCEFGHIJKLMNOPQRSTUVWYZabcefghijklmnopqrstuvwyz-_";

// 魔数 - 用于 XOR 变换，'D' 的 ASCII 值
const MAGIC = 0x44;

// 前缀
const PREFIX = "dx";

// 填充字符
const PADDING = "=";

// 构建反向查找表
const DX_DECODE_MAP = {};
for (let i = 0; i < DX_CHARSET.length; i++) {
	DX_DECODE_MAP[DX_CHARSET[i]] = i;
}

/**
 * 将字符串转换为 UTF-8 字节数组
 * @param {string} str - 输入字符串
 * @returns {Uint8Array} UTF-8 字节数组
 */
function stringToBytes(str) {
	const encoder = new TextEncoder();
	return encoder.encode(str);
}

/**
 * 将 UTF-8 字节数组转换为字符串
 * @param {Uint8Array} bytes - UTF-8 字节数组
 * @returns {string} 字符串
 */
function bytesToString(bytes) {
	const decoder = new TextDecoder("utf-8");
	return decoder.decode(bytes);
}

/**
 * DX 编码
 * 将字符串或字节数组编码为 DX 格式
 *
 * @param {string|Uint8Array|number[]} input - 要编码的数据
 * @returns {string} DX 编码后的字符串（带 dx 前缀）
 *
 * @example
 * dxEncode('Hello, Dogxi!')  // 返回 'dxXXXX...'
 * dxEncode(new Uint8Array([0x48, 0x69]))  // 返回 'dxXXXX...'
 */
function dxEncode(input) {
	// 将输入转换为字节数组
	let bytes;
	if (typeof input === "string") {
		bytes = stringToBytes(input);
	} else if (input instanceof Uint8Array) {
		bytes = input;
	} else if (Array.isArray(input)) {
		bytes = new Uint8Array(input);
	} else {
		throw new Error("输入必须是字符串、Uint8Array 或数字数组");
	}

	let result = "";
	const len = bytes.length;

	// 每 3 字节处理一组
	for (let i = 0; i < len; i += 3) {
		const b0 = bytes[i];
		const b1 = i + 1 < len ? bytes[i + 1] : 0;
		const b2 = i + 2 < len ? bytes[i + 2] : 0;

		// 将 3 字节（24位）分成 4 个 6 位组
		const v0 = (b0 >> 2) & 0x3f;
		const v1 = (((b0 & 0x03) << 4) | (b1 >> 4)) & 0x3f;
		const v2 = (((b1 & 0x0f) << 2) | (b2 >> 6)) & 0x3f;
		const v3 = b2 & 0x3f;

		// XOR 变换并映射到字符
		result += DX_CHARSET[(v0 ^ MAGIC) & 0x3f];
		result += DX_CHARSET[(v1 ^ MAGIC) & 0x3f];

		if (i + 1 < len) {
			result += DX_CHARSET[(v2 ^ MAGIC) & 0x3f];
		} else {
			result += PADDING;
		}

		if (i + 2 < len) {
			result += DX_CHARSET[(v3 ^ MAGIC) & 0x3f];
		} else {
			result += PADDING;
		}
	}

	return PREFIX + result;
}

/**
 * DX 解码
 * 将 DX 编码的字符串解码为原始数据
 *
 * @param {string} encoded - DX 编码的字符串
 * @param {Object} options - 选项
 * @param {boolean} options.asString - 是否返回字符串（默认 true）
 * @returns {string|Uint8Array} 解码后的数据
 *
 * @example
 * dxDecode('dxXXXX...')  // 返回 'Hello, Dogxi!'
 * dxDecode('dxXXXX...', { asString: false })  // 返回 Uint8Array
 */
function dxDecode(encoded, options = { asString: true }) {
	// 验证前缀
	if (!encoded || !encoded.startsWith(PREFIX)) {
		throw new Error("无效的 DX 编码：缺少 dx 前缀");
	}

	// 移除前缀
	const data = encoded.slice(PREFIX.length);

	if (data.length === 0) {
		return options.asString ? "" : new Uint8Array(0);
	}

	// 验证长度
	if (data.length % 4 !== 0) {
		throw new Error("无效的 DX 编码：长度不正确");
	}

	// 计算填充数量
	let paddingCount = 0;
	if (data.endsWith(PADDING + PADDING)) {
		paddingCount = 2;
	} else if (data.endsWith(PADDING)) {
		paddingCount = 1;
	}

	// 计算输出长度
	const outputLen = (data.length / 4) * 3 - paddingCount;
	const result = new Uint8Array(outputLen);

	let resultIndex = 0;

	// 每 4 字符处理一组
	for (let i = 0; i < data.length; i += 4) {
		const c0 = data[i];
		const c1 = data[i + 1];
		const c2 = data[i + 2];
		const c3 = data[i + 3];

		// 字符转索引
		const i0 = DX_DECODE_MAP[c0];
		const i1 = DX_DECODE_MAP[c1];
		const i2 = c2 === PADDING ? 0 : DX_DECODE_MAP[c2];
		const i3 = c3 === PADDING ? 0 : DX_DECODE_MAP[c3];

		// 验证字符
		if (
			i0 === undefined ||
			i1 === undefined ||
			(c2 !== PADDING && i2 === undefined) ||
			(c3 !== PADDING && i3 === undefined)
		) {
			throw new Error(`无效的 DX 编码：包含非法字符`);
		}

		// XOR 逆变换
		const v0 = (i0 ^ MAGIC) & 0x3f;
		const v1 = (i1 ^ MAGIC) & 0x3f;
		const v2 = (i2 ^ MAGIC) & 0x3f;
		const v3 = (i3 ^ MAGIC) & 0x3f;

		// 重建字节
		const b0 = (v0 << 2) | (v1 >> 4);
		const b1 = ((v1 & 0x0f) << 4) | (v2 >> 2);
		const b2 = ((v2 & 0x03) << 6) | v3;

		if (resultIndex < outputLen) result[resultIndex++] = b0;
		if (resultIndex < outputLen) result[resultIndex++] = b1;
		if (resultIndex < outputLen) result[resultIndex++] = b2;
	}

	return options.asString ? bytesToString(result) : result;
}

/**
 * 检查字符串是否为有效的 DX 编码
 *
 * @param {string} str - 要检查的字符串
 * @returns {boolean} 是否为有效的 DX 编码
 *
 * @example
 * isDxEncoded('dxXXXX...')  // true
 * isDxEncoded('Hello')      // false
 */
function isDxEncoded(str) {
	if (!str || typeof str !== "string") {
		return false;
	}

	if (!str.startsWith(PREFIX)) {
		return false;
	}

	const data = str.slice(PREFIX.length);

	// 空字符串编码后只有前缀，也是有效的
	if (data.length === 0) {
		return true;
	}

	// 检查长度
	if (data.length % 4 !== 0) {
		return false;
	}

	// 检查字符
	for (let i = 0; i < data.length; i++) {
		const char = data[i];
		if (char === PADDING) {
			// 填充只能在末尾
			if (i < data.length - 2) {
				return false;
			}
		} else if (DX_DECODE_MAP[char] === undefined) {
			return false;
		}
	}

	return true;
}

/**
 * 获取 DX 编码信息
 *
 * @returns {Object} 编码信息
 */
function getDxInfo() {
	return {
		name: "DX Encoding",
		version: "1.0.0",
		author: "Dogxi",
		charset: DX_CHARSET,
		prefix: PREFIX,
		magic: MAGIC,
		padding: PADDING,
	};
}

// 导出（支持 CommonJS 和 ES Modules）
if (typeof module !== "undefined" && module.exports) {
	module.exports = {
		dxEncode,
		dxDecode,
		isDxEncoded,
		getDxInfo,
		DX_CHARSET,
		PREFIX,
		MAGIC,
		PADDING,
	};
}

// ES Modules 导出
export {
	dxEncode,
	dxDecode,
	isDxEncoded,
	getDxInfo,
	DX_CHARSET,
	PREFIX,
	MAGIC,
	PADDING,
};

export default {
	encode: dxEncode,
	decode: dxDecode,
	isEncoded: isDxEncoded,
	info: getDxInfo,
};
