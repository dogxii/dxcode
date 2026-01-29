# Cloudflare 托管 install.sh 指南

本文档介绍如何使用 Cloudflare 托管 `install.sh` 脚本，使用户可以通过 `curl -fsSL https://dxc.dogxi.me/install.sh | sh` 安装 dxcode CLI。

---

## 方案概览

有两种方式实现：

1. **Vercel Rewrite（推荐）**：通过 Vercel 重写规则将 `/install.sh` 代理到 GitHub Raw
2. **Cloudflare Workers**：使用 Cloudflare Workers 托管脚本

---

## 方案一：Vercel Rewrite（已配置）

网站已配置 `vercel.json`，会自动将 `/install.sh` 请求代理到 GitHub：

```json
{
  "rewrites": [
    {
      "source": "/install.sh",
      "destination": "https://raw.githubusercontent.com/dogxii/dxcode/main/install.sh"
    }
  ]
}
```

**优点**：

- 无需额外配置
- 自动跟随 GitHub 上的最新版本
- 免费

**使用方式**：

```bash
curl -fsSL https://dxc.dogxi.me/install.sh | sh
```

---

## 方案二：Cloudflare Workers

如果你想使用 Cloudflare 托管（更快的全球 CDN），可以按以下步骤操作：

### 步骤 1：创建 Cloudflare Worker

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 **Workers & Pages**
3. 点击 **Create Worker**
4. 命名为 `dxcode-install`

### 步骤 2：编写 Worker 代码

将以下代码粘贴到 Worker 编辑器中：

```javascript
// Cloudflare Worker: dxcode-install
// 托管 dxcode CLI 安装脚本

const GITHUB_RAW_URL =
  'https://raw.githubusercontent.com/dogxii/dxcode/main/install.sh'

// 也可以直接内嵌脚本内容
const INSTALL_SCRIPT = `#!/bin/sh
# dxcode CLI 安装脚本
# 由 Dogxi 创建
#
# 使用方法:
#   curl -fsSL https://dxc.dogxi.me/install.sh | sh

set -e

# ... (完整脚本内容)
`

export default {
  async fetch(request, env, ctx) {
    // 方式一：从 GitHub 获取最新脚本
    const response = await fetch(GITHUB_RAW_URL, {
      headers: {
        'User-Agent': 'Cloudflare-Worker',
      },
    })

    if (!response.ok) {
      return new Response('Failed to fetch install script', { status: 502 })
    }

    const script = await response.text()

    return new Response(script, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, max-age=3600', // 缓存 1 小时
        'X-Content-Type-Options': 'nosniff',
      },
    })

    // 方式二：直接返回内嵌脚本（更快，但需要手动更新）
    // return new Response(INSTALL_SCRIPT, {
    //   headers: {
    //     'Content-Type': 'text/plain; charset=utf-8',
    //     'Cache-Control': 'public, max-age=86400',
    //   },
    // });
  },
}
```

### 步骤 3：配置自定义域名

1. 在 Worker 设置中，点击 **Triggers** > **Custom Domains**
2. 添加自定义域名路由

**方式 A：子域名方式**

- 域名：`install.dxc.dogxi.me`
- 用户访问：`curl -fsSL https://install.dxc.dogxi.me | sh`

**方式 B：路径方式（推荐）**

- 在 Cloudflare DNS 中，确保 `dxc.dogxi.me` 指向你的服务器
- 添加 Worker 路由：`dxc.dogxi.me/install.sh*`

### 步骤 4：DNS 配置

如果使用 Cloudflare 管理 DNS：

1. 进入域名的 DNS 设置
2. 添加 CNAME 记录（如果需要）：

   ```
   类型: CNAME
   名称: dxc
   目标: your-vercel-project.vercel.app
   代理状态: 已代理 (橙色云朵)
   ```

3. 在 **Rules** > **Page Rules** 或 **Workers Routes** 中添加：
   ```
   dxc.dogxi.me/install.sh* -> dxcode-install (Worker)
   ```

---

## 方案三：Cloudflare Pages + Functions

另一种方式是使用 Cloudflare Pages Functions：

### 步骤 1：创建 Functions 目录

在项目中创建：

```
web/
└── functions/
    └── install.sh.js
```

### 步骤 2：编写 Function

```javascript
// web/functions/install.sh.js

export async function onRequest(context) {
  const GITHUB_RAW_URL =
    'https://raw.githubusercontent.com/dogxii/dxcode/main/install.sh'

  const response = await fetch(GITHUB_RAW_URL)
  const script = await response.text()

  return new Response(script, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
```

### 步骤 3：部署到 Cloudflare Pages

```bash
# 安装 Wrangler
npm install -g wrangler

# 登录
wrangler login

# 部署
wrangler pages deploy web --project-name=dxcode
```

---

## 验证安装

部署完成后，测试脚本是否可用：

```bash
# 检查脚本内容
curl -fsSL https://dxc.dogxi.me/install.sh

# 测试安装（建议在虚拟环境中）
curl -fsSL https://dxc.dogxi.me/install.sh | sh
```

---

## 安全建议

1. **内容完整性**：考虑添加脚本的 SHA256 校验和
2. **HTTPS**：确保始终使用 HTTPS
3. **版本控制**：在脚本中添加版本号，便于排查问题
4. **审计日志**：Cloudflare 提供请求日志，可用于监控

---

## 相关链接

- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [Cloudflare Pages Functions](https://developers.cloudflare.com/pages/functions/)
- [Vercel Rewrites 文档](https://vercel.com/docs/edge-network/rewrites)

---

## 当前配置

项目当前使用 **Vercel Rewrite** 方案，配置文件位于 `web/vercel.json`。

如果需要切换到 Cloudflare，按上述步骤操作即可。
