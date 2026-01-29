/**
 * DX Encoding - 带有 `dx` 前缀的自定义编码算法
 *
 * C 语言实现 - 头文件
 *
 * 作者: Dogxi
 * 版本: 2.3.0
 * 许可证: MIT
 *
 * v2.0 新增: CRC16-CCITT 校验和支持
 * v2.1 新增: 智能 DEFLATE 压缩支持（需要 zlib）
 * v2.3 新增: TTL (Time-To-Live) 过期时间支持
 */

#ifndef DXCODE_H
#define DXCODE_H

#include <stddef.h>
#include <stdint.h>
#include <time.h>

#ifdef __cplusplus
extern "C" {
#endif

/* ============================================================================
 * 版本信息
 * ============================================================================ */

#define DX_VERSION_MAJOR 2
#define DX_VERSION_MINOR 3
#define DX_VERSION_PATCH 0
#define DX_VERSION "2.3.0"

/* ============================================================================
 * 常量定义
 * ============================================================================ */

/** DX 字符集 - 以 DXdx 开头作为签名，共64个字符 */
#define DX_CHARSET "DXdx0123456789ABCEFGHIJKLMNOPQRSTUVWYZabcefghijklmnopqrstuvwyz-_"

/** 魔数 - 用于 XOR 变换，'D' 的 ASCII 值 */
#define DX_MAGIC 0x44

/** 前缀 */
#define DX_PREFIX "dx"

/** 前缀长度 */
#define DX_PREFIX_LEN 2

/** 填充字符 */
#define DX_PADDING '='

/** 字符集长度 */
#define DX_CHARSET_LEN 64

/** 头部大小（1字节 flags + 2字节 CRC16） */
#define DX_HEADER_SIZE 3

/** TTL 头部大小（4字节 created_at + 4字节 ttl_seconds） */
#define DX_TTL_HEADER_SIZE 8

/** 压缩阈值（字节数） */
#define DX_COMPRESSION_THRESHOLD 32

/* ============================================================================
 * Flags 位定义
 * ============================================================================ */

/** 数据已压缩 */
#define DX_FLAG_COMPRESSED  0x01

/** 使用 DEFLATE 算法 */
#define DX_FLAG_ALGO_DEFLATE 0x02

/** 包含 TTL */
#define DX_FLAG_HAS_TTL     0x04

/** 有效的 flags 掩码 */
#define DX_VALID_FLAGS_MASK (DX_FLAG_COMPRESSED | DX_FLAG_ALGO_DEFLATE | DX_FLAG_HAS_TTL)

/* ============================================================================
 * 错误码
 * ============================================================================ */

/** 成功 */
#define DX_OK 0

/** 无效输入 */
#define DX_ERROR_INVALID_INPUT -1

/** 缺少前缀 */
#define DX_ERROR_INVALID_PREFIX -2

/** 无效长度 */
#define DX_ERROR_INVALID_LENGTH -3

/** 无效字符 */
#define DX_ERROR_INVALID_CHARACTER -4

/** 缓冲区太小 */
#define DX_ERROR_BUFFER_TOO_SMALL -5

/** 内存分配失败 */
#define DX_ERROR_MEMORY -6

/** 无效的头部格式 */
#define DX_ERROR_INVALID_HEADER -7

/** 无效的 flags */
#define DX_ERROR_INVALID_FLAGS -8

/** 校验和不匹配 */
#define DX_ERROR_CHECKSUM_MISMATCH -9

/** 压缩/解压缩失败 */
#define DX_ERROR_COMPRESSION -10

/** TTL 已过期 */
#define DX_ERROR_TTL_EXPIRED -11

/* ============================================================================
 * 数据结构
 * ============================================================================ */

/**
 * DX 编码选项
 */
typedef struct {
    int compress;       /**< 是否允许压缩（默认 1） */
} dx_encode_options_t;

/**
 * DX 解码选项
 */
typedef struct {
    int check_ttl;      /**< 是否检查 TTL（默认 1） */
} dx_decode_options_t;

/**
 * TTL 信息结构体
 */
typedef struct {
    uint32_t created_at;    /**< 创建时间（Unix 时间戳） */
    uint32_t ttl_seconds;   /**< 有效期（秒） */
    uint32_t expires_at;    /**< 过期时间（Unix 时间戳），0 表示永不过期 */
    int is_expired;         /**< 是否已过期 */
} dx_ttl_info_t;

/**
 * 校验和信息结构体
 */
typedef struct {
    uint16_t stored;        /**< 存储的校验和 */
    uint16_t computed;      /**< 计算的校验和 */
    int match;              /**< 是否匹配 */
} dx_checksum_info_t;

/**
 * DX 编码信息结构体
 */
typedef struct {
    const char *name;               /**< 名称 */
    const char *version;            /**< 版本 */
    const char *author;             /**< 作者 */
    const char *charset;            /**< 字符集 */
    const char *prefix;             /**< 前缀 */
    uint8_t magic;                  /**< 魔数 */
    char padding;                   /**< 填充字符 */
    const char *checksum;           /**< 校验和算法 */
    const char *compression;        /**< 压缩算法 */
    int compression_threshold;      /**< 压缩阈值 */
} dx_info_t;

/* ============================================================================
 * 默认选项
 * ============================================================================ */

/** 默认编码选项 */
#define DX_DEFAULT_ENCODE_OPTIONS { .compress = 1 }

/** 默认解码选项 */
#define DX_DEFAULT_DECODE_OPTIONS { .check_ttl = 1 }

/* ============================================================================
 * 辅助函数
 * ============================================================================ */

/**
 * 计算 CRC16-CCITT 校验和
 *
 * @param data 输入数据
 * @param len 数据长度
 * @return CRC16 校验和
 */
uint16_t dx_crc16(const uint8_t *data, size_t len);

/**
 * 计算编码后的长度
 *
 * @param input_len 输入数据长度
 * @return 编码后的长度（包括前缀，不包括空终止符）
 */
size_t dx_encode_length(size_t input_len);

/**
 * 计算解码后的最大长度
 *
 * @param encoded_len 编码字符串长度（不包括前缀）
 * @return 解码后的最大长度
 */
size_t dx_decode_length(size_t encoded_len);

/* ============================================================================
 * 基本编解码函数
 * ============================================================================ */

/**
 * 将数据编码为 DX 格式（带 CRC16 校验和，智能压缩）
 *
 * @param input 输入数据
 * @param input_len 输入数据长度
 * @param output 输出缓冲区
 * @param output_size 输出缓冲区大小
 * @return 成功返回 DX_OK，失败返回负数错误码
 */
int dx_encode(const uint8_t *input, size_t input_len,
              char *output, size_t output_size);

/**
 * 使用选项编码
 *
 * @param input 输入数据
 * @param input_len 输入数据长度
 * @param output 输出缓冲区
 * @param output_size 输出缓冲区大小
 * @param options 编码选项
 * @return 成功返回 DX_OK，失败返回负数错误码
 */
int dx_encode_with_options(const uint8_t *input, size_t input_len,
                           char *output, size_t output_size,
                           const dx_encode_options_t *options);

/**
 * 将字符串编码为 DX 格式
 *
 * @param input 输入字符串（以空字符结尾）
 * @param output 输出缓冲区
 * @param output_size 输出缓冲区大小
 * @return 成功返回 DX_OK，失败返回负数错误码
 */
int dx_encode_string(const char *input, char *output, size_t output_size);

/**
 * 将 DX 编码的字符串解码
 *
 * @param encoded 编码字符串
 * @param output 输出缓冲区
 * @param output_size 输出缓冲区大小
 * @param output_len 输出解码后的实际长度
 * @return 成功返回 DX_OK，失败返回负数错误码
 */
int dx_decode(const char *encoded, uint8_t *output, size_t output_size,
              size_t *output_len);

/**
 * 使用选项解码
 *
 * @param encoded 编码字符串
 * @param output 输出缓冲区
 * @param output_size 输出缓冲区大小
 * @param output_len 输出解码后的实际长度
 * @param options 解码选项
 * @return 成功返回 DX_OK，失败返回负数错误码
 */
int dx_decode_with_options(const char *encoded, uint8_t *output,
                           size_t output_size, size_t *output_len,
                           const dx_decode_options_t *options);

/**
 * 将 DX 编码的字符串解码为字符串
 *
 * @param encoded 编码字符串
 * @param output 输出缓冲区
 * @param output_size 输出缓冲区大小
 * @return 成功返回 DX_OK，失败返回负数错误码
 */
int dx_decode_string(const char *encoded, char *output, size_t output_size);

/* ============================================================================
 * TTL 相关函数
 * ============================================================================ */

/**
 * 使用 TTL 编码数据
 *
 * @param input 输入数据
 * @param input_len 输入数据长度
 * @param ttl_seconds 有效期（秒），0 表示永不过期
 * @param output 输出缓冲区
 * @param output_size 输出缓冲区大小
 * @return 成功返回 DX_OK，失败返回负数错误码
 */
int dx_encode_with_ttl(const uint8_t *input, size_t input_len,
                       uint32_t ttl_seconds,
                       char *output, size_t output_size);

/**
 * 使用 TTL 和选项编码数据
 *
 * @param input 输入数据
 * @param input_len 输入数据长度
 * @param ttl_seconds 有效期（秒），0 表示永不过期
 * @param output 输出缓冲区
 * @param output_size 输出缓冲区大小
 * @param options 编码选项
 * @return 成功返回 DX_OK，失败返回负数错误码
 */
int dx_encode_with_ttl_and_options(const uint8_t *input, size_t input_len,
                                   uint32_t ttl_seconds,
                                   char *output, size_t output_size,
                                   const dx_encode_options_t *options);

/**
 * 使用 TTL 编码字符串
 *
 * @param input 输入字符串
 * @param ttl_seconds 有效期（秒）
 * @param output 输出缓冲区
 * @param output_size 输出缓冲区大小
 * @return 成功返回 DX_OK，失败返回负数错误码
 */
int dx_encode_string_with_ttl(const char *input, uint32_t ttl_seconds,
                              char *output, size_t output_size);

/**
 * 检查编码是否包含 TTL
 *
 * @param encoded 编码字符串
 * @param has_ttl 输出是否包含 TTL
 * @return 成功返回 DX_OK，失败返回负数错误码
 */
int dx_has_ttl(const char *encoded, int *has_ttl);

/**
 * 获取 TTL 信息
 *
 * @param encoded 编码字符串
 * @param info 输出 TTL 信息
 * @return 成功返回 DX_OK（如果没有 TTL，info 会被设为全 0），失败返回负数错误码
 */
int dx_get_ttl_info(const char *encoded, dx_ttl_info_t *info);

/**
 * 检查编码是否已过期
 *
 * @param encoded 编码字符串
 * @param is_expired 输出是否过期
 * @return 成功返回 DX_OK，失败返回负数错误码
 */
int dx_is_expired(const char *encoded, int *is_expired);

/* ============================================================================
 * 校验和相关函数
 * ============================================================================ */

/**
 * 验证编码的完整性
 *
 * @param encoded 编码字符串
 * @param is_valid 输出是否有效
 * @return 成功返回 DX_OK，失败返回负数错误码
 */
int dx_verify(const char *encoded, int *is_valid);

/**
 * 获取校验和信息
 *
 * @param encoded 编码字符串
 * @param info 输出校验和信息
 * @return 成功返回 DX_OK，失败返回负数错误码
 */
int dx_get_checksum(const char *encoded, dx_checksum_info_t *info);

/* ============================================================================
 * 其他函数
 * ============================================================================ */

/**
 * 检查字符串是否为有效的 DX 编码
 *
 * @param str 要检查的字符串
 * @return 有效返回 1，无效返回 0
 */
int dx_is_encoded(const char *str);

/**
 * 检查编码是否使用了压缩
 *
 * @param encoded 编码字符串
 * @param is_compressed 输出是否压缩
 * @return 成功返回 DX_OK，失败返回负数错误码
 */
int dx_is_compressed(const char *encoded, int *is_compressed);

/**
 * 获取 DX 编码信息
 *
 * @return 指向静态 dx_info_t 结构体的指针
 */
dx_info_t dx_get_info(void);

/**
 * 获取错误信息
 *
 * @param error_code 错误码
 * @return 错误描述字符串
 */
const char *dx_error_string(int error_code);

#ifdef __cplusplus
}
#endif

#endif /* DXCODE_H */
