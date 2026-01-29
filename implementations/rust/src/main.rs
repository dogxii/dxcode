//! dxcode 命令行工具
//!
//! 由 Dogxi 创建

use dxcode::{decode_str, encode_str, get_info, is_encoded};
use std::env;
use std::io::{self, BufRead, Read, Write};
use std::process;

fn print_help() {
    println!("dxcode - 由 Dogxi 创造的独特编码算法");
    println!();
    println!("用法:");
    println!("  dxc encode <文本>     编码文本");
    println!("  dxc decode <编码>     解码 DX 字符串");
    println!("  dxc check <字符串>    检查是否为有效的 DX 编码");
    println!("  dxc info              显示编码信息");
    println!("  dxc help              显示帮助信息");
    println!();
    println!("管道用法:");
    println!("  echo 'Hello' | dxc encode");
    println!("  echo 'dxXXXX' | dxc decode");
    println!();
    println!("示例:");
    println!("  dxc encode '你好，Dogxi！'");
    println!("  dxc decode 'dxXXXX...'");
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
    println!("名称:     {}", info.name);
    println!("版本:     {}", info.version);
    println!("作者:     {}", info.author);
    println!("前缀:     {}", info.prefix);
    println!("魔数:     0x{:02X} ('{}')", info.magic, info.magic as char);
    println!("填充:     {}", info.padding);
    println!("字符集长度: {}", info.charset.len());
    println!();
    println!("字符集:");
    println!("  {}", info.charset);
}

fn encode_command(input: &str) {
    let encoded = encode_str(input);
    println!("{}", encoded);
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
    } else {
        println!("❌ 不是有效的 DX 编码");
        process::exit(1);
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
            encode_command(&stdin_input);
            return;
        }
        print_help();
        return;
    }

    let command = args[1].to_lowercase();

    match command.as_str() {
        "help" | "-h" | "--help" => {
            print_help();
        }
        "info" | "-i" | "--info" => {
            print_info();
        }
        "encode" | "e" | "-e" => {
            let input = if args.len() > 2 {
                args[2..].join(" ")
            } else {
                read_stdin()
            };

            if input.is_empty() {
                eprintln!("错误: 请提供要编码的文本");
                process::exit(1);
            }

            encode_command(&input);
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
        _ => {
            // 如果第一个参数不是命令，尝试将其作为要编码的文本
            let input = args[1..].join(" ");
            encode_command(&input);
        }
    }
}
