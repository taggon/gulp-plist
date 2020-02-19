import fs from 'fs';
import path from 'path';
import gulp from 'gulp';
import plist from 'plist';
import File from 'vinyl';
import plugin from '../src';

const fixtures = (glob: string): string => path.join(__dirname, 'fixtures', glob);

function readFile(filename: string): File {
    const filepath = fixtures(filename);

    return (
        new File({
            path: filepath,
            contents: fs.readFileSync(filepath)
        })
    );
}

describe( 'gulp-plist', () => {
    it('should add data to empty plist', () => {
        expect.assertions(1);

        const writable = plugin({ Author: 'Unknown', Birthdate: 1234, Appended: { prop: 'value' } });

        writable.on('data', data => {
            const expected = {
                Author: 'Unknown',
                Birthdate: 1234,
                Appended: { prop: 'value' }
            };

            expect( plist.parse(data.contents.toString('utf-8')) ).toEqual(expected);
        });

        writable.write(readFile('empty.plist'));
    });

    it('should modify plain text plist', () => {
        expect.assertions(1);

        const writable = plugin({ Author: 'Unknown', Birthdate: 1234, Appended: { prop: 'value' } });

        writable.on('data', data => {
            const expected = {
                Author: 'Unknown',
                Lines: ['It is a tale told by an idiot,', 'Full of sound and fury, signifying nothing.'],
                Birthdate: 1234,
                Appended: { prop: 'value' }
            };

            expect( plist.parse(data.contents.toString('utf-8')) ).toEqual(expected);
        });

        writable.write(readFile('sample.plist'));
    });

    it('should parse binary plist automatically ', () => {
        expect.assertions(1);

        const writable = plugin({});

        writable.on('data', data => {
            const expected = {
                "Year Of Birth": 1965,
                "Date Of Graduation": new Date('2004-06-22T19:23:43Z'),
                "Pets Names": [],
                "Picture": Buffer.from([0x3c, 0x42, 0x81, 0xa5, 0x81, 0xa5, 0x99, 0x81, 0x42, 0x3c]),
                "City Of Birth": "Springfield",
                "Name": "John Doe",
                "Kids Names": ["John", "Kyra"],
            };

            expect( plist.parse(data.contents.toString('utf-8')) ).toEqual(expected);
        });

        writable.write(readFile('sample-binary.plist'));
    });

    it('should add data to binary plist', async () => {
        expect.assertions(1);

        const writable = plugin({ "Year Of Birth": 1024, "Appended": ["Hello", "world"] });

        writable.on('data', data => {
            const expected = {
                "Year Of Birth": 1024,
                "Appended": ["Hello", "world"],
            };

            expect( plist.parse(data.contents.toString('utf-8')) ).toEqual(expected);
        });

        writable.write(readFile('empty-binary.plist'));
    });

    it('should modify binary plist', async () => {
        expect.assertions(1);

        const writable = plugin({ "Year Of Birth": 1024, "Appended": ["Hello", "world"] });

        writable.on('data', data => {
            const expected = {
                "Year Of Birth": 1024,
                "Date Of Graduation": new Date('2004-06-22T19:23:43Z'),
                "Pets Names": [],
                "Picture": Buffer.from([0x3c, 0x42, 0x81, 0xa5, 0x81, 0xa5, 0x99, 0x81, 0x42, 0x3c]),
                "City Of Birth": "Springfield",
                "Name": "John Doe",
                "Kids Names": ["John", "Kyra"],
                "Appended": ["Hello", "world"],
            };

            expect( plist.parse(data.contents.toString('utf-8')) ).toEqual(expected);
        });

        writable.write(readFile('sample-binary.plist'));
    });

    it('should modify plist with a modifier function', async () => {
        expect.assertions(1);

        const writable = plugin( json => {
            delete json['Pets Names'];
            delete json['Kids Names'];
            delete json['Picture'];

            json['Married'] = true;

            return json;
        } );

        writable.on('data', data => {
            const expected = {
                "Year Of Birth": 1965,
                "Date Of Graduation": new Date('2004-06-22T19:23:43Z'),
                "City Of Birth": "Springfield",
                "Name": "John Doe",
                "Married": true,
            };

            expect( plist.parse(data.contents.toString('utf-8')) ).toEqual(expected);
        });

        writable.write(readFile('sample-binary.plist'));
    });

    it('should write binary plist when writeBinary is true', async () => {
        expect.assertions(1);

        const writable = plugin({}, { writeBinary: true });

        writable.on('data', data => {
            expect( data.contents.toString('ascii', 0, 6) ).toBe('bplist');
        });

        writable.write(readFile('sample.plist'));
    });

    it('should write xml plist when writeBinary is false', async () => {
        expect.assertions(1);

        const writable = plugin({}, { writeBinary: false });

        writable.on('data', data => {
            expect( data.contents.toString('ascii', 0, 6) ).toBe('<?xml ');
        });

        writable.write(readFile('sample.plist'));
    });

    it('should throw, when arguments is missing', () => {
        // This test is intentionally designed to throw type errors.

        /* eslint-disable @typescript-eslint/ban-ts-ignore */

        // @ts-ignore
        expect(plugin).toThrowError('missing `modifier` argument');

        /* eslint-enable @typescript-eslint/ban-ts-ignore */
    });
    
    it('should throw, when arguments is invalid', () => {
        const errorMsg = '`modifier` must be a function or an object';

        /* eslint-disable @typescript-eslint/ban-ts-ignore */

        // @ts-ignore
        expect( () => plugin(1) ).toThrowError(errorMsg);
    
        // @ts-ignore
        expect( () => plugin('string') ).toThrowError(errorMsg);
    
        // @ts-ignore
        expect( () => plugin(null) ).toThrowError(errorMsg);

        /* eslint-enable @typescript-eslint/ban-ts-ignore */
    });

    it('should emit error for invalid plist', () => {
        const writable = plugin({});

        expect( () => writable.write(readFile('invalid.plist')) ).toThrowError('Unknown plist format');
    });

    it('should emit error on streamed file', done => {
        gulp.src(fixtures('*'), { buffer: false })
            .pipe(plugin({}))
            .once('error', err => {
                expect(err.message).toBe('Streaming is not supported');
                done();
            });
    });

    it('should do nothing for null contents', () => {
        const writable = plugin({ Author: 'Unknown' });
        const nullFile = new File({ contents: null });

        expect(nullFile.contents).toBeNull();

        writable.write(nullFile);
        
        expect(nullFile.contents).toBeNull();
    });
});
