/**
 * DX Encoding - 带有 `dx` 前缀的自定义编码算法
 *
 * @author Dogxi
 * @version 2.3.0
 * @license MIT
 *
 * v2.0 新增: CRC16-CCITT 校验和支持
 * v2.1 新增: 智能 DEFLATE 压缩支持
 * v2.2 新增: 使用 pako 实现真正的 DEFLATE 压缩
 * v2.3 新增: TTL (Time-To-Live) 过期时间支持
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

// 头部大小（1字节 flags + 2字节 CRC16）
const HEADER_SIZE = 3;

// 压缩阈值（字节数），小于此值不压缩
const COMPRESSION_THRESHOLD = 32;

// Flags 位定义
const FLAG_COMPRESSED = 0x01;
const FLAG_ALGO_DEFLATE = 0x02;
const FLAG_HAS_TTL = 0x04;

// 有效的 flags 掩码
const VALID_FLAGS_MASK = FLAG_COMPRESSED | FLAG_ALGO_DEFLATE | FLAG_HAS_TTL;

// TTL 头部大小（4字节 created_at + 4字节 ttl_seconds）
const TTL_HEADER_SIZE = 8;

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

// ============================================================================
// DEFLATE 压缩/解压缩实现
// 优先使用 pako，回退到简单实现
// ============================================================================

let pako = null;

// 尝试加载 pako
try {
	if (typeof require !== "undefined") {
		// Node.js CommonJS
		pako = require("pako");
	} else if (typeof window !== "undefined" && window.pako) {
		// 浏览器全局变量
		pako = window.pako;
	}
} catch (e) {
	// pako 不可用，使用回退实现
}

/**
 * 简单的 DEFLATE 压缩实现（回退方案）
 * 使用存储块（无压缩）
 */
class FallbackDeflateCompressor {
	constructor() {
		this.output = [];
		this.bitBuffer = 0;
		this.bitCount = 0;
	}

	writeBits(value, bits) {
		this.bitBuffer |= value << this.bitCount;
		this.bitCount += bits;
		while (this.bitCount >= 8) {
			this.output.push(this.bitBuffer & 0xff);
			this.bitBuffer >>= 8;
			this.bitCount -= 8;
		}
	}

	compress(data) {
		// 使用存储块（无压缩）作为回退实现
		// BFINAL=1, BTYPE=00 (无压缩)
		this.writeBits(1, 1); // BFINAL
		this.writeBits(0, 2); // BTYPE = 00 (stored)

		// 对齐到字节边界
		if (this.bitCount > 0) {
			this.output.push(this.bitBuffer & 0xff);
			this.bitBuffer = 0;
			this.bitCount = 0;
		}

		// LEN 和 NLEN
		const len = data.length;
		this.output.push(len & 0xff);
		this.output.push((len >> 8) & 0xff);
		this.output.push(~len & 0xff);
		this.output.push((~len >> 8) & 0xff);

		// 数据
		for (let i = 0; i < data.length; i++) {
			this.output.push(data[i]);
		}

		return new Uint8Array(this.output);
	}
}

/**
 * 简单的 DEFLATE 解压缩实现（回退方案）
 */
class FallbackDeflateDecompressor {
	constructor(data) {
		this.data = data;
		this.pos = 0;
		this.bitBuffer = 0;
		this.bitCount = 0;
		this.output = [];
	}

	readBits(bits) {
		while (this.bitCount < bits) {
			if (this.pos >= this.data.length) {
				throw new Error("Unexpected end of data");
			}
			this.bitBuffer |= this.data[this.pos++] << this.bitCount;
			this.bitCount += 8;
		}
		const value = this.bitBuffer & ((1 << bits) - 1);
		this.bitBuffer >>= bits;
		this.bitCount -= bits;
		return value;
	}

	decompress() {
		let bfinal = 0;

		while (bfinal === 0) {
			bfinal = this.readBits(1);
			const btype = this.readBits(2);

			if (btype === 0) {
				// 存储块（无压缩）
				// 对齐到字节边界
				this.bitBuffer = 0;
				this.bitCount = 0;

				const len = this.data[this.pos] | (this.data[this.pos + 1] << 8);
				this.pos += 2;
				const nlen = this.data[this.pos] | (this.data[this.pos + 1] << 8);
				this.pos += 2;

				if ((len ^ nlen) !== 0xffff) {
					throw new Error("Invalid stored block");
				}

				for (let i = 0; i < len; i++) {
					this.output.push(this.data[this.pos++]);
				}
			} else if (btype === 1 || btype === 2) {
				// 固定或动态 Huffman - 回退实现不支持，需要 pako
				throw new Error(
					"Huffman compression requires pako library. Please install: npm install pako",
				);
			} else {
				throw new Error("Invalid block type");
			}
		}

		return new Uint8Array(this.output);
	}
}

/**
 * 使用 DEFLATE 压缩数据
 * @param {Uint8Array} data - 要压缩的数据
 * @returns {Uint8Array} 压缩后的数据
 */
function compressDeflate(data) {
	if (pako) {
		// 使用 pako 进行真正的 DEFLATE 压缩
		// raw: true 表示不包含 zlib 头部和尾部
		return pako.deflateRaw(data, { level: 9 });
	} else {
		// 回退到存储块实现
		const compressor = new FallbackDeflateCompressor();
		return compressor.compress(data);
	}
}

/**
 * 使用 DEFLATE 解压缩数据
 * @param {Uint8Array} data - 压缩的数据
 * @returns {Uint8Array} 解压缩后的数据
 */
function decompressDeflate(data) {
	if (pako) {
		// 使用 pako 进行解压缩
		return pako.inflateRaw(data);
	} else {
		// 回退到简单实现（只支持存储块）
		const decompressor = new FallbackDeflateDecompressor(data);
		return decompressor.decompress();
	}
}

/**
 * 检查 pako 是否可用
 * @returns {boolean}
 */
function isPakoAvailable() {
	return pako !== null;
}

// ============================================================================
// 内部编解码函数
// ============================================================================

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

// ============================================================================
// 公开 API
// ============================================================================

/**
 * DX 编码（带 CRC16 校验和和智能压缩）
 * 将字符串或字节数组编码为 DX 格式
 *
 * @param {string|Uint8Array|number[]} input - 要编码的数据
 * @param {Object} options - 选项
 * @param {boolean} options.compress - 是否允许压缩（默认 true）
 * @returns {string} DX 编码后的字符串（带 dx 前缀和校验和）
 *
 * @example
 * dxEncode('Hello, Dogxi!')  // 返回 'dxXXXX...'
 * dxEncode(new Uint8Array([0x48, 0x69]))  // 返回 'dxXXXX...'
 * dxEncode('long text...', { compress: false })  // 禁用压缩
 */
function dxEncode(input, options = { compress: true }) {
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

	// 计算原始数据的 CRC16
	const checksum = crc16(bytes);

	// 决定是否压缩
	let flags = 0;
	let payload = bytes;

	if (options.compress !== false && bytes.length >= COMPRESSION_THRESHOLD) {
		try {
			const compressed = compressDeflate(bytes);
			// 压缩后需要额外存储 2 字节原始大小
			// 只有当压缩后的大小 + 2 < 原始大小时才使用压缩
			if (compressed.length + 2 < bytes.length && bytes.length <= 65535) {
				// 使用压缩
				flags = FLAG_COMPRESSED | FLAG_ALGO_DEFLATE;
				const newPayload = new Uint8Array(2 + compressed.length);
				// 存储原始大小（大端序）
				newPayload[0] = (bytes.length >> 8) & 0xff;
				newPayload[1] = bytes.length & 0xff;
				newPayload.set(compressed, 2);
				payload = newPayload;
			}
		} catch (e) {
			// 压缩失败，使用原始数据
		}
	}

	// 构建头部（1字节 flags + 2字节 CRC16，大端序）
	const header = new Uint8Array([
		flags,
		(checksum >> 8) & 0xff,
		checksum & 0xff,
	]);

	// 合并头部和数据
	const combined = new Uint8Array(HEADER_SIZE + payload.length);
	combined.set(header, 0);
	combined.set(payload, HEADER_SIZE);

	// 编码
	return PREFIX + encodeRaw(combined);
}

/**
 * DX 解码（带校验和验证，自动解压缩）
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
function dxDecode(encoded, options = { asString: true, checkTtl: true }) {
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
	const flags = combined[0];
	const expectedChecksum = (combined[1] << 8) | combined[2];

	// 验证 flags
	if ((flags & ~VALID_FLAGS_MASK) !== 0) {
		throw new Error(
			`无效的 flags 字节：0x${flags.toString(16).padStart(2, "0")}`,
		);
	}

	// 确定 payload 的起始位置
	let payloadStart = HEADER_SIZE;

	// 检查是否有 TTL
	if (flags & FLAG_HAS_TTL) {
		// 验证有 TTL 头部的最小长度
		if (combined.length < HEADER_SIZE + TTL_HEADER_SIZE) {
			throw new Error("无效的格式头部");
		}

		// 如果需要检查 TTL
		if (options.checkTtl !== false) {
			const createdAt =
				(combined[HEADER_SIZE] << 24) |
				(combined[HEADER_SIZE + 1] << 16) |
				(combined[HEADER_SIZE + 2] << 8) |
				combined[HEADER_SIZE + 3];

			const ttlSeconds =
				(combined[HEADER_SIZE + 4] << 24) |
				(combined[HEADER_SIZE + 5] << 16) |
				(combined[HEADER_SIZE + 6] << 8) |
				combined[HEADER_SIZE + 7];

			// 检查是否过期
			if (ttlSeconds > 0) {
				const expiresAt = createdAt + ttlSeconds;
				const now = Math.floor(Date.now() / 1000);

				if (now > expiresAt) {
					throw new Error(
						`TTL 已过期：创建于 ${createdAt}，有效期 ${ttlSeconds} 秒，已于 ${expiresAt} 过期`,
					);
				}
			}
		}

		payloadStart = HEADER_SIZE + TTL_HEADER_SIZE;
	}

	// 提取数据部分
	const payload = combined.slice(payloadStart);

	// 根据 flags 决定是否需要解压缩
	let originalData;
	if (flags & FLAG_COMPRESSED) {
		// 数据已压缩，需要解压
		if (payload.length < 2) {
			throw new Error("无效的格式头部");
		}

		// 提取原始大小（用于验证）
		const _originalSize = (payload[0] << 8) | payload[1];

		// 解压缩
		const compressedData = payload.slice(2);
		originalData = decompressDeflate(compressedData);
	} else {
		// 数据未压缩
		originalData = payload;
	}

	// 验证校验和（针对原始数据）
	const actualChecksum = crc16(originalData);
	if (expectedChecksum !== actualChecksum) {
		throw new Error(
			`校验和不匹配：期望 0x${expectedChecksum.toString(16).toUpperCase().padStart(4, "0")}，实际 0x${actualChecksum.toString(16).toUpperCase().padStart(4, "0")}`,
		);
	}

	return options.asString ? bytesToString(originalData) : originalData;
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

	// 提取 flags 和校验和
	const flags = combined[0];
	const stored = (combined[1] << 8) | combined[2];
	const payload = combined.slice(HEADER_SIZE);

	// 根据 flags 决定是否需要解压缩
	let originalData;
	if (flags & FLAG_COMPRESSED) {
		if (payload.length < 2) {
			throw new Error("无效的格式头部");
		}
		const compressedData = payload.slice(2);
		originalData = decompressDeflate(compressedData);
	} else {
		originalData = payload;
	}

	const computed = crc16(originalData);

	return { stored, computed };
}

/**
 * 检查编码是否包含 TTL 信息
 *
 * @param {string} encoded - DX 编码的字符串
 * @returns {boolean} 是否包含 TTL
 */
function hasTtl(encoded) {
	if (!encoded || !encoded.startsWith(PREFIX)) {
		throw new Error("无效的 DX 编码：缺少 dx 前缀");
	}

	const data = encoded.slice(PREFIX.length);
	const combined = decodeRaw(data);

	if (combined.length < HEADER_SIZE) {
		throw new Error("无效的格式头部");
	}

	const flags = combined[0];
	return (flags & FLAG_HAS_TTL) !== 0;
}

/**
 * 获取编码的 TTL 信息
 *
 * @param {string} encoded - DX 编码的字符串
 * @returns {Object|null} TTL 信息，如果没有 TTL 返回 null
 *
 * @example
 * getTtlInfo('dxXXXX...')  // { createdAt, ttlSeconds, expiresAt, isExpired }
 */
function getTtlInfo(encoded) {
	if (!encoded || !encoded.startsWith(PREFIX)) {
		throw new Error("无效的 DX 编码：缺少 dx 前缀");
	}

	const data = encoded.slice(PREFIX.length);
	const combined = decodeRaw(data);

	if (combined.length < HEADER_SIZE) {
		throw new Error("无效的格式头部");
	}

	const flags = combined[0];

	if ((flags & FLAG_HAS_TTL) === 0) {
		return null;
	}

	if (combined.length < HEADER_SIZE + TTL_HEADER_SIZE) {
		throw new Error("无效的格式头部");
	}

	const createdAt =
		(combined[HEADER_SIZE] << 24) |
		(combined[HEADER_SIZE + 1] << 16) |
		(combined[HEADER_SIZE + 2] << 8) |
		combined[HEADER_SIZE + 3];

	const ttlSeconds =
		(combined[HEADER_SIZE + 4] << 24) |
		(combined[HEADER_SIZE + 5] << 16) |
		(combined[HEADER_SIZE + 6] << 8) |
		combined[HEADER_SIZE + 7];

	const now = Math.floor(Date.now() / 1000);

	let expiresAt = null;
	let isExpired = false;

	if (ttlSeconds === 0) {
		// 永不过期
		expiresAt = null;
		isExpired = false;
	} else {
		expiresAt = createdAt + ttlSeconds;
		isExpired = now > expiresAt;
	}

	return {
		createdAt,
		ttlSeconds,
		expiresAt,
		isExpired,
	};
}

/**
 * 检查编码是否已过期
 *
 * @param {string} encoded - DX 编码的字符串
 * @returns {boolean} 是否已过期（没有 TTL 的数据返回 false）
 */
function isExpired(encoded) {
	const info = getTtlInfo(encoded);
	if (info === null) {
		return false; // 没有 TTL 的数据永不过期
	}
	return info.isExpired;
}

/**
 * 使用 TTL 编码数据
 *
 * @param {string|Uint8Array|number[]} input - 要编码的数据
 * @param {number} ttlSeconds - 有效期（秒），0 表示永不过期
 * @param {Object} options - 选项
 * @param {boolean} options.compress - 是否允许压缩（默认 true）
 * @returns {string} 带有 TTL 的 DX 编码字符串
 *
 * @example
 * dxEncodeWithTtl('Hello', 3600)  // 1小时有效期
 * dxEncodeWithTtl('Data', 86400, { compress: false })  // 1天，禁用压缩
 */
function dxEncodeWithTtl(input, ttlSeconds, options = { compress: true }) {
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

	// 获取当前时间戳
	const createdAt = Math.floor(Date.now() / 1000);

	// 计算原始数据的 CRC16
	const checksum = crc16(bytes);

	// 决定是否压缩
	let flags = FLAG_HAS_TTL;
	let payload = bytes;

	if (options.compress !== false && bytes.length >= COMPRESSION_THRESHOLD) {
		try {
			const compressed = compressDeflate(bytes);
			if (compressed.length + 2 < bytes.length && bytes.length <= 65535) {
				flags |= FLAG_COMPRESSED | FLAG_ALGO_DEFLATE;
				const newPayload = new Uint8Array(2 + compressed.length);
				newPayload[0] = (bytes.length >> 8) & 0xff;
				newPayload[1] = bytes.length & 0xff;
				newPayload.set(compressed, 2);
				payload = newPayload;
			}
		} catch (e) {
			// 压缩失败，使用原始数据
		}
	}

	// 构建完整数据：[flags(1)] [CRC16(2)] [created_at(4)] [ttl(4)] [payload]
	const combined = new Uint8Array(
		HEADER_SIZE + TTL_HEADER_SIZE + payload.length,
	);
	combined[0] = flags;
	combined[1] = (checksum >> 8) & 0xff;
	combined[2] = checksum & 0xff;
	// created_at (大端序)
	combined[3] = (createdAt >> 24) & 0xff;
	combined[4] = (createdAt >> 16) & 0xff;
	combined[5] = (createdAt >> 8) & 0xff;
	combined[6] = createdAt & 0xff;
	// ttl_seconds (大端序)
	combined[7] = (ttlSeconds >> 24) & 0xff;
	combined[8] = (ttlSeconds >> 16) & 0xff;
	combined[9] = (ttlSeconds >> 8) & 0xff;
	combined[10] = ttlSeconds & 0xff;
	combined.set(payload, HEADER_SIZE + TTL_HEADER_SIZE);

	return PREFIX + encodeRaw(combined);
}

/**
 * 检查编码是否使用了压缩
 *
 * @param {string} encoded - DX 编码的字符串
 * @returns {boolean} 是否使用了压缩
 *
 * @example
 * isCompressed('dxXXXX...')  // true 或 false
 */
function isCompressed(encoded) {
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

	// 检查 flags
	const flags = combined[0];
	return (flags & FLAG_COMPRESSED) !== 0;
}

/**
 * 获取 DX 编码信息
 *
 * @returns {Object} 编码信息
 */
function getDxInfo() {
	return {
		name: "DX Encoding",
		version: "2.3.0",
		author: "Dogxi",
		charset: DX_CHARSET,
		prefix: PREFIX,
		magic: MAGIC,
		padding: PADDING,
		checksum: "CRC16-CCITT",
		compression: "DEFLATE",
		compressionThreshold: COMPRESSION_THRESHOLD,
		pakoAvailable: isPakoAvailable(),
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
		isCompressed,
		getDxInfo,
		isPakoAvailable,
		// TTL 相关
		dxEncodeWithTtl,
		hasTtl,
		getTtlInfo,
		isExpired,
		crc16,
		DX_CHARSET,
		PREFIX,
		MAGIC,
		PADDING,
		COMPRESSION_THRESHOLD,
	};
}

// ES Modules 导出
export {
	dxEncode,
	dxDecode,
	isDxEncoded,
	dxVerify,
	getChecksum,
	isCompressed,
	getDxInfo,
	isPakoAvailable,
	// TTL 相关
	dxEncodeWithTtl,
	hasTtl,
	getTtlInfo,
	isExpired,
	crc16,
	DX_CHARSET,
	PREFIX,
	MAGIC,
	PADDING,
	COMPRESSION_THRESHOLD,
};

export default {
	encode: dxEncode,
	decode: dxDecode,
	isEncoded: isDxEncoded,
	verify: dxVerify,
	getChecksum,
	isCompressed,
	info: getDxInfo,
	isPakoAvailable,
	// TTL 相关
	encodeWithTtl: dxEncodeWithTtl,
	hasTtl,
	getTtlInfo,
	isExpired,
	crc16,
};
