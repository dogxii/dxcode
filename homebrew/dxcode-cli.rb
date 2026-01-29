# frozen_string_literal: true

# Homebrew formula for dxcode-cli
# DX Encoding CLI - 命令行编码解码工具
#
# 安装方式:
#   brew tap dogxi/tap
#   brew install dxcode-cli
#
# 或者一行命令:
#   brew install dogxi/tap/dxcode-cli

class DxcodeCli < Formula
  desc "DX Encoding CLI - A unique encoding algorithm by Dogxi"
  homepage "https://dxc.dogxi.me"
  url "https://registry.npmjs.org/dxcode-cli/-/dxcode-cli-1.0.0.tgz"
  sha256 "PLACEHOLDER_SHA256_HASH"
  license "MIT"

  # 需要 Node.js 运行时
  depends_on "node"

  def install
    # 安装 npm 包到 libexec
    system "npm", "install", *std_npm_args
    bin.install_symlink Dir["#{libexec}/bin/*"]
  end

  def caveats
    <<~EOS
      dxcode CLI 已安装成功!

      使用方法:
        dxc encode "Hello World"    # 编码
        dxc decode "dxQBpX..."      # 解码
        dxc "Hello World"           # 自动检测
        dxc --help                  # 查看帮助

      更多信息: https://dxc.dogxi.me
    EOS
  end

  test do
    # 测试编码
    encoded = shell_output("#{bin}/dxc encode test").strip
    assert_match(/^dx/, encoded)

    # 测试解码
    decoded = shell_output("#{bin}/dxc decode #{encoded}").strip
    assert_equal "test", decoded

    # 测试版本
    assert_match version.to_s, shell_output("#{bin}/dxc --version")
  end
end
