"""
dxcode 测试文件
由 Dogxi 创建
v2.1 - 带 CRC16 校验和和智能压缩支持
"""

import unittest

from dxcode import (
    COMPRESSION_THRESHOLD,
    DX_CHARSET,
    MAGIC,
    PADDING,
    PREFIX,
    DxChecksumError,
    DxEncodingError,
    crc16,
    dx_decode,
    dx_encode,
    dx_verify,
    get_checksum,
    get_dx_info,
    is_compressed,
    is_dx_encoded,
)


class TestDxEncoding(unittest.TestCase):
    """DX 编码测试类"""

    def test_simple_string(self):
        """测试简单英文字符串"""
        original = "Hello"
        encoded = dx_encode(original)
        decoded = dx_decode(encoded)
        self.assertEqual(decoded, original)
        self.assertTrue(encoded.startswith("dx"))

    def test_chinese_string(self):
        """测试中文字符串"""
        original = "你好，世界！"
        encoded = dx_encode(original)
        decoded = dx_decode(encoded)
        self.assertEqual(decoded, original)

    def test_japanese_string(self):
        """测试日文字符串"""
        original = "こんにちは"
        encoded = dx_encode(original)
        decoded = dx_decode(encoded)
        self.assertEqual(decoded, original)

    def test_emoji(self):
        """测试 Emoji 表情"""
        original = "🎉🚀✨"
        encoded = dx_encode(original)
        decoded = dx_decode(encoded)
        self.assertEqual(decoded, original)

    def test_empty_string(self):
        """测试空字符串"""
        original = ""
        encoded = dx_encode(original)
        decoded = dx_decode(encoded)
        self.assertEqual(decoded, original)
        self.assertTrue(encoded.startswith("dx"))

    def test_single_char(self):
        """测试单个字符"""
        original = "a"
        encoded = dx_encode(original)
        decoded = dx_decode(encoded)
        self.assertEqual(decoded, original)

    def test_two_chars(self):
        """测试两个字符"""
        original = "ab"
        encoded = dx_encode(original)
        decoded = dx_decode(encoded)
        self.assertEqual(decoded, original)

    def test_three_chars(self):
        """测试三个字符"""
        original = "abc"
        encoded = dx_encode(original)
        decoded = dx_decode(encoded)
        self.assertEqual(decoded, original)

    def test_special_characters(self):
        """测试特殊字符"""
        original = "!@#$%^&*()_+-=[]{}|;':\",./<>?"
        encoded = dx_encode(original)
        decoded = dx_decode(encoded)
        self.assertEqual(decoded, original)

    def test_whitespace(self):
        """测试空白字符"""
        original = "   \t\n\r"
        encoded = dx_encode(original)
        decoded = dx_decode(encoded)
        self.assertEqual(decoded, original)

    def test_long_string(self):
        """测试长字符串"""
        original = "The quick brown fox jumps over the lazy dog" * 10
        encoded = dx_encode(original)
        decoded = dx_decode(encoded)
        self.assertEqual(decoded, original)

    def test_numbers(self):
        """测试数字"""
        original = "1234567890"
        encoded = dx_encode(original)
        decoded = dx_decode(encoded)
        self.assertEqual(decoded, original)

    def test_mixed_content(self):
        """测试混合内容"""
        original = "Mixed 混合 🎯 Test 123"
        encoded = dx_encode(original)
        decoded = dx_decode(encoded)
        self.assertEqual(decoded, original)

    def test_bytes_input(self):
        """测试字节输入"""
        original = b"\x00\x01\x02\xfe\xff"
        encoded = dx_encode(original)
        decoded = dx_decode(encoded, as_string=False)
        self.assertEqual(decoded, original)

    def test_bytearray_input(self):
        """测试 bytearray 输入"""
        original = bytearray([0x48, 0x65, 0x6C, 0x6C, 0x6F])
        encoded = dx_encode(original)
        decoded = dx_decode(encoded, as_string=False)
        self.assertEqual(decoded, bytes(original))

    def test_all_byte_values(self):
        """测试所有可能的字节值"""
        original = bytes(range(256))
        encoded = dx_encode(original)
        decoded = dx_decode(encoded, as_string=False)
        self.assertEqual(decoded, original)


class TestCompression(unittest.TestCase):
    """测试压缩功能"""

    def test_short_data_not_compressed(self):
        """测试短数据不压缩"""
        original = "Hello"
        encoded = dx_encode(original)
        self.assertFalse(is_compressed(encoded))

        decoded = dx_decode(encoded)
        self.assertEqual(decoded, original)

    def test_long_repetitive_data_compressed(self):
        """测试长重复数据压缩"""
        original = "A" * 100
        encoded = dx_encode(original)

        # 验证解码正确
        decoded = dx_decode(encoded)
        self.assertEqual(decoded, original)

        # 重复数据应该被压缩
        self.assertTrue(is_compressed(encoded))

    def test_compression_saves_space(self):
        """测试压缩节省空间"""
        original = "Hello World! " * 100
        encoded_compressed = dx_encode(original)
        encoded_uncompressed = dx_encode(original, allow_compression=False)

        # 压缩版本应该更短
        self.assertLess(len(encoded_compressed), len(encoded_uncompressed))

        # 两种方式都能正确解码
        self.assertEqual(dx_decode(encoded_compressed), original)
        self.assertEqual(dx_decode(encoded_uncompressed), original)

    def test_encode_without_compression(self):
        """测试禁用压缩"""
        original = "A" * 100
        encoded = dx_encode(original, allow_compression=False)

        # 强制不压缩
        self.assertFalse(is_compressed(encoded))

        # 仍然能正确解码
        decoded = dx_decode(encoded)
        self.assertEqual(decoded, original)

    def test_compression_threshold(self):
        """测试压缩阈值"""
        # 刚好在阈值以下
        short_data = "x" * (COMPRESSION_THRESHOLD - 1)
        encoded_short = dx_encode(short_data)
        self.assertFalse(is_compressed(encoded_short))

        # 刚好在阈值以上（重复数据）
        long_data = "x" * (COMPRESSION_THRESHOLD + 10)
        encoded_long = dx_encode(long_data)
        # 重复数据应该被压缩
        self.assertTrue(is_compressed(encoded_long))

    def test_large_data_compression(self):
        """测试较大数据压缩"""
        original = "The quick brown fox jumps over the lazy dog. " * 500
        encoded = dx_encode(original)

        # 验证解码正确
        decoded = dx_decode(encoded)
        self.assertEqual(decoded, original)

        # 验证校验和
        self.assertTrue(dx_verify(encoded))


class TestChecksum(unittest.TestCase):
    """测试校验和功能"""

    def test_crc16_known_value(self):
        """测试 CRC16 已知值"""
        # CRC-16-CCITT for "123456789" should be 0x29B1
        data = b"123456789"
        result = crc16(data)
        self.assertEqual(result, 0x29B1)

    def test_crc16_empty(self):
        """测试空数据的 CRC16"""
        result = crc16(b"")
        self.assertEqual(result, 0xFFFF)

    def test_crc16_deterministic(self):
        """测试 CRC16 确定性"""
        data = b"Hello, World!"
        crc1 = crc16(data)
        crc2 = crc16(data)
        self.assertEqual(crc1, crc2)

    def test_checksum_verification(self):
        """测试校验和验证"""
        encoded = dx_encode("Hello")
        self.assertTrue(dx_verify(encoded))

    def test_checksum_get(self):
        """测试获取校验和"""
        encoded = dx_encode("Hello")
        stored, computed = get_checksum(encoded)
        self.assertEqual(stored, computed)

    def test_checksum_mismatch_detection(self):
        """测试校验和不匹配检测"""
        encoded = dx_encode("Hello World Test Data")
        # 篡改编码字符串中的一个字符
        chars = list(encoded)
        if len(chars) > 10:
            chars[10] = "A" if chars[10] != "A" else "B"
        tampered = "".join(chars)

        # 验证应该失败或抛出错误
        try:
            result = dx_verify(tampered)
            self.assertFalse(result)
        except DxEncodingError:
            # 如果抛出编码错误（如无效字符），也是预期的
            pass

    def test_checksum_error_details(self):
        """测试校验和错误详情"""
        encoded = dx_encode("Test")
        # 篡改数据
        chars = list(encoded)
        if len(chars) > 8:
            chars[8] = "A" if chars[8] != "A" else "B"
        tampered = "".join(chars)

        try:
            dx_decode(tampered)
            self.fail("应该抛出异常")
        except DxChecksumError as e:
            # 验证错误信息包含校验和值
            self.assertIsInstance(e.expected, int)
            self.assertIsInstance(e.actual, int)
        except DxEncodingError:
            # 其他编码错误也可接受
            pass


class TestIsDxEncoded(unittest.TestCase):
    """测试 is_dx_encoded 函数"""

    def test_valid_encoded(self):
        """测试有效的 DX 编码"""
        encoded = dx_encode("Hello")
        self.assertTrue(is_dx_encoded(encoded))

    def test_invalid_no_prefix(self):
        """测试缺少前缀"""
        self.assertFalse(is_dx_encoded("hello"))

    def test_invalid_wrong_prefix(self):
        """测试错误的前缀"""
        self.assertFalse(is_dx_encoded("abHello"))

    def test_invalid_none(self):
        """测试 None 输入"""
        self.assertFalse(is_dx_encoded(None))

    def test_invalid_empty(self):
        """测试空字符串"""
        self.assertFalse(is_dx_encoded(""))

    def test_invalid_wrong_length(self):
        """测试错误长度"""
        self.assertFalse(is_dx_encoded("dxABC"))

    def test_invalid_characters(self):
        """测试无效字符"""
        self.assertFalse(is_dx_encoded("dx!!!!"))


class TestDxVerify(unittest.TestCase):
    """测试 dx_verify 函数"""

    def test_verify_valid(self):
        """测试验证有效编码"""
        encoded = dx_encode("Hello, Dogxi!")
        self.assertTrue(dx_verify(encoded))

    def test_verify_various_data(self):
        """测试验证各种数据"""
        test_cases = [
            "Hello",
            "你好世界",
            "🎉🚀✨",
            "1234567890",
            "",
            "a" * 1000,
        ]
        for data in test_cases:
            encoded = dx_encode(data)
            self.assertTrue(dx_verify(encoded), f"验证失败: {data[:20]}...")


class TestErrorHandling(unittest.TestCase):
    """测试错误处理"""

    def test_decode_no_prefix(self):
        """测试解码缺少前缀的字符串"""
        with self.assertRaises(DxEncodingError):
            dx_decode("invalid")

    def test_decode_wrong_length(self):
        """测试解码长度不正确的字符串"""
        with self.assertRaises(DxEncodingError):
            dx_decode("dxABC")

    def test_decode_invalid_characters(self):
        """测试解码包含无效字符的字符串"""
        with self.assertRaises(DxEncodingError):
            dx_decode("dx!!!!!!!!")

    def test_encode_invalid_type(self):
        """测试编码无效类型"""
        with self.assertRaises(DxEncodingError):
            dx_encode(12345)

    def test_encode_invalid_type_list(self):
        """测试编码列表类型"""
        with self.assertRaises(DxEncodingError):
            dx_encode([1, 2, 3])

    def test_get_checksum_invalid(self):
        """测试获取无效编码的校验和"""
        with self.assertRaises(DxEncodingError):
            get_checksum("invalid")


class TestGetDxInfo(unittest.TestCase):
    """测试获取信息函数"""

    def test_info_structure(self):
        """测试信息结构"""
        info = get_dx_info()
        self.assertIn("name", info)
        self.assertIn("version", info)
        self.assertIn("author", info)
        self.assertIn("charset", info)
        self.assertIn("prefix", info)
        self.assertIn("magic", info)
        self.assertIn("padding", info)
        self.assertIn("checksum", info)

    def test_info_values(self):
        """测试信息值"""
        info = get_dx_info()
        self.assertEqual(info["name"], "DX Encoding")
        self.assertEqual(info["version"], "2.1.0")
        self.assertEqual(info["author"], "Dogxi")
        self.assertEqual(info["prefix"], "dx")
        self.assertEqual(info["magic"], 0x44)
        self.assertEqual(info["padding"], "=")
        self.assertEqual(info["checksum"], "CRC16-CCITT")
        self.assertEqual(info["compression"], "DEFLATE")
        self.assertEqual(info["compression_threshold"], COMPRESSION_THRESHOLD)


class TestConstants(unittest.TestCase):
    """测试常量"""

    def test_charset_length(self):
        """测试字符集长度"""
        self.assertEqual(len(DX_CHARSET), 64)

    def test_charset_unique(self):
        """测试字符集唯一性"""
        self.assertEqual(len(set(DX_CHARSET)), 64)

    def test_prefix(self):
        """测试前缀"""
        self.assertEqual(PREFIX, "dx")

    def test_magic(self):
        """测试魔数"""
        self.assertEqual(MAGIC, 0x44)
        self.assertEqual(MAGIC, ord("D"))

    def test_padding(self):
        """测试填充字符"""
        self.assertEqual(PADDING, "=")


class TestRoundTrip(unittest.TestCase):
    """往返测试"""

    def test_roundtrip_various_lengths(self):
        """测试各种长度的往返"""
        for length in range(1, 100):
            original = "x" * length
            encoded = dx_encode(original)
            decoded = dx_decode(encoded)
            self.assertEqual(decoded, original, f"长度 {length} 失败")

    def test_roundtrip_binary(self):
        """测试二进制数据往返"""
        for length in range(1, 50):
            original = bytes([i % 256 for i in range(length)])
            encoded = dx_encode(original)
            decoded = dx_decode(encoded, as_string=False)
            self.assertEqual(decoded, original, f"二进制长度 {length} 失败")

    def test_roundtrip_with_verification(self):
        """测试带校验和验证的往返"""
        test_data = [
            "Hello",
            "你好世界",
            b"\x00\x01\x02\xff",
            "Mixed 混合 🎯",
        ]
        for data in test_data:
            encoded = dx_encode(data)
            self.assertTrue(dx_verify(encoded))
            if isinstance(data, bytes):
                decoded = dx_decode(encoded, as_string=False)
            else:
                decoded = dx_decode(encoded)
            self.assertEqual(decoded, data)


if __name__ == "__main__":
    print("╔════════════════════════════════════════════════════════════╗")
    print("║          DX Encoding Python 测试套件 v2.1                  ║")
    print("║              由 Dogxi 创建                                 ║")
    print("╚════════════════════════════════════════════════════════════╝")
    print()

    # 显示信息
    info = get_dx_info()
    print(f"📋 编码信息:")
    print(f"   名称: {info['name']}")
    print(f"   版本: {info['version']}")
    print(f"   作者: {info['author']}")
    print(f"   前缀: {info['prefix']}")
    print(f"   魔数: 0x{info['magic']:02X}")
    print(f"   校验和: {info['checksum']}")
    print(f"   压缩算法: {info['compression']}")
    print(f"   压缩阈值: {info['compression_threshold']} 字节")
    print()

    # 运行测试
    unittest.main(verbosity=2)
