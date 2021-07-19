import * as PIXI from 'pixi.js';
/** Define the dash: [dash length, gap size, dash size, gap size, ...] */
export declare type Dashes = number[];
export interface DashLineOptions {
    dash?: Dashes;
    width?: number;
    color?: number;
    alpha?: number;
    scale?: number;
    useTexture?: boolean;
}
export declare class DashLine {
    graphics: PIXI.Graphics;
    /** current length of the line */
    lineLength: number;
    /** cursor location */
    cursor: PIXI.Point;
    /** desired scale of line */
    scale: number;
    private activeTexture;
    private start;
    private dashSize;
    private dash;
    private useTexture;
    static dashTextureCache: Record<string, PIXI.Texture>;
    /**
     * Create a DashLine
     * @param graphics
     * @param [options]
     * @param [options.useTexture=false] - use the texture based render (useful for very large or very small dashed lines)
     * @param [options.dashes=[10,5] - an array holding the dash and gap (eg, [10, 5, 20, 5, ...])
     * @param [options.width=1] - width of the dashed line
     * @param [options.alpha=1] - alpha of the dashed line
     * @param [options.color=0xffffff] - color of the dashed line
     */
    constructor(graphics: PIXI.Graphics, options?: DashLineOptions);
    private static distance;
    moveTo(x: number, y: number): this;
    lineTo(x: number, y: number, closePath?: boolean): this;
    closePath(): void;
    drawCircle(x: number, y: number, radius: number, points?: number): this;
    drawEllipse(x: number, y: number, radiusX: number, radiusY: number, points?: number): this;
    drawPolygon(points: PIXI.Point[] | number[]): this;
    drawRect(x: number, y: number, width: number, height: number): this;
    private adjustLineStyle;
    private static getTexture;
}
