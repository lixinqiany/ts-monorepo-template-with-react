# @repo/eslint-config

仓库统一使用 ESLint 10 flat config。根目录 `eslint.config.mjs` 调用 `createConfig(import.meta.dirname)`，各应用运行 `eslint . --max-warnings=0`，规则集中维护在本包。

## 选型依据

采用 ESLint `recommended` 和 typescript-eslint `recommendedTypeChecked`，通过 `projectService` 读取各包的 tsconfig。前者提供基础 JavaScript 检查，后者检查 Promise、any 的不安全传播、错误的类型操作等问题。

这是官方推荐的起点。没有直接启用 `all` 或整个 `strictTypeChecked`：后者包含更多主观约束，官方也说明其规则可能在非 major 升级中调整。当前项目先在推荐集上补充明确有用的规则。[typescript-eslint 配置说明](https://typescript-eslint.io/users/configs/)

格式交给 Prettier，最后应用 `eslint-config-prettier` 关闭冲突规则，不在 ESLint 里重复运行格式化。[Prettier 官方建议](https://prettier.io/docs/integrating-with-linters)

## 规则范围

`index.js` 提供通用 JS/TS、Node 与 Server 测试规则，包括类型感知检查、Promise 处理、未使用变量、联合类型分支完整性和类型导入。`createConfig(rootDirectory, ...additionalConfigs)` 接收附加规则，最后统一应用 Prettier 的冲突关闭配置。

<!-- web:start -->

`react.js` 通过独立的 `@repo/eslint-config/react` 入口提供 React Hooks、JSX、DOM 基础和 Vite Fast Refresh 规则。根配置将 `reactConfig` 传入 `createConfig`。这些规则只作用于 Web/UI，Vite 配置文件使用 Node 全局变量。

React 插件依赖与入口一起由 `--no-web` 裁剪。当前 JSX/DOM 基础规则不等于完整可访问性检查，后续接入 a11y 插件时应检查 ESLint 版本兼容性。

<!-- web:end -->

## 关键约定

- `==` / `!=` 默认禁止，但允许 `value == null`，用来同时判断 null 和 undefined。
- 未使用的参数、变量、catch 绑定和数组解构变量可用 `_` 前缀明确忽略；普通未使用变量仍报错。对象 rest 解构中为排除字段而取出的属性允许不用。
- `switch-exhaustiveness-check` 检查已知联合类型或枚举成员，不要求普通 string/number 的 switch 列举所有可能值。[规则说明](https://typescript-eslint.io/rules/switch-exhaustiveness-check/)
- Promise 必须明确处理；在 try/catch 内返回 Promise 时使用 `return await`，让本层 catch 能捕获异步拒绝。`void promise` 只是明确忽略，不能代替运行时错误处理。
- 类型导入通过 ESLint 提供自动修复；Nest 装饰器文件的元数据由 tsconfig 告知解析器，不会把依赖注入需要的类盲目改为 `import type`。[装饰器注意事项](https://typescript-eslint.io/rules/consistent-type-imports/)
- 同一条导入中有运行时值和类型时可写 `import { value, type T }`；全部都是类型时由 `no-import-type-side-effects` 要求使用 `import type`，避免 `verbatimModuleSyntax` 把它编译为仍会加载模块的 `import {}`。[规则说明](https://typescript-eslint.io/rules/no-import-type-side-effects/)
- TypeScript 负责不可达代码和 switch 穿透，避免 ESLint 重复诊断；未使用变量则统一由 ESLint 负责。
- 保留预设中部分规则的 warning 级别，便于编辑器区分；由于命令带 `--max-warnings=0`，warning 也会使检查失败。
- 不统一禁止 console，不强制每个函数写返回类型，也不强制 import 字母排序；日志输出和 TypeScript 类型推断可以正常使用。

## 开发方式

根目录的开发命令通过 Turbo watch 并行执行启动、类型检查和 lint。编辑器通过工作区 ESLint/Prettier 扩展显示问题、保存格式化并应用可自动修复的规则；业务错误仍需手动处理。

```sh
# 全仓库检查和构建
pnpm exec turbo run build check-types lint

# 格式检查
pnpm exec prettier --check .

# 只修复一个应用中的可自动修复问题
pnpm --filter @repo/server exec eslint . --fix
```

共享包单独依赖 TypeScript 6.0.3，为 typescript-eslint 提供其支持的编译器 API；各应用现有的 TypeScript 编译器版本独立维护。升级时检查 [typescript-eslint 版本兼容范围](https://typescript-eslint.io/users/dependency-versions/)，不要仅因为应用升级就移除该依赖。

TypeScript 分层与具体编译选项见 [TypeScript 配置说明](../typescript-config/README.md)。
