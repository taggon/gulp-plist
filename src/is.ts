// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isPlainObject(obj: any): boolean {
    return (
        typeof obj === 'object' &&
        Object.prototype.toString.call(obj) === '[object Object]'
    );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isFunction(fn: any): boolean {
    return typeof fn === 'function';
}
