# pixi-dashed-line

Implementation of dashed line for pixi using LineTextureStyle (instead of moveTo/lineTo). This is useful when the lines are very long, as PIXI.Graphics does not handle overly large or overly small dimensions well (see https://www.html5gamedevs.com/topic/24876-weird-lines-when-using-extreme-coordinate-values/).

Also supports rescaling the texture (useful when keeping the line/dash size the same when zooming in and out of a scene).

## Live Demo

[davidfig.github.io/pixi-dashed-line](https://davidfig.github.io/pixi-dashed-line/)

See

## Documentation

todo...

## Simple Example

```js
import * as Dash from 'pixi-dashed-lines'

...
const g = stage.addChild(new PIXI.Graphics())

Dash.lineStyle({
    graphics: g,
    dash: [20, 10],
    width: 5,
    color: 0xff0000
})

// draws a dashed line
Dash.line(g, 0, 0, 100, 100)

```

## License
MIT License
(c) 2021 [David Figatner](https://yopeyopey.com/)
