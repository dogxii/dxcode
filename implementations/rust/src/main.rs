//! dxcode 命令行工具
//!
//! 由 Dogxi 创建 - v2.2.0

use dxcode::{decode_str, encode_str_with_options, get_checksum, get_info, is_compressed, is_encoded, verify};
use std::env;
use std::io::{self, Read};
use std::process;

fn print_version() {
    println!("dxc {}", env!("CARGO_PKG_VERSION"));
}

fn print_help() {
    println!("dxcode - 带有 `dx` 前缀的自定义编码算法 (v2.1 带校验和和智能压缩)");
    println!();
    println!("用法:");
    println!("  dxc encode <文本>           编码文本");
    println!("  dxc encode --no-compress <文本>  编码文本（禁用压缩）");
    println!("  dxc decode <编码>           解码 DX 字符串");
    println!("  dxc check <字符串>          检查是否为有效的 DX 编码");
    println!("  dxc verify <编码>           验证校验和完整性");
    println!("  dxc info                    显示编码信息");
    println!("  dxc help                    显示帮助信息");
    println!("  dxc --version               显示版本信息");
    println!();
    println!("管道用法:");
    println!("  echo 'Hello' | dxc encode");
    println!("  echo 'dxXXXX' | dxc decode");
    println!();
    println!("示例:");
    println!("  dxc encode '你好，Dogxi！'");
    println!("  dxc encode --no-compress 'Hello World'");
    println!("  dxc decode 'dxXXXX...'");
    println!("  dxc verify 'dxXXXX...'    # 验证数据完整性");
    println!();
    println!("更多信息: https://dxc.dogxi.me");
    println!("GitHub: https://github.com/dogxii/dxcode");
}

fn print_info() {
    let info = get_info();
    println!("╔════════════════════════════════════════════╗");
    println!("║             dxcode 信息                    ║");
    println!("╚════════════════════════════════════════════╝");
    println!();
    println!("名称:       {}", info.name);
    println!("版本:       {}", info.version);
    println!("作者:       {}", info.author);
    println!("前缀:       {}", info.prefix);
    println!("魔数:       0x{:02X} ('{}')", info.magic, info.magic as char);
    println!("填充:       {}", info.padding);
    println!("校验和:     {}", info.checksum);
    println!("压缩算法:   {}", info.compression);
    println!("压缩阈值:   {} 字节", info.compression_threshold);
    println!("字符集长度: {}", info.charset.len());
    println!();
    println!("字符集:");
    println!("  {}", info.charset);
}

fn encode_command(input: &str, allow_compression: bool) {
    let encoded = encode_str_with_options(input, allow_compression);
    println!("{}", encoded);

    // 显示压缩状态
    if let Ok(compressed) = is_compressed(&encoded) {
        if compressed {
            eprintln!("📦 已压缩");
        }
    }
}

fn decode_command(input: &str) {
    match decode_str(input.trim()) {
        Ok(decoded) => println!("{}", decoded),
        Err(e) => {
            eprintln!("错误: {}", e);
            process::exit(1);
        }
    }
}

fn check_command(input: &str) {
    let is_valid = is_encoded(input.trim());
    if is_valid {
        println!("✅ 是有效的 DX 编码");

        // 显示额外信息
        if let Ok(compressed) = is_compressed(input.trim()) {
            if compressed {
                println!("   📦 数据已压缩");
            } else {
                println!("   📄 数据未压缩");
            }
        }
    } else {
        println!("❌ 不是有效的 DX 编码");
        process::exit(1);
    }
}

fn verify_command(input: &str) {
    let trimmed = input.trim();

    match verify(trimmed) {
        Ok(true) => {
            // 获取校验和详情
            if let Ok((stored, _computed)) = get_checksum(trimmed) {
                println!("✅ 校验和验证通过");
                println!("   CRC16: 0x{:04X}", stored);

                // 显示压缩状态
                if let Ok(compressed) = is_compressed(trimmed) {
                    if compressed {
                        println!("   📦 数据已压缩");
                    }
                }
            } else {
                println!("✅ 校验和验证通过");
            }
        }
        Ok(false) => {
            // 校验和不匹配
            if let Ok((stored, computed)) = get_checksum(trimmed) {
                println!("❌ 校验和验证失败");
                println!("   存储的 CRC16: 0x{:04X}", stored);
                println!("   计算的 CRC16: 0x{:04X}", computed);
                println!("   数据可能已被篡改或损坏");
            } else {
                println!("❌ 校验和验证失败");
            }
            process::exit(1);
        }
        Err(e) => {
            eprintln!("错误: {}", e);
            process::exit(1);
        }
    }
}

fn read_stdin() -> String {
    let stdin = io::stdin();
    let mut input = String::new();

    // 检查是否有管道输入
    if atty::isnt(atty::Stream::Stdin) {
        stdin.lock().read_to_string(&mut input).unwrap_or_default();
    }

    input.trim().to_string()
}

fn main() {
    let args: Vec<String> = env::args().collect();

    // 如果没有参数，检查是否有管道输入
    if args.len() < 2 {
        let stdin_input = read_stdin();
        if !stdin_input.is_empty() {
            // 默认尝试编码
            encode_command(&stdin_input, true);
            return;
        }
        print_help();
        return;
    }

    let command = args[1].to_lowercase();

    match command.as_str() {
        "version" | "-v" | "-V" | "--version" => {
            print_version();
        }
        "help" | "-h" | "--help" => {
            print_help();
        }
        "info" | "-i" | "--info" => {
            print_info();
        }
        "encode" | "e" | "-e" => {
            // 检查是否有 --no-compress 标志
            let mut allow_compression = true;
            let mut input_start_idx = 2;

            if args.len() > 2 && (args[2] == "--no-compress" || args[2] == "-nc") {
                allow_compression = false;
                input_start_idx = 3;
            }

            let input = if args.len() > input_start_idx {
                args[input_start_idx..].join(" ")
            } else {
                read_stdin()
            };

            if input.is_empty() {
                eprintln!("错误: 请提供要编码的文本");
                process::exit(1);
            }

            encode_command(&input, allow_compression);
        }
        "decode" | "d" | "-d" => {
            let input = if args.len() > 2 {
                args[2].clone()
            } else {
                read_stdin()
            };

            if input.is_empty() {
                eprintln!("错误: 请提供要解码的 DX 字符串");
                process::exit(1);
            }

            decode_command(&input);
        }
        "check" | "c" | "-c" => {
            let input = if args.len() > 2 {
                args[2].clone()
            } else {
                read_stdin()
            };

            if input.is_empty() {
                eprintln!("错误: 请提供要检查的字符串");
                process::exit(1);
            }

            check_command(&input);
        }
        "verify" | "v" => {
            let input = if args.len() > 2 {
                args[2].clone()
            } else {
                read_stdin()
            };

            if input.is_empty() {
                eprintln!("错误: 请提供要验证的 DX 字符串");
                process::exit(1);
            }

            verify_command(&input);
        }
        _ => {
            // 如果第一个参数不是命令，尝试将其作为要编码的文本
            let input = args[1..].join(" ");
            encode_command(&input, true);
        }
    }
}
