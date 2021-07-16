# pixi-dashed-line

Implementation of a dashed line for pixi

* two implementations: standard and texture-based
* useful when the lines are very long, as PIXI.Graphics does not handle overly large or overly small dimensions well (see https://www.html5gamedevs.com/topic/24876-weird-lines-when-using-extreme-coordinate-values/)
* supports rescaling of the dashed lines to keep teh line/dash size the same when zooming in and out
Also supports rescaling the texture (useful when keeping the line/dash size the same when zooming in and out of a scene).

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

#### lineTo(x: number, y: number)
Draws a dashed line

#### circle(x: number, y: number, radius: number, points=80)
where x,y is the center of circle, and points are the number of points used to draw the circle

#### ellipse(x: number, y: number, radiusX: number, radiusY: number, points=80)
where x,y is the center of ellipse, and points are the number of points used to draw the ellipse

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
