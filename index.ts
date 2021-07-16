import * as PIXI from 'pixi.js'

/** Define the dash: [dash length, gap size, dash size, gap size, ...] */
export type Dashes = number[]

export interface DashLineOptions {
    dash?: Dashes,
    width?: number,
    color?: number,
    alpha?: number,
    scale?: number,
    useTexture?: boolean,
}

const dashLineOptionsDefault: Partial<DashLineOptions> = {
    dash: [10, 5],
    width: 1,
    color: 0xffffff,
    alpha: 1,
    scale: 1,
    useTexture: false,
}

export class DashLine {
    graphics: PIXI.Graphics

    /** current length of the line */
    lineLength: number

    /** cursor location */
    cursor = new PIXI.Point()

    /** desired scale of line */
    scale = 1

    // sanity check to ensure the lineStyle is still in use
    private activeTexture: PIXI.Texture

    private start: PIXI.Point

    private dashSize: number
    private dash: number[]

    private useTexture: boolean


    // cache of PIXI.Textures for dashed lines
    static dashTextureCache: Record<string, PIXI.Texture> = {}

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
    constructor(graphics: PIXI.Graphics, options: DashLineOptions = {}) {
        this.graphics = graphics
        options = { ...dashLineOptionsDefault, ...options }
        this.dash = options.dash
        this.dashSize = this.dash.reduce((a, b) => a + b)
        this.useTexture = options.useTexture
        if (this.useTexture) {
            const texture = DashLine.getTexture(options, this.dashSize)
            graphics.lineTextureStyle({
                width: options.width * options.scale,
                color: options.color,
                alpha: options.alpha,
                texture,
            })
            this.activeTexture = texture
        } else {
            this.graphics.lineStyle({
                width: options.width * options.scale,
                color: options.color,
                alpha: options.alpha,
            })
        }
        this.scale = options.scale
    }

    private static distance(x1: number, y1: number, x2: number, y2: number): number {
        return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))
    }

    moveTo(x: number, y: number) {
        this.lineLength = 0
        this.cursor.set(x, y)
        this.start = new PIXI.Point(x, y)
        this.graphics.moveTo(this.cursor.x, this.cursor.y)
    }

    lineTo(x: number, y: number) {
        if (typeof this.lineLength === undefined) {
            this.moveTo(0, 0)
        }
        const length = DashLine.distance(this.cursor.x, this.cursor.y, x, y)
        const angle = Math.atan2(y - this.cursor.y, x - this.cursor.x)
        if (this.useTexture) {
            this.graphics.moveTo(this.cursor.x, this.cursor.y)
            this.adjustLineStyle(angle)
            this.graphics.lineTo(x, y)
            this.lineLength += length
        } else {
            const closed = x === this.start.x && y === this.start.y
            const cos = Math.cos(angle)
            const sin = Math.sin(angle)
            let x0 = this.cursor.x
            let y0 = this.cursor.y

            // find the first part of the dash for this line
            const place = this.lineLength % (this.dashSize * this.scale)
            let dashIndex: number = 0, dashStart: number = 0
            let dashX = 0
            for (let i = 0; i < this.dash.length; i++) {
                const dashSize = this.dash[i] * this.scale
                if (place < dashSize) {
                    dashIndex = i
                    dashStart = place - dashX
                    break
                } else {
                    dashX += dashSize
                }
            }

            let remaining = length
            let count = 0
            while (remaining > 0 && count++ < 1000) {
                const dashSize = this.dash[dashIndex] * this.scale - dashStart
                let dist = remaining > dashSize ? dashSize : remaining
                if (closed) {
                    // if connected back to the first point add a gap if needed
                    const remainingDistance = DashLine.distance(x0, y0, this.start.x, this.start.y)
                    if (remainingDistance <= dist) {
                        if (dashIndex % 2 === 0) {
                            const lastDash = dist - this.dash[this.dash.length - 1] * this.scale
                            // console.log(lastDash, remaining, dashSize)
                            // if (lastDash < 0) debugger
                            x0 += cos * lastDash
                            y0 += sin * lastDash
                            this.graphics.lineTo(x0, y0)
                        }
                        break
                    }
                }
                x0 += cos * dist
                y0 += sin * dist
                if (dashIndex % 2) {
                    this.graphics.moveTo(x0, y0)
                } else {
                    this.graphics.lineTo(x0, y0)
                }
                remaining -= dist

                dashIndex++
                dashIndex = dashIndex === this.dash.length ? 0 : dashIndex
                dashStart = 0
            }
            if (count >= 1000) console.log('failure', this.scale)
        }
        this.lineLength += length
        this.cursor.set(x, y)
    }

    circle(x: number, y: number, radius: number, points = 80) {
        const interval = Math.PI * 2 / points
        let angle = 0
        const first = [x + Math.cos(angle) * radius, y + Math.sin(angle) * radius]
        this.moveTo(first[0], first[1])
        angle += interval
        for (let i = 1; i < points + 1; i++) {
            const next = i === points ? first : [x + Math.cos(angle) * radius, y + Math.sin(angle) * radius]
            this.lineTo(next[0], next[1])
            angle += interval
        }
    }

    ellipse(x: number, y: number, radiusX: number, radiusY: number, points = 80) {
        const interval = Math.PI * 2 / points
        let first: { x: number, y: number }
        for (let i = 0; i < Math.PI * 2; i += interval) {
            const x0 = x - radiusX * Math.sin(i)
            const y0 = y - radiusY * Math.cos(i)
            if (i === 0) {
                this.moveTo(x0, y0)
                first = { x: x0, y: y0 }
            } else {
                this.lineTo(x0, y0)
            }
        }
        this.lineTo(first.x, first.y)
    }

    // adjust the matrix of the dashed texture
    private adjustLineStyle(angle: number) {
        const lineStyle = this.graphics.line
        if (lineStyle.texture !== this.activeTexture) {
            console.warn('DashLine will not work if lineStyle is changed between graphics commands')
        }
        lineStyle.matrix = new PIXI.Matrix()
        lineStyle.matrix.rotate(angle).translate(this.cursor.x + this.lineLength * Math.cos(angle) * this.scale, this.cursor.y + this.lineLength * Math.sin(angle) * this.scale)
        if (this.scale !== 1) lineStyle.matrix.scale(this.scale, this.scale)
        this.graphics.lineStyle(lineStyle)
    }

    // creates or uses cached texture
    private static getTexture(options: DashLineOptions, dashSize: number): PIXI.Texture {
        const key = options.dash.toString()
        if (DashLine.dashTextureCache[key]) {
            return DashLine.dashTextureCache[key]
        }
        const canvas = document.createElement("canvas")
        canvas.width = dashSize
        canvas.height = options.width
        const context = canvas.getContext("2d")
        if (!context) return
        context.strokeStyle = "black"
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
        const texture = DashLine.dashTextureCache[key] = PIXI.Texture.from(canvas)
        texture.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST
        return texture
    }
}