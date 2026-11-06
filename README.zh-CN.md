# TypeScript Monorepo 模板

[English](README.md) | 简体中文

基于 NestJS、pnpm 和 Turborepo 的 TypeScript monorepo 模板，预置共享工具配置、严格类型检查和后端独立交付流程。

<!-- web:start -->

默认包含 React + Vite 前端及共享 UI 组件。

<!-- web:end -->

## 快速开始

需要 **Node.js >= 24.20.0** 和 **pnpm 11.24.0**。已验证的 Node.js 版本记录在 [`.node-version`](.node-version) 中。

```sh
pnpm dlx degit lixinqiany/ts-monorepo-template-with-react my-project
cd my-project
pnpm install --frozen-lockfile
pnpm dev:server
```

API 地址为 <http://127.0.0.1:3000/api>。内部包统一使用 `@repo/*`，无需替换包名或运行初始化脚本。按需修改根目录的项目信息，并运行 `git init` 开始记录新项目的历史。

<!-- web:start -->

在另一个终端运行 `pnpm dev:web`，打开 <http://127.0.0.1:5173>。Vite 将 `/api` 代理到后端。

### 仅使用后端

在新复制的项目中，**安装依赖之前**执行：

```sh
node scripts/init.ts --no-web
pnpm install --no-frozen-lockfile
```

这会移除 Web、UI 及其配置和依赖。提交更新后的锁文件，后续即可继续使用冻结安装。

<!-- web:end -->

## 目录结构

| 路径                         | 用途                               |
| ---------------------------- | ---------------------------------- |
| `apps/server`                | NestJS API，使用 Rspack / SWC 编译 |
| `packages/core`              | Node.js 共享代码，使用 tsdown 构建 |
| `packages/typescript-config` | 共享严格 TypeScript 配置           |
| `packages/eslint-config`     | 共享 ESLint 规则，兼容 Prettier    |
| `scripts/build`              | 运行依赖分析和独立交付打包         |

<!-- web:start -->

前端位于 `apps/web`，共享 React 组件位于 `packages/ui`。`core` 使用 Node.js API，浏览器可用的共享代码应单独存放。

<!-- web:end -->

开发命令同时启动应用、类型检查和 lint。VS Code 预置 **Server: Debug** 调试配置。

## 构建与部署

```sh
pnpm build:server
```

工作区代码打包至 `apps/server/dist`，目录包含运行清单、裁剪后的锁文件、source maps，以及存在时的应用资源。构建保留原始锁文件及其解析版本。

可用 `pnpm start:server` 在本地运行产物。部署时，将整个 `dist` 目录复制到目标环境，在目录内执行：

```sh
pnpm install --prod --frozen-lockfile
pnpm start
```

目标环境只需要 Node.js 和 pnpm。

<!-- web:start -->

`pnpm build:web` 在 `apps/web/dist` 生成静态资源。正式部署时使用静态文件服务器，并将 `/api` 转发到后端。`pnpm start:web` 用于本地预览。

<!-- web:end -->

## 运行配置

- `PORT`：API 端口，默认 `3000`。
- `DATA_DIR`：数据目录。开发环境默认使用仓库根目录的 `.data/`，生产环境默认使用后端交付目录内的 `data/`。使用相对路径覆盖时，以启动工作目录为基准。

<!-- web:start -->

- `WEB_PORT`：前端端口，默认 `5173`。修改 API 端口时，前后端开发进程需设置相同的 `PORT`。

<!-- web:end -->

更多细节见[后端说明](apps/server/README.md)和[构建文档](scripts/README.md)。

## 验证

```sh
pnpm exec turbo run build check-types lint
pnpm exec prettier --check .
pnpm --filter @repo/server test
pnpm --filter @repo/server test:e2e
node --test scripts/init.test.ts
```

CI 执行上述检查，并验证后端交付目录能否独立安装和启动。

## 许可证

[MIT](LICENSE) © lixinqiany
