# pixi-dashed-line

A pixi.js implementation to support dashed lines in PIXI.Graphics.

* Two implementations of a dashed line for pixi.js: lineTo/moveTo w/gaps (preferred), and texture-based (using a dashed-line texture when drawing the line)
* Dashed support for lineTo, quadraticCurveTo, bezierCurveTo, arc, circle, ellipse, rect, roundRect, and poly
* Dashed lines can be scaled (allows for dashed lines to remain the same size regardless of zoom level)
* Dashes can be offset (useful for animating dashed lines)

Version 2 requires pixi.js v8. Use pixi-dashed-line@1 for pixi.js v6.

## Live Demo

[https://davidfig.github.io/pixi-dashed-line](https://davidfig.github.io/pixi-dashed-line/) ([source code](https://github.com/davidfig/pixi-dashed-line/blob/main/demo/index.ts))

## Installation

```
npm i pixi-dashed-line
```

## Simple Example

```js
import { Graphics } from 'pixi.js'
import { DashLine } from 'pixi-dashed-line'

...
const g = stage.addChild(new Graphics())

const dash = new DashLine(g, {
    dash: [20, 10],
    width: 5,
    color: 0xff0000,
})

// draws a dashed triangle
dash.moveTo(0, 0)
    .lineTo(100, 100)
    .lineTo(0, 100)
    .lineTo(0, 0)
    .stroke()

// draws a dashed rectangle
dash.rect(200, 0, 100, 50).stroke()
```

Like pixi.js v8's Graphics, you draw the path and then call `stroke()`. (Lines drawn with `useTexture: true` are stroked as they are drawn, so `stroke()` is not needed, but it is harmless.)

## Documentation

### class DashLine
#### constructor(graphics: PIXI.Graphics, options?: DashLineOptions)
```js
DashLineOptions = {
    useTexture?=false - whether to use a texture or moveTo/lineTo (see notes below in README.md)
    dash?=[10, 5] - an array holding one or more [dash, gap] entries, eg, [10, 5, 20, 10, ...])
    dashOffset?=0 - where the line starts in the dash pattern (change it and redraw to animate the dashes)
    width?=1 - width of the dashed line
    color?=0xffffff - color of the dashed line (any PIXI.ColorSource)
    alpha?=1 - alpha of the dashed line
    scale?=1 - scale of the dashes and width (eg, 1 / viewport.scale.x keeps the line the same size when zooming)
    cap?='butt' - line cap style for the dashes: 'butt' | 'round' | 'square' (only works for useTexture: false)
    join?='miter' - line join style for the dashes: 'miter' | 'round' | 'bevel' (only works for useTexture: false)
    alignment?=0.5 - alignment of the line (0.5 = middle, 1 = inside, 0 = outside -- note this is pixi.js v8's alignment, which is reversed from v6)
}
```

#### stroke()
Strokes the dashed path drawn since the last stroke (like `PIXI.Graphics.stroke()`)

#### moveTo(x: number, y: number)
Moves cursor to location (and restarts the dash pattern at `dashOffset`)

#### lineTo(x: number, y: number, closePath?: boolean)
Draws a dashed line. If closePath = true, then lineTo will leave a proper gap if its destination is the first point (ie, if this line closes the shape)

#### closePath()
Draws a dashed line back to the first point, leaving a proper gap

#### quadraticCurveTo(cpx: number, cpy: number, x: number, y: number, points=20)
Draws a dashed quadratic curve from the cursor; points is the number of line segments used to draw the curve

#### bezierCurveTo(cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number, points=20)
Draws a dashed cubic bezier curve from the cursor; points is the number of line segments used to draw the curve

#### arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, points=80, matrix?: PIXI.Matrix)
Draws a dashed arc (in radians) starting a new line at the start of the arc; if endAngle < startAngle, the arc is drawn counterclockwise

#### circle(x: number, y: number, radius: number, points=80, matrix?: PIXI.Matrix)
where x,y is the center of circle, and points are the number of points used to draw the circle; matrix is applied before the draw (this adds a shape-specific transform to pixi's Container transforms)

#### ellipse(x: number, y: number, radiusX: number, radiusY: number, points=80, matrix?: PIXI.Matrix)
where x,y is the center of ellipse, and points are the number of points used to draw the ellipse; matrix is applied before the draw

#### rect(x: number, y: number, width: number, height: number, matrix?: PIXI.Matrix)
draws a dashed rectangle; matrix is applied before the draw

#### roundRect(x: number, y: number, width: number, height: number, radius=10, points=10, matrix?: PIXI.Matrix)
draws a dashed rectangle with rounded corners; points are the number of points used to draw each corner; matrix is applied before the draw

#### poly(PIXI.PointData[] | number[], matrix?: PIXI.Matrix)
draws a dashed polygon; matrix is applied before the draw

#### setStrokeStyle()
sets the graphics element's stroke style to the dashed line's style (so `graphics.stroke()` also works)

## Filling a dashed shape

DashLine only draws the outline. To fill the shape, draw it twice: first the fill using PIXI.Graphics, and then the dashed outline:

```js
g.rect(0, 0, 100, 50).fill(0x00ff00)
dash.rect(0, 0, 100, 50).stroke()
```

## Animating dashes

Set `dashOffset` (either in the options or by changing `dash.dashOffset`) and redraw:

```js
app.ticker.add((ticker) => {
    g.clear()
    dash.dashOffset = -ticker.lastTime / 50
    dash.rect(0, 0, 100, 50).stroke()
})
```

## Migrating from v1 (pixi.js v6)

* pixi.js v8 is required
* call `stroke()` after drawing (see above)
* `drawCircle` → `circle`, `drawEllipse` → `ellipse`, `drawRect` → `rect`, `drawPolygon` → `poly`, `setLineStyle` → `setStrokeStyle` (matching pixi.js v8's Graphics names)
* `cap` and `join` are strings (eg, `'round'`) instead of `PIXI.LINE_CAP`/`PIXI.LINE_JOIN`
* `alignment` uses pixi.js v8's direction (1 = inside, 0 = outside)

## When to use options.useTexture = true

For most use-cases, the lineTo/moveTo (`options.useTexture = false`) is better because it provides a more accurate implementation and supports cap and join styles.

The texture-based approach (`options.useTexture = true`) is useful when the geometry is very large or very small as PIXI.Graphics does not handle those cases well (see https://www.html5gamedevs.com/topic/24876-weird-lines-when-using-extreme-coordinate-values/). You'll know you need this if zooming in and out on the dashed line causes out of memory errors :)

### Technical Notes on options.useTexture = true
`options.useTexture=true` does not use pixi.js's line joins and caps for connecting lines (see https://mattdesl.svbtle.com/drawing-lines-is-hard): instead it strokes each segment of the line with a dashed texture (using `textureSpace: 'global'`). The texture needs a custom matrix to properly rotate the dash based on the angle of the line (and to translate the texture so it starts properly). Without the matrix, the dash's length will change as the line's angle changes. Since the matrix changes with each segment, each segment is stroked separately.

### Future work
Ideally, the dashed line functionality should be built directly into pixi.js's Graphics line drawing module w/logic that separates the triangles of the dashed line to take into account changes in the angle of the line. I thought about adding it, but decided the amount of work was not worth it. (Especially since the use case for useTexture is limited to strange PIXI.Graphics geometries.) Maybe someone does a different calculus and adds this feature directly into pixi.js and makes this library obsolete.

## Contributors

Thanks to [hriverahdez](https://github.com/hriverahdez) for the pixi.js v8 port and rounded rectangles, [tacigar](https://github.com/tacigar) for `arc`, [bhousel](https://github.com/bhousel) for the circle NaN fix, and [namiwang](https://github.com/namiwang) for the README fix.

## License
MIT License
(c) 2021 [David Figatner](https://yopeyopey.com/)
