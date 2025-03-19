# @manzhixing/vite-plugin-svg-sprite-gen
> **SVG Sprite Generator for Vite**

## Install

```bash
npm install @manzhixing/vite-plugin-svg-sprite-gen -D

# OR

yarn add @manzhixing/vite-plugin-svg-sprite-gen -D

# OR

pnpm add @manzhixing/vite-plugin-svg-sprite-gen -D

```

## Usage

### 基础用法

1. 在 `vite.config.ts` 中引入插件
```ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import SVGSpriteGen from '@manzhixing/vite-plugin-svg-sprite-gen'

export default defineConfig({
    plugins: [vue(), SvgSpriteGen()]
})
```
2. 在 `main.ts` 中引入虚拟模块
```ts
import 'virtual:svg-sprite-gen'
```

3. 在 `.vue` 文件中使用
```html
<template>
    <svg>
        <use xlink:href="#home" href="#home"></use>
    </svg>  
</template>
```

### 配置选项

```ts
// ...
import SVGSpriteGen from '@manzhixing/vite-plugin-svg-sprite-gen'

export default defineConfig({
    plugins: [vue(), SvgSpriteGen({
        // 配置选项
    })]
})
```

1. **include**
    > 需要生成 SVG 精灵的文件路径列表

    类型: `string[]`  
    默认值: `['**/*.svg']`
2. **exclude**
    > 不需要生成 SVG 精灵的文件路径列表

    类型: `string[]`  
    默认值: `['**/node_modules/**', '**/dist/**']`
3. **svgoConf**
    > SVGO 配置，可以是一个布尔值或 SVGO 配置对象

    类型: `boolean | Config`  
    默认值: `true`  
    说明: 如果为 `true`，可以在项目根目录下创建一个 `svgo.config.js` 文件，然后导出一个 SVGO 配置对象
4. **symbolId**
    > SVG 精灵中每个图标的 ID 前缀

    类型: `string`  
    默认值: `[name]`  
    说明: 必须包含 [name] 这个占位符，它将被替换为实际的文件名或图标名称，用于动态生成唯一的 ID。   
    示例: 文件为 `home.vue` 配置为 `icon-[name]`，那么生成的id为`icon-home`
5. **output**
    > SVG 精灵文件的输出路径

    类型: `string`  
    默认值: `sprite.svg`
6. **mode**
    > SVG 精灵的加载方式，可以是 'virtual' 或 'inline'

    类型: `'virtual' | 'inline'`   
    默认值: `'virtual'`  
    说明: `inline` 模式下，会在 `HTML` 文件中注入 `SVG 精灵`,无需引入虚拟模块直接使用

## License

> **MIT**
