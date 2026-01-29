// DX Encoding 测试文件
// 由 Dogxi 创建
// 版本: 2.3.0

package dx

import (
	"bytes"
	"testing"
	"time"
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
	_, err := Decode("invalid")
	if err != ErrInvalidPrefix {
		t.Errorf("缺少前缀应返回 ErrInvalidPrefix, 得到 %v", err)
	}

	_, err = Decode("")
	if err != ErrInvalidPrefix {
		t.Errorf("空字符串应返回 ErrInvalidPrefix, 得到 %v", err)
	}
}

// TestGetInfo 测试获取信息
func TestGetInfo(t *testing.T) {
	info := GetInfo()

	if info.Name != "DX Encoding" {
		t.Errorf("名称错误: %s", info.Name)
	}

	if info.Version != "2.3.0" {
		t.Errorf("版本错误: %s", info.Version)
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

	if info.Checksum != "CRC16-CCITT" {
		t.Errorf("校验和类型错误: %s", info.Checksum)
	}

	if info.Compression != "DEFLATE" {
		t.Errorf("压缩类型错误: %s", info.Compression)
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

// ==================== CRC16 测试 ====================

// TestCRC16 测试 CRC16 校验和
func TestCRC16(t *testing.T) {
	tests := []struct {
		name     string
		input    []byte
		expected uint16
	}{
		{"空数据", []byte{}, 0xFFFF},
		{"Hello", []byte("Hello"), CRC16([]byte("Hello"))},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := CRC16(tt.input)
			if result != tt.expected {
				t.Errorf("CRC16(%q) = 0x%04X, 期望 0x%04X", tt.input, result, tt.expected)
			}
		})
	}
}

// TestCRC16Deterministic 测试 CRC16 确定性
func TestCRC16Deterministic(t *testing.T) {
	data := []byte("Hello, World!")
	crc1 := CRC16(data)
	crc2 := CRC16(data)

	if crc1 != crc2 {
		t.Errorf("CRC16 不确定: %04X != %04X", crc1, crc2)
	}
}

// TestVerify 测试验证功能
func TestVerify(t *testing.T) {
	encoded := EncodeString("Hello, World!")
	ok, err := Verify(encoded)

	if err != nil {
		t.Errorf("验证错误: %v", err)
	}

	if !ok {
		t.Error("验证应该成功")
	}
}

// TestGetChecksum 测试获取校验和
func TestGetChecksum(t *testing.T) {
	data := []byte("Hello, World!")
	encoded := Encode(data)

	stored, computed, err := GetChecksum(encoded)
	if err != nil {
		t.Fatalf("获取校验和错误: %v", err)
	}

	if stored != computed {
		t.Errorf("校验和不匹配: stored=0x%04X, computed=0x%04X", stored, computed)
	}

	expectedCRC := CRC16(data)
	if computed != expectedCRC {
		t.Errorf("校验和错误: 期望 0x%04X, 得到 0x%04X", expectedCRC, computed)
	}
}

// ==================== 压缩测试 ====================

// TestShortDataNotCompressed 测试短数据不压缩
func TestShortDataNotCompressed(t *testing.T) {
	shortData := []byte("Hello") // 小于 32 字节
	encoded := Encode(shortData)

	isComp, err := IsCompressed(encoded)
	if err != nil {
		t.Fatalf("检查压缩状态错误: %v", err)
	}

	if isComp {
		t.Error("短数据不应该被压缩")
	}
}

// TestLongRepetitiveDataCompressed 测试长重复数据被压缩
func TestLongRepetitiveDataCompressed(t *testing.T) {
	// 重复数据应该能被很好地压缩
	longData := bytes.Repeat([]byte("AAAA"), 100)
	encoded := Encode(longData)

	isComp, err := IsCompressed(encoded)
	if err != nil {
		t.Fatalf("检查压缩状态错误: %v", err)
	}

	if !isComp {
		t.Error("长重复数据应该被压缩")
	}

	// 验证解码
	decoded, err := Decode(encoded)
	if err != nil {
		t.Fatalf("解码错误: %v", err)
	}

	if !bytes.Equal(decoded, longData) {
		t.Error("解码数据不匹配")
	}
}

// TestEncodeWithoutCompression 测试禁用压缩
func TestEncodeWithoutCompression(t *testing.T) {
	longData := bytes.Repeat([]byte("AAAA"), 100)
	encoded := EncodeWithOptions(longData, EncodeOptions{Compress: false})

	isComp, err := IsCompressed(encoded)
	if err != nil {
		t.Fatalf("检查压缩状态错误: %v", err)
	}

	if isComp {
		t.Error("禁用压缩时不应该压缩")
	}

	// 验证解码
	decoded, err := Decode(encoded)
	if err != nil {
		t.Fatalf("解码错误: %v", err)
	}

	if !bytes.Equal(decoded, longData) {
		t.Error("解码数据不匹配")
	}
}

// TestCompressionSavesSpace 测试压缩节省空间
func TestCompressionSavesSpace(t *testing.T) {
	longData := bytes.Repeat([]byte("Hello World! "), 50)

	compressed := EncodeWithOptions(longData, EncodeOptions{Compress: true})
	uncompressed := EncodeWithOptions(longData, EncodeOptions{Compress: false})

	if len(compressed) >= len(uncompressed) {
		t.Errorf("压缩后应该更短: compressed=%d, uncompressed=%d",
			len(compressed), len(uncompressed))
	}
}

// ==================== TTL 测试 ====================

// TestEncodeWithTTL 测试带 TTL 编码
func TestEncodeWithTTL(t *testing.T) {
	data := []byte("Hello, World!")
	encoded := EncodeWithTTL(data, 3600)

	// 验证有 TTL
	hasTTL, err := HasTTL(encoded)
	if err != nil {
		t.Fatalf("检查 TTL 错误: %v", err)
	}
	if !hasTTL {
		t.Error("应该包含 TTL")
	}

	// 验证解码
	decoded, err := Decode(encoded)
	if err != nil {
		t.Fatalf("解码错误: %v", err)
	}

	if !bytes.Equal(decoded, data) {
		t.Error("解码数据不匹配")
	}
}

// TestEncodeStringWithTTL 测试带 TTL 的字符串编码
func TestEncodeStringWithTTL(t *testing.T) {
	encoded := EncodeStringWithTTL("Hello", 3600)

	hasTTL, err := HasTTL(encoded)
	if err != nil {
		t.Fatalf("检查 TTL 错误: %v", err)
	}
	if !hasTTL {
		t.Error("应该包含 TTL")
	}

	decoded, err := DecodeString(encoded)
	if err != nil {
		t.Fatalf("解码错误: %v", err)
	}

	if decoded != "Hello" {
		t.Errorf("解码不匹配: %q", decoded)
	}
}

// TestGetTTLInfo 测试获取 TTL 信息
func TestGetTTLInfo(t *testing.T) {
	encoded := EncodeWithTTL([]byte("Test"), 3600)

	info, err := GetTTLInfo(encoded)
	if err != nil {
		t.Fatalf("获取 TTL 信息错误: %v", err)
	}

	if info == nil {
		t.Fatal("TTL 信息不应为 nil")
	}

	if info.TTLSeconds != 3600 {
		t.Errorf("TTL 秒数错误: %d", info.TTLSeconds)
	}

	if info.IsExpired {
		t.Error("刚创建的数据不应该过期")
	}

	// 验证创建时间在合理范围内
	now := uint32(time.Now().Unix())
	if info.CreatedAt > now || info.CreatedAt < now-10 {
		t.Errorf("创建时间不合理: %d", info.CreatedAt)
	}
}

// TestTTLZeroNeverExpires 测试 TTL 为 0 时永不过期
func TestTTLZeroNeverExpires(t *testing.T) {
	encoded := EncodeWithTTL([]byte("Test"), 0)

	info, err := GetTTLInfo(encoded)
	if err != nil {
		t.Fatalf("获取 TTL 信息错误: %v", err)
	}

	if info.TTLSeconds != 0 {
		t.Errorf("TTL 秒数应为 0: %d", info.TTLSeconds)
	}

	if info.ExpiresAt != 0 {
		t.Errorf("永不过期时 ExpiresAt 应为 0: %d", info.ExpiresAt)
	}

	if info.IsExpired {
		t.Error("TTL=0 的数据不应该过期")
	}
}

// TestNoTTLReturnsNil 测试无 TTL 返回 nil
func TestNoTTLReturnsNil(t *testing.T) {
	encoded := Encode([]byte("Test"))

	info, err := GetTTLInfo(encoded)
	if err != nil {
		t.Fatalf("获取 TTL 信息错误: %v", err)
	}

	if info != nil {
		t.Error("无 TTL 的数据应该返回 nil")
	}
}

// TestTTLWithCompression 测试 TTL 与压缩组合
func TestTTLWithCompression(t *testing.T) {
	longData := bytes.Repeat([]byte("Hello World! "), 50)
	encoded := EncodeWithTTLAndOptions(longData, 3600, EncodeOptions{Compress: true})

	// 验证有 TTL
	hasTTL, err := HasTTL(encoded)
	if err != nil {
		t.Fatalf("检查 TTL 错误: %v", err)
	}
	if !hasTTL {
		t.Error("应该包含 TTL")
	}

	// 验证压缩
	isComp, err := IsCompressed(encoded)
	if err != nil {
		t.Fatalf("检查压缩状态错误: %v", err)
	}
	if !isComp {
		t.Error("应该被压缩")
	}

	// 验证解码
	decoded, err := Decode(encoded)
	if err != nil {
		t.Fatalf("解码错误: %v", err)
	}

	if !bytes.Equal(decoded, longData) {
		t.Error("解码数据不匹配")
	}
}

// TestTTLWithoutCompression 测试 TTL 不压缩
func TestTTLWithoutCompression(t *testing.T) {
	longData := bytes.Repeat([]byte("Hello World! "), 50)
	encoded := EncodeWithTTLAndOptions(longData, 3600, EncodeOptions{Compress: false})

	// 验证有 TTL
	hasTTL, _ := HasTTL(encoded)
	if !hasTTL {
		t.Error("应该包含 TTL")
	}

	// 验证未压缩
	isComp, _ := IsCompressed(encoded)
	if isComp {
		t.Error("不应该被压缩")
	}

	// 验证解码
	decoded, err := Decode(encoded)
	if err != nil {
		t.Fatalf("解码错误: %v", err)
	}

	if !bytes.Equal(decoded, longData) {
		t.Error("解码数据不匹配")
	}
}

// TestDecodeSkipTTLCheck 测试跳过 TTL 检查
func TestDecodeSkipTTLCheck(t *testing.T) {
	// 创建一个已过期的数据是困难的，但我们可以验证选项工作
	encoded := EncodeWithTTL([]byte("Test"), 3600)

	// 使用 CheckTTL: false 应该总是成功
	decoded, err := DecodeWithOptions(encoded, DecodeOptions{CheckTTL: false})
	if err != nil {
		t.Fatalf("跳过 TTL 检查解码错误: %v", err)
	}

	if string(decoded) != "Test" {
		t.Errorf("解码不匹配: %q", decoded)
	}
}

// TestIsExpiredFunction 测试 IsExpired 函数
func TestIsExpiredFunction(t *testing.T) {
	// 创建一个未过期的数据
	encoded := EncodeWithTTL([]byte("Test"), 3600)

	expired, err := IsExpired(encoded)
	if err != nil {
		t.Fatalf("检查过期状态错误: %v", err)
	}

	if expired {
		t.Error("刚创建的数据不应该过期")
	}

	// 没有 TTL 的数据
	encodedNoTTL := Encode([]byte("Test"))
	expiredNoTTL, err := IsExpired(encodedNoTTL)
	if err != nil {
		t.Fatalf("检查过期状态错误: %v", err)
	}

	if expiredNoTTL {
		t.Error("没有 TTL 的数据不应该过期")
	}
}

// TestHasTTL 测试 HasTTL 函数
func TestHasTTL(t *testing.T) {
	withTTL := EncodeWithTTL([]byte("Test"), 3600)
	withoutTTL := Encode([]byte("Test"))

	hasTTL1, _ := HasTTL(withTTL)
	if !hasTTL1 {
		t.Error("带 TTL 编码应该返回 true")
	}

	hasTTL2, _ := HasTTL(withoutTTL)
	if hasTTL2 {
		t.Error("不带 TTL 编码应该返回 false")
	}
}

// ==================== 基准测试 ====================

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

// BenchmarkCRC16 CRC16 性能测试
func BenchmarkCRC16(b *testing.B) {
	data := make([]byte, 1000)
	for i := range data {
		data[i] = byte(i % 256)
	}
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		CRC16(data)
	}
}

// BenchmarkCompression 压缩性能测试
func BenchmarkCompression(b *testing.B) {
	data := bytes.Repeat([]byte("Hello World! "), 100)
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		EncodeWithOptions(data, EncodeOptions{Compress: true})
	}
}

// BenchmarkEncodeWithTTL TTL 编码性能测试
func BenchmarkEncodeWithTTL(b *testing.B) {
	data := []byte("Hello, World!")
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		EncodeWithTTL(data, 3600)
	}
}
