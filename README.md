# pixi-dashed-line

* Two implementations of a dashed line for pixi.js: lineTo/moveTo w/gaps, and texture-based
* Dashed support for lineTo, drawCircle, drawEllipse, drawPolygon
* Dashed lines can be scaled (allows for dashed lines to remain the same size regardless of zoom level)

For most use-cases, the lineTo/moveTo (`options.useTexture = false`) is better as it provides a more accurate implementation. The texture-based approach (`options.useTexture = true`) is useful when the geometry is very large or very small as PIXI.Graphics does not handle those cases well (see https://www.html5gamedevs.com/topic/24876-weird-lines-when-using-extreme-coordinate-values/).

## Live Demo

[https://davidfig.github.io/pixi-dashed-line](https://davidfig.github.io/pixi-dashed-line/) ([source code](https://github.com/davidfig/pixi-dashed-line/blob/main/demo/main.ts))

## Documentation

### class DashLine
#### constructor(graphics: PIXI.Graphics, options?.DashLineOptions)

DashLine.DashLineOptions = {
    dashes?=[10, 5] - an array holding one or more [dash, gap] entries, eg, [10, 5, 20, 10, ...])
    width?=1 - width of the dashed line
    color?=0xffffff - color of the dashed line
    alpha?=1 - alpha of the dashed line
}

#### moveTo(x: number, y: number)
Moves cursor to location

#### lineTo(x: number, y: number, closePath?: boolean)
Draws a dashed line. If closePath = true, then lineTo will leave a proper gap if it's destination is the first point (ie, this if the line closes the shape)

#### drawCircle(x: number, y: number, radius: number, points=80)
where x,y is the center of circle, and points are the number of points used to draw the circle

#### drawEllipse(x: number, y: number, radiusX: number, radiusY: number, points=80)
where x,y is the center of ellipse, and points are the number of points used to draw the ellipse

#### drawRect(x: number, y: number, width: number, height: number)
draws a dashed rectangle

#### drawPolygon(PIXI.Point[] | number[])
draws a dashed polygon

## Simple Example

```js
import { DashLine } from 'pixi-dashed-lines'

...
const g = stage.addChild(new PIXI.Graphics())

const dash = new DashLine(g, {
    dash: [20, 10],
    width: 5,
    color: 0xff0000,
})

// draws a dashed triangle
dash.moveTo(0, 0)
dash.lineTo(100, 100)
dash.lineTo(0, 100)
dash.lineTo(0, 0)

```

## License
MIT License
(c) 2021 [David Figatner](https://yopeyopey.com/)
