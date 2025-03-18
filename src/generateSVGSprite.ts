import {optimize, loadConfig, type Config} from 'svgo';
import fg from 'fast-glob';
import {resolve, basename} from 'path';
import {readFileSync} from 'fs';

// 定义插件的配置接口
interface SVGSpriteGenOptions {
    include: string[];       // 包含的文件匹配模式
    exclude: string[];       // 排除的文件匹配模式
    svgoConf: boolean | Config; // SVGO 配置，用于优化 SVG 文件
    symbolId: string;        // SVG symbol 的 ID 模板
    output: string;          // 生成的 SVG 精灵文件名
    mode: 'virtual' | 'inline'; // 模式：虚拟模块或内联到 HTML
}

// 生成 SVG 精灵文件的函数
export default async function generateSVGSprite(options: SVGSpriteGenOptions & { root: string }) {
    // 默认的 SVGO 配置，用于优化 SVG 文件
    let svgoConfig: Config = {
        plugins: [
            {
                name: 'preset-default',
                params: {
                    overrides: {
                        removeViewBox: false // 不移除 viewBox 属性
                    }
                }
            }
        ]
    };

    // 加载 SVGO 配置文件（如果存在）
    const svgoLoadConfig = await loadConfig();
    if (typeof options.svgoConf === 'object') {
        svgoConfig = Object.assign(svgoConfig, options.svgoConf); // 合并用户自定义的 SVGO 配置
    }

    // 使用 fast-glob 查找匹配的 SVG 文件
    const SVGFiles = fg.sync(options.include, {
        cwd: options.root, // 以项目根目录为基准
        ignore: options.exclude, // 排除指定的文件或目录
        onlyFiles: true // 只匹配文件
    });

    // 生成 SVG 精灵内容
    const spriteContent = SVGFiles.map((file) => {
        const filePath = resolve(options.root, file); // 获取文件的绝对路径
        const SVGContent = readFileSync(filePath, 'utf-8'); // 读取 SVG 文件内容
        const optimizedSVG = options.svgoConf
            ? optimize(SVGContent, Object.assign(svgoConfig, svgoLoadConfig)).data // 如果启用了 SVGO，优化 SVG 内容
            : SVGContent; // 否则直接使用原始内容
        const id = options.symbolId.replace('[name]', basename(file, '.svg')); // 替换 symbolId 中的 [name] 为文件名
        return `<symbol id="${id}" viewBox="0 0 24 24">${optimizedSVG}</symbol>`; // 生成 symbol 元素
    }).join('\n'); // 将所有 symbol 元素连接成字符串

    // 返回完整的 SVG 精灵文件内容
    return `<svg xmlns="http://www.w3.org/2000/svg" style="display:none;">${spriteContent}</svg>`;
};
