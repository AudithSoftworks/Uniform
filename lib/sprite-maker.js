'use strict';

var FidPromise, fs, Png, zlib;

FidPromise = require('fid-promise');
fs = require('fs');
Png = require('pngjs').PNG;
zlib = require('zlib');  // Used for constants

function SpriteMaker() {
    this.imageNames = {
        'button-left': [],
        'button-middle': [],
        'button-right': [],
        checkbox: [],
        'file-button-left': [],
        'file-button-middle': [],
        'file-button-right': [],
        'file-filename-left': [],
        'file-filename-middle': [],
        'file-filename-right': [],
        radio: [],
        'select-left': [],
        'select-middle': [],
        'select-right': []
    };
    this.pngObjects = {};
}

SpriteMaker.prototype.calculateLayout = function () {
    this.mustBeValidated('calculateLayout');
};

SpriteMaker.prototype.loadImages = function (dir) {
    var promise;
    promise = new FidPromise();
    fs.readdir(dir, function (err, files) {
        if (err) {
            promise.reject(err);
        } else {
            promise.resolve(files);
        }
    });
    promise = promise.then(function (files) {
        // Add files to our list of names
        files.forEach(function (fn) {
            var prefix;

            // Only operate on "*.png"
            if (!fn.match(/\.png$/i)) {
                return;
            }

            // Only add files whose prefix we know
            prefix = fn.split('_')[0];
            if (!this.imageNames[prefix]) {
                return;
            }

            // Add the file to the list
            this.imageNames[prefix].push(fn);
        });
    });
    promise = promise.then(function () {
        var pngPromises;

        // Load each image into a parsed PNG
        pngPromises = [];
        Object.keys(this.imageNames).forEach(function (prefix) {
            this.imageNames[prefix].forEach(function (filename) {
                var loadPromise;
                loadPromise = new FidPromise();
                pngPromises.push(loadPromise);
                fs.createReadStream(filename).pipe(new Png()).on('parsed', function () {
                    console.log('Loaded ' + filename);
                    this.pngObjects[filename] = this;
                    loadPromise.resolve();
                });
            });
        });

        return FidPromise.when(pngPromises);
    });
    return promise;
};

SpriteMaker.prototype.mustBeValidated = function (fn) {
    if (this.validated === undefined) {
        throw new Error('Sprites must be validated before calling ' + fn);
    }

    if (!this.validated) {
        throw new Error('Source images are not validated; ' + fn + ' must not be called yet');
    }
};

SpriteMaker.prototype.mustHaveLayout = function (fn) {
    if (!this.layout) {
        throw new Error('Layout must be created before calling ' + fn);
    }
};

SpriteMaker.prototype.validate = function () {
    return;
};

SpriteMaker.prototype.writeLess = function (dest) {
    this.mustBeValidated('writeLess');
    this.mustHaveLayout('writeLess');
};

SpriteMaker.prototype.writeSprite = function (dest) {
    this.mustBeValidated('writeSprite');
    this.mustHaveLayout('writeSprite');
};

module.exports = SpriteMaker;
