#!/usr/bin/env node

/**
 * dxc - DX Encoding CLI
 * 命令行编码解码工具
 *
 * @author Dogxi
 * @version 2.2.0
 * @license MIT
 */

const {
	dxEncode,
	dxDecode,
	isDxEncoded,
	dxVerify,
	getChecksum,
	isCompressed,
	getDxInfo,
	isPakoAvailable,
} = require("dxcode-lib");
const fs = require("fs");
const path = require("path");

const VERSION = "2.2.0";

// 颜色输出
const colors = {
	reset: "\x1b[0m",
	bold: "\x1b[1m",
	dim: "\x1b[2m",
	cyan: "\x1b[36m",
	green: "\x1b[32m",
	yellow: "\x1b[33m",
	red: "\x1b[31m",
	magenta: "\x1b[35m",
	blue: "\x1b[34m",
};

function c(color, text) {
	return `${colors[color]}${text}${colors.reset}`;
}

// 帮助信息
function showHelp() {
	console.log(`
${c("cyan", c("bold", "dxc"))} - DX Encoding CLI ${c("dim", `v${VERSION}`)}

${c("yellow", "Usage:")}
  ${c("bold", "dxc encode")} <text>       编码文本
  ${c("bold", "dxc decode")} <encoded>    解码 DX 字符串
  ${c("bold", "dxc")} <text>              自动检测（DX 字符串则解码，否则编码）

  ${c("bold", "dxc -f")} <file>           编码文件内容
  ${c("bold", "dxc -d -f")} <file>        解码文件内容

${c("yellow", "Options:")}
  ${c("green", "-e, --encode")}           强制编码模式
  ${c("green", "-d, --decode")}           强制解码模式
  ${c("green", "-f, --file")} <path>      从文件读取输入
  ${c("green", "-o, --output")} <path>    输出到文件
  ${c("green", "-nc, --no-compress")}     禁用压缩
  ${c("green", "-c, --check")}            检查是否为有效 DX 编码
  ${c("green", "--verify")}               验证校验和
  ${c("green", "-i, --info")} [encoded]   显示编码信息（可选：分析已编码字符串）
  ${c("green", "-v, --version")}          显示版本
  ${c("green", "-h, --help")}             显示帮助

${c("yellow", "Examples:")}
  ${c("dim", "# 编码文本")}
  dxc encode "Hello World"
  dxc -e "Hello World"

  ${c("dim", "# 编码但禁用压缩")}
  dxc encode "Hello World" --no-compress

  ${c("dim", "# 解码")}
  dxc decode "dxQBpXRwZXQBxdVwJdQBp="
  dxc -d "dxQBpXRwZXQBxdVwJdQBp="

  ${c("dim", "# 自动检测")}
  dxc "Hello World"              ${c("dim", "# 编码")}
  dxc "dxQBpXRwZXQBxdVwJdQBp="   ${c("dim", "# 解码")}

  ${c("dim", "# 验证校验和")}
  dxc --verify "dxQBpXRwZXQBxdVwJdQBp="

  ${c("dim", "# 分析已编码字符串")}
  dxc -i "dxQBpXRwZXQBxdVwJdQBp="

  ${c("dim", "# 文件操作")}
  dxc -f input.txt -o output.dx
  dxc -d -f output.dx

  ${c("dim", "# 管道")}
  echo "Hello" | dxc
  cat file.txt | dxc -e

${c("magenta", "https://dxc.dogxi.me")}
`);
}

// 显示版本
function showVersion() {
	console.log(`dxc v${VERSION}`);
}

// 显示编码信息
function showInfo(encoded = null) {
	const info = getDxInfo();

	console.log(`
${c("cyan", c("bold", "DX Encoding Info"))}

${c("yellow", "Name:")}         ${info.name}
${c("yellow", "Version:")}      ${info.version}
${c("yellow", "Author:")}       ${info.author}
${c("yellow", "Prefix:")}       ${c("green", info.prefix)}
${c("yellow", "Magic:")}        0x${info.magic.toString(16).toUpperCase()} (${info.magic})
${c("yellow", "Padding:")}      ${info.padding}
${c("yellow", "Checksum:")}     ${info.checksum}
${c("yellow", "Compression:")}  ${info.compression}
${c("yellow", "Threshold:")}    ${info.compressionThreshold} bytes
${c("yellow", "Pako:")}         ${info.pakoAvailable ? c("green", "available ✓") : c("yellow", "not available (using fallback)")}
${c("yellow", "Charset:")}      ${c("dim", info.charset)}
`);

	// 如果提供了已编码字符串，分析它
	if (encoded) {
		console.log(`${c("cyan", c("bold", "Encoded String Analysis"))}`);
		console.log("");

		if (!isDxEncoded(encoded)) {
			console.log(`  ${c("red", "✗")} 不是有效的 DX 编码`);
			return;
		}

		try {
			const checksumInfo = getChecksum(encoded);
			const compressed = isCompressed(encoded);
			const valid = dxVerify(encoded);

			console.log(
				`  ${c("yellow", "Valid:")}        ${valid ? c("green", "Yes ✓") : c("red", "No ✗")}`,
			);
			console.log(
				`  ${c("yellow", "Compressed:")}   ${compressed ? c("blue", "Yes") : "No"}`,
			);
			console.log(
				`  ${c("yellow", "Stored CRC:")}   0x${checksumInfo.stored.toString(16).toUpperCase().padStart(4, "0")}`,
			);
			console.log(
				`  ${c("yellow", "Computed CRC:")} 0x${checksumInfo.computed.toString(16).toUpperCase().padStart(4, "0")}`,
			);
			console.log(`  ${c("yellow", "Length:")}       ${encoded.length} chars`);

			if (valid) {
				const decoded = dxDecode(encoded);
				console.log(
					`  ${c("yellow", "Decoded size:")} ${new TextEncoder().encode(decoded).length} bytes`,
				);
			}
		} catch (err) {
			console.log(`  ${c("red", "Error:")} ${err.message}`);
		}
	}

	console.log(`${c("magenta", "https://dxc.dogxi.me")}`);
}

// 检查是否为 DX 编码
function checkEncoding(text) {
	const isValid = isDxEncoded(text);
	if (isValid) {
		console.log(`${c("green", "✓")} 有效的 DX 编码`);
		process.exit(0);
	} else {
		console.log(`${c("red", "✗")} 不是有效的 DX 编码`);
		process.exit(1);
	}
}

// 验证校验和
function verifyChecksum(text) {
	if (!isDxEncoded(text)) {
		console.log(`${c("red", "✗")} 不是有效的 DX 编码`);
		process.exit(1);
	}

	try {
		const valid = dxVerify(text);
		const checksumInfo = getChecksum(text);

		if (valid) {
			console.log(`${c("green", "✓")} 校验和验证通过`);
			console.log(
				`  CRC16: 0x${checksumInfo.stored.toString(16).toUpperCase().padStart(4, "0")}`,
			);
			process.exit(0);
		} else {
			console.log(`${c("red", "✗")} 校验和验证失败`);
			console.log(
				`  存储: 0x${checksumInfo.stored.toString(16).toUpperCase().padStart(4, "0")}`,
			);
			console.log(
				`  计算: 0x${checksumInfo.computed.toString(16).toUpperCase().padStart(4, "0")}`,
			);
			process.exit(1);
		}
	} catch (err) {
		console.log(`${c("red", "✗")} 验证失败: ${err.message}`);
		process.exit(1);
	}
}

// 读取 stdin
function readStdin() {
	return new Promise((resolve, reject) => {
		let data = "";
		process.stdin.setEncoding("utf8");

		process.stdin.on("readable", () => {
			let chunk;
			while ((chunk = process.stdin.read()) !== null) {
				data += chunk;
			}
		});

		process.stdin.on("end", () => {
			resolve(data.trim());
		});

		process.stdin.on("error", reject);

		// 如果没有管道输入，设置超时
		if (process.stdin.isTTY) {
			resolve(null);
		}
	});
}

// 主函数
async function main() {
	const args = process.argv.slice(2);

	// 解析参数
	let mode = "auto"; // auto, encode, decode
	let inputFile = null;
	let outputFile = null;
	let check = false;
	let verify = false;
	let showInfoFlag = false;
	let noCompress = false;
	let input = null;

	for (let i = 0; i < args.length; i++) {
		const arg = args[i];

		switch (arg) {
			case "-h":
			case "--help":
				showHelp();
				process.exit(0);
				break;

			case "-v":
			case "--version":
				showVersion();
				process.exit(0);
				break;

			case "-i":
			case "--info":
				showInfoFlag = true;
				break;

			case "-e":
			case "--encode":
			case "encode":
				mode = "encode";
				break;

			case "-d":
			case "--decode":
			case "decode":
				mode = "decode";
				break;

			case "-f":
			case "--file":
				inputFile = args[++i];
				break;

			case "-o":
			case "--output":
				outputFile = args[++i];
				break;

			case "-c":
			case "--check":
				check = true;
				break;

			case "--verify":
				verify = true;
				break;

			case "-nc":
			case "--no-compress":
				noCompress = true;
				break;

			default:
				if (!arg.startsWith("-") && input === null) {
					input = arg;
				}
				break;
		}
	}

	// 如果只是显示信息
	if (showInfoFlag && input === null && inputFile === null) {
		showInfo();
		process.exit(0);
	}

	// 读取输入
	if (inputFile) {
		try {
			input = fs.readFileSync(inputFile, "utf8");
		} catch (err) {
			console.error(`${c("red", "Error:")} 无法读取文件 ${inputFile}`);
			process.exit(1);
		}
	} else if (input === null) {
		// 从 stdin 读取
		input = await readStdin();
	}

	if (!input) {
		showHelp();
		process.exit(0);
	}

	// 显示信息模式（带编码字符串分析）
	if (showInfoFlag) {
		showInfo(input);
		process.exit(0);
	}

	// 检查模式
	if (check) {
		checkEncoding(input);
		return;
	}

	// 验证模式
	if (verify) {
		verifyChecksum(input);
		return;
	}

	// 自动检测模式
	if (mode === "auto") {
		mode = isDxEncoded(input) ? "decode" : "encode";
	}

	// 执行编码/解码
	let result;
	try {
		if (mode === "encode") {
			result = dxEncode(input, { compress: !noCompress });
		} else {
			result = dxDecode(input);
		}
	} catch (err) {
		console.error(`${c("red", "Error:")} ${err.message}`);
		process.exit(1);
	}

	// 输出结果
	if (outputFile) {
		try {
			fs.writeFileSync(outputFile, result);
			console.log(`${c("green", "✓")} 已保存到 ${outputFile}`);
		} catch (err) {
			console.error(`${c("red", "Error:")} 无法写入文件 ${outputFile}`);
			process.exit(1);
		}
	} else {
		console.log(result);
	}
}

main().catch((err) => {
	console.error(`${c("red", "Error:")} ${err.message}`);
	process.exit(1);
});
