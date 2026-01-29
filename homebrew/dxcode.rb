# frozen_string_literal: true

# Homebrew formula for dxcode (Rust binary)
# DX Encoding CLI - 高性能命令行编码解码工具
#
# 安装方式:
#   brew tap dogxii/tap
#   brew install dxcode
#
# 或者一行命令:
#   brew install dogxii/tap/dxcode

class Dxcode < Formula
  desc "A distinctive, URL-safe binary encoder with the signature `dx` prefix"
  homepage "https://dxc.dogxi.me"
  version "1.0.0"
  license "MIT"

  on_macos do
    on_arm do
      url "https://github.com/dogxii/dxcode/releases/download/v1.0.0/dxcode-v1.0.0-aarch64-apple-darwin.tar.gz"
      sha256 "PLACEHOLDER_SHA256_ARM64"
    end
    on_intel do
      url "https://github.com/dogxii/dxcode/releases/download/v1.0.0/dxcode-v1.0.0-x86_64-apple-darwin.tar.gz"
      sha256 "PLACEHOLDER_SHA256_X64"
    end
  end

  on_linux do
    on_arm do
      url "https://github.com/dogxii/dxcode/releases/download/v1.0.0/dxcode-v1.0.0-aarch64-unknown-linux-gnu.tar.gz"
      sha256 "PLACEHOLDER_SHA256_LINUX_ARM64"
    end
    on_intel do
      url "https://github.com/dogxii/dxcode/releases/download/v1.0.0/dxcode-v1.0.0-x86_64-unknown-linux-gnu.tar.gz"
      sha256 "PLACEHOLDER_SHA256_LINUX_X64"
    end
  end

  def install
    bin.install "dxc"
  end

  def caveats
    <<~EOS
      dxcode CLI 已安装成功! (Native Rust binary)

      使用方法:
        dxc encode "Hello World"    # 编码
        dxc decode "dxQBpX..."      # 解码
        dxc check "dxQBpX..."       # 检查是否有效
        dxc info                    # 显示编码信息
        dxc --help                  # 查看帮助

      更多信息: https://dxc.dogxi.me
    EOS
  end

  test do
    # 测试帮助
    assert_match "dxcode", shell_output("#{bin}/dxc --help")

    # 测试版本
    assert_match version.to_s, shell_output("#{bin}/dxc --version")

    # 测试编码
    encoded = shell_output("#{bin}/dxc encode Hello").strip
    assert_match(/^dx/, encoded)

    # 测试解码
    decoded = shell_output("#{bin}/dxc decode #{encoded}").strip
    assert_equal "Hello", decoded

    # 测试检查
    assert_match "有效", shell_output("#{bin}/dxc check #{encoded}")
  end
end
