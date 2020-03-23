import { Container, Graphics } from 'pixi.js'
import { is, getPoint, loop, extend } from './utils'
import { createRect } from 'example'

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

function isVer(direction: PScroller.IOps['direction']) {
    if (!direction) return true
    return !['horizontal', 'hor'].includes(direction)
}

export default class PixiBetterScroller {
    public options: PScroller.IOps
    public direction: PScroller.IOps['direction'] = 'vertical'
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
    public static: Container
    public mask: Graphics

    private touching: boolean = false
    private touchStartPoint: PScroller.Point | null
    private startPoint: PScroller.Point | null
    private startTime: number
    private bouncing: -1 | 1 | 0 = 0

    public scrolling: boolean = false

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
                const attr = isVer(this.direction) ? 'height' : 'width'
                const parentLen = this[attr]
                const childLen = this.content[attr]
                rate = 0.8 - (parentLen - this.content[this.target] - childLen) * 0.005
            } else {
                rate = 1
            }
            return delta * rate
        },
    }
    constructor(options: PScroller.IOps = {}, parent?) {
        this.options = options
        this.parent = parent;

        ['x', 'y', 'width', 'height', 'direction', 'overflow'].map((attr) => {
            if (!is.undef(options[attr])) this[attr] = options[attr]
        })

        if (isVer(this.direction)) {
            this.target = 'y'
        } else {
            this.target = 'x'
        }

        this.config = extend(this.config, this.options.config)
        this.init()
    }
    private init() {
        this.container = new Container()
        this.container.x = this.x
        this.container.y = this.y
        this.container.sortableChildren = true
        this.container.name = 'Scroller'

        this.container.addChild(this.static = new Container())
        this.static.name = 'Static'
        this.static.zIndex = 1

        this.container.addChild(this.content = new Container())
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
        if (!delta) return

        // 拖动跟随
        this.scrolling = true
        this._scroll(delta, (toBounce) => {
            if (toBounce) {
                this.bouncing = toBounce
                delta = this.config.bounceResist(delta)
                this._setPos(delta)
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
            const end = this.bouncing < 0 ? 0 : -this.maxScrollDis
            this._scrollTo(typeof pos === 'number' ? pos : end, (pos, isStoped) => {
                if (isStoped) {
                    if (this.content[this.target] === end) {
                        this.bouncing = 0
                    }
                    this.scrolling = false
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
                this.content[this.target] = end
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
                this._setPos(delta)
                callback(false)

                if (this.options.onScroll) {
                    this.options.onScroll(this.content[this.target])
                }
            } else if (next <= 0) {
                callback(1)
            } else if (next >= -this.maxScrollDis) {
                callback(-1)
            }
        }
    }
    private _endScroll(endPoint, deltaT) {
        if (!this.touchStartPoint) return
        const deltaPos = endPoint[this.target] - this.touchStartPoint[this.target]
        
        if (!deltaPos) return
        let speed = deltaPos / deltaT

        let dpos
        loop((next) => {
            // 点击停止惯性滚动
            if (this.touching) {
                this.scrolling = false
                return
            }
            dpos = speed * 16

            if (Math.abs(dpos) > 1) {
                this._scroll(dpos, (toBounce) => {
                    if (toBounce) {
                        this.bouncing = toBounce
    
                        loop(() => {
                            if (this.touching) return false
    
                            this._setPos(dpos)
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
            } else {
                this.scrolling = false
            }
        }, false)
    }
    private _setPos(delta) {
        this.content[this.target] += Math.round(delta)
    }
    public addChild(elm, scrollable: boolean = true) {
        if (scrollable) {
            this.content.addChild(elm)   
            const attr = isVer(this.direction) ? 'height' : 'width'
            const parentLen = this[attr]
            const childLen = this.content[attr]
    
            if (childLen > parentLen) {
                this.maxScrollDis = childLen - parentLen
                if (this.options.overflow !== 'hidden') {
                    this.overflow = 'scroll'
                }
            } else if (this.options.overflow !== 'scroll') {
                this.overflow = 'hidden'
            }
        } else {
            this.static.addChild(elm)
        }
    }
    public removeChild(elm) {
        if (elm) {
            this.content.removeChild(elm)
            this.static.removeChild(elm)
        } else {
            this.static.removeChildren()
            this.content.removeChildren()
        }
    }
    public scrollTo(end, hasAnima: boolean = true) {
        if (hasAnima) {
            this._scrollTo(-end, (pos, isStoped) => {
                const delta = pos - this.content[this.target]
                this._scroll(delta, (toBounce) => {
                    this.content[this.target] = pos
                    if (isStoped && toBounce) {
                        this.bouncing = toBounce
                        this._bounceBack()
                    }
                })
            })
        } else {
            this.content[this.target] = -end
        }
    }
}
