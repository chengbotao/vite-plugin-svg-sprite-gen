import { Plugin } from 'vite';
import { Config } from 'svgo';

interface SVGSpriteGenOptions {
    include: string[];
    exclude: string[];
    svgoConf: boolean | Config;
    symbolId: string;
    output: string;
    mode: 'virtual' | 'inline';
}
declare function SVGSpriteGen(options?: Partial<SVGSpriteGenOptions>): Plugin;

export { SVGSpriteGen as default };
