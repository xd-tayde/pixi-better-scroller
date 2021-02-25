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
        bounceCurve?: number,
        // 触发滚动停止的最小变动值
        minDeltaToStop?: number,  
        // 惯性滚动的速度衰减
        speedDecayCurve?: number,
    }
    
    interface IOps {
        width?: number,
        height?: number,
        x?: number,
        y?: number,
        scrollX?: boolean
        scrollY?: boolean
        radius?: number,
        config?: IConfig,
        onScroll?: (pos: number, status: 'x' | 'y') => void
        onBounce?: (pos: number, back: (pos?: number) => void, status: ['x' | 'y', -1 | 0 | 1]) => void
    }

    interface destroyOps {
        children?: boolean | undefined;
        texture?: boolean | undefined;
        baseTexture?: boolean | undefined;
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
        width: number
        height: number
        x: number
        y: number
        radius: number
        constructor(options: PScroller.IOps, parent: any)
        addChild(elm: any, scrollable?: boolean)
        removeChild(elm?: any)
        destroy(options?: PScroller.destroyOps)
        scrollTo(end: number, hasAnima?: boolean)
    }
}