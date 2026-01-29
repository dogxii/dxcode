//! dxcode 命令行工具
//!
//! 由 Dogxi 创建 - v2.3.0

use dxcode::{
    decode_str, decode_str_with_options, encode_str_with_options, encode_str_with_ttl,
    get_checksum, get_info, get_ttl_info, has_ttl, is_compressed, is_encoded, is_expired, verify,
};
use std::env;
use std::io::{self, Read};
use std::process;

fn print_version() {
    println!("dxc {}", env!("CARGO_PKG_VERSION"));
}

fn print_help() {
    println!("dxcode - 带有 `dx` 前缀的自定义编码算法 (v2.3 带校验和、压缩和 TTL)");
    println!();
    println!("用法:");
    println!("  dxc encode <文本>                编码文本");
    println!("  dxc encode --no-compress <文本>  编码文本（禁用压缩）");
    println!("  dxc encode --ttl <秒> <文本>     编码文本并设置有效期");
    println!("  dxc decode <编码>                解码 DX 字符串");
    println!("  dxc decode --ignore-ttl <编码>   解码（忽略 TTL 过期）");
    println!("  dxc check <字符串>               检查是否为有效的 DX 编码");
    println!("  dxc verify <编码>                验证校验和完整性");
    println!("  dxc ttl <编码>                   查看 TTL 信息");
    println!("  dxc info                         显示编码信息");
    println!("  dxc help                         显示帮助信息");
    println!("  dxc --version                    显示版本信息");
    println!();
    println!("管道用法:");
    println!("  echo 'Hello' | dxc encode");
    println!("  echo 'dxXXXX' | dxc decode");
    println!();
    println!("示例:");
    println!("  dxc encode '你好，Dogxi！'");
    println!("  dxc encode --no-compress 'Hello World'");
    println!("  dxc encode --ttl 3600 '临时令牌'    # 1小时有效期");
    println!("  dxc encode --ttl 86400 'Data'       # 1天有效期");
    println!("  dxc decode 'dxXXXX...'");
    println!("  dxc verify 'dxXXXX...'              # 验证数据完整性");
    println!("  dxc ttl 'dxXXXX...'                 # 查看 TTL 状态");
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

fn encode_command(input: &str, allow_compression: bool, ttl_seconds: Option<u32>) {
    let encoded = if let Some(ttl) = ttl_seconds {
        encode_str_with_ttl(input, ttl)
    } else {
        encode_str_with_options(input, allow_compression)
    };
    println!("{}", encoded);

    // 显示状态信息
    if let Ok(compressed) = is_compressed(&encoded) {
        if compressed {
            eprintln!("📦 已压缩");
        }
    }
    if ttl_seconds.is_some() {
        if let Ok(Some(info)) = get_ttl_info(&encoded) {
            if info.ttl_seconds == 0 {
                eprintln!("⏰ TTL: 永不过期");
            } else {
                eprintln!("⏰ TTL: {} 秒", info.ttl_seconds);
            }
        }
    }
}

fn decode_command(input: &str, check_ttl: bool) {
    match decode_str_with_options(input.trim(), check_ttl) {
        Ok(decoded) => println!("{}", decoded),
        Err(e) => {
            eprintln!("错误: {}", e);
            process::exit(1);
        }
    }
}

fn check_command(input: &str) {
    let trimmed = input.trim();
    let is_valid = is_encoded(trimmed);
    if is_valid {
        println!("✅ 是有效的 DX 编码");

        // 显示额外信息
        if let Ok(compressed) = is_compressed(trimmed) {
            if compressed {
                println!("   📦 数据已压缩");
            } else {
                println!("   📄 数据未压缩");
            }
        }

        if let Ok(has) = has_ttl(trimmed) {
            if has {
                if let Ok(Some(info)) = get_ttl_info(trimmed) {
                    if info.ttl_seconds == 0 {
                        println!("   ⏰ TTL: 永不过期");
                    } else if info.is_expired {
                        println!("   ⏰ TTL: 已过期");
                    } else {
                        println!("   ⏰ TTL: {} 秒 (未过期)", info.ttl_seconds);
                    }
                }
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

                // 显示 TTL 状态
                if let Ok(Some(info)) = get_ttl_info(trimmed) {
                    if info.ttl_seconds == 0 {
                        println!("   ⏰ TTL: 永不过期");
                    } else if info.is_expired {
                        println!("   ⏰ TTL: 已过期");
                    } else {
                        println!("   ⏰ TTL: {} 秒 (有效)", info.ttl_seconds);
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

fn ttl_command(input: &str) {
    let trimmed = input.trim();

    match has_ttl(trimmed) {
        Ok(true) => {
            if let Ok(Some(info)) = get_ttl_info(trimmed) {
                println!("⏰ TTL 信息");
                println!();

                // 格式化时间戳
                let created_str = format_timestamp(info.created_at);
                println!("   创建时间:   {} ({})", created_str, info.created_at);

                if info.ttl_seconds == 0 {
                    println!("   有效期:     永不过期");
                    println!("   状态:       ✅ 永久有效");
                } else {
                    println!("   有效期:     {} 秒", info.ttl_seconds);

                    if let Some(expires) = info.expires_at {
                        let expires_str = format_timestamp(expires);
                        println!("   过期时间:   {} ({})", expires_str, expires);
                    }

                    if info.is_expired {
                        println!("   状态:       ❌ 已过期");
                    } else {
                        // 计算剩余时间
                        if let Some(expires) = info.expires_at {
                            let now = std::time::SystemTime::now()
                                .duration_since(std::time::UNIX_EPOCH)
                                .map(|d| d.as_secs())
                                .unwrap_or(0);
                            let remaining = expires.saturating_sub(now);
                            println!("   剩余时间:   {} 秒", remaining);
                        }
                        println!("   状态:       ✅ 有效");
                    }
                }
            }
        }
        Ok(false) => {
            println!("ℹ️  此编码不包含 TTL 信息");
            println!("   数据永不过期");
        }
        Err(e) => {
            eprintln!("错误: {}", e);
            process::exit(1);
        }
    }
}

fn format_timestamp(ts: u64) -> String {
    // 简单格式化 - 如果需要更复杂的格式化可以使用 chrono crate
    use std::time::{Duration, UNIX_EPOCH};
    let datetime = UNIX_EPOCH + Duration::from_secs(ts);
    match datetime.duration_since(UNIX_EPOCH) {
        Ok(_) => {
            // 返回 ISO 格式近似
            format!("Unix timestamp {}", ts)
        }
        Err(_) => format!("{}", ts),
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
            encode_command(&stdin_input, true, None);
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
            // 解析选项
            let mut allow_compression = true;
            let mut ttl_seconds: Option<u32> = None;
            let mut input_start_idx = 2;

            let mut i = 2;
            while i < args.len() {
                match args[i].as_str() {
                    "--no-compress" | "-nc" => {
                        allow_compression = false;
                        input_start_idx = i + 1;
                    }
                    "--ttl" | "-t" => {
                        if i + 1 < args.len() {
                            match args[i + 1].parse::<u32>() {
                                Ok(ttl) => {
                                    ttl_seconds = Some(ttl);
                                    i += 1;
                                    input_start_idx = i + 1;
                                }
                                Err(_) => {
                                    eprintln!("错误: TTL 必须是正整数（秒）");
                                    process::exit(1);
                                }
                            }
                        } else {
                            eprintln!("错误: --ttl 需要指定秒数");
                            process::exit(1);
                        }
                    }
                    _ => {
                        if !args[i].starts_with('-') {
                            break;
                        }
                    }
                }
                i += 1;
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

            encode_command(&input, allow_compression, ttl_seconds);
        }
        "decode" | "d" | "-d" => {
            let mut check_ttl = true;
            let mut input_idx = 2;

            if args.len() > 2 && (args[2] == "--ignore-ttl" || args[2] == "-it") {
                check_ttl = false;
                input_idx = 3;
            }

            let input = if args.len() > input_idx {
                args[input_idx].clone()
            } else {
                read_stdin()
            };

            if input.is_empty() {
                eprintln!("错误: 请提供要解码的 DX 字符串");
                process::exit(1);
            }

            decode_command(&input, check_ttl);
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
        "ttl" | "expire" | "expiry" => {
            let input = if args.len() > 2 {
                args[2].clone()
            } else {
                read_stdin()
            };

            if input.is_empty() {
                eprintln!("错误: 请提供要检查 TTL 的 DX 字符串");
                process::exit(1);
            }

            ttl_command(&input);
        }
        "expired" => {
            // 快速检查是否过期
            let input = if args.len() > 2 {
                args[2].clone()
            } else {
                read_stdin()
            };

            if input.is_empty() {
                eprintln!("错误: 请提供要检查的 DX 字符串");
                process::exit(1);
            }

            match is_expired(input.trim()) {
                Ok(true) => {
                    println!("❌ 已过期");
                    process::exit(1);
                }
                Ok(false) => {
                    println!("✅ 未过期");
                }
                Err(e) => {
                    eprintln!("错误: {}", e);
                    process::exit(1);
                }
            }
        }
        _ => {
            // 如果第一个参数不是命令，尝试将其作为要编码的文本
            let input = args[1..].join(" ");
            encode_command(&input, true, None);
        }
    }
}
