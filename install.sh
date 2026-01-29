#!/bin/sh
# dxcode CLI 安装脚本
# 由 Dogxi 创建
#
# 使用方法:
#   curl -fsSL https://dxc.dogxi.me/install.sh | sh
#
# 或者先下载后审查再执行:
#   curl -fsSL https://dxc.dogxi.me/install.sh -o install.sh
#   cat install.sh
#   sh install.sh

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

print_banner() {
    printf "${CYAN}${BOLD}"
    cat << 'EOF'
     _                   _
  __| |_  _____ ___   __| | ___
 / _` \ \/ / __/ _ \ / _` |/ _ \
| (_| |>  < (_| (_) | (_| |  __/
 \__,_/_/\_\___\___/ \__,_|\___|

EOF
    printf "${NC}"
    printf "${CYAN}dxcode CLI Installer${NC}\n"
    printf "https://dxc.dogxi.me\n\n"
}

info() {
    printf "${CYAN}→${NC} %s\n" "$1"
}

success() {
    printf "${GREEN}✓${NC} %s\n" "$1"
}

warn() {
    printf "${YELLOW}!${NC} %s\n" "$1"
}

error() {
    printf "${RED}✗${NC} %s\n" "$1"
    exit 1
}

# 检查命令是否存在
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# 检测操作系统
detect_os() {
    OS="$(uname -s)"
    case "${OS}" in
        Linux*)     OS_TYPE=linux;;
        Darwin*)    OS_TYPE=macos;;
        MINGW*|MSYS*|CYGWIN*)    OS_TYPE=windows;;
        *)          OS_TYPE=unknown;;
    esac
    echo "${OS_TYPE}"
}

# 检测架构
detect_arch() {
    ARCH="$(uname -m)"
    case "${ARCH}" in
        x86_64|amd64)   ARCH_TYPE=x64;;
        aarch64|arm64)  ARCH_TYPE=arm64;;
        armv7l)         ARCH_TYPE=arm;;
        *)              ARCH_TYPE=unknown;;
    esac
    echo "${ARCH_TYPE}"
}

# 通过 npm 安装
install_via_npm() {
    info "通过 npm 安装 dxcode-cli..."

    if npm install -g dxcode-cli; then
        success "dxcode-cli 安装成功!"
        return 0
    else
        error "npm 安装失败"
        return 1
    fi
}

# 通过 yarn 安装
install_via_yarn() {
    info "通过 yarn 安装 dxcode-cli..."

    if yarn global add dxcode-cli; then
        success "dxcode-cli 安装成功!"
        return 0
    else
        error "yarn 安装失败"
        return 1
    fi
}

# 通过 pnpm 安装
install_via_pnpm() {
    info "通过 pnpm 安装 dxcode-cli..."

    if pnpm add -g dxcode-cli; then
        success "dxcode-cli 安装成功!"
        return 0
    else
        error "pnpm 安装失败"
        return 1
    fi
}

# 通过 bun 安装
install_via_bun() {
    info "通过 bun 安装 dxcode-cli..."

    if bun add -g dxcode-cli; then
        success "dxcode-cli 安装成功!"
        return 0
    else
        error "bun 安装失败"
        return 1
    fi
}

# 主安装流程
main() {
    print_banner

    OS=$(detect_os)
    ARCH=$(detect_arch)

    info "检测到系统: ${OS} (${ARCH})"

    # 检查包管理器并安装
    if command_exists bun; then
        info "检测到 bun"
        install_via_bun
    elif command_exists pnpm; then
        info "检测到 pnpm"
        install_via_pnpm
    elif command_exists yarn; then
        info "检测到 yarn"
        install_via_yarn
    elif command_exists npm; then
        info "检测到 npm"
        install_via_npm
    else
        echo ""
        error "未找到 Node.js 包管理器 (npm/yarn/pnpm/bun)"
        echo ""
        warn "请先安装 Node.js: https://nodejs.org/"
        echo ""
        echo "或使用以下方式安装:"
        echo "  - Homebrew (macOS): brew install node"
        echo "  - apt (Debian/Ubuntu): sudo apt install nodejs npm"
        echo "  - nvm: https://github.com/nvm-sh/nvm"
        echo ""
        exit 1
    fi

    echo ""

    # 验证安装
    if command_exists dxc; then
        success "安装完成!"
        echo ""
        printf "${BOLD}使用方法:${NC}\n"
        echo "  dxc encode \"Hello World\"    # 编码"
        echo "  dxc decode \"dxQBpX...\"      # 解码"
        echo "  dxc \"Hello World\"           # 自动检测"
        echo "  dxc --help                   # 查看帮助"
        echo ""
        printf "${CYAN}更多信息: https://dxc.dogxi.me${NC}\n"
        printf "${CYAN}GitHub: https://github.com/dogxii/dxcode${NC}\n"
    else
        warn "安装完成，但 'dxc' 命令可能不在 PATH 中"
        echo ""
        echo "请尝试重新打开终端，或手动添加全局 npm bin 到 PATH:"
        echo "  export PATH=\"\$(npm bin -g):\$PATH\""
    fi
}

# 运行
main "$@"
