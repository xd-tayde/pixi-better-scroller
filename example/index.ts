import * as PIXI from 'pixi.js'
import { Application, Graphics, utils, TextStyle, Text, Container } from 'pixi.js'
import toHex from 'colornames'
import { extend } from '../lib/utils/extend'
import "./main.scss"
import PixiBetterScroller from '../lib'

window.PIXI = PIXI

let view 
function getView() {
    if (typeof canvas !== 'undefined') {
        return canvas
    } else {
        view = document.createElement('canvas')
        document.body.appendChild(view)
        view.setAttribute('style', `width: 100%; height: 100%;`)
        return view
    }
}

const { innerWidth: iw, innerHeight: ih } = window

const game = new Application({
    backgroundColor: 0xffffff,
    autoStart: true,
    sharedTicker: true,
    sharedLoader: true,
    transparent: false,
    antialias: true,
    preserveDrawingBuffer: false,
    resolution: 2,
    forceCanvas: false,
    clearBeforeRender: true,
    width: iw,
    height: ih,
    view: getView(),
})
// game.renderer.resize(iw, ih)
const container = new Container()
game.stage.addChild(container)

const text = createText({
    content: `pixi-better-scroller`,
    style: {
        fill: '#68beba',
        fontSize: 20,
    },
})
text.x = 20
text.y = 10
game.stage.addChild(text)

const ver = createRect({
    width: 180,
    height: 280,
    x: 0,
    y: 0,
    borderWidth: 2,
    borderColor: '#f35588',
})

const verRect = createRect({
    width: 180,
    height: 1000,
    backgroundColor: '#beebe9',
})

const scroller = new PixiBetterScroller({
    width: 180,
    height: 280,
    radius: 10,
    onScroll(attr, pos) {
        console.log('attr, pos', attr, pos);
    },
    onBounce(pos, back, status) {
        if (status[1] < 0) {
            console.log('Refresh', pos)
            if (pos > 40) {
                back(40)
                setTimeout(() => {
                    back()
                }, 1000)
            } else {
                back()
            }
        } else if (status[1] > 0) {
            console.log('Loading')
            back(scroller.height - scroller.content.height - 40)
            setTimeout(() => {
                const loaded = createRect({
                    width: 160,
                    height: 500,
                    x: 10,
                    y: scroller.content.height + 10,
                    backgroundColor: '#eca0b6',
                })
                const text = createText({
                    content: `new - item`,
                    style: {
                        fill: '#fffdf9',
                        fontSize: 20,
                    },
                })
                text.x = (loaded.width - text.width) / 2
                text.y = (loaded.height - text.height) / 2
                loaded.addChild(text)
                scroller.addChild(loaded)
            }, 0)
        }
    },
}, ver)

for (let i = 0; i < 14; i++) {
    const item = createRect({
        x: 20,
        y: 15 + 70 * i,
        width: 140,
        height: 60,
        backgroundColor: '#fffdf9',
    })
    const text = createText({
        content: `item - ${i}`,
        style: {
            fill: '#8ac6d1',
            fontSize: 20,
        },
    })
    text.x = (item.width - text.width) / 2 
    text.y = (item.height - text.height) / 2 
    item.addChild(text)

    item.interactive = true
    item.on('tap', () => {
        console.log(`Tap item-${i}`)
    })
    
    verRect.addChild(item)
}

container.addChild(ver)

const refresh = createText({
    content: 'Refresh',
    x: 66,
    y: 10,
    style: {
        fontSize: 12,
        fill: '#eca0b6',
    },
})
scroller.addChild(refresh, false)

const load = createText({
    content: 'Loading',
    x: 66,
    y: 250,
    style: {
        fontSize: 12,
        fill: '#eca0b6',
    },
})
scroller.addChild(load, false)
scroller.addChild(verRect)

// -----------
// 水平
const horRect = createRect({
    width: 1300,
    height: 340,
    backgroundColor: '#beebe9',
})

const hor = createRect({
    width: 260,
    height: 160,
    x: 220,
    y: 60,
    borderWidth: 2,
    borderColor: '#f35588',
})
container.addChild(hor)

const scroller1 = new PixiBetterScroller({
    width: 260,
    height: 160,
    scrollY: true,
    scrollX: true,
    onScroll(pos) {
        // console.log('scroll', pos)
    },
    onBounce(direction, next) {
        // console.log('onBounce', direction)
        next()
    },
}, hor)
scroller1.addChild(horRect)

for (let i = 0; i < 14; i++) {
    const item = createRect({
        y: 20,
        x: 15 + 90 * i,
        width: 80,
        height: 120,
        backgroundColor: '#fffdf9',
    })
    const text = createText({
        content: `item - ${i}`,
        style: {
            fill: '#8ac6d1',
            fontSize: 20,
        },
    })
    text.x = (item.width - text.width) / 2 
    text.y = (item.height - text.height) / 2 
    item.addChild(text)

    item.interactive = true
    item.on('tap', () => {
        if (!scroller1.scrolling) {
            console.log(`Tap item-${i}`)
        }
    })

    horRect.addChild(item)
}

for (let j = 0; j < 14; j++) {
    const item = createRect({
        y: 160,
        x: 15 + 90 * j,
        width: 80,
        height: 120,
        backgroundColor: '#fffdf9',
    })
    const text = createText({
        content: `item - ${j + 13}`,
        style: {
            fill: '#8ac6d1',
            fontSize: 20,
        },
    })
    text.x = (item.width - text.width) / 2 
    text.y = (item.height - text.height) / 2 
    item.addChild(text)

    item.interactive = true
    item.on('tap', () => {
        if (!scroller1.scrolling) {
            console.log(`Tap item-${j}`)
        }
    })

    horRect.addChild(item)
}

container.x = (iw - container.width) / 2
container.y = (ih - container.height) / 2

// setTimeout(() => {
    // scroller1.scrollTo([100, 100], true)
    // scroller1.x = 50
    // scroller1.y = 300
    // scroller1.width = 100
// }, 1000)


export function createRect(ops) {
    const { 
        width = 0, 
        height = 0, 
        backgroundColor, 
        backgroundAlpha = 1,
        borderWidth = 0, 
        borderColor = 0x000000,
        borderRadius = 0,
        ...props
    } = ops

    const rect = new Graphics()

    const alpha = backgroundColor !== undefined ? backgroundAlpha : 0.00001
    const bgColor = backgroundColor !== undefined ? string2hex(backgroundColor) : 0xFFFFFF

    rect.clear()
    rect.beginFill(bgColor, alpha)
    rect.lineStyle(borderWidth, string2hex(borderColor), 1)
    rect.drawRect(0, 0, width, height)
    rect.endFill()

    extend(rect, props)
    return rect
}

export function string2hex(string: any) {
    if (typeof string === 'string') {
        let str
        if (string.startsWith('#') || string.startsWith('0x')) {
            str = string
        } else {
            const hex = toHex.get(string)
            if (hex) str = hex.value
        }
        
        if (!str) {
            return str
        } else {
            return (utils.string2hex as any)(str)
        }
    } else {
        return string
    }
}

export function createText(ops) {
    const { content = '', style = {}, ...props } = ops
    const textstyle = new TextStyle(style)
    const text = new Text(content, textstyle)
    extend(text, props)
    return text
}
