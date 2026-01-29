/**
 * dxcode 测试文件
 * 由 Dogxi 创建
 * v2.0 - 带 CRC16 校验和支持
 */

const {
	dxEncode,
	dxDecode,
	isDxEncoded,
	dxVerify,
	getChecksum,
	getDxInfo,
	crc16,
} = require("./dxcode");

// 测试用例
const testCases = [
	// 基本字符串测试
	{ input: "Hello", description: "简单英文" },
	{ input: "Hello, Dogxi!", description: "带标点的英文" },
	{ input: "你好，世界！", description: "中文字符" },
	{ input: "こんにちは", description: "日文字符" },
	{ input: "🎉🚀✨", description: "Emoji 表情" },
	{ input: "", description: "空字符串" },
	{ input: "a", description: "单个字符" },
	{ input: "ab", description: "两个字符" },
	{ input: "abc", description: "三个字符" },
	{ input: "abcd", description: "四个字符" },
	{
		input: "The quick brown fox jumps over the lazy dog",
		description: "长英文句子",
	},
	{ input: "1234567890", description: "数字" },
	{ input: "!@#$%^&*()_+-=[]{}|;':\",./<>?", description: "特殊字符" },
	{ input: "   ", description: "空格" },
	{ input: "\t\n\r", description: "控制字符" },
	{ input: "Mixed 混合 🎯 Test", description: "混合内容" },
];

// 统计
let passed = 0;
let failed = 0;

console.log("╔════════════════════════════════════════════════════════════╗");
console.log("║              DX Encoding 测试套件 v2.0                     ║");
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
console.log(`   校验和: ${info.checksum}`);
console.log();

console.log("🧪 运行测试用例...");
console.log("─".repeat(60));

for (const testCase of testCases) {
	try {
		const { input, description } = testCase;

		// 编码
		const encoded = dxEncode(input);

		// 验证前缀
		if (!encoded.startsWith("dx")) {
			throw new Error(`编码结果缺少 'dx' 前缀: ${encoded}`);
		}

		// 验证 isDxEncoded
		if (!isDxEncoded(encoded)) {
			throw new Error(`isDxEncoded 返回 false: ${encoded}`);
		}

		// 验证校验和
		if (!dxVerify(encoded)) {
			throw new Error(`校验和验证失败: ${encoded}`);
		}

		// 解码
		const decoded = dxDecode(encoded);

		// 验证解码结果
		if (decoded !== input) {
			throw new Error(`解码不匹配!\n  输入: "${input}"\n  解码: "${decoded}"`);
		}

		console.log(`✅ ${description}`);
		console.log(
			`   输入: "${input.slice(0, 30)}${input.length > 30 ? "..." : ""}"`,
		);
		console.log(
			`   编码: ${encoded.slice(0, 40)}${encoded.length > 40 ? "..." : ""}`,
		);
		passed++;
	} catch (error) {
		console.log(`❌ ${testCase.description}`);
		console.log(`   错误: ${error.message}`);
		failed++;
	}
}

console.log("─".repeat(60));
console.log();

// 校验和测试
console.log("🔐 校验和测试...");
console.log("─".repeat(60));

try {
	// CRC16 已知值测试
	const testData = new TextEncoder().encode("123456789");
	const crcResult = crc16(testData);
	if (crcResult !== 0x29b1) {
		throw new Error(
			`CRC16 计算错误: 期望 0x29B1, 实际 0x${crcResult.toString(16).toUpperCase()}`,
		);
	}
	console.log("✅ CRC16 已知值测试 (123456789 -> 0x29B1)");
	passed++;
} catch (error) {
	console.log(`❌ CRC16 已知值测试`);
	console.log(`   错误: ${error.message}`);
	failed++;
}

try {
	// 校验和获取测试
	const encoded = dxEncode("Hello");
	const { stored, computed } = getChecksum(encoded);
	if (stored !== computed) {
		throw new Error(
			`校验和不一致: stored=0x${stored.toString(16)}, computed=0x${computed.toString(16)}`,
		);
	}
	console.log("✅ 校验和获取测试");
	console.log(
		`   CRC16: 0x${stored.toString(16).toUpperCase().padStart(4, "0")}`,
	);
	passed++;
} catch (error) {
	console.log(`❌ 校验和获取测试`);
	console.log(`   错误: ${error.message}`);
	failed++;
}

try {
	// 校验和篡改检测测试
	const encoded = dxEncode("Hello World Test");
	// 篡改编码字符串中的一个字符
	const chars = encoded.split("");
	if (chars.length > 10) {
		chars[10] = chars[10] === "A" ? "B" : "A";
	}
	const tampered = chars.join("");

	// 验证应该失败
	const verifyResult = dxVerify(tampered);
	if (verifyResult === true) {
		throw new Error("篡改后的数据验证应该失败");
	}
	console.log("✅ 校验和篡改检测测试");
	console.log("   成功检测到数据篡改");
	passed++;
} catch (error) {
	if (error.message.includes("篡改后的数据验证应该失败")) {
		console.log(`❌ 校验和篡改检测测试`);
		console.log(`   错误: ${error.message}`);
		failed++;
	} else {
		// 抛出的其他错误也是预期的（比如无效字符）
		console.log("✅ 校验和篡改检测测试");
		console.log("   成功检测到数据篡改");
		passed++;
	}
}

console.log("─".repeat(60));
console.log();

// 额外测试：二进制数据
console.log("🔢 二进制数据测试...");
console.log("─".repeat(60));

try {
	const binaryData = new Uint8Array([0x00, 0x01, 0x02, 0xfe, 0xff]);
	const encoded = dxEncode(binaryData);
	const decoded = dxDecode(encoded, { asString: false });

	let match = true;
	if (binaryData.length !== decoded.length) {
		match = false;
	} else {
		for (let i = 0; i < binaryData.length; i++) {
			if (binaryData[i] !== decoded[i]) {
				match = false;
				break;
			}
		}
	}

	if (match) {
		console.log("✅ 二进制数据编解码");
		console.log(
			`   输入: [${Array.from(binaryData)
				.map((b) => "0x" + b.toString(16).padStart(2, "0"))
				.join(", ")}]`,
		);
		console.log(`   编码: ${encoded}`);
		passed++;
	} else {
		throw new Error("二进制数据解码不匹配");
	}
} catch (error) {
	console.log(`❌ 二进制数据测试`);
	console.log(`   错误: ${error.message}`);
	failed++;
}

try {
	// 所有字节值测试
	const allBytes = new Uint8Array(256);
	for (let i = 0; i < 256; i++) {
		allBytes[i] = i;
	}
	const encoded = dxEncode(allBytes);
	const decoded = dxDecode(encoded, { asString: false });

	let match = true;
	for (let i = 0; i < 256; i++) {
		if (allBytes[i] !== decoded[i]) {
			match = false;
			break;
		}
	}

	if (match) {
		console.log("✅ 所有字节值 (0x00-0xFF) 编解码");
		passed++;
	} else {
		throw new Error("字节值解码不匹配");
	}
} catch (error) {
	console.log(`❌ 所有字节值测试`);
	console.log(`   错误: ${error.message}`);
	failed++;
}

console.log("─".repeat(60));
console.log();

// 错误处理测试
console.log("⚠️  错误处理测试...");
console.log("─".repeat(60));

const errorTests = [
	{
		fn: () => dxDecode("invalid"),
		description: "无效输入（缺少前缀）",
		shouldThrow: true,
	},
	{
		fn: () => dxDecode("dxAAAA!!!!"),
		description: "无效字符",
		shouldThrow: true,
	},
	{
		fn: () => isDxEncoded("hello"),
		description: "isDxEncoded 对非 DX 字符串返回 false",
		shouldThrow: false,
		expected: false,
	},
	{
		fn: () => isDxEncoded(null),
		description: "isDxEncoded 对 null 返回 false",
		shouldThrow: false,
		expected: false,
	},
	{
		fn: () => getChecksum("invalid"),
		description: "getChecksum 对无效输入抛出错误",
		shouldThrow: true,
	},
];

for (const test of errorTests) {
	try {
		const result = test.fn();

		if (test.shouldThrow) {
			console.log(`❌ ${test.description}`);
			console.log(`   应该抛出错误但没有`);
			failed++;
		} else if (test.expected !== undefined && result !== test.expected) {
			console.log(`❌ ${test.description}`);
			console.log(`   期望: ${test.expected}, 实际: ${result}`);
			failed++;
		} else {
			console.log(`✅ ${test.description}`);
			passed++;
		}
	} catch (error) {
		if (test.shouldThrow) {
			console.log(`✅ ${test.description}`);
			console.log(`   正确抛出错误: ${error.message}`);
			passed++;
		} else {
			console.log(`❌ ${test.description}`);
			console.log(`   意外错误: ${error.message}`);
			failed++;
		}
	}
}

console.log("─".repeat(60));
console.log();

// 总结
console.log("╔════════════════════════════════════════════════════════════╗");
console.log("║                      测试结果                              ║");
console.log("╠════════════════════════════════════════════════════════════╣");
console.log(
	`║   通过: ${passed.toString().padEnd(4)} ✅                                           ║`,
);
console.log(
	`║   失败: ${failed.toString().padEnd(4)} ${failed > 0 ? "❌" : "  "}                                           ║`,
);
console.log(
	`║   总计: ${(passed + failed).toString().padEnd(4)}                                              ║`,
);
console.log("╚════════════════════════════════════════════════════════════╝");

// 退出码
process.exit(failed > 0 ? 1 : 0);
