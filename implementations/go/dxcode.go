// Package dx 提供 dxcode 编码算法的 Go 实现
//
// # DX 编码是由 Dogxi 创造的独特编码算法
//
// 作者: Dogxi
// 版本: 1.0.0
// 许可证: MIT
package dx

import (
	"errors"
	"strings"
)

// DX 编码使用的字符集（64个唯一字符）
const Charset = "DXdx0123456789ABCEFGHIJKLMNOPQRSTUVWYZabcefghijklmnopqrstuvwyz-_"

// Magic 用于 XOR 变换的魔数（'D' 的 ASCII 值）
const Magic = 0x44

// Prefix DX 编码的前缀
const Prefix = "dx"

// Padding 填充字符
const Padding = '='

// 反向查找表
var decodeMap = make(map[byte]int)

func init() {
	for i := 0; i < len(Charset); i++ {
		decodeMap[Charset[i]] = i
	}
}

// ErrInvalidPrefix 无效前缀错误
var ErrInvalidPrefix = errors.New("无效的 DX 编码：缺少 dx 前缀")

// ErrInvalidLength 无效长度错误
var ErrInvalidLength = errors.New("无效的 DX 编码：长度不正确")

// ErrInvalidCharacter 无效字符错误
var ErrInvalidCharacter = errors.New("无效的 DX 编码：包含非法字符")

// Encode 将字节切片编码为 DX 格式
//
// 参数:
//   - data: 要编码的字节数据
//
// 返回:
//   - 以 'dx' 为前缀的编码字符串
//
// 示例:
//
//	encoded := dx.Encode([]byte("Hello, Dogxi!"))
//	// encoded = "dxXXXX..."
func Encode(data []byte) string {
	if len(data) == 0 {
		return Prefix
	}

	var result strings.Builder
	length := len(data)

	// 预分配空间
	result.Grow(2 + (length+2)/3*4)
	result.WriteString(Prefix)

	// 每 3 字节处理一组
	for i := 0; i < length; i += 3 {
		b0 := data[i]
		var b1, b2 byte
		if i+1 < length {
			b1 = data[i+1]
		}
		if i+2 < length {
			b2 = data[i+2]
		}

		// 将 3 字节（24位）分成 4 个 6 位组
		v0 := (b0 >> 2) & 0x3F
		v1 := ((b0&0x03)<<4 | (b1 >> 4)) & 0x3F
		v2 := ((b1&0x0F)<<2 | (b2 >> 6)) & 0x3F
		v3 := b2 & 0x3F

		// XOR 变换并映射到字符
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

// EncodeString 将字符串编码为 DX 格式
//
// 参数:
//   - s: 要编码的字符串
//
// 返回:
//   - 以 'dx' 为前缀的编码字符串
func EncodeString(s string) string {
	return Encode([]byte(s))
}

// Decode 将 DX 编码的字符串解码为字节切片
//
// 参数:
//   - encoded: DX 编码的字符串（必须以 'dx' 开头）
//
// 返回:
//   - 解码后的字节切片
//   - 错误（如果输入无效）
//
// 示例:
//
//	decoded, err := dx.Decode("dxXXXX...")
//	if err != nil {
//	    log.Fatal(err)
//	}
//	fmt.Println(string(decoded)) // "Hello, Dogxi!"
func Decode(encoded string) ([]byte, error) {
	// 验证前缀
	if len(encoded) < len(Prefix) || !strings.HasPrefix(encoded, Prefix) {
		return nil, ErrInvalidPrefix
	}

	// 移除前缀
	data := encoded[len(Prefix):]

	if len(data) == 0 {
		return []byte{}, nil
	}

	// 验证长度
	if len(data)%4 != 0 {
		return nil, ErrInvalidLength
	}

	// 计算填充数量
	paddingCount := 0
	if strings.HasSuffix(data, "==") {
		paddingCount = 2
	} else if strings.HasSuffix(data, "=") {
		paddingCount = 1
	}

	// 计算输出长度
	outputLen := (len(data) / 4) * 3 - paddingCount
	result := make([]byte, outputLen)

	resultIdx := 0

	// 每 4 字符处理一组
	for i := 0; i < len(data); i += 4 {
		c0 := data[i]
		c1 := data[i+1]
		c2 := data[i+2]
		c3 := data[i+3]

		// 字符转索引
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

		// XOR 逆变换
		v0 := (i0 ^ Magic) & 0x3F
		v1 := (i1 ^ Magic) & 0x3F
		v2 := (i2 ^ Magic) & 0x3F
		v3 := (i3 ^ Magic) & 0x3F

		// 重建字节
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

// DecodeString 将 DX 编码的字符串解码为字符串
//
// 参数:
//   - encoded: DX 编码的字符串
//
// 返回:
//   - 解码后的字符串
//   - 错误（如果输入无效）
func DecodeString(encoded string) (string, error) {
	data, err := Decode(encoded)
	if err != nil {
		return "", err
	}
	return string(data), nil
}

// IsEncoded 检查字符串是否为有效的 DX 编码
//
// 参数:
//   - s: 要检查的字符串
//
// 返回:
//   - 如果是有效的 DX 编码返回 true，否则返回 false
func IsEncoded(s string) bool {
	if len(s) < len(Prefix) || !strings.HasPrefix(s, Prefix) {
		return false
	}

	data := s[len(Prefix):]

	// 检查长度
	if len(data) == 0 || len(data)%4 != 0 {
		return false
	}

	// 检查字符
	for i := 0; i < len(data); i++ {
		char := data[i]
		if char == byte(Padding) {
			// 填充只能在末尾
			if i < len(data)-2 {
				return false
			}
		} else if _, ok := decodeMap[char]; !ok {
			return false
		}
	}

	return true
}

// Info 包含 DX 编码的信息
type Info struct {
	Name    string `json:"name"`
	Version string `json:"version"`
	Author  string `json:"author"`
	Charset string `json:"charset"`
	Prefix  string `json:"prefix"`
	Magic   int    `json:"magic"`
	Padding string `json:"padding"`
}

// GetInfo 获取 DX 编码的信息
//
// 返回:
//   - 包含版本、作者、字符集等信息的 Info 结构体
func GetInfo() Info {
	return Info{
		Name:    "DX Encoding",
		Version: "1.0.0",
		Author:  "Dogxi",
		Charset: Charset,
		Prefix:  Prefix,
		Magic:   Magic,
		Padding: string(Padding),
	}
}
