import {createFilter, normalizePath, type ResolvedConfig, type Plugin, ViteDevServer} from 'vite';
import {type Config} from 'svgo';
import {resolve} from 'path';
import {writeFileSync} from 'fs';
import generateSVGSprite from "./generateSVGSprite";

// 定义插件的配置接口
interface SVGSpriteGenOptions {
    include: string[];       // 包含的文件匹配模式
    exclude: string[];       // 排除的文件匹配模式
    svgoConf: boolean | Config; // SVGO 配置，用于优化 SVG 文件
    symbolId: string;        // SVG symbol 的 ID 模板
    output: string;          // 生成的 SVG 精灵文件名
    mode: 'virtual' | 'inline'; // 模式：虚拟模块或内联到 HTML
}


// 定义插件名称和虚拟模块 ID
const VITE_PLUGIN_NAME = 'vite-plugin-svg-sprite-gen';
const VIRTUAL_MODULE_ID = 'virtual:svg-sprite-gen';
const RESOLVED_VIRTUAL_MODULE_ID = '\0' + VIRTUAL_MODULE_ID;

// 插件的主函数
export default function SVGSpriteGen(options?: Partial<SVGSpriteGenOptions>): Plugin {
    // 默认配置
    const defaultOptions: SVGSpriteGenOptions = {
        include: ['**/*.svg'], // 默认包含所有 SVG 文件
        exclude: ['**/node_modules/**', '**/dist/**'], // 默认排除 node_modules 和 dist 目录
        svgoConf: true, // 启用 SVGO 优化
        symbolId: '[name]', // 默认 symbolId 使用文件名
        output: 'sprite.svg', // 默认输出文件名
        mode: 'virtual' // 默认模式为虚拟模块
    };

    // 合并用户传入的配置和默认配置
    const SVGSpriteGenOpts = Object.assign(defaultOptions, options);
    const {include, exclude, output, mode} = SVGSpriteGenOpts;

    // 创建文件过滤器，用于匹配和排除文件
    const filter = createFilter(include, exclude);
    let config: ResolvedConfig; // Vite 的配置对象
    let SVGSpriteElement = ''; // 存储生成的 SVG 精灵内容

    // 文件变化时的处理函数
    const handleFileChange = async (file: string, server: ViteDevServer) => {
        if (filter(normalizePath(file))) { // 如果文件匹配过滤器
            SVGSpriteElement = await generateSVGSprite({...SVGSpriteGenOpts, root: config.root}); // 重新生成 SVG 精灵
            // 重新触发虚拟模块的加载
            const module = server.moduleGraph.getModuleById(RESOLVED_VIRTUAL_MODULE_ID);
            if (module) {
                server.moduleGraph.invalidateModule(module);
            }
            server.ws.send({ // 触发页面重新加载
                type: 'full-reload',
                path: '*'
            });
        }
    };

    return {
        name: VITE_PLUGIN_NAME, // 插件名称
        async configResolved(_config) {
            config = _config; // 保存 Vite 的配置对象
        },
        configureServer(server) {
            // 监听文件变化
            server.watcher.add(include);
            server.watcher.on("add", (file) => handleFileChange(file, server)); // 文件新增
            server.watcher.on("change", (file) => handleFileChange(file, server)); // 文件修改
            server.watcher.on("unlink", (file) => handleFileChange(file, server)); // 文件删除
        },
        async buildStart() {
            // 构建开始时生成 SVG 精灵
            SVGSpriteElement = await generateSVGSprite({...SVGSpriteGenOpts, root: config.root});
            if (config.command === 'build') {
                // 在构建模式下，将 SVG 精灵作为资产输出
                this.emitFile({
                    type: 'asset',
                    source: SVGSpriteElement,
                    fileName: output
                });
            } else {
                // 在开发模式下，将 SVG 精灵写入到输出目录
                writeFileSync(resolve(config.build.outDir, output), SVGSpriteElement);
            }
        },
        transformIndexHtml(html) {
            // 在 HTML 文件中注入 SVG 精灵
            if (mode === 'inline') {
                return html.replace('</body>', `${SVGSpriteElement}</body>`);
            }
            return html;
        },
        resolveId(id) {
            // 解析虚拟模块 ID
            if (id === VIRTUAL_MODULE_ID) {
                return RESOLVED_VIRTUAL_MODULE_ID;
            }
        },
        load(id) {
            // 加载虚拟模块的内容
            if (id === RESOLVED_VIRTUAL_MODULE_ID) {
                return `const SVGSprite = \`${SVGSpriteElement}\`;
                        const parser = new DOMParser();
                        const SVGDoc = parser.parseFromString(SVGSprite, 'image/svg+xml');
                        const SVGNode = SVGDoc.documentElement;
                        document.body.appendChild(SVGNode);
                        export default SVGSprite;`;
            }
        },
        transform(code, id) {
            // 如果文件匹配过滤器，则不处理代码
            if (filter(id)) return null;
            return code;
        }
    };
}
