/**
 * DX Encoding - TypeScript 类型定义
 * 由 Dogxi 创建
 * @version 2.0.0
 */

/**
 * 将字符串或字节数组编码为 DX 格式（带 CRC16 校验和）
 * @param input - 要编码的输入数据（字符串或 Uint8Array）
 * @returns 以 'dx' 为前缀的编码字符串（包含校验和）
 */
export function dxEncode(input: string | Uint8Array | number[]): string;

/**
 * 将 DX 编码的字符串解码为原始数据（带校验和验证）
 * @param encoded - DX 编码的字符串（必须以 'dx' 开头）
 * @param options - 解码选项
 * @returns 解码后的字符串或 Uint8Array
 * @throws 如果输入不是有效的 DX 编码字符串或校验和不匹配
 */
export function dxDecode(encoded: string, options?: { asString?: true }): string;
export function dxDecode(encoded: string, options: { asString: false }): Uint8Array;
export function dxDecode(encoded: string, options?: { asString?: boolean }): string | Uint8Array;

/**
 * 检查字符串是否为有效的 DX 编码
 * @param str - 要检查的字符串
 * @returns 如果是有效的 DX 编码返回 true，否则返回 false
 */
export function isDxEncoded(str: string): boolean;

/**
 * 验证 DX 编码的校验和（不返回解码数据）
 * @param encoded - DX 编码的字符串
 * @returns 校验和是否匹配
 * @throws 如果格式无效（非校验和错误）
 */
export function dxVerify(encoded: string): boolean;

/**
 * 获取 DX 编码的校验和信息
 * @param encoded - DX 编码的字符串
 * @returns 存储的和计算的校验和
 * @throws 如果输入不是有效的 DX 编码字符串
 */
export function getChecksum(encoded: string): { stored: number; computed: number };

/**
 * 计算 CRC16-CCITT 校验和
 * @param data - 输入字节数组
 * @returns 16位校验和
 */
export function crc16(data: Uint8Array): number;

/**
 * 获取 DX 编码信息
 * @returns 编码信息对象
 */
export function getDxInfo(): {
  name: string;
  version: string;
  author: string;
  charset: string;
  prefix: string;
  magic: number;
  padding: string;
  checksum: string;
};

/**
 * DX 编码使用的字符集
 */
export const DX_CHARSET: string;

/**
 * DX 编码的魔数（用于 XOR 变换）
 */
export const MAGIC: number;

/**
 * DX 编码的前缀
 */
export const PREFIX: string;

/**
 * DX 编码的填充字符
 */
export const PADDING: string;

declare const _default: {
  encode: typeof dxEncode;
  decode: typeof dxDecode;
  isEncoded: typeof isDxEncoded;
  verify: typeof dxVerify;
  getChecksum: typeof getChecksum;
  info: typeof getDxInfo;
  crc16: typeof crc16;
};

export default _default;
