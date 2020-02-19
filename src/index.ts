import { Transform, TransformCallback } from 'stream';
import PluginError from 'plugin-error';
import plist from 'plist';
import { parseBuffer } from 'bplist-parser';
import bplistCreator from 'bplist-creator';
import merge from 'deepmerge';
import { isFunction, isPlainObject } from './is';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type GulpPlistJson = { [key: string]: any };

export type GulpPlistModifierFunction = (json: GulpPlistJson) => GulpPlistJson;

export type GulpPlistModifierArg = GulpPlistJson | GulpPlistModifierFunction;

export type GulpPListOptions = {
    writeBinary?: boolean;
};

const LIB_NAME = 'gulp-plist';

const defaultOptions: GulpPListOptions = {
    writeBinary: false,
};

function createModifer(
    modifier: GulpPlistModifierArg
): GulpPlistModifierFunction {
    if (typeof modifier === 'undefined') {
        throw new PluginError(LIB_NAME, 'missing `modifier` argument');
    }

    if (isFunction(modifier)) {
        return modifier as GulpPlistModifierFunction;
    }

    if (isPlainObject(modifier)) {
        return (json): GulpPlistJson =>
            merge(json, modifier, { isMergeableObject: isPlainObject });
    }

    throw new PluginError(
        LIB_NAME,
        '`modifier` must be a function or an object'
    );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parsePlistData(data: any): GulpPlistJson {
    const magicBytes: string = data.contents.toString('ascii', 0, 6);

    if (magicBytes === 'bplist') {
        return parseBuffer(data.contents)[0];
    }

    if (magicBytes === '<?xml ') {
        return plist.parse(data.contents.toString('utf8')) as GulpPlistJson;
    }

    throw new Error('Unknown plist format');
}

export default function(
    modifier: GulpPlistModifierArg,
    options: GulpPListOptions = {}
): Transform {
    const transform = new Transform({ objectMode: true });
    const opts = Object.assign({}, defaultOptions, options || {});
    const mod = createModifer(modifier);

    transform._transform = function _transform(
        data: any, // eslint-disable-line @typescript-eslint/no-explicit-any
        encoding: string,
        callback: TransformCallback
    ): void {
        // ignore null content
        if (data.isNull()) {
            return callback(null, null);
        }

        // stream is not supported
        if (data.isStream()) {
            this.emit(
                'error',
                new PluginError(LIB_NAME, 'Streaming is not supported')
            );
            return callback();
        }

        try {
            const json = mod(parsePlistData(data));
            data.contents = opts.writeBinary
                ? bplistCreator(json)
                : Buffer.from(plist.build(json));
        } catch (err) {
            this.emit('error', new PluginError(LIB_NAME, err));
            return callback();
        }

        callback(null, data);
    };

    return transform;
}
