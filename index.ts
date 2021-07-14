import * as PIXI from 'pixi.js'

/** Define the dash: [dash length, gap size, dash size, gap size, ...] */
export type Dashes = number[]

export interface DashLineOptions {
    graphics: PIXI.Graphics,
    dash?: Dashes,
    width?: number,
    color?: number,
    alpha?: number,
    scale?: number,
}

const dashLineOptionsDefault: Partial<DashLineOptions> = {
    dash: [10, 5],
    width: 1,
    color: 0xffffff,
    alpha: 1,
    scale: 1,
}

// cache of PIXI.Textures for dashed lines
const dashes: Record<string, PIXI.Texture> = {}

// this rotates the dashed line texture
function adjustLineStyle(graphics: PIXI.Graphics, angle: number, lineLength = 0, scale: number) {
    const lineStyle = graphics.line
    lineStyle.matrix = new PIXI.Matrix()
    lineStyle.matrix.translate(lineLength, 0)
    if (angle) lineStyle.matrix.rotate(angle)
    if (scale !== 1) lineStyle.matrix.scale(scale, scale)
    graphics.lineStyle(lineStyle)
}

/**
 *
 * @param options
 * @param [options.dashes=[10,5] - an array holding the dash and gap (eg, [10, 5, 20, 5, ...])
 * @param [options.width=1] - width of the dashed line
 * @param [options.alpha=1] - alpha of the dashed line
 * @param [options.color=0xffffff] - color of the dashed line
 * @param [options.scale] - scale for the dashed line (this is optional and used to ensure dashed line stays same size regardless of zoom)
 */
export function lineStyle(options: DashLineOptions): number {
    options = { ...dashLineOptionsDefault, ...options }
    const key = options.dash.toString()
    let texture: PIXI.Texture = dashes[key]
    if (!texture) {
        const total = options.dash.reduce((a, b) => a + b)
        const canvas = document.createElement("canvas")
        canvas.width = total
        canvas.height = options.width
        const context = canvas.getContext("2d")
        if (!context) return
        context.strokeStyle = "white"
        context.globalAlpha = options.alpha
        context.lineWidth = options.width
        let x = 0
        const y = options.width / 2
        context.moveTo(x, y)
        for (let i = 0; i < options.dash.length; i += 2) {
            x += options.dash[i]
            context.lineTo(x, y)
            if (options.dash.length !== i + 1) {
                x += options.dash[i + 1]
                context.moveTo(x, y)
            }
        }
        context.stroke()
        texture = dashes[key] = PIXI.Texture.from(canvas)
        texture.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST
    }
    options.graphics.lineTextureStyle({
        width: options.width * options.scale,
        color: options.color,
        alpha: options.alpha,
        texture,
    })
}

/**
 *
 * @param g
 * @param x1
 * @param y1
 * @param x2
 * @param y2
 * @param [lineLength=0] - current line length (to properly wrap texture, see Dash.circle() implementation)
 * @param [scale=1]
 */
export function line(g: PIXI.Graphics, x1: number, y1: number, x2: number, y2: number, lineLength: number = 0, scale: number = 1) {
    g.moveTo(x1, y1)
    adjustLineStyle(g, Math.atan2(y2 - y1, x2 - x1), x1 + lineLength, scale)
    g.lineTo(x2, y2)
}

export function circle(g: PIXI.Graphics, x: number, y: number, radius: number, scale: number = 1) {
    const points = 5
    const interval = Math.PI * 2 / points
    let angle = 0
    const first = [x + Math.cos(angle) * radius, y + Math.sin(angle) * radius]
    let last = first
    angle += interval
    let lineLength = 0
    for (let i = 1; i < points + 1; i++) {
        const next = i === points ? first : [x + Math.cos(angle) * radius, y + Math.sin(angle) * radius]
        line(g, last[0], last[1], next[0], next[1], last[0] - lineLength, scale)
        lineLength += Math.sqrt(Math.pow(next[0] - last[0], 2) + Math.pow(next[1] - last[1], 2))
        last = next
        angle += interval
    }
}