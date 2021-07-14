import * as PIXI from 'pixi.js'
import { Viewport } from 'pixi-viewport'
import * as Dash from '../index'

let viewport: Viewport, g: PIXI.Graphics, x2: number, y2: number

function setup() {
    const canvas = document.querySelector('canvas')
    const application = new PIXI.Application({
        view: canvas,
        width: window.innerWidth,
        height: window.innerHeight,
        antialias: true,
    })
    viewport = application.stage.addChild(new Viewport({
        screenWidth: window.innerWidth,
        screenHeight: window.innerHeight,
    }))
    viewport.pinch().wheel().decelerate().drag()
    g = viewport.addChild(new PIXI.Graphics())
    viewport.on('zoomed', () => draw())
    y2 = window.innerHeight - 100
    x2 = window.innerWidth - 100

}

function lineLength(x1: number, x2: number, y1: number, y2: number) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))
}

function drawScalingRectangle() {
    const scale = 1 / viewport.scale.x
    Dash.lineStyle({
        graphics: g,
        dash: [20, 10],
        width: 5,
        scale,
    })
    Dash.line(g, 100, 100, x2, 100, x2, scale)
    let length = lineLength(100, 100, x2, 100)
    Dash.line(g, x2, 100, x2, y2, length, scale)
    length += lineLength(x2, 100, x2, y2)
    Dash.line(g, x2, y2, 100, y2, length, scale)
    length += lineLength(x2, y2, 100, y2)
    Dash.line(g, 100, y2, 100, 100, length, scale)
    length += lineLength(100, y2, 100, 100)
}

function drawCross() {
    Dash.lineStyle({
        graphics: g,
        dash: [10, 10],
        width: 5,
        color: 0xffff00,
    })
    const a = 50
    Dash.line(g, x2 - a, 100 + a, 100 + a, y2 - a)
    Dash.line(g, 100 + a, 100 + a, x2 - a, y2 - a)
}

function drawText() {
    const text = g.addChild(new PIXI.Text('This rectangle scales when zooming', { fill: 'white' }))
    text.position.set(x2 - text.width, 100 - text.height)
}

function draw() {
    g.removeChildren()
    g.clear()

    drawScalingRectangle()
    drawCross()
    drawText()

    Dash.circle(g, 100, 100, 50, 1)
}

setup()
draw()
