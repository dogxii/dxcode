// DX Encoding 测试文件
// 由 Dogxi 创建

package dx

import (
	"bytes"
	"testing"
)

// 测试用例结构
type testCase struct {
	name  string
	input string
}

// 基本测试用例
var testCases = []testCase{
	{"简单英文", "Hello"},
	{"带标点的英文", "Hello, Dogxi!"},
	{"中文字符", "你好，世界！"},
	{"日文字符", "こんにちは"},
	{"Emoji 表情", "🎉🚀✨"},
	{"空字符串", ""},
	{"单个字符", "a"},
	{"两个字符", "ab"},
	{"三个字符", "abc"},
	{"四个字符", "abcd"},
	{"长英文句子", "The quick brown fox jumps over the lazy dog"},
	{"数字", "1234567890"},
	{"特殊字符", "!@#$%^&*()_+-=[]{}|;':\",./<>?"},
	{"空格", "   "},
	{"制表符和换行", "\t\n\r"},
	{"混合内容", "Mixed 混合 🎯 Test"},
}

// TestEncode 测试编码功能
func TestEncode(t *testing.T) {
	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			encoded := EncodeString(tc.input)

			// 验证前缀
			if len(encoded) < 2 || encoded[:2] != "dx" {
				t.Errorf("编码结果缺少 'dx' 前缀: %s", encoded)
			}
		})
	}
}

// TestDecode 测试解码功能
func TestDecode(t *testing.T) {
	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			encoded := EncodeString(tc.input)
			decoded, err := DecodeString(encoded)

			if err != nil {
				t.Errorf("解码错误: %v", err)
				return
			}

			if decoded != tc.input {
				t.Errorf("解码不匹配\n  输入: %q\n  解码: %q", tc.input, decoded)
			}
		})
	}
}

// TestRoundTrip 测试往返编解码
func TestRoundTrip(t *testing.T) {
	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			encoded := EncodeString(tc.input)
			decoded, err := DecodeString(encoded)

			if err != nil {
				t.Fatalf("解码错误: %v", err)
			}

			if decoded != tc.input {
				t.Errorf("往返失败\n  原始: %q\n  编码: %s\n  解码: %q",
					tc.input, encoded, decoded)
			}
		})
	}
}

// TestBinaryData 测试二进制数据
func TestBinaryData(t *testing.T) {
	original := []byte{0x00, 0x01, 0x02, 0xFE, 0xFF}
	encoded := Encode(original)
	decoded, err := Decode(encoded)

	if err != nil {
		t.Fatalf("解码错误: %v", err)
	}

	if !bytes.Equal(decoded, original) {
		t.Errorf("二进制数据不匹配\n  原始: %v\n  解码: %v", original, decoded)
	}
}

// TestAllByteValues 测试所有可能的字节值
func TestAllByteValues(t *testing.T) {
	original := make([]byte, 256)
	for i := 0; i < 256; i++ {
		original[i] = byte(i)
	}

	encoded := Encode(original)
	decoded, err := Decode(encoded)

	if err != nil {
		t.Fatalf("解码错误: %v", err)
	}

	if !bytes.Equal(decoded, original) {
		t.Error("所有字节值测试失败")
	}
}

// TestIsEncoded 测试 IsEncoded 函数
func TestIsEncoded(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected bool
	}{
		{"有效编码", EncodeString("Hello"), true},
		{"缺少前缀", "Hello", false},
		{"错误前缀", "abHello", false},
		{"空字符串", "", false},
		{"只有前缀", "dx", false},
		{"无效长度", "dxABC", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := IsEncoded(tt.input)
			if result != tt.expected {
				t.Errorf("IsEncoded(%q) = %v, 期望 %v", tt.input, result, tt.expected)
			}
		})
	}
}

// TestDecodeErrors 测试解码错误处理
func TestDecodeErrors(t *testing.T) {
	tests := []struct {
		name  string
		input string
		err   error
	}{
		{"缺少前缀", "invalid", ErrInvalidPrefix},
		{"空字符串", "", ErrInvalidPrefix},
		{"错误长度", "dxABC", ErrInvalidLength},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := Decode(tt.input)
			if err != tt.err {
				t.Errorf("Decode(%q) 错误 = %v, 期望 %v", tt.input, err, tt.err)
			}
		})
	}
}

// TestPadding 测试填充逻辑
func TestPadding(t *testing.T) {
	// 3 字节 - 无填充
	encoded3 := EncodeString("abc")
	if encoded3[len(encoded3)-1] == '=' {
		t.Error("3 字节不应该有填充")
	}

	// 2 字节 - 1 个填充
	encoded2 := EncodeString("ab")
	if encoded2[len(encoded2)-1] != '=' || encoded2[len(encoded2)-2] == '=' {
		t.Error("2 字节应该有 1 个填充")
	}

	// 1 字节 - 2 个填充
	encoded1 := EncodeString("a")
	if encoded1[len(encoded1)-1] != '=' || encoded1[len(encoded1)-2] != '=' {
		t.Error("1 字节应该有 2 个填充")
	}
}

// TestGetInfo 测试获取信息
func TestGetInfo(t *testing.T) {
	info := GetInfo()

	if info.Name != "DX Encoding" {
		t.Errorf("名称错误: %s", info.Name)
	}

	if info.Author != "Dogxi" {
		t.Errorf("作者错误: %s", info.Author)
	}

	if info.Prefix != "dx" {
		t.Errorf("前缀错误: %s", info.Prefix)
	}

	if info.Magic != 0x44 {
		t.Errorf("魔数错误: %d", info.Magic)
	}

	if len(info.Charset) != 64 {
		t.Errorf("字符集长度错误: %d", len(info.Charset))
	}
}

// TestCharsetUnique 测试字符集唯一性
func TestCharsetUnique(t *testing.T) {
	seen := make(map[byte]bool)
	for i := 0; i < len(Charset); i++ {
		c := Charset[i]
		if seen[c] {
			t.Errorf("字符集中存在重复字符: %c", c)
		}
		seen[c] = true
	}

	if len(seen) != 64 {
		t.Errorf("字符集应该有 64 个唯一字符，实际有 %d 个", len(seen))
	}
}

// TestVariousLengths 测试各种长度
func TestVariousLengths(t *testing.T) {
	for length := 0; length <= 100; length++ {
		original := make([]byte, length)
		for i := 0; i < length; i++ {
			original[i] = byte(i % 256)
		}

		encoded := Encode(original)
		decoded, err := Decode(encoded)

		if err != nil {
			t.Errorf("长度 %d 解码错误: %v", length, err)
			continue
		}

		if !bytes.Equal(decoded, original) {
			t.Errorf("长度 %d 往返失败", length)
		}
	}
}

// BenchmarkEncode 编码性能测试
func BenchmarkEncode(b *testing.B) {
	data := []byte("Hello, Dogxi! 你好，世界！")
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		Encode(data)
	}
}

// BenchmarkDecode 解码性能测试
func BenchmarkDecode(b *testing.B) {
	encoded := EncodeString("Hello, Dogxi! 你好，世界！")
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		Decode(encoded)
	}
}

// BenchmarkLargeEncode 大数据编码性能测试
func BenchmarkLargeEncode(b *testing.B) {
	data := make([]byte, 10000)
	for i := range data {
		data[i] = byte(i % 256)
	}
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		Encode(data)
	}
}

// BenchmarkLargeDecode 大数据解码性能测试
func BenchmarkLargeDecode(b *testing.B) {
	data := make([]byte, 10000)
	for i := range data {
		data[i] = byte(i % 256)
	}
	encoded := Encode(data)
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		Decode(encoded)
	}
}
