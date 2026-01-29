/**
 * DX Encoding - TypeScript 类型定义
 * 由 Dogxi 创建
 */

/**
 * 将字符串或字节数组编码为 DX 格式
 * @param input - 要编码的输入数据（字符串或 Uint8Array）
 * @returns 以 'dx' 为前缀的编码字符串
 */
export function dxEncode(input: string | Uint8Array): string;

/**
 * 将 DX 编码的字符串解码为原始数据
 * @param encoded - DX 编码的字符串（必须以 'dx' 开头）
 * @returns 解码后的字符串
 * @throws 如果输入不是有效的 DX 编码字符串
 */
export function dxDecode(encoded: string): string;

/**
 * 将 DX 编码的字符串解码为字节数组
 * @param encoded - DX 编码的字符串（必须以 'dx' 开头）
 * @returns 解码后的 Uint8Array
 * @throws 如果输入不是有效的 DX 编码字符串
 */
export function dxDecodeToBytes(encoded: string): Uint8Array;

/**
 * 检查字符串是否为有效的 DX 编码
 * @param str - 要检查的字符串
 * @returns 如果是有效的 DX 编码返回 true，否则返回 false
 */
export function isDxEncoded(str: string): boolean;

/**
 * DX 编码使用的字符集
 */
export const DX_CHARSET: string;

/**
 * DX 编码的魔数（用于 XOR 变换）
 */
export const DX_MAGIC: number;

/**
 * DX 编码的前缀
 */
export const DX_PREFIX: string;

/**
 * DX 编码错误类
 */
export class DxEncodingError extends Error {
  constructor(message: string);
  name: 'DxEncodingError';
}

declare const _default: {
  dxEncode: typeof dxEncode;
  dxDecode: typeof dxDecode;
  dxDecodeToBytes: typeof dxDecodeToBytes;
  isDxEncoded: typeof isDxEncoded;
  DX_CHARSET: typeof DX_CHARSET;
  DX_MAGIC: typeof DX_MAGIC;
  DX_PREFIX: typeof DX_PREFIX;
  DxEncodingError: typeof DxEncodingError;
};

export default _default;
