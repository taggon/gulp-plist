'use strict';

const fs = require('fs');
const path = require('path');
const gutil = require('gulp-util');
const assert = require('assert');
const plist = require('plist');
const peditor = require('.');

describe('Parse and building', function(){
  it ('should modify plain text format', function(done){
    var stream = peditor({Author: 'Unknown', Birthdate: 1234, Appended: {prop: 'value'}});

    stream.on('data', function(file){
      const expected = {
	Author: 'Unknown',
	Lines: ['It is a tale told by an idiot,', 'Full of sound and fury, signifying nothing.'],
	Birthdate: 1234,
	Appended: {prop: 'value'}
      };
      assert.deepEqual(expected, plist.parse(file.contents.toString('utf-8')));
      done();
    });

    stream.write(readFile('sample.text.plist'));
  });

  it ('should parse binary format automatically ', function(done){
    var stream = peditor({});
    stream.on('data', function(file){
      const expected = {
	"Year Of Birth": 1965,
	"Date Of Graduation": new Date('2004-06-22T19:23:43Z'),
	"Pets Names": [ ],
	"Picture": new Buffer([0x3c,0x42,0x81,0xa5,0x81,0xa5,0x99,0x81,0x42,0x3c]),
	"City Of Birth": "Springfield",
	"Name": "John Doe",
	"Kids Names": ["John", "Kyra"]
      };

      assert.deepEqual(expected, plist.parse(file.contents.toString('utf-8')));
      done();
    });
    stream.write(readFile('sample.binary.plist'));
  });

  it ('should modify binary format', function(done){
    var stream = peditor({"Year Of Birth": 1024, "Appended": ["Hello", "world"]});
    stream.on('data', function(file){
      const expected = {
	"Year Of Birth": 1024,
	"Date Of Graduation": new Date('2004-06-22T19:23:43Z'),
	"Pets Names": [ ],
	"Picture": new Buffer([0x3c,0x42,0x81,0xa5,0x81,0xa5,0x99,0x81,0x42,0x3c]),
	"City Of Birth": "Springfield",
	"Name": "John Doe",
	"Kids Names": ["John", "Kyra"],
	"Appended": ["Hello", "world"]
      };

      assert.deepEqual(expected, plist.parse(file.contents.toString('utf-8')));
      done();
    });
    stream.write(readFile('sample.binary.plist'));
  });
});

describe('Option: writeBinary', function(){
  context('when true', function(){
    it ('should write binary', function(done){
      var stream = peditor({}, {writeBinary:true});

      stream.on('data', function(file){
	assert.equal(file.contents.toString('ascii', 0, 6), 'bplist');
	done();
      });

      stream.write(readFile('sample.text.plist'))
    });
  });

  context('when false', function(){
    it ('should write plain text', function(done){
      var stream = peditor({}, {writeBinary:false});

      stream.on('data', function(file){
	assert.equal(file.contents.toString('ascii', 0, 5), '<?xml');
	done();
      });

      stream.write(readFile('sample.text.plist'))
    });
  });
});

function readFile(filename) {
  const filepath = path.join(__dirname, 'sample', filename);

  return (
    new gutil.File({
      path: filepath,
      contents: fs.readFileSync(filepath)
    })
  );
}
