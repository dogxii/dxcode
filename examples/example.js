/**
 * DXCode 使用示例
 * 由 Dogxi 创建
 *
 * 运行方法: node example.js
 */

// 如果使用 npm 包，可以这样导入：
// import { dxEncode, dxDecode, isDxEncoded, getDxInfo } from 'dxcode';

// 这里使用相对路径导入本地实现
const {
	dxEncode,
	dxDecode,
	isDxEncoded,
	getDxInfo,
} = require("../implementations/javascript/dxcode");

console.log("╔════════════════════════════════════════════════════════════╗");
console.log("║              DX Encoding 使用示例                          ║");
console.log("║              由 Dogxi 创建                                 ║");
console.log("╚════════════════════════════════════════════════════════════╝");
console.log();

// 显示编码信息
const info = getDxInfo();
console.log("📋 编码信息:");
console.log(`   名称: ${info.name}`);
console.log(`   版本: ${info.version}`);
console.log(`   作者: ${info.author}`);
console.log(`   前缀: ${info.prefix}`);
console.log(`   魔数: 0x${info.magic.toString(16).toUpperCase()}`);
console.log();

// ============================================================================
// 示例 1: 基本字符串编码
// ============================================================================
console.log("🔹 示例 1: 基本字符串编码");
console.log("─".repeat(50));

const text1 = "Hello, Dogxi!";
const encoded1 = dxEncode(text1);
const decoded1 = dxDecode(encoded1);

console.log(`   原文: "${text1}"`);
console.log(`   编码: ${encoded1}`);
console.log(`   解码: "${decoded1}"`);
console.log(`   验证: ${text1 === decoded1 ? "✅ 成功" : "❌ 失败"}`);
console.log();

// ============================================================================
// 示例 2: 中文字符编码
// ============================================================================
console.log("🔹 示例 2: 中文字符编码");
console.log("─".repeat(50));

const text2 = "你好，世界！这是 DX 编码测试。";
const encoded2 = dxEncode(text2);
const decoded2 = dxDecode(encoded2);

console.log(`   原文: "${text2}"`);
console.log(`   编码: ${encoded2}`);
console.log(`   解码: "${decoded2}"`);
console.log(`   验证: ${text2 === decoded2 ? "✅ 成功" : "❌ 失败"}`);
console.log();

// ============================================================================
// 示例 3: Emoji 表情编码
// ============================================================================
console.log("🔹 示例 3: Emoji 表情编码");
console.log("─".repeat(50));

const text3 = "🎉🚀✨ Happy Coding! 🐱‍💻";
const encoded3 = dxEncode(text3);
const decoded3 = dxDecode(encoded3);

console.log(`   原文: "${text3}"`);
console.log(`   编码: ${encoded3}`);
console.log(`   解码: "${decoded3}"`);
console.log(`   验证: ${text3 === decoded3 ? "✅ 成功" : "❌ 失败"}`);
console.log();

// ============================================================================
// 示例 4: 二进制数据编码
// ============================================================================
console.log("🔹 示例 4: 二进制数据编码");
console.log("─".repeat(50));

const binaryData = new Uint8Array([
	0x00, 0x01, 0x02, 0x48, 0x65, 0x6c, 0x6c, 0x6f, 0xfe, 0xff,
]);
const encoded4 = dxEncode(binaryData);
const decoded4 = dxDecode(encoded4, { asString: false });

console.log(
	`   原始字节: [${Array.from(binaryData)
		.map((b) => "0x" + b.toString(16).padStart(2, "0"))
		.join(", ")}]`,
);
console.log(`   编码: ${encoded4}`);
console.log(
	`   解码字节: [${Array.from(decoded4)
		.map((b) => "0x" + b.toString(16).padStart(2, "0"))
		.join(", ")}]`,
);

let binaryMatch = true;
if (binaryData.length !== decoded4.length) {
	binaryMatch = false;
} else {
	for (let i = 0; i < binaryData.length; i++) {
		if (binaryData[i] !== decoded4[i]) {
			binaryMatch = false;
			break;
		}
	}
}
console.log(`   验证: ${binaryMatch ? "✅ 成功" : "❌ 失败"}`);
console.log();

// ============================================================================
// 示例 5: 检测 DX 编码
// ============================================================================
console.log("🔹 示例 5: 检测 DX 编码");
console.log("─".repeat(50));

const testStrings = [
	{ str: encoded1, desc: "有效的 DX 编码" },
	{ str: "Hello World", desc: "普通字符串" },
	{ str: "dxABC", desc: "假的 DX 前缀（长度不对）" },
	{ str: "dx", desc: "只有前缀（空字符串编码）" },
	{ str: "SGVsbG8gV29ybGQ=", desc: "Base64 编码" },
];

for (const test of testStrings) {
	const result = isDxEncoded(test.str);
	console.log(
		`   "${test.str.slice(0, 30)}${test.str.length > 30 ? "..." : ""}" (${test.desc})`,
	);
	console.log(`      → ${result ? "✅ 是 DX 编码" : "❌ 不是 DX 编码"}`);
}
console.log();

// ============================================================================
// 示例 6: 实际应用场景
// ============================================================================
console.log("🔹 示例 6: 实际应用场景");
console.log("─".repeat(50));

// 存储敏感信息（仅作为演示，实际使用请配合加密）
const sensitiveData = {
	apiKey: "sk-12345-abcde-67890",
	secretNote: "这是一条秘密笔记",
	timestamp: Date.now(),
};

const jsonStr = JSON.stringify(sensitiveData);
const encodedData = dxEncode(jsonStr);
const decodedData = JSON.parse(dxDecode(encodedData));

console.log("   原始数据:");
console.log(`      ${jsonStr}`);
console.log();
console.log("   DX 编码后:");
console.log(`      ${encodedData}`);
console.log();
console.log("   解码还原:");
console.log(`      API Key: ${decodedData.apiKey}`);
console.log(`      笔记: ${decodedData.secretNote}`);
console.log(`      时间戳: ${decodedData.timestamp}`);
console.log();

// ============================================================================
// 总结
// ============================================================================
console.log("╔════════════════════════════════════════════════════════════╗");
console.log("║                      示例完成                              ║");
console.log("╠════════════════════════════════════════════════════════════╣");
console.log("║   DX 编码特点:                                             ║");
console.log("║   • 所有编码结果以 'dx' 开头                               ║");
console.log("║   • 支持任意文本和二进制数据                               ║");
console.log("║   • 完全可逆，无损编码                                     ║");
console.log("║   • 使用独特的字符集和 XOR 变换                            ║");
console.log("╚════════════════════════════════════════════════════════════╝");
console.log();
console.log("了解更多: https://dxc.dogxi.me");
console.log("GitHub: https://github.com/dogxii/dxcode");
