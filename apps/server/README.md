# @repo/server

在仓库根目录使用 `pnpm dev:server`、`pnpm build:server`、`pnpm start:server`，这些命令只负责后端 API。

后端默认监听 `127.0.0.1:3000`，可用 `PORT` 修改。

<!-- web:start -->

Web 和 Server 分别启动。开发时在两个终端执行 `pnpm dev:server` 和 `pnpm dev:web`；前端默认监听 `127.0.0.1:5173`，可用 `WEB_PORT` 修改。前端开发服务与本地构建预览将 `/api` 转发到后端，修改后端端口时两端都设置相同的 `PORT`。

使用构建产物时分别执行 `pnpm build:server`、`pnpm build:web`，再运行 `pnpm start:server`、`pnpm start:web`。后者仅用于本地预览；正式部署由静态文件服务器提供前端并代理 `/api`。

<!-- web:end -->

开发入口 `dev.ts` 编译到 `.dev/`；生产入口 `src/main.ts` 编译到 `dist/main.js`，共用 `src/bootstrap.ts`。Turbo 监听后端和 core 的变化并重启，正式启动只运行构建后的 JavaScript。开发数据目录为仓库下的 `.data/`，生产数据目录为交付目录内的 `data/`。可用 `DATA_DIR` 指定独立持久化目录；相对路径基于启动工作目录解析，未指定时的默认路径与工作目录无关。

## 断点调试

在 VS Code 中打开仓库根目录，进入“运行和调试”，选择 `Server: Debug` 并按 F5。它会启动现有的 `pnpm dev:server`，保留类型检查、lint 和保存后重启；调试器自动连接到 Nest 启动的应用进程及重启后的新进程。

可以直接在 `src/` 下的 TypeScript 文件设置断点。例如，在 `src/app.service.ts` 的 `getHello()` 内设置断点，再访问 `http://127.0.0.1:3000/api`。启动逻辑也可以提前设置断点。结束调试时停止整个启动会话，或在对应终端按 Ctrl+C。

调试使用集成终端。Turbo 的开发任务透传编辑器注入的 `NODE_OPTIONS` 和 `VSCODE_INSPECTOR_OPTIONS`，让调试器能跟随子进程；source map 配置将 Rspack 中的源码路径映射到本地文件。普通开发仍使用原来的 `pnpm dev:server`。

## 构建与交付

Nest CLI 使用 Rspack builder，保留内置 SWC 的装饰器及元数据处理。`rspack.config.ts` 选择开发或生产入口，将工作区运行依赖打入产物，并把第三方依赖保留为 ESM 引用。源码的相对 TypeScript 导入不写扩展名。Node 的 `import.meta` 和运行时 URL 保留到运行阶段，避免将数据目录当作待打包资源。

根目录的构建命令会先通过完整类型检查。构建后的 `dist` 包含运行入口、JS 分块、source maps、运行用 `package.json`、裁剪后的 `pnpm-lock.yaml` 和独立安装设置。复制整个目录到目标机器，在里面执行：

```sh
pnpm install --prod --frozen-lockfile
pnpm start
```

目标机器需要 Node.js 和 pnpm，不需要 Nest CLI、Rspack、TypeScript 或原仓库。`assets/` 中的应用资源会被复制到 `dist/assets/`。
