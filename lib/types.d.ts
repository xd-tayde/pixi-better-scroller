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
        x: number
        y: number
    }
}