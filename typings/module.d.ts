declare module 'bplist-creator' {
    export function Real(): void;

    function bplistCreator(dicts: any): Buffer;
    export default bplistCreator;
}

declare module 'bplist-parser' {
    export type ParseResult = Array<any>;
    export type ParseFileCallback = (err: Error, result: ParseResult) => void;

    export function parseFile(fileNameOrBuffer: string | Buffer, callback: ParseFileCallback ): Promise<ParseResult>;
    export function parseBuffer(buffer: string | Buffer): ParseResult;
}
