# ts-monorepo-template-with-react

基于 pnpm 和 Turborepo 的 TypeScript monorepo 模板。工作区包统一使用 `@repo/*`，下载后即可开发，无需执行初始化脚本或替换包名前缀。

<!-- web:start -->

默认包含 NestJS 后端、React + Vite 前端及共享 UI 组件。前后端分别开发、构建和部署，开发时由 Vite 将 `/api` 代理到后端。

<!-- web:end -->

## 开始使用

需要 Node.js >= 24.20.0 和 pnpm。仓库通过 `packageManager` 固定使用 pnpm 11.24.0。

`.node-version` 记录已验证的 Node.js 版本，GitHub Actions 使用相同版本。

```sh
pnpm dlx degit lixinqiany/ts-monorepo-template-with-react my-project
cd my-project
pnpm install --frozen-lockfile
pnpm dev:server
```

后端默认运行在 `http://127.0.0.1:3000/api`，返回 `Hello World!`。degit 不携带模板的 Git 历史，需要记录新项目的开发时执行 `git init`。

<!-- web:start -->

在另一个终端运行 `pnpm dev:web`，打开 `http://127.0.0.1:5173`。

### 只需要后端

仅在新项目中、安装依赖之前执行可选裁剪脚本：

```sh
pnpm dlx degit lixinqiany/ts-monorepo-template-with-react my-api
cd my-api
node scripts/init.ts --no-web
pnpm install --no-frozen-lockfile
pnpm dev:server
```

脚本移除 `apps/web`、`packages/ui`、React lint 依赖和配置、React TypeScript 预设、前端命令及相关说明，保留 Server、core 和完整构建交付流程。下一次安装会根据裁剪后的清单更新锁文件，已有依赖继续使用锁定版本；提交更新后的锁文件后，后续安装使用 `--frozen-lockfile`。

脚本只依赖 Node.js，执行位置始终以脚本所在仓库为准。它拒绝裁剪已经安装依赖的完整项目，重复裁剪已完成的项目不会继续修改文件。默认前后端项目不需要运行它。

<!-- web:end -->

## 仓库结构

| 目录                         | 用途                                                     |
| ---------------------------- | -------------------------------------------------------- |
| `apps/server`                | NestJS 后端，Rspack / SWC 编译，开发和生产入口分离       |
| `packages/core`              | Node 侧共享逻辑，tsdown 输出 ESM、声明文件和 source maps |
| `packages/typescript-config` | 共享严格 TypeScript 配置                                 |
| `packages/eslint-config`     | 共享 ESLint 规则，格式交给 Prettier                      |
| `scripts/build`              | 分析运行依赖、裁剪锁文件、准备独立交付目录               |
| `.vscode`                    | 保存格式化、ESLint 检查和 Server 断点调试                |

<!-- web:start -->

| 前端目录      | 用途                                |
| ------------- | ----------------------------------- |
| `apps/web`    | React + Vite 前端                   |
| `packages/ui` | 由 Vite 直接消费源码的 React 组件包 |

<!-- web:end -->

`core` 包含 Node 的文件系统逻辑。需要跨端共享接口类型或纯函数时，放入不依赖 Node API 的独立工作区包。

## 开发与构建

| 命令                | 用途                                                |
| ------------------- | --------------------------------------------------- |
| `pnpm dev:server`   | 启动后端，监听源码和依赖包，同时运行类型检查与 lint |
| `pnpm build:server` | 先检查类型，再构建后端及其工作区依赖                |
| `pnpm start:server` | 运行后端生产产物                                    |

<!-- web:start -->

| 前端命令         | 用途                                      |
| ---------------- | ----------------------------------------- |
| `pnpm dev:web`   | 启动前端开发服务，同时运行类型检查与 lint |
| `pnpm build:web` | 检查类型并生成静态资源                    |
| `pnpm start:web` | 本地预览前端构建产物，使用 Vite preview   |

`start:web` 用于本地预览。正式部署将 `apps/web/dist` 交给静态文件服务器，并为 `/api` 配置到后端的反向代理。

<!-- web:end -->

Turbo 保留依赖优先构建、开发时依赖变化触发重启、构建缓存及脚本变更失效机制。类型检查和运行时转译分别进行；Node 应用使用 ESM，业务源码相对导入可以省略扩展名。

在 VS Code 的“运行和调试”中选择 `Server: Debug`，即可在 TypeScript 源码设置断点；保存后重启仍会自动连接。详见 [Server 说明](apps/server/README.md)。

## 运行配置

- `PORT`：后端端口，默认 `3000`。
- `DATA_DIR`：可选数据目录。绝对路径直接使用，相对路径基于启动时的工作目录解析。默认开发数据位于仓库 `.data/`，默认生产数据位于交付目录 `data/`。正式部署可将它指向独立的持久化目录。

<!-- web:start -->

- `WEB_PORT`：前端端口，默认 `5173`。修改后端端口时，前后端启动命令都设置相同的 `PORT`，以保持开发代理一致。

<!-- web:end -->

## 独立交付

```sh
pnpm build:server
```

生成的 `apps/server/dist` 包含运行 JavaScript、source maps、运行用 `package.json`、裁剪后的锁文件、独立安装设置及 LICENSE。工作区运行代码已经打入产物，第三方依赖按锁文件安装。`assets/` 存在时也会复制到产物中。

将整个 `dist` 复制到仓库之外，在交付目录中执行：

```sh
pnpm install --prod --frozen-lockfile
pnpm start
```

目标环境只需要 Node.js 和 pnpm。构建过程不安装依赖、不重新解析版本、不改变根锁文件；依赖声明与锁文件不一致、打包包之间存在不兼容的运行依赖时会中止。支持范围见 [构建脚本说明](scripts/README.md)。

## 检查

```sh
pnpm exec turbo run build check-types lint
pnpm exec prettier --check .
pnpm --filter @repo/server test
pnpm --filter @repo/server test:e2e
node --test scripts/init.test.ts
```

包名 `@repo/*` 可以一直保留。新项目只需按需修改根 `package.json` 的名称、介绍和作者，无需批量替换内部包引用。

GitHub Actions 自动检查模板构建、类型、lint、格式和测试，并将 Server 产物复制到仓库外验证生产依赖安装和 HTTP 启动。

<!-- web:start -->

CI 同时验证完整前后端和 `--no-web` 两种结果。裁剪后的新项目只保留后端检查任务。

<!-- web:end -->

## License

MIT © lixinqiany
