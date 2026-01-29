/**
 * DX Encoding - 由 Dogxi 创造的独特编码算法
 *
 * C 实现
 *
 * 作者: Dogxi
 * 版本: 1.0.0
 * 许可证: MIT
 */

#include "dxcode.h"
#include <stdlib.h>
#include <string.h>

/* DX 字符集 - 64 个唯一字符 */
static const char DX_CHARSET[] = "DXdx0123456789ABCEFGHIJKLMNOPQRSTUVWYZabcefghijklmnopqrstuvwyz-_";

/* 魔数 - 'D' 的 ASCII 值 */
#define DX_MAGIC 0x44

/* 前缀 */
static const char DX_PREFIX[] = "dx";
#define DX_PREFIX_LEN 2

/* 填充字符 */
#define DX_PADDING '='

/* 反向查找表 */
static int dx_decode_map[256];
static int dx_map_initialized = 0;

/* 初始化反向查找表 */
static void dx_init_decode_map(void) {
    if (dx_map_initialized) return;

    /* 初始化所有值为 -1 */
    for (int i = 0; i < 256; i++) {
        dx_decode_map[i] = -1;
    }

    /* 填充有效字符的索引 */
    for (int i = 0; i < 64; i++) {
        dx_decode_map[(unsigned char)DX_CHARSET[i]] = i;
    }

    dx_map_initialized = 1;
}

/* 计算编码后的长度 */
size_t dx_encode_length(size_t input_len) {
    if (input_len == 0) return DX_PREFIX_LEN + 1; /* 前缀 + null 终止符 */
    return DX_PREFIX_LEN + ((input_len + 2) / 3) * 4 + 1;
}

/* 计算解码后的最大长度 */
size_t dx_decode_length(size_t encoded_len) {
    if (encoded_len <= DX_PREFIX_LEN) return 1;
    size_t data_len = encoded_len - DX_PREFIX_LEN;
    return (data_len / 4) * 3 + 1;
}

/* 编码函数 */
int dx_encode(const uint8_t *input, size_t input_len, char *output, size_t output_size) {
    dx_init_decode_map();

    /* 计算需要的输出大小 */
    size_t required_size = dx_encode_length(input_len);
    if (output_size < required_size) {
        return DX_ERROR_BUFFER_TOO_SMALL;
    }

    /* 添加前缀 */
    output[0] = 'd';
    output[1] = 'x';

    if (input_len == 0) {
        output[2] = '\0';
        return DX_OK;
    }

    size_t out_idx = DX_PREFIX_LEN;

    /* 每 3 字节处理一组 */
    for (size_t i = 0; i < input_len; i += 3) {
        uint8_t b0 = input[i];
        uint8_t b1 = (i + 1 < input_len) ? input[i + 1] : 0;
        uint8_t b2 = (i + 2 < input_len) ? input[i + 2] : 0;

        /* 将 3 字节分成 4 个 6 位组 */
        uint8_t v0 = (b0 >> 2) & 0x3F;
        uint8_t v1 = ((b0 & 0x03) << 4 | (b1 >> 4)) & 0x3F;
        uint8_t v2 = ((b1 & 0x0F) << 2 | (b2 >> 6)) & 0x3F;
        uint8_t v3 = b2 & 0x3F;

        /* XOR 变换并映射到字符 */
        output[out_idx++] = DX_CHARSET[(v0 ^ DX_MAGIC) & 0x3F];
        output[out_idx++] = DX_CHARSET[(v1 ^ DX_MAGIC) & 0x3F];

        if (i + 1 < input_len) {
            output[out_idx++] = DX_CHARSET[(v2 ^ DX_MAGIC) & 0x3F];
        } else {
            output[out_idx++] = DX_PADDING;
        }

        if (i + 2 < input_len) {
            output[out_idx++] = DX_CHARSET[(v3 ^ DX_MAGIC) & 0x3F];
        } else {
            output[out_idx++] = DX_PADDING;
        }
    }

    output[out_idx] = '\0';
    return DX_OK;
}

/* 编码字符串 */
int dx_encode_string(const char *input, char *output, size_t output_size) {
    return dx_encode((const uint8_t *)input, strlen(input), output, output_size);
}

/* 解码函数 */
int dx_decode(const char *encoded, uint8_t *output, size_t output_size, size_t *output_len) {
    dx_init_decode_map();

    if (encoded == NULL || output == NULL || output_len == NULL) {
        return DX_ERROR_INVALID_INPUT;
    }

    size_t encoded_len = strlen(encoded);

    /* 验证前缀 */
    if (encoded_len < DX_PREFIX_LEN ||
        encoded[0] != 'd' || encoded[1] != 'x') {
        return DX_ERROR_INVALID_PREFIX;
    }

    /* 获取数据部分 */
    const char *data = encoded + DX_PREFIX_LEN;
    size_t data_len = encoded_len - DX_PREFIX_LEN;

    if (data_len == 0) {
        *output_len = 0;
        return DX_OK;
    }

    /* 验证长度 */
    if (data_len % 4 != 0) {
        return DX_ERROR_INVALID_LENGTH;
    }

    /* 计算填充数量 */
    int padding_count = 0;
    if (data_len >= 2 && data[data_len - 1] == DX_PADDING && data[data_len - 2] == DX_PADDING) {
        padding_count = 2;
    } else if (data_len >= 1 && data[data_len - 1] == DX_PADDING) {
        padding_count = 1;
    }

    /* 计算输出长度 */
    size_t result_len = (data_len / 4) * 3 - padding_count;

    if (output_size < result_len) {
        return DX_ERROR_BUFFER_TOO_SMALL;
    }

    size_t out_idx = 0;

    /* 每 4 字符处理一组 */
    for (size_t i = 0; i < data_len; i += 4) {
        char c0 = data[i];
        char c1 = data[i + 1];
        char c2 = data[i + 2];
        char c3 = data[i + 3];

        /* 字符转索引 */
        int i0 = dx_decode_map[(unsigned char)c0];
        int i1 = dx_decode_map[(unsigned char)c1];
        int i2 = (c2 == DX_PADDING) ? 0 : dx_decode_map[(unsigned char)c2];
        int i3 = (c3 == DX_PADDING) ? 0 : dx_decode_map[(unsigned char)c3];

        /* 验证字符 */
        if (i0 < 0 || i1 < 0 ||
            (c2 != DX_PADDING && i2 < 0) ||
            (c3 != DX_PADDING && i3 < 0)) {
            return DX_ERROR_INVALID_CHARACTER;
        }

        /* XOR 逆变换 */
        int v0 = (i0 ^ DX_MAGIC) & 0x3F;
        int v1 = (i1 ^ DX_MAGIC) & 0x3F;
        int v2 = (i2 ^ DX_MAGIC) & 0x3F;
        int v3 = (i3 ^ DX_MAGIC) & 0x3F;

        /* 重建字节 */
        uint8_t b0 = (v0 << 2) | (v1 >> 4);
        uint8_t b1 = ((v1 & 0x0F) << 4) | (v2 >> 2);
        uint8_t b2 = ((v2 & 0x03) << 6) | v3;

        if (out_idx < result_len) output[out_idx++] = b0;
        if (out_idx < result_len) output[out_idx++] = b1;
        if (out_idx < result_len) output[out_idx++] = b2;
    }

    *output_len = result_len;
    return DX_OK;
}

/* 解码为字符串 */
int dx_decode_string(const char *encoded, char *output, size_t output_size) {
    size_t decoded_len;
    int result = dx_decode(encoded, (uint8_t *)output, output_size - 1, &decoded_len);
    if (result == DX_OK) {
        output[decoded_len] = '\0';
    }
    return result;
}

/* 检查是否为有效的 DX 编码 */
int dx_is_encoded(const char *str) {
    dx_init_decode_map();

    if (str == NULL) return 0;

    size_t len = strlen(str);
    if (len < DX_PREFIX_LEN) return 0;
    if (str[0] != 'd' || str[1] != 'x') return 0;

    size_t data_len = len - DX_PREFIX_LEN;
    if (data_len == 0 || data_len % 4 != 0) return 0;

    const char *data = str + DX_PREFIX_LEN;

    /* 检查字符 */
    for (size_t i = 0; i < data_len; i++) {
        char c = data[i];
        if (c == DX_PADDING) {
            /* 填充只能在末尾 */
            if (i < data_len - 2) return 0;
        } else if (dx_decode_map[(unsigned char)c] < 0) {
            return 0;
        }
    }

    return 1;
}

/* 获取编码信息 */
dx_info_t dx_get_info(void) {
    dx_info_t info;
    info.name = "DX Encoding";
    info.version = "1.0.0";
    info.author = "Dogxi";
    info.charset = DX_CHARSET;
    info.prefix = DX_PREFIX;
    info.magic = DX_MAGIC;
    info.padding = DX_PADDING;
    return info;
}

/* 获取错误信息 */
const char *dx_error_string(int error_code) {
    switch (error_code) {
        case DX_OK:
            return "成功";
        case DX_ERROR_INVALID_INPUT:
            return "无效的输入";
        case DX_ERROR_INVALID_PREFIX:
            return "无效的 DX 编码：缺少 dx 前缀";
        case DX_ERROR_INVALID_LENGTH:
            return "无效的 DX 编码：长度不正确";
        case DX_ERROR_INVALID_CHARACTER:
            return "无效的 DX 编码：包含非法字符";
        case DX_ERROR_BUFFER_TOO_SMALL:
            return "输出缓冲区太小";
        default:
            return "未知错误";
    }
}
