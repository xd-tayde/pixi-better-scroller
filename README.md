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
    width: 260,
    height: 160,
    onScroll(pos) {
        console.log('scroll', pos)
    },
    onBounce(direction, back) {
        console.log('onBounce', direction)
        back()
    },
}, game.stage)

// add some children into the scroller
scroller.addChild(child)
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

    // scroller radius
    radius?: number
    
    // scroll config
    scrollX?: boolean
    scrollY?: boolean

    // scroll config
    config?: IConfig,
    
    /**
     * scroll callback
     * @param pos: number, current scroller position
     * @param status: current scroller direction
     */
    onScroll?: (pos: number， status: 'x' | 'y') => void
    
    /**
     * when scroll reach boundary of scroller
     * @param pos: number, current scroller position
     * @param back: (pos?: number) => void, bounce back function
     * @param status: []
     */
    onBounce?: (pos: number, back: (pos?: number) => void, status: ['x' | 'y', -1 | 0 | 1]) => void
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

    // the speed attenuation of inertia scrolling
    // default: 0.02
    speedDecayCurve?: number,
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
scroller.addChild(elm, true)
```

### `- scroller.removeChild(elm?)`

remove pixi element from scroller.

### `- scroller.scrollTo(end, hasAnima?)`

scroller scroll to end position.

```js
/**
 * @param end: number | [endX, endY]
 * @param hasAnima?: boolean
 */
scroller.scrollTo([100, 100], true)
```

### `- scroller.container`

the pixi container of scroller.

### `- scroller.content`

the pixi container of scroll content.

### `- scroller.x / y / width / height`

you can use scroller.x / y / width / height directly to update scroller status.



