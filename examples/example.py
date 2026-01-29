#!/usr/bin/env python3
"""
dxcode 使用示例
由 Dogxi 创建

这个文件展示了如何使用 DX 编码库进行各种编码和解码操作。
"""

import os
import sys

# 添加实现目录到路径（用于直接运行示例）
sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "implementations", "python")
)

from dxcode import (
    DxEncodingError,
    dx_decode,
    dx_encode,
    get_dx_info,
    is_dx_encoded,
)


def print_separator(title: str = ""):
    """打印分隔线"""
    print()
    if title:
        print(f"{'=' * 20} {title} {'=' * 20}")
    else:
        print("=" * 50)
    print()


def example_basic():
    """基本编码解码示例"""
    print_separator("基本示例")

    # 编码简单字符串
    original = "Hello, Dogxi!"
    encoded = dx_encode(original)
    decoded = dx_decode(encoded)

    print(f"原文:   {original}")
    print(f"编码:   {encoded}")
    print(f"解码:   {decoded}")
    print(f"验证:   {'✅ 成功' if original == decoded else '❌ 失败'}")


def example_chinese():
    """中文编码示例"""
    print_separator("中文字符示例")

    original = "你好，世界！欢迎使用 DX 编码。"
    encoded = dx_encode(original)
    decoded = dx_decode(encoded)

    print(f"原文:   {original}")
    print(f"编码:   {encoded}")
    print(f"解码:   {decoded}")
    print(f"验证:   {'✅ 成功' if original == decoded else '❌ 失败'}")


def example_emoji():
    """Emoji 编码示例"""
    print_separator("Emoji 示例")

    original = "🎉 DX 编码 🚀 由 Dogxi 创造 ✨"
    encoded = dx_encode(original)
    decoded = dx_decode(encoded)

    print(f"原文:   {original}")
    print(f"编码:   {encoded}")
    print(f"解码:   {decoded}")
    print(f"验证:   {'✅ 成功' if original == decoded else '❌ 失败'}")


def example_binary():
    """二进制数据编码示例"""
    print_separator("二进制数据示例")

    # 创建一些二进制数据
    original = bytes([0x00, 0x01, 0x02, 0x10, 0x20, 0x30, 0xFE, 0xFF])
    encoded = dx_encode(original)
    decoded = dx_decode(encoded, as_string=False)

    print(f"原始字节: {list(original)}")
    print(f"十六进制: {original.hex()}")
    print(f"编码:     {encoded}")
    print(f"解码字节: {list(decoded)}")
    print(f"验证:     {'✅ 成功' if original == decoded else '❌ 失败'}")


def example_validation():
    """验证 DX 编码示例"""
    print_separator("编码验证示例")

    test_strings = [
        dx_encode("Hello"),  # 有效的 DX 编码
        "dxDXdxDXdxDX",  # 可能是有效的（取决于字符集）
        "Hello, World!",  # 普通字符串
        "base64encodedstring",  # 看起来像编码但不是 DX
        "",  # 空字符串
        "dx",  # 只有前缀
    ]

    for s in test_strings:
        is_valid = is_dx_encoded(s)
        display = s if len(s) <= 30 else s[:27] + "..."
        status = "✅ 有效" if is_valid else "❌ 无效"
        print(f"{status}  {repr(display)}")


def example_error_handling():
    """错误处理示例"""
    print_separator("错误处理示例")

    invalid_inputs = [
        ("Hello", "缺少 dx 前缀"),
        ("dxABC", "长度不正确"),
        ("dx!!!!", "包含无效字符"),
    ]

    for invalid_input, reason in invalid_inputs:
        try:
            result = dx_decode(invalid_input)
            print(f"❓ 意外成功: {invalid_input} -> {result}")
        except DxEncodingError as e:
            print(f"✅ 正确捕获错误 ({reason})")
            print(f"   输入: {invalid_input}")
            print(f"   错误: {e}")
        print()


def example_info():
    """显示编码信息示例"""
    print_separator("编码信息")

    info = get_dx_info()

    print(f"名称:   {info['name']}")
    print(f"版本:   {info['version']}")
    print(f"作者:   {info['author']}")
    print(f"前缀:   {info['prefix']}")
    print(f"魔数:   0x{info['magic']:02X} ('{chr(info['magic'])}')")
    print(f"填充:   {info['padding']}")
    print(f"字符集长度: {len(info['charset'])}")
    print(f"字符集:")
    print(f"  {info['charset']}")


def example_file():
    """文件编码示例"""
    print_separator("文件编码示例")

    # 创建示例内容
    content = "这是一个测试文件的内容。\n包含多行文本。\n由 Dogxi 创建。"

    # 编码
    encoded = dx_encode(content)

    # 解码
    decoded = dx_decode(encoded)

    print("原始内容:")
    print(f"  {repr(content)}")
    print()
    print("编码后:")
    print(f"  {encoded}")
    print()
    print("解码后:")
    print(f"  {repr(decoded)}")
    print()
    print(f"验证: {'✅ 成功' if content == decoded else '❌ 失败'}")


def example_batch():
    """批量处理示例"""
    print_separator("批量处理示例")

    messages = [
        "第一条消息",
        "Second message",
        "第三条 🎯 Mixed",
        "12345",
        "!@#$%",
    ]

    print("批量编码结果:")
    print()

    all_success = True
    for msg in messages:
        encoded = dx_encode(msg)
        decoded = dx_decode(encoded)
        success = msg == decoded
        all_success = all_success and success

        status = "✅" if success else "❌"
        print(f"  {status} {msg:20} -> {encoded[:30]}...")

    print()
    print(f"总结: {'✅ 全部成功' if all_success else '❌ 存在失败'}")


def main():
    """主函数"""
    print()
    print("╔════════════════════════════════════════════════════════════╗")
    print("║              DX Encoding 使用示例                          ║")
    print("║              由 Dogxi 创建                                 ║")
    print("╚════════════════════════════════════════════════════════════╝")

    # 运行所有示例
    example_info()
    example_basic()
    example_chinese()
    example_emoji()
    example_binary()
    example_validation()
    example_error_handling()
    example_file()
    example_batch()

    print_separator("完成")
    print("所有示例运行完毕！")
    print()
    print("更多信息请访问: https://dxc.dogxi.me")
    print("GitHub: https://github.com/dogxii/dxcode")
    print()


if __name__ == "__main__":
    main()
