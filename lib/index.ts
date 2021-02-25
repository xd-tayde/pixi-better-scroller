import { Container, Graphics, MaskData, Rectangle } from 'pixi.js'
import { is, getPoint, extend } from './utils'
import { Scroller } from './scroller'

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
}]

export default class PixiBetterScroller {
    public get width() {
        return is.num(this.options.width) ? this.options.width : 500
    }
    public set width(val: number) {
        if (this.options.width === val) return
        this.options.width = val
        this._createMask()
        this.initScroller()
    }

    public get height() {
        return is.num(this.options.height) ? this.options.height : 500
    }
    public set height(val: number) {
        if (this.options.height === val) return
        this.options.height = val
        this._createMask()
        this.initScroller()
    }

    public get x() {
        return is.num(this.options.x) ? this.options.x : 0
    }
    public set x(val: number) {
        this.options.x = val
        if (this.container) {
            this.container.x = val
        }
    }

    public get y() {
        return is.num(this.options.y) ? this.options.y : 0
    }
    public set y(val: number) {
        this.options.y = val
        if (this.container) {
            this.container.y = val
        }
    }
    public get scrolling() {
        return !!(this.XScroller.scrolling && this.YScroller.scrolling)
    }


    public options: PScroller.IOps
    public radius: number = 0

    public scrollX: boolean
    public XScroller: Scroller
    
    public scrollY: boolean
    public YScroller: Scroller


    public parent
    public container: Container
    public content: Container
    public static: Container
    public mask: Graphics | undefined

    private touching: boolean = false
    private touchStartPoints: PScroller.Point[] = []
    private curPoints: PScroller.Point[] = []

    public config = {
        // 触发惯性滚动的 触摸时间上限
        timeForEndScroll: 300,
    }
    constructor(options: PScroller.IOps = {}, parent?) {
        this.options = options
        this.parent = parent;

        ['scrollX', 'scrollY', 'radius'].map((attr) => {
            if (!is.undef(options[attr])) this[attr] = options[attr]
        })

        this.config = extend(this.config, this.options.config)
        this.init()
        this.createScroller()
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
        if (this.mask) {
            this.container.removeChild(this.mask)
            this.mask.destroy()
            this.mask = undefined
            this.container.mask = null
        }

        const rect = new Graphics()
        rect.beginFill(0xFFFFFF, 1)
        if (this.radius) {
            rect.drawRoundedRect(0, 0, this.width, this.height, this.radius)
        } else {
            rect.drawRect(0, 0, this.width, this.height)
        }
        rect.endFill()

        if (this.radius) {
            this.container.mask = rect
        } else {
            const mask = new MaskData(rect)
            mask.type = 1
            mask.autoDetect = false
            this.container.mask = mask
            this.container.hitArea = new Rectangle(0, 0, this.width, this.height)
        }
        this.container.addChild(rect)
    }
    private _bindOriginEvent() {
        this.container.interactive = true
        ORIGIN_EVENT_MAP.map(({ name, fn }) => {
            this.container.on(name, this[fn], this)
        })
    }
    private _unbindOriginEvent() {
        this.container.interactive = false
        ORIGIN_EVENT_MAP.map(({ name, fn }) => {
            this.container.off(name, this[fn], this)
        })
    }
    public _start(ev: PScroller.PixiEvent) {
        const startPoint = getPoint(ev)
        this.touchStartPoints.push(startPoint)
        this.curPoints.push(startPoint)

        this.touchScroller(this.touching = true)
    } 
    public _move(ev: PScroller.PixiEvent) {
        if (!this.touching) return

        const curPoint = getPoint(ev)
        const lastPoint = this._findLastPoint(curPoint.id)
        if (!lastPoint) return

        let deltaX = curPoint.x - lastPoint.x
        let deltaY = curPoint.y - lastPoint.y

        this.scrollScroller(deltaX, deltaY)
        this._replaceCurPoint(curPoint)
    }
    public _end(ev) {
        this.touchScroller(this.touching = false)
        const endPoint = getPoint(ev)
        const startPoint = this._findStartPoint(endPoint.id)
        if (!startPoint) return

        const deltaT = endPoint.t - startPoint.t
        const deltaX = endPoint.x - startPoint.x
        const deltaY = endPoint.y - startPoint.y

        this.handleScrollEnd(deltaX, deltaY, deltaT)
        
        this.touchStartPoints = []
        this.curPoints = []
    }
    private _findStartPoint(id: number) {
        for (let i = 0; i < this.touchStartPoints.length; i++) {
            const point = this.touchStartPoints[i]
            if (point.id === id) return point
        }
        return undefined
    }
    private _findLastPoint(id: number) {
        for (let i = 0; i < this.curPoints.length; i++) {
            const point = this.curPoints[i]
            if (point.id === id) return point
        }
        return undefined
    }
    private _replaceCurPoint(curPoint: PScroller.Point) {
        const startPoint = this._findLastPoint(curPoint.id)
        if (startPoint) {
            const index = this.curPoints.indexOf(startPoint)
            this.curPoints.splice(index, 1, curPoint)
        }
    }

    public addChild(elm, scrollable: boolean = true) {
        if (scrollable) {
            this.content.addChild(elm)   
            this.initScroller()
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
    public destroy(options?: PScroller.destroyOps) {
        this._unbindOriginEvent()
        this.container.destroy(options)
    }
    public scrollTo(end: number | number[], hasAnima: boolean = true) {
        let endX, endY
        if (is.num(end)) {
            endX = endY = end
        } else if (is.array(end)) {
            endX = end[0]
            endY = end[1]
        }

        if (hasAnima) {
            this.XScroller.scrollTo(-endX)
            this.YScroller.scrollTo(-endY)
        } else {
            this.XScroller.setPos(-endX)
            this.YScroller.setPos(-endY)
        }
    }


    // control scroller
    private createScroller() {
        const createOpt = (dire: 'hor' | 'ver') => {
            const scrollable = dire === 'hor' ? this.scrollX : this.scrollY
            return {
                parent: this,
                target: this.content,
                dire,
                scrollable,
                config: this.options.config,
                onBounce: (pos, back, toBounce) => {
                    if (is.fn(this.options.onBounce)) {
                        this.options.onBounce(pos, back, toBounce)
                    } else {
                        back()
                    }
                },
                onScroll: (pos, attr) => {
                    if (is.fn(this.options.onScroll)) {
                        this.options.onScroll(pos, attr)
                    }
                },
            }
        }
        this.XScroller = new Scroller(createOpt('hor'))
        this.YScroller = new Scroller(createOpt('ver'))
    }
    private initScroller() {
        this.XScroller.init()
        this.YScroller.init()
    }
    private touchScroller(touching: boolean) {
        this.XScroller.setStatus(touching)
        this.YScroller.setStatus(touching)
    }
    private scrollScroller(deltaX: number, deltaY: number) {
        this.XScroller.scroll(deltaX)
        this.YScroller.scroll(deltaY)
    }
    private handleScrollEnd(deltaX: number, deltaY: number, deltaT: number) {
        if (this.XScroller.isToBounce()) {
            // 当正在回弹
            // 且结束点未超过回弹终点时
            // 继续回弹
            this.XScroller.bounceBack()
        } else if (deltaT < this.config.timeForEndScroll) {
            // 否则触发惯性滚动
            if (!deltaX) return
            const speed = deltaX / deltaT
            this.XScroller.inertiaScroll(speed)
        }

        if (this.YScroller.isToBounce()) {
            // 当正在回弹
            // 且结束点未超过回弹终点时
            // 继续回弹
            this.YScroller.bounceBack()
        } else if (deltaT < this.config.timeForEndScroll) {
            // 否则触发惯性滚动
            if (!deltaY) return
            const speed = deltaY / deltaT
            this.YScroller.inertiaScroll(speed)
        }
    }
}
