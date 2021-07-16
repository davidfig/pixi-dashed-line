import * as PIXI from 'pixi.js'
import { Viewport } from 'pixi-viewport'
import { DashLine } from '../index'

let viewport: Viewport, g: PIXI.Graphics, x2: number, y2: number

const useTexture = false

function setup() {
    const canvas = document.querySelector('canvas')
    const application = new PIXI.Application({
        view: canvas,
        width: window.innerWidth,
        height: window.innerHeight,
        antialias: true,
        backgroundAlpha: 0,
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

function drawScalingRectangle() {
    const scale = 1 / viewport.scale.x
    const dash = new DashLine(g, {
        dash: [20, 10],
        width: 5,
        scale,
        useTexture,
        color: 0,
    })
    dash.moveTo(100, 100)
    dash.lineTo(x2, 100)
    dash.lineTo(x2, y2)
    dash.lineTo(100, y2)
    dash.lineTo(100, 100)

    // const text = g.addChild(new PIXI.Text('This rectangle\'s outline size is the same when zooming', { fill: 'black', fontSize: '15px' }))
    // text.position.set(x2 - text.width, 100 - text.height)
}

function drawCircle() {
    const dash = new DashLine(g, {
        dash: [10, 5],
        width: 3,
        color: 0x0000aa,
        useTexture,
    })
    const x = window.innerWidth / 2
    const y = window.innerHeight / 2
    dash.circle(x, y, 100)
}

function drawEllipse() {
    const dot = new DashLine(g, {
        dash: [3, 3],
        width: 3,
        color: 0x00aa00,
        useTexture,
    })
    const x = window.innerWidth / 2
    const y = window.innerHeight / 2
    dot.ellipse(x, y, 300, 200)
}

function draw() {
    g.removeChildren()
    g.clear()
    drawScalingRectangle()
    // drawCircle()
    // drawEllipse()
}

setup()
draw()