import * as PIXI from 'pixi.js'
import { Viewport } from 'pixi-viewport'
import { DashLine } from '../lib'

let viewport: Viewport, g: PIXI.Graphics, animated: PIXI.Graphics, labels: PIXI.Container, x2: number, y2: number

let useTexture = false

function checkbox() {
    return document.querySelector('#use-texture') as HTMLInputElement
}

async function setup() {
    const application = new PIXI.Application()
    await application.init({
        canvas: document.querySelector('canvas')!,
        resizeTo: window,
        antialias: true,
        backgroundAlpha: 0,
    })
    viewport = application.stage.addChild(new Viewport({
        screenWidth: window.innerWidth,
        screenHeight: window.innerHeight,
        events: application.renderer.events,
        passiveWheel: false,
        stopPropagation: true,
    }))
    viewport.pinch().wheel().decelerate().drag()
    g = viewport.addChild(new PIXI.Graphics())
    animated = viewport.addChild(new PIXI.Graphics())
    labels = viewport.addChild(new PIXI.Container())
    viewport.on('zoomed', () => draw())
    y2 = window.innerHeight - 100
    x2 = window.innerWidth - 100
    checkbox().checked = useTexture
    checkbox().addEventListener('change', () => {
        useTexture = !useTexture
        draw()
    })
    application.ticker.add((ticker) => drawMarchingAnts(ticker.lastTime))
}

function label(text: string, x: number, y: number) {
    const t = labels.addChild(new PIXI.Text({ text, style: { fill: 'black', fontSize: 15 } }))
    t.position.set(x - t.width, y - t.height - 5)
}

function drawScalingRectangle() {
    const scale = 1 / viewport.scale.x
    const dash = new DashLine(g, {
        dash: [20, 10],
        width: 5,
        scale,
        useTexture,
        color: 0,
        alignment: 0,
    })
    dash.rect(100, 100, x2 - 100, y2 - 100).stroke()
    label('This rectangle\'s outline size remains constant when zooming', x2, 100)
}

function drawJoinCapRectangle() {
    const dash = new DashLine(g, {
        dash: [20, 5],
        width: 3,
        color: 0xaa00aa,
        useTexture,
        cap: 'round',
        join: 'round',
    })
    dash.rect(150, 150, x2 - 200, y2 - 200).stroke()
    label('Using cap and joins (only works when useTexture: false)', x2 - 50, 150)
}

function drawRoundRect() {
    const dash = new DashLine(g, {
        dash: [8, 4],
        width: 2,
        color: 0x0088aa,
        useTexture,
    })
    dash.roundRect(200, 200, 250, 120, 30).stroke()
    label('roundRect', 450, 200)
}

function drawCurves() {
    const dash = new DashLine(g, {
        dash: [12, 6],
        width: 3,
        color: 0xaa5500,
        useTexture,
    })
    const y = y2 - 150
    dash.moveTo(200, y)
        .bezierCurveTo(250, y - 120, 350, y + 120, 400, y)
        .quadraticCurveTo(450, y - 100, 500, y)
        .stroke()
    label('bezierCurveTo and quadraticCurveTo', 500, y - 60)
}

function drawArc() {
    const dash = new DashLine(g, {
        dash: [6, 4],
        width: 3,
        color: 0x5500aa,
        useTexture,
    })
    dash.arc(x2 - 250, y2 - 150, 60, Math.PI, Math.PI * 2.5).stroke()
    label('arc', x2 - 180, y2 - 220)
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
    dash.circle(x, y, 100).stroke()
}

function drawTinyCircle() {
    const dash = new DashLine(g, {
        dash: [10, 5],
        width: 0.5,
        color: 0xaa00aa,
        useTexture,
    })
    const x = window.innerWidth / 2
    const y = window.innerHeight / 2
    dash.circle(x, y, 5).stroke()
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
    dot.ellipse(x, y, 300, 200).stroke()
}

function drawPolygon() {
    const dash = new DashLine(g, {
        width: 2,
        color: 0xaa0000,
        useTexture,
    })
    const x = window.innerWidth / 2
    const y = window.innerHeight / 2
    const size = 20
    dash.poly([x, y - size, x - size, y + size, x + size, y + size, x, y - size]).stroke()
}

function drawMarchingAnts(time: number) {
    animated.clear()
    const dash = new DashLine(animated, {
        dash: [10, 6],
        width: 2,
        color: 0x333333,
        useTexture,
        dashOffset: -time / 50,
    })
    dash.rect(x2 - 400, 200, 200, 100).stroke()
}

function draw() {
    labels.removeChildren().forEach((child) => child.destroy())
    g.clear()
    drawScalingRectangle()
    drawJoinCapRectangle()
    drawRoundRect()
    drawCurves()
    drawArc()
    drawCircle()
    drawTinyCircle()
    drawEllipse()
    drawPolygon()
    label('animated with dashOffset', x2 - 200, 200)
}

function keyboard() {
    window.addEventListener('keydown', (event: KeyboardEvent) => {
        if (event.key === 'ArrowUp') {
            viewport.zoom(1, true)
            draw()
        }
        if (event.key === 'ArrowDown') {
            viewport.zoom(-1, true)
            draw()
        }
    })
}

setup().then(() => {
    draw()
    keyboard()
})
