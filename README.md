# pixi-dashed-line

* Two implementations of a dashed line for pixi.js: lineTo/moveTo w/gaps, and texture-based
* Dashed support for lineTo, drawCircle, drawEllipse, drawPolygon
* Dashed lines can be scaled (allows for dashed lines to remain the same size regardless of zoom level)

## When to use options.useTexture = true

For most use-cases, the lineTo/moveTo (`options.useTexture = false`) is slightly better because it provides a more accurate implementation (see Technical Notes below).

The texture-based approach (`options.useTexture = true`) is useful when the geometry is very large or very small as PIXI.Graphics does not handle those cases well (see https://www.html5gamedevs.com/topic/24876-weird-lines-when-using-extreme-coordinate-values/). You'll know you need this if zooming in and out on the dashed line causes out of memory errors :)

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

## Technical Notes
Additional details on why useTexture=true approach does not use pixi.js's line joins and caps for connecting lines (see https://mattdesl.svbtle.com/drawing-lines-is-hard): useTexture uses Graphics.lineTextureStyle to supply a texture to draw the dashed lines. The texture needs a custom matrix to properly rotate the dash based on the angle of the next line (and to translate the texture so it starts properly (see https://www.html5gamedevs.com/topic/45698-begintexturefill/)). Without the matrix, the dash's length will change as the line's angle changes.

Regrettably, pixi.js does not provide a mechanism to change the matrix of a texture without breaking the current line with a moveTo command. (This was my key insight that finally got this working. I banged my head many hours trying to figure out why the texture did not rotate properly. The answer was that you have to moveTo before changing the matrix.)

The way to fix this issue is to build the dashed line texture directly into pixi.js's Graphics module. I thought about it, but decided the amount of work was not worth it. Hopefully someone does a different calculus and adds this feature directly into pixi.js and makes this library obsolete.

## License
MIT License
(c) 2021 [David Figatner](https://yopeyopey.com/)
