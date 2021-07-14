import * as PIXI from 'pixi.js'
import { Viewport } from 'pixi-viewport'
import * as Dash from '../index'

let viewport: Viewport, g: PIXI.Graphics

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
    viewport.pinch({
        noDrag: true,
    })
    viewport.wheel({
        center: new PIXI.Point(window.innerWidth / 2, window.innerHeight / 2)
    })
    g = viewport.addChild(new PIXI.Graphics())
    viewport.on('zoomed', () => drawLine())
}

function lineLength(x1: number, x2: number, y1: number, y2: number) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))
}

function drawLine() {
    g.clear()
    const scale = 1 / viewport.scale.x
    Dash.lineStyle({
        graphics: g,
        dash: [20, 10],
        lineWidth: 5,
        scale,
    })
    // const x2 = window.innerWidth - 100
    // const y2 = window.innerHeight - 100
    // let length = 0
    // Dash.line(g, 100, 100, x2, 100, length, scale)
    // length += lineLength(100, 100, x2, 100)
    // Dash.line(g, x2, 100, x2, y2, length, scale)
    // length += lineLength(x2, 100, x2, y2)
    // Dash.line(g, x2, y2, 100, y2, length, scale)
    // length += lineLength(x2, y2, 100, y2)
    // Dash.line(g, 100, y2, 100, 100, length, scale)
    // length += lineLength(100, y2, 100, 100)
    // Dash.line(g, 100, 100, x2, y2, length, scale)
    // length += lineLength(100, 100, x2, y2)
    // Dash.line(g, x2, 100, 100, y2, length, scale)
    // length += lineLength(x2, 100, 100, y2)

    Dash.circle(g, 100, 100, 50, 1)
}

setup()
drawLine()
