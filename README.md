# pixi-better-scroller

## introduce:

a nice, simple scroller container which has the **inertia scrolling**, **bounce scrolling** and **drag scrolling**, as the ios system's scroller.

## install

```js
npm i pixi-better-scroller
```

## usage
    
```js
import PixiBetterScroller from 'pixi-better-scroller'

// init the scroller
const scroller = new PixiBetterScroller({
    direction: 'vertical',
    width: 260,
    height: 160,
    onScroll(pos) {
        console.log('scroll', pos)
    },
    onBounce(direction, next) {
        console.log('onBounce', direction)
        next()
    },
}, game.stage)

// add some children into the scroller
scroller.addChild(context)
```

## api

### `- new PixiBetterScroller(IOptions, parent)`

create the instance of scroller.

```js
interface IOptions {
    // scroller size
    width?: number,
    height?: number,
    
    // scroller position
    x?: number,
    y?: number,
    
    // scroll direction
    direction?: 'horizontal' | 'vertical' | 'ver' | 'hor',
    
    overflow?: 'scroll' | 'hidden',
    
    /**
     * scroll callback
     * @param pos: number, current scroller position
     */
    onScroll?: (pos: number) => void
    
    /**
     * when scroll reach boundary of scroller
     * @param direction: -1 | 1 (left/top | right/bottom)
     * @param next: (pos?: number) => void, bounce back function
     * @param pos: number, current scroller position
     */
    onBounce?: (direction, next, pos: number) => void
    
    // scroll config
    config?: IConfig,
}


interface IConfig {

    // the max time between start and end will trigger the inertia scrolling
    // over this time, there will be no inertia
    // unit: ms, default: 300
    timeForEndScroll?: number,
    
    // bounce back scroll curve
    // bigger value will be slower
    // default: 7
    scrollCurve?: number,
    
    // when the delta position less then it, scrolling will be stoped.
    // it affects the smoothness of scrolling stop
    // unit: px, default: 0.3
    minDeltaToStop?: number,  
    
    // reverse direction factor to prevent scroll
    //      false: close this rule
    //      true: when antiDelta > delta, prevent scroll
    //      number: when antiDelta + n > delta, prevent scroll
    antiFactor?: boolean | number,

    // the speed attenuation of inertia scrolling
    // default: speed - speed * 0.02
    speedDecay?: (speed) => number,
    
    // the resistion of bounce
    bounceResist?: (delta) => number,


    
}
```

### `- scroller.addChild(elm, scrollable: boolean)`

add pixi element into the scroller.

```js
/**
 * @param elm: pixi element
 * @param scrollable?: boolean
 * tips: not scrollable element will be bottom (zIndex) by default, you can set zIndex to up.
 */
scroller.addChild(elm, scrollable?)
```

### `- scroller.removeChild(elm?)`

remove pixi element from scroller.

### `- scroller.scrollTo(end, hasAnima?)`

scroller scroll to end position.

```js
/**
 * @param end: number
 * @param hasAnima?: boolean
 */
scroller.scrollTo(end, hasAnima?)
```

### `- scroller.container`

the pixi container of scroller.

### `- scroller.content`

the pixi container of scroll content.



