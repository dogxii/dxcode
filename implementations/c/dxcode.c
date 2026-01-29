/**
 * DX Encoding - 带有 `dx` 前缀的自定义编码算法
 *
 * C 实现
 *
 * 作者: Dogxi
 * 版本: 2.3.0
 * 许可证: MIT
 *
 * v2.0 新增: CRC16-CCITT 校验和支持
 * v2.1 新增: 智能 DEFLATE 压缩支持（需要 zlib）
 * v2.3 新增: TTL (Time-To-Live) 过期时间支持
 *
 * 注意: 压缩功能需要 zlib 库，编译时定义 DX_USE_ZLIB 启用
 */

#include "dxcode.h"
#include <stdlib.h>
#include <string.h>

#ifdef DX_USE_ZLIB
#include <zlib.h>
#endif

/* DX 字符集 - 64 个唯一字符 */
static const char DX_CHARSET_STR[] = DX_CHARSET;

/* CRC16-CCITT 查找表 */
static uint16_t crc16_table[256];
static int crc16_table_initialized = 0;

/* 反向查找表 */
static int dx_decode_map[256];
static int dx_map_initialized = 0;

/* 初始化 CRC16 查找表 */
static void init_crc16_table(void) {
    if (crc16_table_initialized) return;

    const uint16_t polynomial = 0x1021;
    for (int i = 0; i < 256; i++) {
        uint16_t crc = (uint16_t)(i << 8);
        for (int j = 0; j < 8; j++) {
            if (crc & 0x8000) {
                crc = (crc << 1) ^ polynomial;
            } else {
                crc <<= 1;
            }
        }
        crc16_table[i] = crc;
    }
    crc16_table_initialized = 1;
}

/* 初始化反向查找表 */
static void init_decode_map(void) {
    if (dx_map_initialized) return;

    /* 初始化所有值为 -1 */
    for (int i = 0; i < 256; i++) {
        dx_decode_map[i] = -1;
    }

    /* 填充有效字符的索引 */
    for (int i = 0; i < 64; i++) {
        dx_decode_map[(unsigned char)DX_CHARSET_STR[i]] = i;
    }

    dx_map_initialized = 1;
}

/* 初始化所有表 */
static void dx_init(void) {
    init_crc16_table();
    init_decode_map();
}

/* 计算 CRC16-CCITT 校验和 */
uint16_t dx_crc16(const uint8_t *data, size_t len) {
    init_crc16_table();

    uint16_t crc = 0xFFFF;
    for (size_t i = 0; i < len; i++) {
        uint8_t index = (uint8_t)((crc >> 8) ^ data[i]);
        crc = (crc << 8) ^ crc16_table[index];
    }
    return crc;
}

/* 计算编码后的长度 */
size_t dx_encode_length(size_t input_len) {
    if (input_len == 0) {
        /* 空数据: 前缀(2) + header编码(4) + null */
        return DX_PREFIX_LEN + 4 + 1;
    }
    /* 前缀(2) + 编码后的数据 + null */
    size_t data_len = DX_HEADER_SIZE + input_len;
    return DX_PREFIX_LEN + ((data_len + 2) / 3) * 4 + 1;
}

/* 计算解码后的最大长度 */
size_t dx_decode_length(size_t encoded_len) {
    if (encoded_len <= DX_PREFIX_LEN) return 0;
    size_t data_len = encoded_len - DX_PREFIX_LEN;
    return (data_len / 4) * 3;
}

/* 原始编码（不含前缀） */
static size_t encode_raw(const uint8_t *input, size_t input_len,
                         char *output, size_t output_size) {
    if (input_len == 0) {
        if (output_size > 0) output[0] = '\0';
        return 0;
    }

    size_t required = ((input_len + 2) / 3) * 4 + 1;
    if (output_size < required) return 0;

    size_t out_idx = 0;

    for (size_t i = 0; i < input_len; i += 3) {
        uint8_t b0 = input[i];
        uint8_t b1 = (i + 1 < input_len) ? input[i + 1] : 0;
        uint8_t b2 = (i + 2 < input_len) ? input[i + 2] : 0;

        uint8_t v0 = (b0 >> 2) & 0x3F;
        uint8_t v1 = ((b0 & 0x03) << 4 | (b1 >> 4)) & 0x3F;
        uint8_t v2 = ((b1 & 0x0F) << 2 | (b2 >> 6)) & 0x3F;
        uint8_t v3 = b2 & 0x3F;

        output[out_idx++] = DX_CHARSET_STR[(v0 ^ DX_MAGIC) & 0x3F];
        output[out_idx++] = DX_CHARSET_STR[(v1 ^ DX_MAGIC) & 0x3F];

        if (i + 1 < input_len) {
            output[out_idx++] = DX_CHARSET_STR[(v2 ^ DX_MAGIC) & 0x3F];
        } else {
            output[out_idx++] = DX_PADDING;
        }

        if (i + 2 < input_len) {
            output[out_idx++] = DX_CHARSET_STR[(v3 ^ DX_MAGIC) & 0x3F];
        } else {
            output[out_idx++] = DX_PADDING;
        }
    }

    output[out_idx] = '\0';
    return out_idx;
}

/* 原始解码（不含前缀） */
static int decode_raw(const char *data, size_t data_len,
                      uint8_t *output, size_t output_size,
                      size_t *output_len) {
    dx_init();

    if (data_len == 0) {
        *output_len = 0;
        return DX_OK;
    }

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

    size_t result_len = (data_len / 4) * 3 - padding_count;

    if (output_size < result_len) {
        return DX_ERROR_BUFFER_TOO_SMALL;
    }

    size_t out_idx = 0;

    for (size_t i = 0; i < data_len; i += 4) {
        char c0 = data[i];
        char c1 = data[i + 1];
        char c2 = data[i + 2];
        char c3 = data[i + 3];

        int i0 = dx_decode_map[(unsigned char)c0];
        int i1 = dx_decode_map[(unsigned char)c1];
        int i2 = (c2 == DX_PADDING) ? 0 : dx_decode_map[(unsigned char)c2];
        int i3 = (c3 == DX_PADDING) ? 0 : dx_decode_map[(unsigned char)c3];

        if (i0 < 0 || i1 < 0 ||
            (c2 != DX_PADDING && i2 < 0) ||
            (c3 != DX_PADDING && i3 < 0)) {
            return DX_ERROR_INVALID_CHARACTER;
        }

        int v0 = (i0 ^ DX_MAGIC) & 0x3F;
        int v1 = (i1 ^ DX_MAGIC) & 0x3F;
        int v2 = (i2 ^ DX_MAGIC) & 0x3F;
        int v3 = (i3 ^ DX_MAGIC) & 0x3F;

        uint8_t b0 = (uint8_t)((v0 << 2) | (v1 >> 4));
        uint8_t b1 = (uint8_t)(((v1 & 0x0F) << 4) | (v2 >> 2));
        uint8_t b2 = (uint8_t)(((v2 & 0x03) << 6) | v3);

        if (out_idx < result_len) output[out_idx++] = b0;
        if (out_idx < result_len) output[out_idx++] = b1;
        if (out_idx < result_len) output[out_idx++] = b2;
    }

    *output_len = result_len;
    return DX_OK;
}

#ifdef DX_USE_ZLIB
/* DEFLATE 压缩 */
static int compress_deflate(const uint8_t *input, size_t input_len,
                            uint8_t *output, size_t output_size,
                            size_t *output_len) {
    z_stream strm;
    memset(&strm, 0, sizeof(strm));

    if (deflateInit2(&strm, Z_BEST_COMPRESSION, Z_DEFLATED, -15, 8, Z_DEFAULT_STRATEGY) != Z_OK) {
        return DX_ERROR_COMPRESSION;
    }

    strm.avail_in = (uInt)input_len;
    strm.next_in = (Bytef *)input;
    strm.avail_out = (uInt)output_size;
    strm.next_out = output;

    int ret = deflate(&strm, Z_FINISH);
    deflateEnd(&strm);

    if (ret != Z_STREAM_END) {
        return DX_ERROR_COMPRESSION;
    }

    *output_len = strm.total_out;
    return DX_OK;
}

/* DEFLATE 解压缩 */
static int decompress_deflate(const uint8_t *input, size_t input_len,
                              uint8_t *output, size_t output_size,
                              size_t *output_len) {
    z_stream strm;
    memset(&strm, 0, sizeof(strm));

    if (inflateInit2(&strm, -15) != Z_OK) {
        return DX_ERROR_COMPRESSION;
    }

    strm.avail_in = (uInt)input_len;
    strm.next_in = (Bytef *)input;
    strm.avail_out = (uInt)output_size;
    strm.next_out = output;

    int ret = inflate(&strm, Z_FINISH);
    inflateEnd(&strm);

    if (ret != Z_STREAM_END) {
        return DX_ERROR_COMPRESSION;
    }

    *output_len = strm.total_out;
    return DX_OK;
}
#endif

/* 使用选项编码 */
int dx_encode_with_options(const uint8_t *input, size_t input_len,
                           char *output, size_t output_size,
                           const dx_encode_options_t *options) {
    dx_init();

    if (output == NULL || output_size == 0) {
        return DX_ERROR_INVALID_INPUT;
    }

    /* 计算 CRC16 */
    uint16_t checksum = dx_crc16(input, input_len);

    /* 决定是否压缩 */
    uint8_t flags = 0;
    const uint8_t *payload = input;
    size_t payload_len = input_len;

#ifdef DX_USE_ZLIB
    uint8_t compressed_buf[65536];
    size_t compressed_len = 0;

    if (options && options->compress && input_len >= DX_COMPRESSION_THRESHOLD) {
        int ret = compress_deflate(input, input_len, compressed_buf,
                                   sizeof(compressed_buf), &compressed_len);
        if (ret == DX_OK && compressed_len + 2 < input_len && input_len <= 65535) {
            flags = DX_FLAG_COMPRESSED | DX_FLAG_ALGO_DEFLATE;
            payload = NULL; /* 使用下面的特殊处理 */
            payload_len = 2 + compressed_len;
        }
    }
#else
    (void)options; /* 避免未使用警告 */
#endif

    /* 计算需要的缓冲区大小 */
    size_t combined_len = DX_HEADER_SIZE + payload_len;
    size_t required_size = DX_PREFIX_LEN + ((combined_len + 2) / 3) * 4 + 1;

    if (output_size < required_size) {
        return DX_ERROR_BUFFER_TOO_SMALL;
    }

    /* 构建 combined 数据 */
    uint8_t *combined = (uint8_t *)malloc(combined_len);
    if (combined == NULL) {
        return DX_ERROR_MEMORY;
    }

    combined[0] = flags;
    combined[1] = (checksum >> 8) & 0xFF;
    combined[2] = checksum & 0xFF;

#ifdef DX_USE_ZLIB
    if (flags & DX_FLAG_COMPRESSED) {
        /* 压缩数据: [orig_size(2)] [compressed_data] */
        combined[DX_HEADER_SIZE] = (input_len >> 8) & 0xFF;
        combined[DX_HEADER_SIZE + 1] = input_len & 0xFF;
        memcpy(combined + DX_HEADER_SIZE + 2, compressed_buf, compressed_len);
    } else {
        memcpy(combined + DX_HEADER_SIZE, input, input_len);
    }
#else
    memcpy(combined + DX_HEADER_SIZE, payload, payload_len);
#endif

    /* 添加前缀 */
    output[0] = 'd';
    output[1] = 'x';

    /* 编码 */
    encode_raw(combined, combined_len, output + DX_PREFIX_LEN, output_size - DX_PREFIX_LEN);

    free(combined);
    return DX_OK;
}

/* 编码函数 */
int dx_encode(const uint8_t *input, size_t input_len,
              char *output, size_t output_size) {
    dx_encode_options_t options = DX_DEFAULT_ENCODE_OPTIONS;
    return dx_encode_with_options(input, input_len, output, output_size, &options);
}

/* 编码字符串 */
int dx_encode_string(const char *input, char *output, size_t output_size) {
    if (input == NULL) {
        return DX_ERROR_INVALID_INPUT;
    }
    return dx_encode((const uint8_t *)input, strlen(input), output, output_size);
}

/* 使用选项解码 */
int dx_decode_with_options(const char *encoded, uint8_t *output,
                           size_t output_size, size_t *output_len,
                           const dx_decode_options_t *options) {
    dx_init();

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

    /* 解码原始数据 */
    size_t max_combined_len = (data_len / 4) * 3;
    uint8_t *combined = (uint8_t *)malloc(max_combined_len);
    if (combined == NULL) {
        return DX_ERROR_MEMORY;
    }

    size_t combined_len;
    int ret = decode_raw(data, data_len, combined, max_combined_len, &combined_len);
    if (ret != DX_OK) {
        free(combined);
        return ret;
    }

    if (combined_len < DX_HEADER_SIZE) {
        free(combined);
        return DX_ERROR_INVALID_HEADER;
    }

    /* 提取头部 */
    uint8_t flags = combined[0];
    uint16_t expected_checksum = (combined[1] << 8) | combined[2];

    /* 验证 flags */
    if ((flags & ~DX_VALID_FLAGS_MASK) != 0) {
        free(combined);
        return DX_ERROR_INVALID_FLAGS;
    }

    /* 处理 TTL */
    size_t payload_start = DX_HEADER_SIZE;
    if (flags & DX_FLAG_HAS_TTL) {
        if (combined_len < DX_HEADER_SIZE + DX_TTL_HEADER_SIZE) {
            free(combined);
            return DX_ERROR_INVALID_HEADER;
        }

        uint32_t created_at = ((uint32_t)combined[DX_HEADER_SIZE] << 24) |
                              ((uint32_t)combined[DX_HEADER_SIZE + 1] << 16) |
                              ((uint32_t)combined[DX_HEADER_SIZE + 2] << 8) |
                              (uint32_t)combined[DX_HEADER_SIZE + 3];

        uint32_t ttl_seconds = ((uint32_t)combined[DX_HEADER_SIZE + 4] << 24) |
                               ((uint32_t)combined[DX_HEADER_SIZE + 5] << 16) |
                               ((uint32_t)combined[DX_HEADER_SIZE + 6] << 8) |
                               (uint32_t)combined[DX_HEADER_SIZE + 7];

        /* 检查是否过期 */
        if (options && options->check_ttl && ttl_seconds > 0) {
            uint32_t now = (uint32_t)time(NULL);
            uint32_t expires_at = created_at + ttl_seconds;
            if (now > expires_at) {
                free(combined);
                return DX_ERROR_TTL_EXPIRED;
            }
        }

        payload_start = DX_HEADER_SIZE + DX_TTL_HEADER_SIZE;
    }

    const uint8_t *payload = combined + payload_start;
    size_t payload_len = combined_len - payload_start;

    /* 解压缩或直接使用 */
    uint8_t *original_data = NULL;
    size_t original_len = 0;

    if (flags & DX_FLAG_COMPRESSED) {
        if (payload_len < 2) {
            free(combined);
            return DX_ERROR_INVALID_HEADER;
        }

        size_t orig_size = (payload[0] << 8) | payload[1];
        const uint8_t *compressed_data = payload + 2;
        size_t compressed_len = payload_len - 2;

#ifdef DX_USE_ZLIB
        original_data = (uint8_t *)malloc(orig_size);
        if (original_data == NULL) {
            free(combined);
            return DX_ERROR_MEMORY;
        }

        ret = decompress_deflate(compressed_data, compressed_len,
                                 original_data, orig_size, &original_len);
        if (ret != DX_OK) {
            free(original_data);
            free(combined);
            return ret;
        }
#else
        /* 没有 zlib，无法解压 */
        (void)orig_size;
        (void)compressed_data;
        (void)compressed_len;
        free(combined);
        return DX_ERROR_COMPRESSION;
#endif
    } else {
        original_data = (uint8_t *)malloc(payload_len);
        if (original_data == NULL) {
            free(combined);
            return DX_ERROR_MEMORY;
        }
        memcpy(original_data, payload, payload_len);
        original_len = payload_len;
    }

    free(combined);

    /* 验证校验和 */
    uint16_t actual_checksum = dx_crc16(original_data, original_len);
    if (expected_checksum != actual_checksum) {
        free(original_data);
        return DX_ERROR_CHECKSUM_MISMATCH;
    }

    /* 复制结果 */
    if (output_size < original_len) {
        free(original_data);
        return DX_ERROR_BUFFER_TOO_SMALL;
    }

    memcpy(output, original_data, original_len);
    *output_len = original_len;

    free(original_data);
    return DX_OK;
}

/* 解码函数 */
int dx_decode(const char *encoded, uint8_t *output, size_t output_size,
              size_t *output_len) {
    dx_decode_options_t options = DX_DEFAULT_DECODE_OPTIONS;
    return dx_decode_with_options(encoded, output, output_size, output_len, &options);
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

/* 使用 TTL 和选项编码 */
int dx_encode_with_ttl_and_options(const uint8_t *input, size_t input_len,
                                   uint32_t ttl_seconds,
                                   char *output, size_t output_size,
                                   const dx_encode_options_t *options) {
    dx_init();

    if (output == NULL || output_size == 0) {
        return DX_ERROR_INVALID_INPUT;
    }

    /* 获取当前时间戳 */
    uint32_t created_at = (uint32_t)time(NULL);

    /* 计算 CRC16 */
    uint16_t checksum = dx_crc16(input, input_len);

    /* 决定是否压缩 */
    uint8_t flags = DX_FLAG_HAS_TTL;
    const uint8_t *payload = input;
    size_t payload_len = input_len;

#ifdef DX_USE_ZLIB
    uint8_t compressed_buf[65536];
    size_t compressed_len = 0;

    if (options && options->compress && input_len >= DX_COMPRESSION_THRESHOLD) {
        int ret = compress_deflate(input, input_len, compressed_buf,
                                   sizeof(compressed_buf), &compressed_len);
        if (ret == DX_OK && compressed_len + 2 < input_len && input_len <= 65535) {
            flags |= DX_FLAG_COMPRESSED | DX_FLAG_ALGO_DEFLATE;
            payload = NULL;
            payload_len = 2 + compressed_len;
        }
    }
#else
    (void)options;
#endif

    /* 计算需要的缓冲区大小 */
    size_t combined_len = DX_HEADER_SIZE + DX_TTL_HEADER_SIZE + payload_len;
    size_t required_size = DX_PREFIX_LEN + ((combined_len + 2) / 3) * 4 + 1;

    if (output_size < required_size) {
        return DX_ERROR_BUFFER_TOO_SMALL;
    }

    /* 构建 combined 数据 */
    uint8_t *combined = (uint8_t *)malloc(combined_len);
    if (combined == NULL) {
        return DX_ERROR_MEMORY;
    }

    combined[0] = flags;
    combined[1] = (checksum >> 8) & 0xFF;
    combined[2] = checksum & 0xFF;

    /* TTL 头部 */
    combined[DX_HEADER_SIZE] = (created_at >> 24) & 0xFF;
    combined[DX_HEADER_SIZE + 1] = (created_at >> 16) & 0xFF;
    combined[DX_HEADER_SIZE + 2] = (created_at >> 8) & 0xFF;
    combined[DX_HEADER_SIZE + 3] = created_at & 0xFF;
    combined[DX_HEADER_SIZE + 4] = (ttl_seconds >> 24) & 0xFF;
    combined[DX_HEADER_SIZE + 5] = (ttl_seconds >> 16) & 0xFF;
    combined[DX_HEADER_SIZE + 6] = (ttl_seconds >> 8) & 0xFF;
    combined[DX_HEADER_SIZE + 7] = ttl_seconds & 0xFF;

#ifdef DX_USE_ZLIB
    if (flags & DX_FLAG_COMPRESSED) {
        combined[DX_HEADER_SIZE + DX_TTL_HEADER_SIZE] = (input_len >> 8) & 0xFF;
        combined[DX_HEADER_SIZE + DX_TTL_HEADER_SIZE + 1] = input_len & 0xFF;
        memcpy(combined + DX_HEADER_SIZE + DX_TTL_HEADER_SIZE + 2,
               compressed_buf, compressed_len);
    } else {
        memcpy(combined + DX_HEADER_SIZE + DX_TTL_HEADER_SIZE, input, input_len);
    }
#else
    memcpy(combined + DX_HEADER_SIZE + DX_TTL_HEADER_SIZE, payload, payload_len);
#endif

    /* 添加前缀 */
    output[0] = 'd';
    output[1] = 'x';

    /* 编码 */
    encode_raw(combined, combined_len, output + DX_PREFIX_LEN, output_size - DX_PREFIX_LEN);

    free(combined);
    return DX_OK;
}

/* 使用 TTL 编码 */
int dx_encode_with_ttl(const uint8_t *input, size_t input_len,
                       uint32_t ttl_seconds,
                       char *output, size_t output_size) {
    dx_encode_options_t options = DX_DEFAULT_ENCODE_OPTIONS;
    return dx_encode_with_ttl_and_options(input, input_len, ttl_seconds,
                                          output, output_size, &options);
}

/* 使用 TTL 编码字符串 */
int dx_encode_string_with_ttl(const char *input, uint32_t ttl_seconds,
                              char *output, size_t output_size) {
    if (input == NULL) {
        return DX_ERROR_INVALID_INPUT;
    }
    return dx_encode_with_ttl((const uint8_t *)input, strlen(input),
                              ttl_seconds, output, output_size);
}

/* 检查是否包含 TTL */
int dx_has_ttl(const char *encoded, int *has_ttl) {
    dx_init();

    if (encoded == NULL || has_ttl == NULL) {
        return DX_ERROR_INVALID_INPUT;
    }

    size_t encoded_len = strlen(encoded);
    if (encoded_len < DX_PREFIX_LEN || encoded[0] != 'd' || encoded[1] != 'x') {
        return DX_ERROR_INVALID_PREFIX;
    }

    const char *data = encoded + DX_PREFIX_LEN;
    size_t data_len = encoded_len - DX_PREFIX_LEN;

    if (data_len < 4) {
        return DX_ERROR_INVALID_HEADER;
    }

    /* 解码前 4 个字符获取 flags */
    uint8_t buf[3];
    size_t buf_len;
    int ret = decode_raw(data, 4, buf, sizeof(buf), &buf_len);
    if (ret != DX_OK || buf_len < 1) {
        return ret != DX_OK ? ret : DX_ERROR_INVALID_HEADER;
    }

    *has_ttl = (buf[0] & DX_FLAG_HAS_TTL) != 0;
    return DX_OK;
}

/* 获取 TTL 信息 */
int dx_get_ttl_info(const char *encoded, dx_ttl_info_t *info) {
    dx_init();

    if (encoded == NULL || info == NULL) {
        return DX_ERROR_INVALID_INPUT;
    }

    memset(info, 0, sizeof(dx_ttl_info_t));

    size_t encoded_len = strlen(encoded);
    if (encoded_len < DX_PREFIX_LEN || encoded[0] != 'd' || encoded[1] != 'x') {
        return DX_ERROR_INVALID_PREFIX;
    }

    const char *data = encoded + DX_PREFIX_LEN;
    size_t data_len = encoded_len - DX_PREFIX_LEN;

    /* 解码整个 header + TTL header */
    size_t max_len = (data_len / 4) * 3;
    uint8_t *combined = (uint8_t *)malloc(max_len);
    if (combined == NULL) {
        return DX_ERROR_MEMORY;
    }

    size_t combined_len;
    int ret = decode_raw(data, data_len, combined, max_len, &combined_len);
    if (ret != DX_OK) {
        free(combined);
        return ret;
    }

    if (combined_len < DX_HEADER_SIZE) {
        free(combined);
        return DX_ERROR_INVALID_HEADER;
    }

    uint8_t flags = combined[0];

    if ((flags & DX_FLAG_HAS_TTL) == 0) {
        /* 没有 TTL */
        free(combined);
        return DX_OK;
    }

    if (combined_len < DX_HEADER_SIZE + DX_TTL_HEADER_SIZE) {
        free(combined);
        return DX_ERROR_INVALID_HEADER;
    }

    info->created_at = ((uint32_t)combined[DX_HEADER_SIZE] << 24) |
                       ((uint32_t)combined[DX_HEADER_SIZE + 1] << 16) |
                       ((uint32_t)combined[DX_HEADER_SIZE + 2] << 8) |
                       (uint32_t)combined[DX_HEADER_SIZE + 3];

    info->ttl_seconds = ((uint32_t)combined[DX_HEADER_SIZE + 4] << 24) |
                        ((uint32_t)combined[DX_HEADER_SIZE + 5] << 16) |
                        ((uint32_t)combined[DX_HEADER_SIZE + 6] << 8) |
                        (uint32_t)combined[DX_HEADER_SIZE + 7];

    free(combined);

    uint32_t now = (uint32_t)time(NULL);

    if (info->ttl_seconds == 0) {
        info->expires_at = 0;
        info->is_expired = 0;
    } else {
        info->expires_at = info->created_at + info->ttl_seconds;
        info->is_expired = (now > info->expires_at) ? 1 : 0;
    }

    return DX_OK;
}

/* 检查是否过期 */
int dx_is_expired(const char *encoded, int *is_expired) {
    if (is_expired == NULL) {
        return DX_ERROR_INVALID_INPUT;
    }

    dx_ttl_info_t info;
    int ret = dx_get_ttl_info(encoded, &info);
    if (ret != DX_OK) {
        return ret;
    }

    /* 没有 TTL 的数据永不过期 */
    if (info.ttl_seconds == 0 && info.created_at == 0) {
        *is_expired = 0;
    } else {
        *is_expired = info.is_expired;
    }

    return DX_OK;
}

/* 验证编码完整性 */
int dx_verify(const char *encoded, int *is_valid) {
    if (is_valid == NULL) {
        return DX_ERROR_INVALID_INPUT;
    }

    uint8_t buf[65536];
    size_t buf_len;
    dx_decode_options_t options = { .check_ttl = 0 };

    int ret = dx_decode_with_options(encoded, buf, sizeof(buf), &buf_len, &options);

    *is_valid = (ret == DX_OK) ? 1 : 0;
    return (ret == DX_OK || ret == DX_ERROR_CHECKSUM_MISMATCH) ? DX_OK : ret;
}

/* 获取校验和信息 */
int dx_get_checksum(const char *encoded, dx_checksum_info_t *info) {
    dx_init();

    if (encoded == NULL || info == NULL) {
        return DX_ERROR_INVALID_INPUT;
    }

    memset(info, 0, sizeof(dx_checksum_info_t));

    size_t encoded_len = strlen(encoded);
    if (encoded_len < DX_PREFIX_LEN || encoded[0] != 'd' || encoded[1] != 'x') {
        return DX_ERROR_INVALID_PREFIX;
    }

    /* 完整解码以获取校验和 */
    uint8_t buf[65536];
    size_t buf_len;
    dx_decode_options_t options = { .check_ttl = 0 };

    /* 先获取存储的校验和 */
    const char *data = encoded + DX_PREFIX_LEN;
    size_t data_len = encoded_len - DX_PREFIX_LEN;

    size_t max_len = (data_len / 4) * 3;
    uint8_t *combined = (uint8_t *)malloc(max_len);
    if (combined == NULL) {
        return DX_ERROR_MEMORY;
    }

    size_t combined_len;
    int ret = decode_raw(data, data_len, combined, max_len, &combined_len);
    if (ret != DX_OK || combined_len < DX_HEADER_SIZE) {
        free(combined);
        return ret != DX_OK ? ret : DX_ERROR_INVALID_HEADER;
    }

    info->stored = (combined[1] << 8) | combined[2];
    free(combined);

    /* 解码并计算校验和 */
    ret = dx_decode_with_options(encoded, buf, sizeof(buf), &buf_len, &options);
    if (ret == DX_OK) {
        info->computed = dx_crc16(buf, buf_len);
        info->match = (info->stored == info->computed) ? 1 : 0;
    } else if (ret == DX_ERROR_CHECKSUM_MISMATCH) {
        /* 校验和不匹配时，需要手动计算 */
        info->computed = 0; /* 无法获取 */
        info->match = 0;
    } else {
        return ret;
    }

    return DX_OK;
}

/* 检查是否为有效的 DX 编码 */
int dx_is_encoded(const char *str) {
    dx_init();

    if (str == NULL) return 0;

    size_t len = strlen(str);
    if (len < DX_PREFIX_LEN) return 0;
    if (str[0] != 'd' || str[1] != 'x') return 0;

    size_t data_len = len - DX_PREFIX_LEN;
    if (data_len == 0 || data_len % 4 != 0) return 0;

    const char *data = str + DX_PREFIX_LEN;

    for (size_t i = 0; i < data_len; i++) {
        char c = data[i];
        if (c == DX_PADDING) {
            if (i < data_len - 2) return 0;
        } else if (dx_decode_map[(unsigned char)c] < 0) {
            return 0;
        }
    }

    return 1;
}

/* 检查是否压缩 */
int dx_is_compressed(const char *encoded, int *is_compressed) {
    dx_init();

    if (encoded == NULL || is_compressed == NULL) {
        return DX_ERROR_INVALID_INPUT;
    }

    size_t encoded_len = strlen(encoded);
    if (encoded_len < DX_PREFIX_LEN || encoded[0] != 'd' || encoded[1] != 'x') {
        return DX_ERROR_INVALID_PREFIX;
    }

    const char *data = encoded + DX_PREFIX_LEN;
    size_t data_len = encoded_len - DX_PREFIX_LEN;

    if (data_len < 4) {
        return DX_ERROR_INVALID_HEADER;
    }

    uint8_t buf[3];
    size_t buf_len;
    int ret = decode_raw(data, 4, buf, sizeof(buf), &buf_len);
    if (ret != DX_OK || buf_len < 1) {
        return ret != DX_OK ? ret : DX_ERROR_INVALID_HEADER;
    }

    *is_compressed = (buf[0] & DX_FLAG_COMPRESSED) != 0;
    return DX_OK;
}

/* 获取编码信息 */
dx_info_t dx_get_info(void) {
    dx_info_t info;
    info.name = "DX Encoding";
    info.version = DX_VERSION;
    info.author = "Dogxi";
    info.charset = DX_CHARSET;
    info.prefix = DX_PREFIX;
    info.magic = DX_MAGIC;
    info.padding = DX_PADDING;
    info.checksum = "CRC16-CCITT";
    info.compression = "DEFLATE";
    info.compression_threshold = DX_COMPRESSION_THRESHOLD;
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
        case DX_ERROR_MEMORY:
            return "内存分配失败";
        case DX_ERROR_INVALID_HEADER:
            return "无效的格式头部";
        case DX_ERROR_INVALID_FLAGS:
            return "无效的 flags 字节";
        case DX_ERROR_CHECKSUM_MISMATCH:
            return "校验和不匹配";
        case DX_ERROR_COMPRESSION:
            return "压缩/解压缩失败";
        case DX_ERROR_TTL_EXPIRED:
            return "数据已过期";
        default:
            return "未知错误";
    }
}
