import * as PIXI from "pixi.js"

/** Define the dash: [dash length, gap size, dash size, gap size, ...] */
export type Dashes = number[]

export type DashLineOptions = {
    dash?: Dashes
    /** where the line starts in the dash pattern (in unscaled dash units); change and redraw to animate the dashes */
    dashOffset?: number
    width?: number
    color?: PIXI.ColorSource
    alpha?: number
    scale?: number
    useTexture?: boolean
    cap?: PIXI.LineCap
    join?: PIXI.LineJoin
    alignment?: number
}

const dashLineOptionsDefault: Required<DashLineOptions> = {
    dash: [10, 5],
    dashOffset: 0,
    width: 1,
    color: 0xffffff,
    alpha: 1,
    scale: 1,
    useTexture: false,
    cap: "butt",
    join: "miter",
    alignment: 0.5,
}

const tempPoint = new PIXI.Point()

export class DashLine {
    graphics: PIXI.Graphics

    /** current length of the line */
    lineLength: number = 0

    /** cursor location */
    cursor = new PIXI.Point()

    /** desired scale of line */
    scale = 1

    /** where each line starts in the dash pattern (in unscaled dash units); applied at moveTo */
    dashOffset: number

    private start: PIXI.Point = new PIXI.Point(0, 0)

    // offset into the dash pattern at this.start (used to decide whether a closed path needs a final gap)
    private startPlace = 0

    private dashSize: number
    private dash: number[]

    private useTexture: boolean
    private texture: PIXI.Texture | undefined
    private options: Required<DashLineOptions>

    // cache of PIXI.Textures for dashed lines
    static dashTextureCache: Record<string, PIXI.Texture> = {}

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
    constructor(graphics: PIXI.Graphics, options: DashLineOptions = {}) {
        this.graphics = graphics
        this.options = { ...dashLineOptionsDefault, ...options }
        this.dash = this.options.dash
        this.dashSize = this.dash.reduce((a, b) => a + b)
        this.dashOffset = this.options.dashOffset
        this.useTexture = Boolean(this.options.useTexture)
        this.scale = this.options.scale
        if (this.useTexture) {
            this.texture = DashLine.getTexture(this.options, this.dashSize)
        }
        this.setStrokeStyle()
    }

    /** sets the graphics element's stroke style to this dashed line's style (so graphics.stroke() draws with it) */
    setStrokeStyle(): this {
        this.graphics.setStrokeStyle(this.getStrokeStyle())
        return this
    }

    /**
     * Strokes the dashed path drawn since the last stroke (like PIXI.Graphics.stroke()).
     * Lines drawn with useTexture: true are stroked as they are drawn, so this is only required for useTexture: false.
     */
    stroke(): this {
        if (!this.useTexture) {
            this.graphics.stroke(this.getStrokeStyle())
        }
        return this
    }

    private getStrokeStyle(): PIXI.StrokeStyle {
        const options = this.options
        return {
            width: options.width * this.scale,
            color: options.color,
            alpha: options.alpha,
            cap: options.cap,
            join: options.join,
            alignment: options.alignment,
        }
    }

    private static distance(
        x1: number,
        y1: number,
        x2: number,
        y2: number
    ): number {
        return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))
    }

    // place within the (scaled) dash pattern for a given line length
    private getPlace(lineLength: number): number {
        const size = this.dashSize * this.scale
        return ((lineLength % size) + size) % size
    }

    moveTo(x: number, y: number): this {
        this.lineLength = this.dashOffset * this.scale
        this.startPlace = this.getPlace(this.lineLength)
        this.cursor.set(x, y)
        this.start.set(x, y)
        this.graphics.moveTo(this.cursor.x, this.cursor.y)
        return this
    }

    lineTo(x: number, y: number, closePath?: boolean): this {
        const length = DashLine.distance(this.cursor.x, this.cursor.y, x, y)
        const angle = Math.atan2(y - this.cursor.y, x - this.cursor.x)
        const cos = Math.cos(angle)
        const sin = Math.sin(angle)

        // leaving a gap before the start only makes sense if the pattern starts with a dash
        const closed =
            closePath &&
            this.startPlace === 0 &&
            x === this.start.x &&
            y === this.start.y
        if (this.useTexture) {
            let x1 = x
            let y1 = y
            if (closed && this.dash.length % 2 === 0) {
                const gap = Math.min(
                    this.dash[this.dash.length - 1] * this.scale,
                    length
                )
                x1 -= cos * gap
                y1 -= sin * gap
            }

            // each segment needs its own stroke since the texture's matrix depends on the segment's angle
            this.graphics
                .moveTo(this.cursor.x, this.cursor.y)
                .lineTo(x1, y1)
                .stroke(this.getTextureStyle(angle))
        } else {
            let x0 = this.cursor.x
            let y0 = this.cursor.y

            // find the first part of the dash for this line
            const place = this.getPlace(this.lineLength)
            let dashIndex: number = 0
            let dashStart: number = 0
            let dashX = 0
            for (let i = 0; i < this.dash.length; i++) {
                const dashSize = this.dash[i] * this.scale
                if (place < dashX + dashSize) {
                    dashIndex = i
                    dashStart = place - dashX
                    break
                } else {
                    dashX += dashSize
                }
            }

            let remaining = length
            while (remaining > 0) {
                const dashSize = this.dash[dashIndex] * this.scale - dashStart
                const dist = remaining > dashSize ? dashSize : remaining
                if (closed) {
                    const remainingDistance = DashLine.distance(
                        x0 + cos * dist,
                        y0 + sin * dist,
                        this.start.x,
                        this.start.y
                    )
                    if (remainingDistance <= dist) {
                        if (dashIndex % 2 === 0) {
                            const lastDash =
                                DashLine.distance(
                                    x0,
                                    y0,
                                    this.start.x,
                                    this.start.y
                                ) -
                                this.dash[this.dash.length - 1] * this.scale
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
        }
        this.lineLength += length
        this.cursor.set(x, y)
        return this
    }

    closePath(): this {
        return this.lineTo(this.start.x, this.start.y, true)
    }

    /**
     * Draws a dashed quadratic curve from the cursor
     * @param [points=20] - number of line segments used to draw the curve
     */
    quadraticCurveTo(
        cpx: number,
        cpy: number,
        x: number,
        y: number,
        points = 20
    ): this {
        const x0 = this.cursor.x
        const y0 = this.cursor.y
        for (let i = 1; i <= points; i++) {
            const t = i / points
            const mt = 1 - t
            this.lineTo(
                mt * mt * x0 + 2 * mt * t * cpx + t * t * x,
                mt * mt * y0 + 2 * mt * t * cpy + t * t * y
            )
        }
        return this
    }

    /**
     * Draws a dashed cubic bezier curve from the cursor
     * @param [points=20] - number of line segments used to draw the curve
     */
    bezierCurveTo(
        cp1x: number,
        cp1y: number,
        cp2x: number,
        cp2y: number,
        x: number,
        y: number,
        points = 20
    ): this {
        const x0 = this.cursor.x
        const y0 = this.cursor.y
        for (let i = 1; i <= points; i++) {
            const t = i / points
            const mt = 1 - t
            const a = mt * mt * mt
            const b = 3 * mt * mt * t
            const c = 3 * mt * t * t
            const d = t * t * t
            this.lineTo(
                a * x0 + b * cp1x + c * cp2x + d * x,
                a * y0 + b * cp1y + c * cp2y + d * y
            )
        }
        return this
    }

    // applies the optional matrix to a point (returns a shared point)
    private static transform(
        x: number,
        y: number,
        matrix?: PIXI.Matrix
    ): PIXI.Point {
        tempPoint.set(x, y)
        if (matrix) {
            matrix.apply(tempPoint, tempPoint)
        }
        return tempPoint
    }

    /**
     * Draws a dashed arc (starts a new line at the start of the arc)
     * @param startAngle - in radians
     * @param endAngle - in radians (if smaller than startAngle, the arc is drawn counterclockwise)
     * @param [points=80] - number of line segments used to draw the arc
     */
    arc(
        cx: number,
        cy: number,
        radius: number,
        startAngle: number,
        endAngle: number,
        points = 80,
        matrix?: PIXI.Matrix
    ): this {
        const p = DashLine.transform(
            cx + Math.cos(startAngle) * radius,
            cy + Math.sin(startAngle) * radius,
            matrix
        )
        this.moveTo(p.x, p.y)
        return this.arcTo(cx, cy, radius, startAngle, endAngle, points, matrix)
    }

    // draws the arc from the cursor (which should be at startAngle)
    private arcTo(
        cx: number,
        cy: number,
        radius: number,
        startAngle: number,
        endAngle: number,
        points: number,
        matrix?: PIXI.Matrix
    ): this {
        const interval = (endAngle - startAngle) / points
        for (let i = 1; i <= points; i++) {
            const angle = startAngle + i * interval
            const p = DashLine.transform(
                cx + Math.cos(angle) * radius,
                cy + Math.sin(angle) * radius,
                matrix
            )
            this.lineTo(p.x, p.y)
        }
        return this
    }

    circle(
        x: number,
        y: number,
        radius: number,
        points = 80,
        matrix?: PIXI.Matrix
    ): this {
        const interval = (Math.PI * 2) / points
        const first = DashLine.transform(x + radius, y, matrix).clone()
        this.moveTo(first.x, first.y)
        for (let i = 1; i < points; i++) {
            const angle = i * interval
            const p = DashLine.transform(
                x + Math.cos(angle) * radius,
                y + Math.sin(angle) * radius,
                matrix
            )
            this.lineTo(p.x, p.y)
        }
        this.lineTo(first.x, first.y, true)
        return this
    }

    ellipse(
        x: number,
        y: number,
        radiusX: number,
        radiusY: number,
        points = 80,
        matrix?: PIXI.Matrix
    ): this {
        const interval = (Math.PI * 2) / points
        const first = DashLine.transform(x, y - radiusY, matrix).clone()
        this.moveTo(first.x, first.y)
        for (let i = 1; i < points; i++) {
            const angle = i * interval
            const p = DashLine.transform(
                x - radiusX * Math.sin(angle),
                y - radiusY * Math.cos(angle),
                matrix
            )
            this.lineTo(p.x, p.y)
        }
        this.lineTo(first.x, first.y, true)
        return this
    }

    poly(points: PIXI.PointData[] | number[], matrix?: PIXI.Matrix): this {
        if (typeof points[0] === "number") {
            const numbers = points as number[]
            const first = DashLine.transform(numbers[0], numbers[1], matrix)
            this.moveTo(first.x, first.y)
            for (let i = 2; i < numbers.length; i += 2) {
                const p = DashLine.transform(numbers[i], numbers[i + 1], matrix)
                this.lineTo(p.x, p.y, i === numbers.length - 2)
            }
        } else {
            const pointData = points as PIXI.PointData[]
            const first = DashLine.transform(
                pointData[0].x,
                pointData[0].y,
                matrix
            )
            this.moveTo(first.x, first.y)
            for (let i = 1; i < pointData.length; i++) {
                const p = DashLine.transform(
                    pointData[i].x,
                    pointData[i].y,
                    matrix
                )
                this.lineTo(p.x, p.y, i === pointData.length - 1)
            }
        }
        return this
    }

    rect(
        x: number,
        y: number,
        width: number,
        height: number,
        matrix?: PIXI.Matrix
    ): this {
        return this.poly(
            [x, y, x + width, y, x + width, y + height, x, y + height, x, y],
            matrix
        )
    }

    /**
     * Draws a dashed rectangle with rounded corners
     * @param [radius=10] - corner radius (limited to half the smaller side)
     * @param [points=10] - number of line segments used to draw each corner
     */
    roundRect(
        x: number,
        y: number,
        width: number,
        height: number,
        radius: number = 10,
        points = 10,
        matrix?: PIXI.Matrix
    ): this {
        radius = Math.max(0, Math.min(radius, Math.min(width, height) / 2))
        const half = Math.PI / 2

        const start = DashLine.transform(x + radius, y, matrix).clone()
        this.moveTo(start.x, start.y)

        let p = DashLine.transform(x + width - radius, y, matrix)
        this.lineTo(p.x, p.y)
        this.arcTo(x + width - radius, y + radius, radius, -half, 0, points, matrix)

        p = DashLine.transform(x + width, y + height - radius, matrix)
        this.lineTo(p.x, p.y)
        this.arcTo(x + width - radius, y + height - radius, radius, 0, half, points, matrix)

        p = DashLine.transform(x + radius, y + height, matrix)
        this.lineTo(p.x, p.y)
        this.arcTo(x + radius, y + height - radius, radius, half, Math.PI, points, matrix)

        p = DashLine.transform(x, y + radius, matrix)
        this.lineTo(p.x, p.y)

        // the last corner ends exactly at the start so the path closes properly
        this.arcTo(x + radius, y + radius, radius, Math.PI, Math.PI + half - half / points, points - 1, matrix)
        this.lineTo(start.x, start.y, true)
        return this
    }

    // creates the stroke style (with the texture's matrix) for a segment of the line with useTexture: true
    private getTextureStyle(angle: number): PIXI.StrokeStyle {
        const matrix = new PIXI.Matrix()
        if (angle) {
            matrix.rotate(angle)
        }
        if (this.scale !== 1) {
            matrix.scale(this.scale, this.scale)
        }
        const textureStart = -this.lineLength
        matrix.translate(
            this.cursor.x + textureStart * Math.cos(angle),
            this.cursor.y + textureStart * Math.sin(angle)
        )
        const options = this.options
        return {
            width: options.width * this.scale,
            color: options.color,
            alpha: options.alpha,
            alignment: options.alignment,
            texture: this.texture,
            matrix,
            textureSpace: "global",
        }
    }

    // creates or uses cached texture
    private static getTexture(
        options: Required<DashLineOptions>,
        dashSize: number
    ): PIXI.Texture | undefined {
        const key = `${options.dash.toString()}-${options.width}`
        if (DashLine.dashTextureCache[key]) {
            return DashLine.dashTextureCache[key]
        }
        const canvas = document.createElement("canvas")
        canvas.width = dashSize
        canvas.height = Math.ceil(options.width)
        const context = canvas.getContext("2d")
        if (!context) {
            console.warn("Did not get context from canvas")
            return undefined
        }

        // color and alpha are applied by the stroke
        context.strokeStyle = "white"
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
        const texture = (DashLine.dashTextureCache[key] =
            PIXI.Texture.from(canvas))
        texture.source.scaleMode = "nearest"
        return texture
    }
}
