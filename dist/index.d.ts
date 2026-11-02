import * as PIXI from "pixi.js";
/** Define the dash: [dash length, gap size, dash size, gap size, ...] */
export type Dashes = number[];
export type DashLineOptions = {
    dash?: Dashes;
    /** where the line starts in the dash pattern (in unscaled dash units); change and redraw to animate the dashes */
    dashOffset?: number;
    width?: number;
    color?: PIXI.ColorSource;
    alpha?: number;
    scale?: number;
    useTexture?: boolean;
    cap?: PIXI.LineCap;
    join?: PIXI.LineJoin;
    alignment?: number;
};
export declare class DashLine {
    graphics: PIXI.Graphics;
    /** current length of the line */
    lineLength: number;
    /** cursor location */
    cursor: PIXI.Point;
    /** desired scale of line */
    scale: number;
    /** where each line starts in the dash pattern (in unscaled dash units); applied at moveTo */
    dashOffset: number;
    private start;
    private startPlace;
    private dashSize;
    private dash;
    private useTexture;
    private texture;
    private options;
    static dashTextureCache: Record<string, PIXI.Texture>;
    /**
     * Create a DashLine
     * @param graphics
     * @param [options]
     * @param [options.useTexture=false] - use the texture based render (useful for very large or very small dashed lines)
     * @param [options.dash=[10,5]] - an array holding the dash and gap (eg, [10, 5, 20, 5, ...])
     * @param [options.dashOffset=0] - where the line starts in the dash pattern (change and redraw to animate)
     * @param [options.width=1] - width of the dashed line
     * @param [options.alpha=1] - alpha of the dashed line
     * @param [options.color=0xffffff] - color of the dashed line
     * @param [options.scale=1] - scale of the dashes and width (eg, 1 / viewport.scale.x keeps the line the same size when zooming)
     * @param [options.cap=butt] - line cap style for the dashes (only works for useTexture: false)
     * @param [options.join=miter] - line join style for the dashes (only works for useTexture: false)
     * @param [options.alignment=0.5] - alignment of the line (pixi.js v8: 0.5 = middle, 1 = inside, 0 = outside)
     */
    constructor(graphics: PIXI.Graphics, options?: DashLineOptions);
    /** sets the graphics element's stroke style to this dashed line's style (so graphics.stroke() draws with it) */
    setStrokeStyle(): this;
    /**
     * Strokes the dashed path drawn since the last stroke (like PIXI.Graphics.stroke()).
     * Lines drawn with useTexture: true are stroked as they are drawn, so this is only required for useTexture: false.
     */
    stroke(): this;
    private getStrokeStyle;
    private static distance;
    private getPlace;
    moveTo(x: number, y: number): this;
    lineTo(x: number, y: number, closePath?: boolean): this;
    closePath(): this;
    /**
     * Draws a dashed quadratic curve from the cursor
     * @param [points=20] - number of line segments used to draw the curve
     */
    quadraticCurveTo(cpx: number, cpy: number, x: number, y: number, points?: number): this;
    /**
     * Draws a dashed cubic bezier curve from the cursor
     * @param [points=20] - number of line segments used to draw the curve
     */
    bezierCurveTo(cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number, points?: number): this;
    private static transform;
    /**
     * Draws a dashed arc (starts a new line at the start of the arc)
     * @param startAngle - in radians
     * @param endAngle - in radians (if smaller than startAngle, the arc is drawn counterclockwise)
     * @param [points=80] - number of line segments used to draw the arc
     */
    arc(cx: number, cy: number, radius: number, startAngle: number, endAngle: number, points?: number, matrix?: PIXI.Matrix): this;
    private arcTo;
    circle(x: number, y: number, radius: number, points?: number, matrix?: PIXI.Matrix): this;
    ellipse(x: number, y: number, radiusX: number, radiusY: number, points?: number, matrix?: PIXI.Matrix): this;
    poly(points: PIXI.PointData[] | number[], matrix?: PIXI.Matrix): this;
    rect(x: number, y: number, width: number, height: number, matrix?: PIXI.Matrix): this;
    /**
     * Draws a dashed rectangle with rounded corners
     * @param [radius=10] - corner radius (limited to half the smaller side)
     * @param [points=10] - number of line segments used to draw each corner
     */
    roundRect(x: number, y: number, width: number, height: number, radius?: number, points?: number, matrix?: PIXI.Matrix): this;
    private getTextureStyle;
    private static getTexture;
}
