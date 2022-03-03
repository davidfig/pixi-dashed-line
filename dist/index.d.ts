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
    useDots?: boolean;
    cap?: PIXI.LINE_CAP;
    join?: PIXI.LINE_JOIN;
    alignment?: number;
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
    private options;
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
     * @param [options.cap] - add a PIXI.LINE_CAP style to dashed lines (only works for useTexture: false)
     * @param [options.join] - add a PIXI.LINE_JOIN style to the dashed lines (only works for useTexture: false)
     * @param [options.alignment] - The alignment of any lines drawn (0.5 = middle, 1 = outer, 0 = inner)
     */
    constructor(graphics: PIXI.Graphics, options?: DashLineOptions);
    /** resets line style to enable dashed line (useful if lineStyle was changed on graphics element) */
    setLineStyle(): void;
    private static distance;
    moveTo(x: number, y: number): this;
    lineTo(x: number, y: number, closePath?: boolean): this;
    closePath(): void;
    drawCircle(x: number, y: number, radius: number, points?: number, matrix?: PIXI.Matrix): this;
    drawEllipse(x: number, y: number, radiusX: number, radiusY: number, points?: number, matrix?: PIXI.Matrix): this;
    drawPolygon(points: PIXI.Point[] | number[], matrix?: PIXI.Matrix): this;
    drawRect(x: number, y: number, width: number, height: number, matrix?: PIXI.Matrix): this;
    private adjustLineStyle;
    private static getTexture;
}
