# 项目脚本

脚本按职责分目录，目前的构建辅助逻辑集中在 `build/`，供 Node 应用使用。脚本使用 Node.js 24 原生 TypeScript 支持运行，工具依赖由根目录 `devDependencies` 管理。

- `build/dependencies.ts`：分析运行依赖，确定工作区包与第三方依赖的打包边界。
- `build/dist.ts`：生成交付清单、裁剪锁文件并复制资源。
- `build/prepare-dist.ts`：整理 `dist` 的命令入口，由 Server 构建命令调用；以后新增 Node 应用也可复用同一实现。
- `tsconfig.json`：递归检查所有脚本的共享 TypeScript 配置。

后续新增脚本按实际职责归入对应目录，例如发布脚本归入 `release/`，部署脚本归入 `deploy/`，有实际需要时再创建。

`getRuntimeDependencies` 读取应用清单和仓库锁文件，递归识别需要打入产物的工作区包，并收集它们的第三方运行依赖。应用的打包配置使用同一个结果设置打包边界。

`prepareDist` 在编译完成后整理 `dist`，复用 pnpm 官方库裁剪传递依赖图，保留已锁定的版本，生成运行清单及独立安装设置，并复制应用 `assets/` 与仓库 LICENSE。这个过程不会访问依赖仓库、安装依赖或改变根锁文件。

多个被打入应用的工作区包要求同名依赖的不同解析版本时，会中止构建并要求先统一依赖。依赖声明与锁文件不一致也会中止。当前支持 registry 依赖和 `workspace:` 包；引入 catalog、外部本地文件依赖、patch 或 pnpmfile hook 时，需要先扩展对应的交付处理。

Turbo 通过 `globalDependencies: ["scripts/**"]` 跟踪这些脚本。Server 的 `check-types` 同时运行脚本项目的检查，`lint` 同时检查脚本；根目录保留按应用区分的开发、构建与启动命令。直接由 Node 加载的脚本引用保留 `.ts` 后缀，业务源码的导入仍然可以省略后缀。

在仓库根目录单独验证：

```sh
pnpm exec tsc --noEmit -p scripts/tsconfig.json
pnpm exec eslint scripts --max-warnings=0
```

交付验证应把应用的整个 `dist` 复制到仓库外，执行 `pnpm install --prod --frozen-lockfile` 和 `pnpm start`。

## 可选初始化

`init.ts --no-web` 只使用 Node 标准库，在安装依赖前裁剪前端，并更新配置与文档。无参数和 `--help` 只显示用法；默认模板无需初始化。裁剪后执行 `pnpm install --no-frozen-lockfile` 更新现有锁文件。

`init.test.ts` 在临时副本中验证默认无修改、裁剪保留后端构建、参数错误、重复执行及安装后拒绝修改等行为：

```sh
node --test scripts/init.test.ts
```
