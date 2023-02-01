# pixi-dashed-line

A pixi.js implementation to support dashed lines in PIXI.Graphics.

* Two implementations of a dashed line for pixi.js: lineTo/moveTo w/gaps (preferred), and texture-based (using a dashed-line texture when drawing the line)
* Dashed support for lineTo, drawCircle, drawEllipse, drawPolygon
* Dashed lines can be scaled (allows for dashed lines to remain the same size regardless of zoom level)

## Live Demo

[https://davidfig.github.io/pixi-dashed-line](https://davidfig.github.io/pixi-dashed-line/) ([source code](https://github.com/davidfig/pixi-dashed-line/blob/main/demo/index.ts))

## Documentation

### class DashLine
#### constructor(graphics: PIXI.Graphics, options?.DashLineOptions)
```js
DashLine.DashLineOptions = {
    useTexture?=false - whether to use a texture or moveTo/lineTo (see notes below in README.md)
    dashes?=[10, 5] - an array holding one or more [dash, gap] entries, eg, [10, 5, 20, 10, ...])
    width?=1 - width of the dashed line
    color?=0xffffff - color of the dashed line
    alpha?=1 - alpha of the dashed line
    options.cap? - add a PIXI.LINE_CAP style to dashed lines (only works for useTexture: false)
    options.join? - add a PIXI.LINE_JOIN style to the dashed lines (only works for useTexture: false)
    options.alignment? - change alignment of lines drawn (0.5 = middle, 1 = outer, 0 = inner)
}
```
#### moveTo(x: number, y: number)
Moves cursor to location

#### lineTo(x: number, y: number, closePath?: boolean)
Draws a dashed line. If closePath = true, then lineTo will leave a proper gap if its destination is the first point (ie, if this line closes the shape)

#### drawCircle(x: number, y: number, radius: number, points=80, matrix?: PIXI.Matrix)
where x,y is the center of circle, and points are the number of points used to draw the circle; matrix is applied before the draw (this adds a shape-specific transform to pixi's DisplayObject transforms)

#### drawEllipse(x: number, y: number, radiusX: number, radiusY: number, points=80, matrix?: PIXI.Matrix)
where x,y is the center of ellipse, and points are the number of points used to draw the ellipse; matrix is applied before the draw (this adds a shape-specific transform to pixi's DisplayObject transforms)

#### drawRect(x: number, y: number, width: number, height: number, matrix?: PIXI.Matrix)
draws a dashed rectangle; matrix is applied before the draw (this adds a shape-specific transform to pixi's DisplayObject transforms)

#### drawPolygon(PIXI.Point[] | number[], matrix?: PIXI.Matrix)
draws a dashed polygon; matrix is applied before the draw (this adds a shape-specific transform to pixi's DisplayObject transforms)

#### setLineStyle()
changes line style to the proper dashed line style -- this is useful if the graphics element's lineStyle was changed

## Simple Example

```js
import { DashLine } from 'pixi-dashed-line'

...
const g = stage.addChild(new PIXI.Graphics())

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

```
## When to use options.useTexture = true

For most use-cases, the lineTo/moveTo (`options.useTexture = false`) is better because it provides a more accurate implementation and supports cap and join styles.

The texture-based approach (`options.useTexture = true`) is useful when the geometry is very large or very small as PIXI.Graphics does not handle those cases well (see https://www.html5gamedevs.com/topic/24876-weird-lines-when-using-extreme-coordinate-values/). You'll know you need this if zooming in and out on the dashed line causes out of memory errors :)

### Technical Notes on options.useTexture = true
`options.useTexture=true` does not use pixi.js's line joins and caps for connecting lines (see https://mattdesl.svbtle.com/drawing-lines-is-hard): instead it uses `Graphics.lineTextureStyle` to supply a texture to draw the dashed lines. The texture needs a custom matrix to properly rotate the dash based on the angle of the next line (and to translate the texture so it starts properly (see https://www.html5gamedevs.com/topic/45698-begintexturefill/)). Without the matrix, the dash's length will change as the line's angle changes.

Regrettably, pixi.js does not provide a mechanism to change the matrix of a texture without breaking the current line with a moveTo command. (This was my key insight that finally got this working. I banged my head many hours trying to figure out why the texture did not rotate properly. The answer was that you have to moveTo before changing the matrix.)

### Future work
Ideally, the dashed line functionality should be built directly into pixi.js's Graphics line drawing module w/logic that separates the triangles of the dashed line to take into account changes in the angle of the line. I thought about adding it, but decided the amount of work was not worth it. (Especially since the use case for useTexture is limited to strange PIXI.Graphics geometries.) Maybe someone does a different calculus and adds this feature directly into pixi.js and makes this library obsolete.

## License
MIT License
(c) 2021 [David Figatner](https://yopeyopey.com/)
