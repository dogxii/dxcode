/**
 * DX Encoding - 带有 `dx` 前缀的自定义编码算法
 *
 * @author Dogxi
 * @version 2.0.0
 * @license MIT
 *
 * v2.0 新增: CRC16-CCITT 校验和支持
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

// 头部大小（2字节 CRC16）
const HEADER_SIZE = 2;

// 构建反向查找表
const DX_DECODE_MAP = {};
for (let i = 0; i < DX_CHARSET.length; i++) {
	DX_DECODE_MAP[DX_CHARSET[i]] = i;
}

// CRC16-CCITT 查找表
const CRC16_TABLE = new Uint16Array(256);
for (let i = 0; i < 256; i++) {
	let crc = i << 8;
	for (let j = 0; j < 8; j++) {
		if (crc & 0x8000) {
			crc = ((crc << 1) ^ 0x1021) & 0xffff;
		} else {
			crc = (crc << 1) & 0xffff;
		}
	}
	CRC16_TABLE[i] = crc;
}

/**
 * 计算 CRC16-CCITT 校验和
 * @param {Uint8Array} data - 输入数据
 * @returns {number} 16位校验和
 */
function crc16(data) {
	let crc = 0xffff;
	for (let i = 0; i < data.length; i++) {
		const index = ((crc >> 8) ^ data[i]) & 0xff;
		crc = ((crc << 8) ^ CRC16_TABLE[index]) & 0xffff;
	}
	return crc;
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
 * 内部编码函数（不带前缀）
 * @param {Uint8Array} bytes - 要编码的字节数组
 * @returns {string} 编码后的字符串（不含前缀）
 */
function encodeRaw(bytes) {
	if (bytes.length === 0) {
		return "";
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

	return result;
}

/**
 * 内部解码函数（不带前缀验证）
 * @param {string} data - 编码数据（不含前缀）
 * @returns {Uint8Array} 解码后的字节数组
 */
function decodeRaw(data) {
	if (data.length === 0) {
		return new Uint8Array(0);
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

	return result;
}

/**
 * DX 编码（带 CRC16 校验和）
 * 将字符串或字节数组编码为 DX 格式
 *
 * @param {string|Uint8Array|number[]} input - 要编码的数据
 * @returns {string} DX 编码后的字符串（带 dx 前缀和校验和）
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

	// 计算 CRC16
	const checksum = crc16(bytes);

	// 构建头部（2字节 CRC16，大端序）
	const header = new Uint8Array([checksum >> 8, checksum & 0xff]);

	// 合并头部和数据
	const combined = new Uint8Array(HEADER_SIZE + bytes.length);
	combined.set(header, 0);
	combined.set(bytes, HEADER_SIZE);

	// 编码
	return PREFIX + encodeRaw(combined);
}

/**
 * DX 解码（带校验和验证）
 * 将 DX 编码的字符串解码为原始数据
 *
 * @param {string} encoded - DX 编码的字符串
 * @param {Object} options - 选项
 * @param {boolean} options.asString - 是否返回字符串（默认 true）
 * @returns {string|Uint8Array} 解码后的数据
 * @throws {Error} 如果校验和不匹配
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

	// 解码
	const combined = decodeRaw(data);

	// 验证长度
	if (combined.length < HEADER_SIZE) {
		throw new Error("无效的格式头部");
	}

	// 提取头部
	const expectedChecksum = (combined[0] << 8) | combined[1];

	// 提取数据
	const payload = combined.slice(HEADER_SIZE);

	// 验证校验和
	const actualChecksum = crc16(payload);
	if (expectedChecksum !== actualChecksum) {
		throw new Error(
			`校验和不匹配：期望 0x${expectedChecksum.toString(16).toUpperCase().padStart(4, "0")}，实际 0x${actualChecksum.toString(16).toUpperCase().padStart(4, "0")}`,
		);
	}

	return options.asString ? bytesToString(payload) : payload;
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

	// 检查长度（至少需要头部）
	if (data.length === 0 || data.length % 4 !== 0) {
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
 * 验证 DX 编码的校验和（不返回解码数据）
 *
 * @param {string} encoded - DX 编码的字符串
 * @returns {boolean} 校验和是否匹配
 *
 * @example
 * dxVerify('dxXXXX...')  // true 或 false
 */
function dxVerify(encoded) {
	try {
		dxDecode(encoded, { asString: false });
		return true;
	} catch (e) {
		if (e.message.includes("校验和不匹配")) {
			return false;
		}
		throw e;
	}
}

/**
 * 获取 DX 编码的校验和信息
 *
 * @param {string} encoded - DX 编码的字符串
 * @returns {{stored: number, computed: number}} 存储的和计算的校验和
 *
 * @example
 * getChecksum('dxXXXX...')  // { stored: 0x1234, computed: 0x1234 }
 */
function getChecksum(encoded) {
	// 验证前缀
	if (!encoded || !encoded.startsWith(PREFIX)) {
		throw new Error("无效的 DX 编码：缺少 dx 前缀");
	}

	// 移除前缀
	const data = encoded.slice(PREFIX.length);

	// 解码
	const combined = decodeRaw(data);

	// 验证长度
	if (combined.length < HEADER_SIZE) {
		throw new Error("无效的格式头部");
	}

	// 提取校验和
	const stored = (combined[0] << 8) | combined[1];
	const payload = combined.slice(HEADER_SIZE);
	const computed = crc16(payload);

	return { stored, computed };
}

/**
 * 获取 DX 编码信息
 *
 * @returns {Object} 编码信息
 */
function getDxInfo() {
	return {
		name: "DX Encoding",
		version: "2.0.0",
		author: "Dogxi",
		charset: DX_CHARSET,
		prefix: PREFIX,
		magic: MAGIC,
		padding: PADDING,
		checksum: "CRC16-CCITT",
	};
}

// 导出（支持 CommonJS 和 ES Modules）
if (typeof module !== "undefined" && module.exports) {
	module.exports = {
		dxEncode,
		dxDecode,
		isDxEncoded,
		dxVerify,
		getChecksum,
		getDxInfo,
		crc16,
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
	dxVerify,
	getChecksum,
	getDxInfo,
	crc16,
	DX_CHARSET,
	PREFIX,
	MAGIC,
	PADDING,
};

export default {
	encode: dxEncode,
	decode: dxDecode,
	isEncoded: isDxEncoded,
	verify: dxVerify,
	getChecksum,
	info: getDxInfo,
	crc16,
};
