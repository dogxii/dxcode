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

# 配置
REPO="dogxii/dxcode"
BINARY_NAME="dxc"
INSTALL_DIR="${DXC_INSTALL_DIR:-$HOME/.local/bin}"

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
        Linux*)     echo "linux";;
        Darwin*)    echo "darwin";;
        MINGW*|MSYS*|CYGWIN*)    echo "windows";;
        *)          echo "unknown";;
    esac
}

# 检测架构
detect_arch() {
    ARCH="$(uname -m)"
    case "${ARCH}" in
        x86_64|amd64)   echo "x86_64";;
        aarch64|arm64)  echo "aarch64";;
        armv7l)         echo "armv7";;
        i686|i386)      echo "i686";;
        *)              echo "unknown";;
    esac
}

# 获取最新版本号
get_latest_version() {
    if command_exists curl; then
        curl -fsSL "https://api.github.com/repos/${REPO}/releases/latest" 2>/dev/null | \
            grep '"tag_name"' | sed -E 's/.*"([^"]+)".*/\1/' | sed 's/^v//'
    elif command_exists wget; then
        wget -qO- "https://api.github.com/repos/${REPO}/releases/latest" 2>/dev/null | \
            grep '"tag_name"' | sed -E 's/.*"([^"]+)".*/\1/' | sed 's/^v//'
    else
        echo ""
    fi
}

# 下载文件
download() {
    URL="$1"
    OUTPUT="$2"

    if command_exists curl; then
        curl -fsSL "$URL" -o "$OUTPUT"
    elif command_exists wget; then
        wget -q "$URL" -O "$OUTPUT"
    else
        error "需要 curl 或 wget 来下载文件"
    fi
}

# 通过 Cargo 安装
install_via_cargo() {
    info "通过 Cargo 安装 dxcode..."

    if cargo install dxcode; then
        success "dxcode 安装成功!"
        return 0
    else
        return 1
    fi
}

# 通过 Homebrew 安装
install_via_homebrew() {
    info "通过 Homebrew 安装 dxcode..."

    if brew install dogxii/tap/dxcode; then
        success "dxcode 安装成功!"
        return 0
    else
        return 1
    fi
}

# 从 GitHub Releases 下载预编译二进制
install_from_releases() {
    OS=$(detect_os)
    ARCH=$(detect_arch)

    info "检测到系统: ${OS} (${ARCH})"

    if [ "$OS" = "unknown" ] || [ "$ARCH" = "unknown" ]; then
        return 1
    fi

    # 获取最新版本
    info "获取最新版本..."
    VERSION=$(get_latest_version)

    if [ -z "$VERSION" ]; then
        warn "无法获取最新版本，尝试使用 v1.0.0"
        VERSION="1.0.0"
    fi

    info "最新版本: v${VERSION}"

    # 构建下载 URL
    case "${OS}" in
        darwin)
            if [ "$ARCH" = "aarch64" ]; then
                TARGET="aarch64-apple-darwin"
            else
                TARGET="x86_64-apple-darwin"
            fi
            EXT="tar.gz"
            ;;
        linux)
            if [ "$ARCH" = "aarch64" ]; then
                TARGET="aarch64-unknown-linux-gnu"
            elif [ "$ARCH" = "armv7" ]; then
                TARGET="armv7-unknown-linux-gnueabihf"
            else
                TARGET="x86_64-unknown-linux-gnu"
            fi
            EXT="tar.gz"
            ;;
        windows)
            TARGET="x86_64-pc-windows-msvc"
            EXT="zip"
            ;;
        *)
            return 1
            ;;
    esac

    FILENAME="dxcode-v${VERSION}-${TARGET}.${EXT}"
    DOWNLOAD_URL="https://github.com/${REPO}/releases/download/v${VERSION}/${FILENAME}"

    info "下载 ${FILENAME}..."

    # 创建临时目录
    TMP_DIR=$(mktemp -d)
    trap "rm -rf ${TMP_DIR}" EXIT

    # 下载
    if ! download "$DOWNLOAD_URL" "${TMP_DIR}/${FILENAME}"; then
        warn "无法从 GitHub Releases 下载"
        return 1
    fi

    # 解压
    info "解压..."
    cd "$TMP_DIR"

    if [ "$EXT" = "tar.gz" ]; then
        tar -xzf "$FILENAME"
    elif [ "$EXT" = "zip" ]; then
        if command_exists unzip; then
            unzip -q "$FILENAME"
        else
            error "需要 unzip 来解压 zip 文件"
        fi
    fi

    # 找到二进制文件
    if [ -f "dxc" ]; then
        BINARY_PATH="dxc"
    elif [ -f "dxc.exe" ]; then
        BINARY_PATH="dxc.exe"
    elif [ -f "${BINARY_NAME}" ]; then
        BINARY_PATH="${BINARY_NAME}"
    else
        # 尝试在子目录中查找
        BINARY_PATH=$(find . -name "dxc" -o -name "dxc.exe" 2>/dev/null | head -n 1)
        if [ -z "$BINARY_PATH" ]; then
            warn "无法找到二进制文件"
            return 1
        fi
    fi

    # 创建安装目录
    mkdir -p "$INSTALL_DIR"

    # 安装二进制
    info "安装到 ${INSTALL_DIR}..."

    if [ "$OS" = "windows" ]; then
        cp "$BINARY_PATH" "${INSTALL_DIR}/dxc.exe"
        chmod +x "${INSTALL_DIR}/dxc.exe"
    else
        cp "$BINARY_PATH" "${INSTALL_DIR}/dxc"
        chmod +x "${INSTALL_DIR}/dxc"
    fi

    success "二进制文件已安装到 ${INSTALL_DIR}/dxc"
    return 0
}

# 检查 PATH
check_path() {
    case ":${PATH}:" in
        *":${INSTALL_DIR}:"*)
            return 0
            ;;
        *)
            return 1
            ;;
    esac
}

# 打印 PATH 配置提示
print_path_hint() {
    if ! check_path; then
        echo ""
        warn "${INSTALL_DIR} 不在 PATH 中"
        echo ""
        echo "请将以下内容添加到你的 shell 配置文件中:"
        echo ""

        SHELL_NAME=$(basename "$SHELL")
        case "$SHELL_NAME" in
            zsh)
                echo "  echo 'export PATH=\"${INSTALL_DIR}:\$PATH\"' >> ~/.zshrc"
                echo "  source ~/.zshrc"
                ;;
            bash)
                echo "  echo 'export PATH=\"${INSTALL_DIR}:\$PATH\"' >> ~/.bashrc"
                echo "  source ~/.bashrc"
                ;;
            fish)
                echo "  echo 'set -gx PATH ${INSTALL_DIR} \$PATH' >> ~/.config/fish/config.fish"
                echo "  source ~/.config/fish/config.fish"
                ;;
            *)
                echo "  export PATH=\"${INSTALL_DIR}:\$PATH\""
                ;;
        esac
        echo ""
    fi
}

# 打印使用说明
print_usage() {
    echo ""
    printf "${BOLD}使用方法:${NC}\n"
    echo "  dxc encode \"Hello World\"    # 编码"
    echo "  dxc decode \"dxQBpX...\"      # 解码"
    echo "  dxc check \"dxQBpX...\"       # 检查是否有效"
    echo "  dxc info                     # 显示编码信息"
    echo "  dxc --help                   # 查看帮助"
    echo ""
    printf "${CYAN}更多信息: https://dxc.dogxi.me${NC}\n"
    printf "${CYAN}GitHub: https://github.com/${REPO}${NC}\n"
}

# 主安装流程
main() {
    print_banner

    OS=$(detect_os)
    ARCH=$(detect_arch)

    info "检测到系统: ${OS} (${ARCH})"

    # 安装策略:
    # 1. 优先从 GitHub Releases 下载预编译二进制（最快）
    # 2. macOS 上尝试 Homebrew
    # 3. 如果有 Rust/Cargo，通过 Cargo 安装
    # 4. 都不行则报错

    INSTALLED=false

    # 尝试从 GitHub Releases 下载
    info "尝试从 GitHub Releases 下载预编译二进制..."
    if install_from_releases; then
        INSTALLED=true
    else
        warn "从 GitHub Releases 下载失败"

        # macOS 尝试 Homebrew
        if [ "$OS" = "darwin" ] && command_exists brew; then
            info "尝试通过 Homebrew 安装..."
            if install_via_homebrew; then
                INSTALLED=true
            fi
        fi

        # 尝试 Cargo
        if [ "$INSTALLED" = false ] && command_exists cargo; then
            info "尝试通过 Cargo 安装..."
            if install_via_cargo; then
                INSTALLED=true
            fi
        fi
    fi

    if [ "$INSTALLED" = false ]; then
        echo ""
        error "安装失败"
        echo ""
        echo "请尝试以下方式手动安装:"
        echo ""
        echo "  ${BOLD}Homebrew (macOS):${NC}"
        echo "    brew install dogxii/tap/dxcode"
        echo ""
        echo "  ${BOLD}Cargo (需要 Rust):${NC}"
        echo "    cargo install dxcode"
        echo ""
        echo "  ${BOLD}手动下载:${NC}"
        echo "    https://github.com/${REPO}/releases"
        echo ""
        exit 1
    fi

    # 检查安装
    echo ""
    success "安装完成!"

    # PATH 提示
    print_path_hint

    # 验证
    if command_exists dxc; then
        DXC_VERSION=$(dxc --version 2>/dev/null || echo "")
        if [ -n "$DXC_VERSION" ]; then
            success "已验证: ${DXC_VERSION}"
        fi
    elif [ -x "${INSTALL_DIR}/dxc" ]; then
        success "二进制已就绪: ${INSTALL_DIR}/dxc"
    fi

    print_usage
}

# 运行
main "$@"
