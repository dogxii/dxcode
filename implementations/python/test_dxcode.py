"""
DXCode 测试文件
由 Dogxi 创建
"""

import unittest

from dxcode import (
    DX_CHARSET,
    MAGIC,
    PADDING,
    PREFIX,
    DxEncodingError,
    dx_decode,
    dx_encode,
    get_dx_info,
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
        self.assertEqual(encoded, "dx")

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

    def test_just_prefix(self):
        """测试只有前缀"""
        self.assertTrue(is_dx_encoded("dx"))  # 空字符串编码后的结果


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

    def test_info_values(self):
        """测试信息值"""
        info = get_dx_info()
        self.assertEqual(info["name"], "DX Encoding")
        self.assertEqual(info["author"], "Dogxi")
        self.assertEqual(info["prefix"], "dx")
        self.assertEqual(info["magic"], 0x44)
        self.assertEqual(info["padding"], "=")


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


class TestPadding(unittest.TestCase):
    """测试填充逻辑"""

    def test_no_padding(self):
        """测试无填充（3 字节的倍数）"""
        encoded = dx_encode("abc")  # 3 bytes
        self.assertFalse(encoded.endswith("="))

    def test_one_padding(self):
        """测试一个填充（2 字节余数）"""
        encoded = dx_encode("ab")  # 2 bytes
        self.assertTrue(encoded.endswith("="))
        self.assertFalse(encoded.endswith("=="))

    def test_two_padding(self):
        """测试两个填充（1 字节余数）"""
        encoded = dx_encode("a")  # 1 byte
        self.assertTrue(encoded.endswith("=="))


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


if __name__ == "__main__":
    print("╔════════════════════════════════════════════════════════════╗")
    print("║              DX Encoding Python 测试套件                   ║")
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
    print()

    # 运行测试
    unittest.main(verbosity=2)
