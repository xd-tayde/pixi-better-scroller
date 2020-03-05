function isPlainObject(object) {
    // tslint:disable-next-line: one-variable-per-declaration
    let proto,
        ctor,
        class2type = {},
        toString = class2type.toString, // Object.prototype.toString
        hasOwn = class2type.hasOwnProperty,
        fnToString = hasOwn.toString, // Object.toString/Function.toString
        ObjectFunctionString = fnToString.call(Object) // 'function Object() { [native code] }'

    if (!object || toString.call(object) !== '[object Object]') {
        return false
    }

    // According to the object created by `Object.create(null)` is no `prototype`
    proto = Object.getPrototypeOf(object)
    if (!proto) {
        return true
    }

    ctor = hasOwn.call(proto, 'constructor') && proto.constructor
    return typeof ctor === 'function' && fnToString.call(ctor) === ObjectFunctionString
}

export function extend(this: any, ...args) {
    let options
    let name
    let clone
    let copy
    let source
    let copyIsArray
    let target = arguments[0] || {}
    let i = 1
    let length = arguments.length
    let deep = false

    if (typeof target === 'boolean') {
        deep = target
        target = arguments[i] || {}
        i++
    }

    if (typeof target !== 'object' && typeof target !== 'function') {
        target = {}
    }

    if (i === length) {
        target = this
        i--
    }

    for (; i < length; i++) {
        // tslint:disable-next-line: no-conditional-assignment
        if ((options = arguments[i]) !== null) {
            for (name in options) {
                if (options.hasOwnProperty(name)) {
                    source = target[name]
                    copy = options[name]

                    if (target === copy) {
                        continue
                    }

                    // deep clone
                    // tslint:disable-next-line: no-conditional-assignment
                    if (deep && copy && (isPlainObject(copy) || (copyIsArray = Array.isArray(copy)))) {
                        if (copyIsArray) {
                            copyIsArray = false
                            clone = source && Array.isArray(source) ? source : []
                        } else {
                            clone = source && isPlainObject(source) ? source : {}
                        }

                        target[name] = extend(deep, clone, copy)
                    } else if (copy !== undefined) {
                        target[name] = copy
                    }
                }
            }
        }
    }

    return target
}
