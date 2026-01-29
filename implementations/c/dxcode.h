/**
 * DX Encoding - 带有 `dx` 前缀的自定义编码算法
 *
 * C 语言实现 - 头文件
 *
 * 作者: Dogxi
 * 版本: 1.0.0
 * 许可证: MIT
 */

#ifndef DXCODE_H
#define DXCODE_H

#include <stddef.h>
#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

/* ============================================================================
 * 常量定义
 * ============================================================================ */

/** DX 字符集 - 以 DXdx 开头作为签名 */
#define DX_CHARSET "DXdx0OGgIi1LlAaBbCcEeFfHhJjKkMmNnPpQqRrSsTtUuVvWwYyZz23456789+/"

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

/* ============================================================================
 * 数据结构
 * ============================================================================ */

/**
 * DX 编码信息结构体
 */
typedef struct {
    const char *name;       /**< 名称 */
    const char *version;    /**< 版本 */
    const char *author;     /**< 作者 */
    const char *charset;    /**< 字符集 */
    const char *prefix;     /**< 前缀 */
    uint8_t magic;          /**< 魔数 */
    char padding;           /**< 填充字符 */
} dx_info_t;

/* ============================================================================
 * 函数声明
 * ============================================================================ */

/**
 * 计算编码后的长度（不包括空终止符）
 *
 * @param input_len 输入数据长度
 * @return 编码后的长度
 */
size_t dx_encoded_length(size_t input_len);

/**
 * 计算解码后的最大长度
 *
 * @param encoded 编码字符串
 * @param encoded_len 编码字符串长度
 * @return 解码后的最大长度，错误时返回 0
 */
size_t dx_decoded_length(const char *encoded, size_t encoded_len);

/**
 * 将数据编码为 DX 格式
 *
 * @param input 输入数据
 * @param input_len 输入数据长度
 * @param output 输出缓冲区（必须预先分配）
 * @param output_size 输出缓冲区大小
 * @return 成功时返回编码后的长度，失败时返回负数错误码
 *
 * @example
 *   char output[100];
 *   int len = dx_encode("Hello", 5, output, sizeof(output));
 *   if (len > 0) {
 *       printf("编码结果: %s\n", output);
 *   }
 */
int dx_encode(const uint8_t *input, size_t input_len,
              char *output, size_t output_size);

/**
 * 将字符串编码为 DX 格式
 *
 * @param input 输入字符串（以空字符结尾）
 * @param output 输出缓冲区
 * @param output_size 输出缓冲区大小
 * @return 成功时返回编码后的长度，失败时返回负数错误码
 */
int dx_encode_string(const char *input, char *output, size_t output_size);

/**
 * 将 DX 编码的字符串解码
 *
 * @param encoded 编码字符串
 * @param encoded_len 编码字符串长度
 * @param output 输出缓冲区（必须预先分配）
 * @param output_size 输出缓冲区大小
 * @return 成功时返回解码后的长度，失败时返回负数错误码
 *
 * @example
 *   uint8_t output[100];
 *   int len = dx_decode("dxXXXX...", 10, output, sizeof(output));
 *   if (len > 0) {
 *       output[len] = '\0';
 *       printf("解码结果: %s\n", output);
 *   }
 */
int dx_decode(const char *encoded, size_t encoded_len,
              uint8_t *output, size_t output_size);

/**
 * 将 DX 编码的字符串解码为字符串
 *
 * @param encoded 编码字符串（以空字符结尾）
 * @param output 输出缓冲区
 * @param output_size 输出缓冲区大小
 * @return 成功时返回解码后的长度，失败时返回负数错误码
 */
int dx_decode_string(const char *encoded, char *output, size_t output_size);

/**
 * 检查字符串是否为有效的 DX 编码
 *
 * @param str 要检查的字符串
 * @param len 字符串长度
 * @return 有效返回 1，无效返回 0
 */
int dx_is_encoded(const char *str, size_t len);

/**
 * 获取 DX 编码信息
 *
 * @return 指向静态 dx_info_t 结构体的指针
 */
const dx_info_t *dx_get_info(void);

/**
 * 获取错误信息
 *
 * @param error_code 错误码
 * @return 错误描述字符串
 */
const char *dx_strerror(int error_code);

/* ============================================================================
 * 动态内存分配版本（可选）
 * ============================================================================ */

#ifdef DX_USE_MALLOC

/**
 * 编码数据并返回新分配的字符串
 *
 * @param input 输入数据
 * @param input_len 输入数据长度
 * @return 新分配的编码字符串，失败返回 NULL。调用者负责释放。
 */
char *dx_encode_alloc(const uint8_t *input, size_t input_len);

/**
 * 解码数据并返回新分配的缓冲区
 *
 * @param encoded 编码字符串
 * @param encoded_len 编码字符串长度
 * @param output_len 输出解码后的长度
 * @return 新分配的解码数据，失败返回 NULL。调用者负责释放。
 */
uint8_t *dx_decode_alloc(const char *encoded, size_t encoded_len,
                         size_t *output_len);

#endif /* DX_USE_MALLOC */

#ifdef __cplusplus
}
#endif

#endif /* DXCODE_H */
