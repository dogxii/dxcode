// Package dx 提供 dxcode 编码算法的 Go 实现
//
// # DX 编码是带有 `dx` 前缀的自定义编码算法
//
// 作者: Dogxi
// 版本: 2.3.0
// 许可证: MIT
//
// v2.0 新增: CRC16-CCITT 校验和支持
// v2.1 新增: 智能 DEFLATE 压缩支持
// v2.3 新增: TTL (Time-To-Live) 过期时间支持
package dx

import (
	"bytes"
	"compress/flate"
	"encoding/binary"
	"errors"
	"fmt"
	"io"
	"strings"
	"time"
)

// 版本号
const Version = "2.3.0"

// DX 编码使用的字符集（64个唯一字符）
const Charset = "DXdx0123456789ABCEFGHIJKLMNOPQRSTUVWYZabcefghijklmnopqrstuvwyz-_"

// Magic 用于 XOR 变换的魔数（'D' 的 ASCII 值）
const Magic = 0x44

// Prefix DX 编码的前缀
const Prefix = "dx"

// Padding 填充字符
const Padding = '='

// 头部大小（1字节 flags + 2字节 CRC16）
const HeaderSize = 3

// TTL 头部大小（4字节 created_at + 4字节 ttl_seconds）
const TTLHeaderSize = 8

// 压缩阈值（字节数）
const CompressionThreshold = 32

// Flags 位定义
const (
	FlagCompressed  = 0x01
	FlagAlgoDeflate = 0x02
	FlagHasTTL      = 0x04
	ValidFlagsMask  = FlagCompressed | FlagAlgoDeflate | FlagHasTTL
)

// 错误定义
var (
	ErrInvalidPrefix     = errors.New("无效的 DX 编码：缺少 dx 前缀")
	ErrInvalidLength     = errors.New("无效的 DX 编码：长度不正确")
	ErrInvalidCharacter  = errors.New("无效的 DX 编码：包含非法字符")
	ErrInvalidHeader     = errors.New("无效的格式头部")
	ErrInvalidFlags      = errors.New("无效的 flags 字节")
	ErrChecksumMismatch  = errors.New("校验和不匹配")
	ErrCompressionFailed = errors.New("压缩失败")
	ErrTTLExpired        = errors.New("数据已过期")
)

// 反向查找表
var decodeMap = make(map[byte]int)

// CRC16 查找表
var crc16Table [256]uint16

func init() {
	// 初始化解码表
	for i := 0; i < len(Charset); i++ {
		decodeMap[Charset[i]] = i
	}

	// 初始化 CRC16-CCITT 查找表
	const polynomial uint16 = 0x1021
	for i := 0; i < 256; i++ {
		crc := uint16(i) << 8
		for j := 0; j < 8; j++ {
			if crc&0x8000 != 0 {
				crc = (crc << 1) ^ polynomial
			} else {
				crc <<= 1
			}
		}
		crc16Table[i] = crc
	}
}

// CRC16 计算 CRC16-CCITT 校验和
func CRC16(data []byte) uint16 {
	crc := uint16(0xFFFF)
	for _, b := range data {
		index := byte(crc>>8) ^ b
		crc = (crc << 8) ^ crc16Table[index]
	}
	return crc
}

// compressDeflate 使用 DEFLATE 压缩数据
func compressDeflate(data []byte) ([]byte, error) {
	var buf bytes.Buffer
	writer, err := flate.NewWriter(&buf, flate.BestCompression)
	if err != nil {
		return nil, err
	}
	_, err = writer.Write(data)
	if err != nil {
		return nil, err
	}
	err = writer.Close()
	if err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}

// decompressDeflate 解压 DEFLATE 数据
func decompressDeflate(data []byte) ([]byte, error) {
	reader := flate.NewReader(bytes.NewReader(data))
	defer reader.Close()
	return io.ReadAll(reader)
}

// encodeRaw 原始编码（不含前缀）
func encodeRaw(data []byte) string {
	if len(data) == 0 {
		return ""
	}

	var result strings.Builder
	length := len(data)
	result.Grow((length + 2) / 3 * 4)

	for i := 0; i < length; i += 3 {
		b0 := data[i]
		var b1, b2 byte
		if i+1 < length {
			b1 = data[i+1]
		}
		if i+2 < length {
			b2 = data[i+2]
		}

		v0 := (b0 >> 2) & 0x3F
		v1 := ((b0&0x03)<<4 | (b1 >> 4)) & 0x3F
		v2 := ((b1&0x0F)<<2 | (b2 >> 6)) & 0x3F
		v3 := b2 & 0x3F

		result.WriteByte(Charset[(v0^Magic)&0x3F])
		result.WriteByte(Charset[(v1^Magic)&0x3F])

		if i+1 < length {
			result.WriteByte(Charset[(v2^Magic)&0x3F])
		} else {
			result.WriteByte(byte(Padding))
		}

		if i+2 < length {
			result.WriteByte(Charset[(v3^Magic)&0x3F])
		} else {
			result.WriteByte(byte(Padding))
		}
	}

	return result.String()
}

// decodeRaw 原始解码（不含前缀）
func decodeRaw(data string) ([]byte, error) {
	if len(data) == 0 {
		return []byte{}, nil
	}

	if len(data)%4 != 0 {
		return nil, ErrInvalidLength
	}

	paddingCount := 0
	if strings.HasSuffix(data, "==") {
		paddingCount = 2
	} else if strings.HasSuffix(data, "=") {
		paddingCount = 1
	}

	outputLen := (len(data) / 4) * 3 - paddingCount
	result := make([]byte, outputLen)
	resultIdx := 0

	for i := 0; i < len(data); i += 4 {
		c0 := data[i]
		c1 := data[i+1]
		c2 := data[i+2]
		c3 := data[i+3]

		i0, ok0 := decodeMap[c0]
		i1, ok1 := decodeMap[c1]

		var i2, i3 int
		var ok2, ok3 bool

		if c2 == byte(Padding) {
			i2 = 0
			ok2 = true
		} else {
			i2, ok2 = decodeMap[c2]
		}

		if c3 == byte(Padding) {
			i3 = 0
			ok3 = true
		} else {
			i3, ok3 = decodeMap[c3]
		}

		if !ok0 || !ok1 || !ok2 || !ok3 {
			return nil, ErrInvalidCharacter
		}

		v0 := (i0 ^ Magic) & 0x3F
		v1 := (i1 ^ Magic) & 0x3F
		v2 := (i2 ^ Magic) & 0x3F
		v3 := (i3 ^ Magic) & 0x3F

		b0 := byte((v0 << 2) | (v1 >> 4))
		b1 := byte(((v1 & 0x0F) << 4) | (v2 >> 2))
		b2 := byte(((v2 & 0x03) << 6) | v3)

		if resultIdx < outputLen {
			result[resultIdx] = b0
			resultIdx++
		}
		if resultIdx < outputLen {
			result[resultIdx] = b1
			resultIdx++
		}
		if resultIdx < outputLen {
			result[resultIdx] = b2
			resultIdx++
		}
	}

	return result, nil
}

// EncodeOptions 编码选项
type EncodeOptions struct {
	Compress bool // 是否允许压缩（默认 true）
}

// DefaultEncodeOptions 默认编码选项
var DefaultEncodeOptions = EncodeOptions{Compress: true}

// Encode 将字节切片编码为 DX 格式（带 CRC16 校验和和智能压缩）
func Encode(data []byte) string {
	return EncodeWithOptions(data, DefaultEncodeOptions)
}

// EncodeWithOptions 使用选项编码
func EncodeWithOptions(data []byte, opts EncodeOptions) string {
	if len(data) == 0 {
		// 空数据：flags=0, CRC16=0xFFFF
		header := []byte{0x00, 0xFF, 0xFF}
		return Prefix + encodeRaw(header)
	}

	// 计算 CRC16
	checksum := CRC16(data)

	// 决定是否压缩
	var flags byte = 0
	payload := data

	if opts.Compress && len(data) >= CompressionThreshold {
		compressed, err := compressDeflate(data)
		if err == nil && len(compressed)+2 < len(data) && len(data) <= 65535 {
			flags = FlagCompressed | FlagAlgoDeflate
			// 构建压缩 payload: [orig_size(2)] [compressed_data]
			newPayload := make([]byte, 2+len(compressed))
			binary.BigEndian.PutUint16(newPayload[0:2], uint16(len(data)))
			copy(newPayload[2:], compressed)
			payload = newPayload
		}
	}

	// 构建完整数据: [flags(1)] [CRC16(2)] [payload]
	combined := make([]byte, HeaderSize+len(payload))
	combined[0] = flags
	binary.BigEndian.PutUint16(combined[1:3], checksum)
	copy(combined[HeaderSize:], payload)

	return Prefix + encodeRaw(combined)
}

// EncodeString 将字符串编码为 DX 格式
func EncodeString(s string) string {
	return Encode([]byte(s))
}

// DecodeOptions 解码选项
type DecodeOptions struct {
	CheckTTL bool // 是否检查 TTL（默认 true）
}

// DefaultDecodeOptions 默认解码选项
var DefaultDecodeOptions = DecodeOptions{CheckTTL: true}

// Decode 将 DX 编码的字符串解码为字节切片
func Decode(encoded string) ([]byte, error) {
	return DecodeWithOptions(encoded, DefaultDecodeOptions)
}

// DecodeWithOptions 使用选项解码
func DecodeWithOptions(encoded string, opts DecodeOptions) ([]byte, error) {
	if len(encoded) < len(Prefix) || !strings.HasPrefix(encoded, Prefix) {
		return nil, ErrInvalidPrefix
	}

	data := encoded[len(Prefix):]
	combined, err := decodeRaw(data)
	if err != nil {
		return nil, err
	}

	if len(combined) < HeaderSize {
		return nil, ErrInvalidHeader
	}

	flags := combined[0]
	expectedChecksum := binary.BigEndian.Uint16(combined[1:3])

	// 验证 flags
	if flags&^ValidFlagsMask != 0 {
		return nil, fmt.Errorf("%w: 0x%02X", ErrInvalidFlags, flags)
	}

	// 处理 TTL
	payloadStart := HeaderSize
	if flags&FlagHasTTL != 0 {
		if len(combined) < HeaderSize+TTLHeaderSize {
			return nil, ErrInvalidHeader
		}

		createdAt := binary.BigEndian.Uint32(combined[HeaderSize : HeaderSize+4])
		ttlSeconds := binary.BigEndian.Uint32(combined[HeaderSize+4 : HeaderSize+8])

		// 检查是否过期
		if opts.CheckTTL && ttlSeconds > 0 {
			now := uint32(time.Now().Unix())
			expiresAt := createdAt + ttlSeconds
			if now > expiresAt {
				return nil, fmt.Errorf("%w: 创建于 %s, 已于 %s 过期",
					ErrTTLExpired,
					time.Unix(int64(createdAt), 0).Format(time.RFC3339),
					time.Unix(int64(expiresAt), 0).Format(time.RFC3339))
			}
		}

		payloadStart = HeaderSize + TTLHeaderSize
	}

	payload := combined[payloadStart:]

	// 解压缩
	var originalData []byte
	if flags&FlagCompressed != 0 {
		if len(payload) < 2 {
			return nil, ErrInvalidHeader
		}
		// originalSize := binary.BigEndian.Uint16(payload[0:2])
		compressedData := payload[2:]
		decompressed, err := decompressDeflate(compressedData)
		if err != nil {
			return nil, fmt.Errorf("解压缩失败: %w", err)
		}
		originalData = decompressed
	} else {
		originalData = payload
	}

	// 验证校验和
	actualChecksum := CRC16(originalData)
	if expectedChecksum != actualChecksum {
		return nil, fmt.Errorf("%w: 期望 0x%04X, 实际 0x%04X",
			ErrChecksumMismatch, expectedChecksum, actualChecksum)
	}

	return originalData, nil
}

// DecodeString 将 DX 编码的字符串解码为字符串
func DecodeString(encoded string) (string, error) {
	data, err := Decode(encoded)
	if err != nil {
		return "", err
	}
	return string(data), nil
}

// IsEncoded 检查字符串是否为有效的 DX 编码
func IsEncoded(s string) bool {
	if len(s) < len(Prefix) || !strings.HasPrefix(s, Prefix) {
		return false
	}

	data := s[len(Prefix):]
	if len(data) == 0 || len(data)%4 != 0 {
		return false
	}

	for i := 0; i < len(data); i++ {
		char := data[i]
		if char == byte(Padding) {
			if i < len(data)-2 {
				return false
			}
		} else if _, ok := decodeMap[char]; !ok {
			return false
		}
	}

	return true
}

// Verify 验证 DX 编码的完整性
func Verify(encoded string) (bool, error) {
	_, err := DecodeWithOptions(encoded, DecodeOptions{CheckTTL: false})
	if err != nil {
		return false, err
	}
	return true, nil
}

// GetChecksum 获取编码数据的校验和信息
func GetChecksum(encoded string) (stored uint16, computed uint16, err error) {
	if len(encoded) < len(Prefix) || !strings.HasPrefix(encoded, Prefix) {
		return 0, 0, ErrInvalidPrefix
	}

	data := encoded[len(Prefix):]
	combined, err := decodeRaw(data)
	if err != nil {
		return 0, 0, err
	}

	if len(combined) < HeaderSize {
		return 0, 0, ErrInvalidHeader
	}

	flags := combined[0]
	stored = binary.BigEndian.Uint16(combined[1:3])

	payloadStart := HeaderSize
	if flags&FlagHasTTL != 0 {
		payloadStart = HeaderSize + TTLHeaderSize
	}

	payload := combined[payloadStart:]

	var originalData []byte
	if flags&FlagCompressed != 0 {
		if len(payload) < 2 {
			return 0, 0, ErrInvalidHeader
		}
		compressedData := payload[2:]
		decompressed, err := decompressDeflate(compressedData)
		if err != nil {
			return 0, 0, err
		}
		originalData = decompressed
	} else {
		originalData = payload
	}

	computed = CRC16(originalData)
	return stored, computed, nil
}

// IsCompressed 检查编码是否使用了压缩
func IsCompressed(encoded string) (bool, error) {
	if len(encoded) < len(Prefix) || !strings.HasPrefix(encoded, Prefix) {
		return false, ErrInvalidPrefix
	}

	data := encoded[len(Prefix):]
	combined, err := decodeRaw(data)
	if err != nil {
		return false, err
	}

	if len(combined) < HeaderSize {
		return false, ErrInvalidHeader
	}

	flags := combined[0]
	return flags&FlagCompressed != 0, nil
}

// TTLInfo TTL 信息
type TTLInfo struct {
	CreatedAt  uint32 // 创建时间（Unix 时间戳）
	TTLSeconds uint32 // 有效期（秒）
	ExpiresAt  uint32 // 过期时间（Unix 时间戳），0 表示永不过期
	IsExpired  bool   // 是否已过期
}

// HasTTL 检查编码是否包含 TTL
func HasTTL(encoded string) (bool, error) {
	if len(encoded) < len(Prefix) || !strings.HasPrefix(encoded, Prefix) {
		return false, ErrInvalidPrefix
	}

	data := encoded[len(Prefix):]
	combined, err := decodeRaw(data)
	if err != nil {
		return false, err
	}

	if len(combined) < HeaderSize {
		return false, ErrInvalidHeader
	}

	flags := combined[0]
	return flags&FlagHasTTL != 0, nil
}

// GetTTLInfo 获取 TTL 信息
func GetTTLInfo(encoded string) (*TTLInfo, error) {
	if len(encoded) < len(Prefix) || !strings.HasPrefix(encoded, Prefix) {
		return nil, ErrInvalidPrefix
	}

	data := encoded[len(Prefix):]
	combined, err := decodeRaw(data)
	if err != nil {
		return nil, err
	}

	if len(combined) < HeaderSize {
		return nil, ErrInvalidHeader
	}

	flags := combined[0]

	if flags&FlagHasTTL == 0 {
		return nil, nil // 没有 TTL
	}

	if len(combined) < HeaderSize+TTLHeaderSize {
		return nil, ErrInvalidHeader
	}

	createdAt := binary.BigEndian.Uint32(combined[HeaderSize : HeaderSize+4])
	ttlSeconds := binary.BigEndian.Uint32(combined[HeaderSize+4 : HeaderSize+8])

	now := uint32(time.Now().Unix())

	info := &TTLInfo{
		CreatedAt:  createdAt,
		TTLSeconds: ttlSeconds,
	}

	if ttlSeconds == 0 {
		// 永不过期
		info.ExpiresAt = 0
		info.IsExpired = false
	} else {
		info.ExpiresAt = createdAt + ttlSeconds
		info.IsExpired = now > info.ExpiresAt
	}

	return info, nil
}

// IsExpired 检查编码是否已过期
func IsExpired(encoded string) (bool, error) {
	info, err := GetTTLInfo(encoded)
	if err != nil {
		return false, err
	}
	if info == nil {
		return false, nil // 没有 TTL 的数据永不过期
	}
	return info.IsExpired, nil
}

// EncodeWithTTL 使用 TTL 编码数据
func EncodeWithTTL(data []byte, ttlSeconds uint32) string {
	return EncodeWithTTLAndOptions(data, ttlSeconds, DefaultEncodeOptions)
}

// EncodeWithTTLAndOptions 使用 TTL 和选项编码数据
func EncodeWithTTLAndOptions(data []byte, ttlSeconds uint32, opts EncodeOptions) string {
	// 获取当前时间戳
	createdAt := uint32(time.Now().Unix())

	// 计算 CRC16
	checksum := CRC16(data)

	// 决定是否压缩
	var flags byte = FlagHasTTL
	payload := data

	if opts.Compress && len(data) >= CompressionThreshold {
		compressed, err := compressDeflate(data)
		if err == nil && len(compressed)+2 < len(data) && len(data) <= 65535 {
			flags |= FlagCompressed | FlagAlgoDeflate
			newPayload := make([]byte, 2+len(compressed))
			binary.BigEndian.PutUint16(newPayload[0:2], uint16(len(data)))
			copy(newPayload[2:], compressed)
			payload = newPayload
		}
	}

	// 构建完整数据: [flags(1)] [CRC16(2)] [created_at(4)] [ttl_seconds(4)] [payload]
	combined := make([]byte, HeaderSize+TTLHeaderSize+len(payload))
	combined[0] = flags
	binary.BigEndian.PutUint16(combined[1:3], checksum)
	binary.BigEndian.PutUint32(combined[HeaderSize:HeaderSize+4], createdAt)
	binary.BigEndian.PutUint32(combined[HeaderSize+4:HeaderSize+8], ttlSeconds)
	copy(combined[HeaderSize+TTLHeaderSize:], payload)

	return Prefix + encodeRaw(combined)
}

// EncodeStringWithTTL 使用 TTL 编码字符串
func EncodeStringWithTTL(s string, ttlSeconds uint32) string {
	return EncodeWithTTL([]byte(s), ttlSeconds)
}

// Info 包含 DX 编码的信息
type Info struct {
	Name                 string `json:"name"`
	Version              string `json:"version"`
	Author               string `json:"author"`
	Charset              string `json:"charset"`
	Prefix               string `json:"prefix"`
	Magic                int    `json:"magic"`
	Padding              string `json:"padding"`
	Checksum             string `json:"checksum"`
	Compression          string `json:"compression"`
	CompressionThreshold int    `json:"compression_threshold"`
}

// GetInfo 获取 DX 编码的信息
func GetInfo() Info {
	return Info{
		Name:                 "DX Encoding",
		Version:              Version,
		Author:               "Dogxi",
		Charset:              Charset,
		Prefix:               Prefix,
		Magic:                Magic,
		Padding:              string(Padding),
		Checksum:             "CRC16-CCITT",
		Compression:          "DEFLATE",
		CompressionThreshold: CompressionThreshold,
	}
}
