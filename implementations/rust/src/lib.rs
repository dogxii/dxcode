//! dxcode - 带有 `dx` 前缀的自定义编码算法
//!
//! Rust 实现 - 带 CRC16 校验和和智能压缩
//!
//! # 示例
//!
//! ```
//! use dxcode::{encode, decode, encode_str, decode_str};
//!
//! // 编码字符串
//! let encoded = encode_str("你好，Dogxi！");
//! println!("{}", encoded); // dxXXXX...
//!
//! // 解码（自动验证校验和，自动解压缩）
//! let decoded = decode_str(&encoded).unwrap();
//! println!("{}", decoded); // 你好，Dogxi！
//!
//! // 验证完整性
//! use dxcode::verify;
//! assert!(verify(&encoded).unwrap());
//! ```
//!
//! # 作者
//!
//! Dogxi
//!
//! # 版本
//!
//! 2.2.0
//!
//! # 许可证
//!
//! MIT

use flate2::read::DeflateDecoder;
use flate2::write::DeflateEncoder;
use flate2::Compression;
use std::collections::HashMap;
use std::error::Error;
use std::fmt;
use std::io::{Read, Write};
use std::sync::LazyLock;

/// DX 字符集 - 以 DXdx 开头作为签名，共64个字符
pub const CHARSET: &str = "DXdx0123456789ABCEFGHIJKLMNOPQRSTUVWYZabcefghijklmnopqrstuvwyz-_";

/// 魔数 - 用于 XOR 变换，'D' 的 ASCII 值
pub const MAGIC: u8 = 0x44;

/// 前缀
pub const PREFIX: &str = "dx";

/// 填充字符
pub const PADDING: char = '=';

/// 头部大小（1字节 flags + 2字节 CRC16）
const HEADER_SIZE: usize = 3;

/// 压缩阈值（字节数），小于此值不压缩
const COMPRESSION_THRESHOLD: usize = 32;

/// Flags 位定义
const FLAG_COMPRESSED: u8 = 0x01;
const FLAG_ALGO_DEFLATE: u8 = 0x02;

/// 字符集字节数组
static CHARSET_BYTES: LazyLock<Vec<u8>> = LazyLock::new(|| CHARSET.as_bytes().to_vec());

/// 反向查找表
static DECODE_MAP: LazyLock<HashMap<u8, u8>> = LazyLock::new(|| {
    let mut map = HashMap::new();
    for (i, &byte) in CHARSET_BYTES.iter().enumerate() {
        map.insert(byte, i as u8);
    }
    map
});

/// CRC16 查找表 (CRC-16-CCITT)
static CRC16_TABLE: LazyLock<[u16; 256]> = LazyLock::new(|| {
    let mut table = [0u16; 256];
    for i in 0..256 {
        let mut crc = (i as u16) << 8;
        for _ in 0..8 {
            if crc & 0x8000 != 0 {
                crc = (crc << 1) ^ 0x1021;
            } else {
                crc <<= 1;
            }
        }
        table[i] = crc;
    }
    table
});

/// DX 编码错误类型
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum DxError {
    /// 缺少 dx 前缀
    InvalidPrefix,
    /// 长度不正确
    InvalidLength,
    /// 包含非法字符
    InvalidCharacter(char),
    /// UTF-8 解码错误
    Utf8Error(String),
    /// 校验和不匹配
    ChecksumMismatch { expected: u16, actual: u16 },
    /// 头部无效
    InvalidHeader,
    /// 压缩/解压缩错误
    CompressionError(String),
    /// 无效的 flags
    InvalidFlags(u8),
}

impl fmt::Display for DxError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            DxError::InvalidPrefix => write!(f, "无效的 DX 编码：缺少 dx 前缀"),
            DxError::InvalidLength => write!(f, "无效的 DX 编码：长度不正确"),
            DxError::InvalidCharacter(c) => write!(f, "无效的 DX 编码：包含非法字符 '{}'", c),
            DxError::Utf8Error(s) => write!(f, "UTF-8 解码错误：{}", s),
            DxError::ChecksumMismatch { expected, actual } => {
                write!(
                    f,
                    "校验和不匹配：期望 0x{:04X}，实际 0x{:04X}",
                    expected, actual
                )
            }
            DxError::InvalidHeader => write!(f, "无效的格式头部"),
            DxError::CompressionError(s) => write!(f, "压缩/解压缩错误：{}", s),
            DxError::InvalidFlags(flags) => write!(f, "无效的 flags 字节：0x{:02X}", flags),
        }
    }
}

impl Error for DxError {}

/// DX 编码结果类型
pub type Result<T> = std::result::Result<T, DxError>;

/// 计算 CRC16-CCITT 校验和
pub fn crc16(data: &[u8]) -> u16 {
    let mut crc: u16 = 0xFFFF;
    for &byte in data {
        let index = ((crc >> 8) ^ (byte as u16)) as usize;
        crc = (crc << 8) ^ CRC16_TABLE[index];
    }
    crc
}

/// 使用 DEFLATE 压缩数据
fn compress_deflate(data: &[u8]) -> Result<Vec<u8>> {
    let mut encoder = DeflateEncoder::new(Vec::new(), Compression::default());
    encoder
        .write_all(data)
        .map_err(|e| DxError::CompressionError(e.to_string()))?;
    encoder
        .finish()
        .map_err(|e| DxError::CompressionError(e.to_string()))
}

/// 使用 DEFLATE 解压缩数据
fn decompress_deflate(data: &[u8]) -> Result<Vec<u8>> {
    let mut decoder = DeflateDecoder::new(data);
    let mut decompressed = Vec::new();
    decoder
        .read_to_end(&mut decompressed)
        .map_err(|e| DxError::CompressionError(e.to_string()))?;
    Ok(decompressed)
}

/// 内部编码函数（不带前缀）
fn encode_raw(data: &[u8]) -> String {
    if data.is_empty() {
        return String::new();
    }

    let mut result = String::with_capacity((data.len() + 2) / 3 * 4);
    let charset = &*CHARSET_BYTES;

    // 每 3 字节处理一组
    for chunk in data.chunks(3) {
        let b0 = chunk[0];
        let b1 = chunk.get(1).copied().unwrap_or(0);
        let b2 = chunk.get(2).copied().unwrap_or(0);

        // 将 3 字节（24位）分成 4 个 6 位组
        let v0 = (b0 >> 2) & 0x3F;
        let v1 = ((b0 & 0x03) << 4 | (b1 >> 4)) & 0x3F;
        let v2 = ((b1 & 0x0F) << 2 | (b2 >> 6)) & 0x3F;
        let v3 = b2 & 0x3F;

        // XOR 变换并映射到字符
        result.push(charset[((v0 ^ MAGIC) & 0x3F) as usize] as char);
        result.push(charset[((v1 ^ MAGIC) & 0x3F) as usize] as char);

        if chunk.len() > 1 {
            result.push(charset[((v2 ^ MAGIC) & 0x3F) as usize] as char);
        } else {
            result.push(PADDING);
        }

        if chunk.len() > 2 {
            result.push(charset[((v3 ^ MAGIC) & 0x3F) as usize] as char);
        } else {
            result.push(PADDING);
        }
    }

    result
}

/// 内部解码函数（不带前缀验证）
fn decode_raw(data: &str) -> Result<Vec<u8>> {
    if data.is_empty() {
        return Ok(Vec::new());
    }

    // 验证长度
    if data.len() % 4 != 0 {
        return Err(DxError::InvalidLength);
    }

    // 计算填充数量
    let padding_count = if data.ends_with("==") {
        2
    } else if data.ends_with('=') {
        1
    } else {
        0
    };

    // 计算输出长度
    let output_len = (data.len() / 4) * 3 - padding_count;
    let mut result = Vec::with_capacity(output_len);

    let decode_map = &*DECODE_MAP;
    let data_bytes = data.as_bytes();

    // 每 4 字符处理一组
    for chunk in data_bytes.chunks(4) {
        let c0 = chunk[0];
        let c1 = chunk[1];
        let c2 = chunk[2];
        let c3 = chunk[3];

        // 字符转索引
        let i0 = *decode_map
            .get(&c0)
            .ok_or_else(|| DxError::InvalidCharacter(c0 as char))?;
        let i1 = *decode_map
            .get(&c1)
            .ok_or_else(|| DxError::InvalidCharacter(c1 as char))?;

        let i2 = if c2 == PADDING as u8 {
            0
        } else {
            *decode_map
                .get(&c2)
                .ok_or_else(|| DxError::InvalidCharacter(c2 as char))?
        };

        let i3 = if c3 == PADDING as u8 {
            0
        } else {
            *decode_map
                .get(&c3)
                .ok_or_else(|| DxError::InvalidCharacter(c3 as char))?
        };

        // XOR 逆变换
        let v0 = (i0 ^ MAGIC) & 0x3F;
        let v1 = (i1 ^ MAGIC) & 0x3F;
        let v2 = (i2 ^ MAGIC) & 0x3F;
        let v3 = (i3 ^ MAGIC) & 0x3F;

        // 重建字节
        let b0 = (v0 << 2) | (v1 >> 4);
        let b1 = ((v1 & 0x0F) << 4) | (v2 >> 2);
        let b2 = ((v2 & 0x03) << 6) | v3;

        if result.len() < output_len {
            result.push(b0);
        }
        if result.len() < output_len {
            result.push(b1);
        }
        if result.len() < output_len {
            result.push(b2);
        }
    }

    Ok(result)
}

/// 将字节切片编码为 DX 格式（带 CRC16 校验和和智能压缩）
///
/// # 参数
///
/// * `data` - 要编码的字节数据
///
/// # 返回值
///
/// 以 'dx' 为前缀、包含 CRC16 校验和的编码字符串（可能压缩）
///
/// # 示例
///
/// ```
/// use dxcode::encode;
///
/// let encoded = encode(b"Hello, Dogxi!");
/// assert!(encoded.starts_with("dx"));
/// ```
pub fn encode(data: &[u8]) -> String {
    encode_with_options(data, true)
}

/// 将字节切片编码为 DX 格式，可选择是否启用压缩
///
/// # 参数
///
/// * `data` - 要编码的字节数据
/// * `allow_compression` - 是否允许压缩
///
/// # 返回值
///
/// 以 'dx' 为前缀的编码字符串
pub fn encode_with_options(data: &[u8], allow_compression: bool) -> String {
    // 计算原始数据的 CRC16
    let checksum = crc16(data);

    // 决定是否压缩
    let (flags, payload) = if allow_compression && data.len() >= COMPRESSION_THRESHOLD {
        // 尝试压缩
        match compress_deflate(data) {
            Ok(compressed) => {
                // 压缩后需要额外存储 2 字节原始大小
                // 只有当压缩后的大小 + 2 < 原始大小时才使用压缩
                if compressed.len() + 2 < data.len() && data.len() <= 65535 {
                    // 使用压缩
                    let mut payload = Vec::with_capacity(2 + compressed.len());
                    // 存储原始大小（大端序）
                    payload.push((data.len() >> 8) as u8);
                    payload.push((data.len() & 0xFF) as u8);
                    payload.extend_from_slice(&compressed);
                    (FLAG_COMPRESSED | FLAG_ALGO_DEFLATE, payload)
                } else {
                    // 压缩无收益，使用原始数据
                    (0u8, data.to_vec())
                }
            }
            Err(_) => {
                // 压缩失败，使用原始数据
                (0u8, data.to_vec())
            }
        }
    } else {
        // 不压缩
        (0u8, data.to_vec())
    };

    // 构建头部（1字节 flags + 2字节 CRC16，大端序）
    let header = [flags, (checksum >> 8) as u8, (checksum & 0xFF) as u8];

    // 合并头部和数据
    let mut combined = Vec::with_capacity(HEADER_SIZE + payload.len());
    combined.extend_from_slice(&header);
    combined.extend_from_slice(&payload);

    // 编码
    let mut result = String::with_capacity(PREFIX.len() + (combined.len() + 2) / 3 * 4);
    result.push_str(PREFIX);
    result.push_str(&encode_raw(&combined));
    result
}

/// 将字符串编码为 DX 格式（带 CRC16 校验和和智能压缩）
///
/// # 参数
///
/// * `s` - 要编码的字符串
///
/// # 返回值
///
/// 以 'dx' 为前缀、包含 CRC16 校验和的编码字符串
///
/// # 示例
///
/// ```
/// use dxcode::encode_str;
///
/// let encoded = encode_str("你好，Dogxi！");
/// assert!(encoded.starts_with("dx"));
/// ```
pub fn encode_str(s: &str) -> String {
    encode(s.as_bytes())
}

/// 将字符串编码为 DX 格式，可选择是否启用压缩
pub fn encode_str_with_options(s: &str, allow_compression: bool) -> String {
    encode_with_options(s.as_bytes(), allow_compression)
}

/// 将 DX 编码的字符串解码为字节向量（带校验和验证，自动解压缩）
///
/// # 参数
///
/// * `encoded` - DX 编码的字符串（必须以 'dx' 开头）
///
/// # 返回值
///
/// 解码后的字节向量，如果输入无效或校验和不匹配则返回错误
///
/// # 示例
///
/// ```
/// use dxcode::{encode, decode};
///
/// let encoded = encode(b"Hello");
/// let decoded = decode(&encoded).unwrap();
/// assert_eq!(decoded, b"Hello");
/// ```
pub fn decode(encoded: &str) -> Result<Vec<u8>> {
    // 验证前缀
    if !encoded.starts_with(PREFIX) {
        return Err(DxError::InvalidPrefix);
    }

    // 移除前缀
    let data = &encoded[PREFIX.len()..];

    // 解码
    let combined = decode_raw(data)?;

    // 验证长度
    if combined.len() < HEADER_SIZE {
        return Err(DxError::InvalidHeader);
    }

    // 提取头部
    let flags = combined[0];
    let expected_checksum = ((combined[1] as u16) << 8) | (combined[2] as u16);

    // 验证 flags 的保留位
    if flags & 0xFC != 0 && flags & 0xFC != FLAG_ALGO_DEFLATE {
        // 允许 flags 为 0x00, 0x01, 0x02, 0x03
        if flags > 0x03 {
            return Err(DxError::InvalidFlags(flags));
        }
    }

    // 提取数据部分
    let payload = &combined[HEADER_SIZE..];

    // 根据 flags 决定是否需要解压缩
    let original_data = if flags & FLAG_COMPRESSED != 0 {
        // 数据已压缩，需要解压
        if payload.len() < 2 {
            return Err(DxError::InvalidHeader);
        }

        // 提取原始大小（用于验证）
        let _original_size = ((payload[0] as usize) << 8) | (payload[1] as usize);

        // 解压缩
        let compressed_data = &payload[2..];
        decompress_deflate(compressed_data)?
    } else {
        // 数据未压缩
        payload.to_vec()
    };

    // 验证校验和（针对原始数据）
    let actual_checksum = crc16(&original_data);
    if expected_checksum != actual_checksum {
        return Err(DxError::ChecksumMismatch {
            expected: expected_checksum,
            actual: actual_checksum,
        });
    }

    Ok(original_data)
}

/// 将 DX 编码的字符串解码为字符串（带校验和验证，自动解压缩）
///
/// # 参数
///
/// * `encoded` - DX 编码的字符串
///
/// # 返回值
///
/// 解码后的字符串，如果输入无效、校验和不匹配或不是有效的 UTF-8 则返回错误
///
/// # 示例
///
/// ```
/// use dxcode::{encode_str, decode_str};
///
/// let encoded = encode_str("你好，Dogxi！");
/// let decoded = decode_str(&encoded).unwrap();
/// assert_eq!(decoded, "你好，Dogxi！");
/// ```
pub fn decode_str(encoded: &str) -> Result<String> {
    let bytes = decode(encoded)?;
    String::from_utf8(bytes).map_err(|e| DxError::Utf8Error(e.to_string()))
}

/// 检查字符串是否为有效的 DX 编码
///
/// # 参数
///
/// * `s` - 要检查的字符串
///
/// # 返回值
///
/// 如果是有效的 DX 编码返回 `true`，否则返回 `false`
///
/// # 示例
///
/// ```
/// use dxcode::{encode_str, is_encoded};
///
/// let encoded = encode_str("Hello");
/// assert!(is_encoded(&encoded));
/// assert!(!is_encoded("hello"));
/// ```
pub fn is_encoded(s: &str) -> bool {
    if !s.starts_with(PREFIX) {
        return false;
    }

    let data = &s[PREFIX.len()..];

    // 检查长度（至少需要头部）
    if data.is_empty() || data.len() % 4 != 0 {
        return false;
    }

    let decode_map = &*DECODE_MAP;

    // 检查字符
    for (i, c) in data.bytes().enumerate() {
        if c == PADDING as u8 {
            // 填充只能在末尾
            if i < data.len() - 2 {
                return false;
            }
        } else if !decode_map.contains_key(&c) {
            return false;
        }
    }

    true
}

/// 验证 DX 编码的校验和（不返回解码数据）
///
/// # 参数
///
/// * `encoded` - DX 编码的字符串
///
/// # 返回值
///
/// 如果校验和匹配返回 `Ok(true)`，不匹配返回 `Ok(false)`，格式无效返回错误
///
/// # 示例
///
/// ```
/// use dxcode::{encode_str, verify};
///
/// let encoded = encode_str("Hello");
/// assert!(verify(&encoded).unwrap());
/// ```
pub fn verify(encoded: &str) -> Result<bool> {
    match decode(encoded) {
        Ok(_) => Ok(true),
        Err(DxError::ChecksumMismatch { .. }) => Ok(false),
        Err(e) => Err(e),
    }
}

/// 获取 DX 编码的校验和信息
///
/// # 参数
///
/// * `encoded` - DX 编码的字符串
///
/// # 返回值
///
/// 返回 `(存储的校验和, 实际计算的校验和)`
///
/// # 示例
///
/// ```
/// use dxcode::{encode_str, get_checksum};
///
/// let encoded = encode_str("Hello");
/// let (stored, computed) = get_checksum(&encoded).unwrap();
/// assert_eq!(stored, computed);
/// ```
pub fn get_checksum(encoded: &str) -> Result<(u16, u16)> {
    // 验证前缀
    if !encoded.starts_with(PREFIX) {
        return Err(DxError::InvalidPrefix);
    }

    // 移除前缀
    let data = &encoded[PREFIX.len()..];

    // 解码
    let combined = decode_raw(data)?;

    // 验证长度
    if combined.len() < HEADER_SIZE {
        return Err(DxError::InvalidHeader);
    }

    // 提取 flags 和校验和
    let flags = combined[0];
    let stored = ((combined[1] as u16) << 8) | (combined[2] as u16);

    // 提取数据部分
    let payload = &combined[HEADER_SIZE..];

    // 根据 flags 决定是否需要解压缩
    let original_data = if flags & FLAG_COMPRESSED != 0 {
        if payload.len() < 2 {
            return Err(DxError::InvalidHeader);
        }
        let compressed_data = &payload[2..];
        decompress_deflate(compressed_data)?
    } else {
        payload.to_vec()
    };

    let computed = crc16(&original_data);

    Ok((stored, computed))
}

/// 检查编码是否使用了压缩
///
/// # 参数
///
/// * `encoded` - DX 编码的字符串
///
/// # 返回值
///
/// 返回 `true` 如果数据已压缩，否则返回 `false`
///
/// # 示例
///
/// ```
/// use dxcode::{encode_str, is_compressed};
///
/// let short_data = encode_str("Hi");
/// assert!(!is_compressed(&short_data).unwrap());
///
/// let long_data = encode_str(&"x".repeat(100));
/// // 可能压缩也可能不压缩，取决于压缩效果
/// ```
pub fn is_compressed(encoded: &str) -> Result<bool> {
    // 验证前缀
    if !encoded.starts_with(PREFIX) {
        return Err(DxError::InvalidPrefix);
    }

    // 移除前缀
    let data = &encoded[PREFIX.len()..];

    // 解码
    let combined = decode_raw(data)?;

    // 验证长度
    if combined.len() < HEADER_SIZE {
        return Err(DxError::InvalidHeader);
    }

    // 检查 flags
    let flags = combined[0];
    Ok(flags & FLAG_COMPRESSED != 0)
}

/// DX 编码信息
#[derive(Debug, Clone)]
pub struct Info {
    pub name: &'static str,
    pub version: &'static str,
    pub author: &'static str,
    pub charset: &'static str,
    pub prefix: &'static str,
    pub magic: u8,
    pub padding: char,
    pub checksum: &'static str,
    pub compression: &'static str,
    pub compression_threshold: usize,
}

/// 获取 DX 编码的信息
///
/// # 返回值
///
/// 包含版本、作者、字符集等信息的 `Info` 结构体
///
/// # 示例
///
/// ```
/// use dxcode::get_info;
///
/// let info = get_info();
/// println!("名称: {}", info.name);
/// println!("作者: {}", info.author);
/// ```
pub fn get_info() -> Info {
    Info {
        name: "DX Encoding",
        version: "2.2.0",
        author: "Dogxi",
        charset: CHARSET,
        prefix: PREFIX,
        magic: MAGIC,
        padding: PADDING,
        checksum: "CRC16-CCITT",
        compression: "DEFLATE",
        compression_threshold: COMPRESSION_THRESHOLD,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_simple_string() {
        let original = "Hello";
        let encoded = encode_str(original);
        let decoded = decode_str(&encoded).unwrap();
        assert_eq!(decoded, original);
        assert!(encoded.starts_with("dx"));
    }

    #[test]
    fn test_chinese_string() {
        let original = "你好，世界！";
        let encoded = encode_str(original);
        let decoded = decode_str(&encoded).unwrap();
        assert_eq!(decoded, original);
    }

    #[test]
    fn test_emoji() {
        let original = "🎉🚀✨";
        let encoded = encode_str(original);
        let decoded = decode_str(&encoded).unwrap();
        assert_eq!(decoded, original);
    }

    #[test]
    fn test_empty_string() {
        let original = "";
        let encoded = encode_str(original);
        let decoded = decode_str(&encoded).unwrap();
        assert_eq!(decoded, original);
        assert!(encoded.starts_with("dx"));
    }

    #[test]
    fn test_binary_data() {
        let original: Vec<u8> = vec![0x00, 0x01, 0x02, 0xFE, 0xFF];
        let encoded = encode(&original);
        let decoded = decode(&encoded).unwrap();
        assert_eq!(decoded, original);
    }

    #[test]
    fn test_all_byte_values() {
        let original: Vec<u8> = (0..=255).collect();
        let encoded = encode(&original);
        let decoded = decode(&encoded).unwrap();
        assert_eq!(decoded, original);
    }

    #[test]
    fn test_is_encoded() {
        let encoded = encode_str("Hello");
        assert!(is_encoded(&encoded));
        assert!(!is_encoded("hello"));
    }

    #[test]
    fn test_decode_invalid_prefix() {
        let result = decode("invalid");
        assert!(matches!(result, Err(DxError::InvalidPrefix)));
    }

    #[test]
    fn test_decode_invalid_length() {
        let result = decode("dxABC");
        assert!(matches!(result, Err(DxError::InvalidLength)));
    }

    #[test]
    fn test_checksum_verification() {
        let encoded = encode_str("Hello");
        assert!(verify(&encoded).unwrap());

        let (stored, computed) = get_checksum(&encoded).unwrap();
        assert_eq!(stored, computed);
    }

    #[test]
    fn test_checksum_mismatch() {
        let encoded = encode_str("Hello World Test Data");

        // 篡改数据（修改编码字符串中的一个字符）
        let mut chars: Vec<char> = encoded.chars().collect();

        // 找到一个可以修改的位置（跳过 "dx" 前缀，在数据部分修改）
        if chars.len() > 10 {
            let pos = 10;
            let original_char = chars[pos];
            // 用字符集中的另一个有效字符替换
            chars[pos] = if original_char == 'A' { 'B' } else { 'A' };
        }

        let modified: String = chars.into_iter().collect();

        // 验证应该失败（校验和不匹配或无效字符）
        let result = decode(&modified);
        assert!(
            matches!(result, Err(DxError::ChecksumMismatch { .. }))
                || matches!(result, Err(DxError::InvalidCharacter(_)))
        );
    }

    #[test]
    fn test_get_info() {
        let info = get_info();
        assert_eq!(info.name, "DX Encoding");
        assert_eq!(info.author, "Dogxi");
        assert_eq!(info.prefix, "dx");
        assert_eq!(info.magic, 0x44);
        assert_eq!(info.charset.len(), 64);
        assert_eq!(info.version, "2.2.0");
        assert_eq!(info.checksum, "CRC16-CCITT");
        assert_eq!(info.compression, "DEFLATE");
    }

    #[test]
    fn test_various_lengths() {
        for length in 0..100 {
            let original: Vec<u8> = (0..length).map(|i| (i % 256) as u8).collect();
            let encoded = encode(&original);
            let decoded = decode(&encoded).unwrap();
            assert_eq!(decoded, original, "长度 {} 失败", length);
        }
    }

    #[test]
    fn test_crc16() {
        // 测试空数据
        assert_eq!(crc16(&[]), 0xFFFF);

        // 测试已知值 - CRC-16-CCITT for "123456789" should be 0x29B1
        let data = b"123456789";
        let crc = crc16(data);
        assert_eq!(crc, 0x29B1);
    }

    #[test]
    fn test_crc16_deterministic() {
        let data = b"Hello, World!";
        let crc1 = crc16(data);
        let crc2 = crc16(data);
        assert_eq!(crc1, crc2);
    }

    #[test]
    fn test_verify_function() {
        let encoded = encode_str("Test data for verification");
        assert!(verify(&encoded).unwrap());
    }

    // ========== 压缩测试 ==========

    #[test]
    fn test_short_data_not_compressed() {
        let original = "Short";
        let encoded = encode_str(original);
        assert!(!is_compressed(&encoded).unwrap());

        let decoded = decode_str(&encoded).unwrap();
        assert_eq!(decoded, original);
    }

    #[test]
    fn test_long_repetitive_data_compressed() {
        // 重复数据压缩效果好
        let original = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
        let encoded = encode_str(original);

        // 验证解码正确
        let decoded = decode_str(&encoded).unwrap();
        assert_eq!(decoded, original);

        // 重复数据应该被压缩（压缩效果好）
        assert!(is_compressed(&encoded).unwrap());
    }

    #[test]
    fn test_compression_saves_space() {
        // 创建大量重复数据
        let original = "Hello World! ".repeat(100);
        let encoded_compressed = encode_str(&original);
        let encoded_uncompressed = encode_str_with_options(&original, false);

        // 压缩版本应该更短
        assert!(
            encoded_compressed.len() < encoded_uncompressed.len(),
            "压缩版本 ({}) 应该比未压缩版本 ({}) 短",
            encoded_compressed.len(),
            encoded_uncompressed.len()
        );

        // 两种方式都能正确解码
        assert_eq!(decode_str(&encoded_compressed).unwrap(), original);
        assert_eq!(decode_str(&encoded_uncompressed).unwrap(), original);
    }

    #[test]
    fn test_incompressible_data() {
        // 随机数据压缩效果差
        let original: Vec<u8> = (0..100).map(|i| (i * 7 + 13) as u8).collect();
        let encoded = encode(&original);

        // 验证解码正确
        let decoded = decode(&encoded).unwrap();
        assert_eq!(decoded, original);
    }

    #[test]
    fn test_encode_without_compression() {
        let original = "A".repeat(100);
        let encoded = encode_str_with_options(&original, false);

        // 强制不压缩
        assert!(!is_compressed(&encoded).unwrap());

        // 仍然能正确解码
        let decoded = decode_str(&encoded).unwrap();
        assert_eq!(decoded, original);
    }

    #[test]
    fn test_compression_threshold() {
        // 刚好在阈值以下
        let short_data = "x".repeat(COMPRESSION_THRESHOLD - 1);
        let encoded_short = encode_str(&short_data);
        assert!(!is_compressed(&encoded_short).unwrap());

        // 刚好在阈值以上
        let long_data = "x".repeat(COMPRESSION_THRESHOLD + 10);
        let encoded_long = encode_str(&long_data);
        // 重复数据应该被压缩
        assert!(is_compressed(&encoded_long).unwrap());
    }

    #[test]
    fn test_large_data_compression() {
        // 测试较大数据
        let original = "The quick brown fox jumps over the lazy dog. ".repeat(500);
        let encoded = encode_str(&original);

        // 验证解码正确
        let decoded = decode_str(&encoded).unwrap();
        assert_eq!(decoded, original);

        // 验证校验和
        assert!(verify(&encoded).unwrap());
    }
}
