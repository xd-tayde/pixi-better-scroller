import { Container, Graphics } from 'pixi.js'
import { is, getPoint, loop, requestAnimateFrame, extend } from './utils'

interface IConfig {
    timeForEndScroll?: number,
    // 定点滚动曲线
    scrollCurve?: number,
    // 触发滚动停止的最小变动值
    minDeltaToStop?: number,  
    // 惯性滚动的速度衰减
    speedDecay?: (speed) => number,
    // 弹性拉动衰减
    bounceResist?: (delta) => number,
}

interface IOps {
    width?: number,
    height?: number,
    x?: number,
    y?: number,
    direction?: 'horizontal' | 'vertical',
    overflow?: 'scroll' | 'hidden',
    config?: IConfig,
    onScroll?: (pos: number) => void
    onBounce?: (direction: -1 | 1 | 0, next: (pos?: number) => void, pos: number) => void
}

// 挟持的原生事件
const ORIGIN_EVENT_MAP = [{
    name: 'pointerdown',
    fn: '_start',
}, {
    name: 'pointermove',
    fn: '_move',
}, {
    name: 'pointerup',
    fn: '_end',
}, {
    name: 'pointerupoutside',
    fn: '_end',
}, {
    name: 'pointercancel',
    fn: '_end',
}, {
    name: 'pointerout',
    fn: '_end',
}]

export default class PixiScroller {
    public options: IOps
    public direction = 'vertical'
    public width: number = 500
    public height: number = 500
    public x: number = 0
    public y: number = 0
    public parent

    private target = 'x'

    public overflow: 'scroll' | 'hidden' = 'scroll'
    private maxScrollDis: number = 0

    public container: Container
    public content: Container
    public mask: Graphics

    private touching: boolean = false
    private touchStartPoint: PScroller.Point | null
    private startPoint: PScroller.Point | null
    private startTime: number
    private bouncing: -1 | 1 | 0 = 0

    public config = {
        // 触发惯性滚动的 触摸时间上限
        timeForEndScroll: 300,
        // 定点滚动曲线
        scrollCurve: 7,
        // 触发滚动停止的最小变动值
        minDeltaToStop: 0.3,
        // 惯性滚动的速度衰减
        speedDecay: (speed) => speed - speed * 0.02,
        // 弹性拉动衰减
        bounceResist: (delta) => {
            let rate
            if (this.bouncing < 0) {
                rate = 0.8 - this.content[this.target] * 0.005
            } else if (this.bouncing > 0) {
                const attr = this.direction === 'vertical' ? 'height' : 'width'
                const parentLen = this[attr]
                const childLen = this.content[attr]
                rate = 0.8 - (parentLen - this.content[this.target] - childLen) * 0.005
            } else {
                rate = 1
            }
            return delta * rate
        },
    }
    constructor(options: IOps = {}, parent?) {
        this.options = options
        this.parent = parent;

        ['x', 'y', 'width', 'height', 'direction', 'overflow'].map((attr) => {
            if (!is.undef(options[attr])) this[attr] = options[attr]
        })

        if (this.direction === 'horizontal') {
            this.target = 'x'
        } else if (this.direction === 'vertical') {
            this.target = 'y'
        } else {
            console.error(`the direction only support horizontal or vertical, now value is ${this.direction}`)
        }

        this.config = extend(this.config, this.options.config)
        this.init()
    }
    private init() {
        this.container = new Container()
        this.container.addChild(this.content = new Container())
        this.container.x = this.x
        this.container.y = this.y
        this.container.sortableChildren = true
        this.container.name = 'Scroller'
        this.content.name = 'Context'
        this.content.zIndex = 9

        if (this.parent && this.parent.addChild) {
            this.parent.addChild(this.container)
        }

        this._createMask()
        this._bindOriginEvent()
    }
    private _createMask() {
        const mask = new Graphics()
        mask.beginFill(0xFFFFFF, 1)
        mask.drawRect(0, 0, this.width, this.height)
        mask.endFill()
        this.container.addChild(this.mask = mask)
        this.container.mask = mask
    }
    private _bindOriginEvent() {
        this.container.interactive = true
        ORIGIN_EVENT_MAP.map(({ name, fn }) => {
            this.container.on(name, this[fn], this)
        })
    }
    public _start(ev: PScroller.PixiEvent) {
        this.startTime = Date.now()
        this.touching = true
        this.touchStartPoint = this.startPoint = getPoint(ev, 0)
    }
    public _move(ev: PScroller.PixiEvent) {
        if (!this.touching) return
        const curPoint = getPoint(ev, 0)

        if (!this.startPoint) this.startPoint = curPoint
        let delta = curPoint[this.target] - this.startPoint[this.target]

        // 拖动跟随
        this._scroll(delta, (toBounce) => {
            if (toBounce) {
                if (delta > 0) {
                    this.bouncing = -1
                } else if (delta < 0) {
                    this.bouncing = 1
                }
                delta = this.config.bounceResist(delta)
                this.content[this.target] += delta
            }
        })

        this.startPoint = curPoint
    }
    public _end(ev) {
        this.touching = false
        const endPoint = getPoint(ev, 0)
        const endTime = Date.now()
        const deltaT = endTime - this.startTime

        if (
            this.bouncing &&
            !(this.bouncing < 0 && this.content[this.target] < 0) &&
            !(this.bouncing > 0 && this.content[this.target] > -this.maxScrollDis)
        ) {
            // 当正在回弹
            // 且结束点未超过回弹终点时
            // 继续回弹
            this._bounceBack()
        } else if (deltaT < this.config.timeForEndScroll) {
            // 否则触发惯性滚动
            this._endScroll(endPoint, deltaT)
        }
    }
    private _bounceBack() {
        const _back = (pos?) => {
            const end = typeof pos === 'number' ? pos : (this.bouncing < 0 ? 0 : -this.maxScrollDis)
            this._scrollTo(end, (pos, isStoped) => {
                if (isStoped) {
                    if (this.content[this.target] === end) {
                        this.bouncing = 0
                    }
                } else {
                    this.content[this.target] = pos
                }
            })
        }
        // 触发边界回弹
        if (is.fn(this.options.onBounce)) {
            this.options.onBounce(this.bouncing, (pos?) => _back(pos), this.content[this.target])
        } else {
            _back()
        }
    }
    // 缓动定点滚动
    private _scrollTo(end: number, callback?) {
        let start = this.content[this.target]
        if (start === end) return

        loop(() => {
            if (this.touching) return false

            start = start + (end - start) / this.config.scrollCurve
            if (Math.abs(start - end) < this.config.minDeltaToStop) {
                callback && callback(end, true)
                return false
            }
            callback && callback(start, false)
            return true
        })
    }
    private _scroll(delta: number, callback = (toBounce) => {}) {
        if (this.overflow === 'scroll') {
            const next = this.content[this.target] + delta
            if (next <= 0 && next >= -this.maxScrollDis) {
                this.content[this.target] += delta
                callback(false)

                if (this.options.onScroll) {
                    this.options.onScroll(this.content[this.target])
                }
            } else {
                callback(true)
            }
        }
    }
    private _endScroll(endPoint, deltaT) {
        if (!this.touchStartPoint) return
        const deltaPos = endPoint[this.target] - this.touchStartPoint[this.target]

        let speed = deltaPos / deltaT

        let dpos
        loop((next) => {
            if (this.touching) return
            dpos = speed * 16
            this._scroll(dpos, (toBounce) => {
                if (toBounce) {
                    if (dpos > 0) {
                        this.bouncing = -1
                    } else if (dpos < 0) {
                        this.bouncing = 1
                    }

                    loop(() => {
                        if (this.touching) return false

                        this.content[this.target] += dpos
                        dpos = this.config.bounceResist(dpos)
                        if (Math.abs(dpos) < this.config.minDeltaToStop) {
                            this._bounceBack()
                            return false
                        } else {
                            return true
                        }
                    })
                } else if (Math.abs(dpos) > 1)  {
                    speed = this.config.speedDecay(speed)
                    next()
                }
            })
        }, false)
    }
    public addChild(elm, scrollable: boolean = true) {
        if (scrollable) {
            this.content.addChild(elm)   
            const attr = this.direction === 'vertical' ? 'height' : 'width'
            const parentLen = this[attr]
            const childLen = this.content[attr]
    
            if (childLen > parentLen) {
                this.maxScrollDis = childLen - parentLen
            } else {
                this.overflow = 'hidden'
            }
        } else {
            this.container.addChild(elm)
        }
    }
    public removeChild(elm) {
        this.content.removeChild(elm)
    }
}