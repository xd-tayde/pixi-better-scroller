declare const canvas: any

declare namespace PScroller {
    export type Handler = (e: object) => void
    export interface RTouchEvent {
        origin: PixiEvent
        type: string
        delta?: {
            scale?: number,
            rotate?: number,
            x?: number,
            y?: number,
        }
        stopPropagation?: () => void
    }
    interface PixiEvent {
        data: {
            global: Point,
            [props: string]: any,
        },
        [props: string]: any,
    }
    interface Point {
        id: number
        x: number
        y: number
        t: number
    }

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
        // 反向
        antiFactor?: boolean | number,
    }
    
    interface IOps {
        width?: number,
        height?: number,
        x?: number,
        y?: number,
        direction?: 'horizontal' | 'vertical' | 'ver' | 'hor',
        overflow?: 'scroll' | 'hidden',
        radius?: number,
        config?: IConfig,
        onScroll?: (pos: number) => void
        onBounce?: (direction: -1 | 1 | 0, next: (pos?: number) => void, pos: number) => void
    }
}

declare module 'pixi-better-scroller' {
    export default class PixiBetterScroller {
        container: PIXI.Container
        content: PIXI.Container
        static: PIXI.Container
        mask: PIXI.Graphics
        parent: any

        scrolling: boolean
        direction: PScroller.IOps['direction']
        width: number
        height: number
        x: number
        y: number
        radius: number
        overflow: 'scroll' | 'hidden'
        constructor(options: PScroller.IOps, parent: any)
        addChild(elm: any, scrollable?: boolean)
        removeChild(elm?: any)
        destroy()
        scrollTo(end: number, hasAnima?: boolean)
    }
}