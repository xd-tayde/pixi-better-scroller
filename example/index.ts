import * as PIXI from 'pixi.js'
import { Application, Graphics, utils, TextStyle, Text } from 'pixi.js'
import toHex from 'colornames'
import { extend } from '../lib/utils/extend'
import "./main.scss"
import PixiBetterScroller from '../lib'

window.PIXI = PIXI

function getView() {
    if (typeof canvas !== 'undefined') {
        return canvas
    } else {
        const view = document.createElement('canvas')
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
    forceFXAA: false,
    width: iw,
    height: ih,
    view: getView(),
})
game.renderer.resize(iw, ih)

const ver = createRect({
    width: 180,
    height: 280,
    x: 50,
    y: 20,
    borderWidth: 2,
    borderColor: '#f35588',
})

const verRect = createRect({
    width: 180,
    height: 1000,
    backgroundColor: '#beebe9',
})

const scroller = new PixiBetterScroller({
    direction: 'vertical',
    width: 180,
    height: 280,
    onBounce(direction, back, pos) {
        console.log('pos', pos)
        if (direction < 0) {
            console.log('Refresh')
            if (pos > 40) {
                back(40)
                setTimeout(() => {
                    back()
                }, 1000)
            } else {
                back()
            }
        } else if (direction > 0) {
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
            }, 1000)
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

game.stage.addChild(ver)

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
    width: 200,
    height: 160,
    backgroundColor: '#beebe9',
})

const hor = createRect({
    width: 260,
    height: 160,
    x: 270,
    y: 80,
    borderWidth: 2,
    borderColor: '#f35588',
})
game.stage.addChild(hor)

const scroller1 = new PixiBetterScroller({
    direction: 'horizontal',
    overflow: 'hidden',
    width: 260,
    height: 160,
    onScroll(pos) {
        // console.log('scroll', pos)
    },
    onBounce(direction, next) {
        // console.log('onBounce', direction)
        next()
    },
}, hor)
scroller1.addChild(horRect)

for (let i = 0; i < 2; i++) {
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
            return utils.string2hex(str)
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
