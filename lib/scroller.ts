import { Container } from 'pixi.js'
import { is, loop, extend } from './utils'

export class Scroller {
    public config = {
        // 定点滚动曲线
        bounceCurve: 7,
        // 触发滚动停止的最小变动值
        minDeltaToStop: 0.3,
        // 惯性滚动的速度衰减
        speedDecayCurve: 0.02,
    }

    public callbacks: {
        onScroll?: PScroller.IOps['onScroll']
        onBounce?: PScroller.IOps['onBounce']
    } = {}

    private parent: any
    private target: Container
    private attr: 'x' | 'y'
    private len: 'width' | 'height'
    private scrollable: boolean

    private pausing: boolean = false

    // 边界状态
    //      0: 滚动区间中
    //      -1: 到达左边界
    //      1: 到达右边界
    private toBounce: 0 | -1 | 1

    // 最大滚动距离
    private maxScrollDis: number = 0

    public scrolling: boolean = false
    constructor(opt: {
        parent: any, 
        target: Container, 
        dire: 'hor' | 'ver',
        scrollable: boolean,
        config?: PScroller.IConfig
        onScroll?: PScroller.IOps['onScroll']
        onBounce?: PScroller.IOps['onBounce']
    }) {
        const { parent, target, dire, scrollable, config, onBounce, onScroll } = opt
        this.parent = parent
        this.target = target

        if(!is.undef(scrollable)) this.scrollable = !!scrollable
        if (is.fn(onBounce)) this.callbacks.onBounce = onBounce
        if (is.fn(onScroll)) this.callbacks.onScroll = onScroll

        this.attr = dire === 'hor' ? 'x' : 'y'
        this.len = dire === 'hor' ? 'width' : 'height'
        this.config = extend(this.config, config)
    }
    public init() {
        const pLen = this.parent[this.len]
        const cLen = this.target[this.len]

        if (cLen > pLen) {
            this.maxScrollDis = cLen - pLen
            if (is.undef(this.scrollable)) {
                this.scrollable = true
            }
        }
    }
    public scroll(delta: number) {
        if (!this.scrollable || !delta) return
        this.scrolling = true

        const next = this.target[this.attr] + delta
        if (next <= 0 && next >= -this.maxScrollDis) {
            this.toBounce = 0
        } else if (next <= 0) {
            this.toBounce = 1
        } else if (next >= -this.maxScrollDis) {
            this.toBounce = -1
        }

        delta = this.bounceResist(delta)
        this.addPos(delta)

        if (is.fn(this.callbacks.onScroll)) {
            this.callbacks.onScroll(this.target[this.attr], this.attr)
        }
    }
    public addPos(delta: number) {
        if (!is.num(delta) || delta === 0) return
        this.target[this.attr] += Math.round(delta)
    }

    public setPos(pos: number) {
        if (!is.num(pos)) return
        this.target[this.attr] = Math.round(pos)
    }

    // 弹性拉动衰减
    public bounceResist(delta: number) {
        let rate
        const pLen = this.parent[this.len]
        const cLen = this.target[this.len]
        if (this.toBounce < 0) {
            if (pLen >= cLen) {
                rate = 0.8 - cLen * 0.0058
            } else {
                rate = 0.8 - this.target[this.attr] * 0.0058
            }
        } else if (this.toBounce > 0) {
            if (pLen >= cLen) {
                rate =  0.8 - cLen * 0.0058
            } else {
                rate = 0.8 - (pLen - this.target[this.attr] - cLen) * 0.0058
            }
        } else {
            rate = 1
        }

        return delta * Math.abs(rate) 
    }

    // 弹性回弹
    public bounceBack() {
        const _back = (pos?) => {
            const end = this.toBounce < 0 ? 0 : -this.maxScrollDis
            this.scrollTo(is.num(pos) ? pos : end)
        }

        if (is.fn(this.callbacks.onBounce)) {
            this.callbacks.onBounce(this.target[this.attr], (pos?) => _back(pos), [this.attr, this.toBounce])
        } else {
            _back()
        }
    }

    // 缓动滚动
    public scrollTo(end: number) {
        let start = this.target[this.attr]
        if (start === end) return
        loop(() => {
            if (this.pausing) return false
            start = start + (end - start) / this.config.bounceCurve
            if (Math.abs(start - end) < this.config.minDeltaToStop) {
                // 停止
                this.setPos(end)
                this.scrolling = false
                return false
            }
            this.setPos(start)
            return true
        })
    }

    // 惯性滚动
    public inertiaScroll(speed: number) {
        let delta
        loop((next) => {
            // 点击停止惯性滚动
            if (this.pausing) {
                this.scrolling = false
                return
            }
            delta = speed * 16

            if (Math.abs(delta) > 1) {
                this.scroll(delta)
                if (this.toBounce) {
                    loop(() => {
                        if (this.pausing) return false

                        this.addPos(delta)
                        delta = this.bounceResist(delta)

                        // 当下次滚动距离小于停止阈值时
                        // 触发弹性回弹
                        if (Math.abs(delta) < this.config.minDeltaToStop) {
                            this.bounceBack()
                            return false
                        } else {
                            return true
                        }
                    })
                } else if (Math.abs(delta) > 1)  {
                    speed = this._speedDecay(speed)
                    next()
                }
            } else {
                this.scrolling = false
            }
        }, false)
    }
    public setStatus(pause: boolean) {
        this.pausing = pause
    }
    public isToBounce() {
        return !!(
            this.toBounce &&
            !(this.toBounce < 0 && this.target[this.attr] < 0) &&
            !(this.toBounce > 0 && this.target[this.attr] > -this.maxScrollDis)
        )
    }

    private _speedDecay(speed) {
        return speed - speed * this.config.speedDecayCurve
    }
}