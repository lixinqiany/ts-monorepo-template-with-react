# @repo/web

React + Vite 前端，使用 `@repo/ui` 中的源码组件。根目录命令为 `pnpm dev:web`、`pnpm build:web` 和 `pnpm start:web`。

开发时另外启动 `pnpm dev:server`。默认 Web 端口为 5173，后端端口为 3000；使用 `WEB_PORT` 和 `PORT` 覆盖。开发服务与本地预览将 `/api` 代理到后端。

`pnpm build:web` 生成 `dist` 静态资源。`pnpm start:web` 使用 Vite preview，只用于本地预览；正式部署需要静态文件服务器和 `/api` 反向代理。

浏览器代码可以使用 UI 或浏览器兼容的共享包；`@repo/core` 包含 Node 文件系统逻辑，不应导入这里。
