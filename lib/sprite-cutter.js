/**
 * This does the grunt work of cutting up sprite images using the pngjs
 * library.
 */

'use strict';

var FidPromise, fs, Png, zlib;

FidPromise = require('fid-promise');
fs = require('fs');
Png = require('pngjs').PNG;
zlib = require('zlib');  // Used for constants


/**
 * Adds image writing function for the sprite object
 *
 * @param {Object} spriteObject
 * @return {Object} spriteObject with image() method added
 */
function addImageWriter(spriteObject) {
    /**
     * Write a single image, return a promise indicating that the write
     * was successful or not.
     *
     * @return {FidPromise}
     */
    function writeOne(srcPng, name, x, y, w, h) {
        var destPng, promise;

        // Create a new PNG
        destPng = new Png({
            height: h,
            width: w
        });

        // Keep us within limits.  If it is outside of bounds, just don't
        // copy the pixels outside of the image.  The browser would have
        // treated them as transparent anyway.
        if (x + w > srcPng.width) {
            w = srcPng.width - x;
        }

        if (y + h > srcPng.height) {
            h = srcPng.height - y;
        }

        // Copy
        promise = new FidPromise();
        try {
            srcPng.bitblt(destPng, x, y, w, h, 0, 0);
            destPng.pack().pipe(fs.createWriteStream(name).on('error', function (err) {
                promise.reject(new Error('Unable to write ' + name + ":  " + err.toString()));
            }).on('end', function () {
                promise.resolve();
            }));
        } catch (err) {
            promise.reject('Error when copying sprite from (' + x + ', ' + y + ') size (' + w + ', ' + h + ') to make ' + name);
        }

        return promise;
    }


    /**
     * Write the code to chop out an image
     *
     * @param {string} name Image name without ".png"
     * @param {number} x X coordinate in pixels (0 = left)
     * @param {number} y Y coordinage in pixels (0 = top)
     * @param {number} w Width in pixels (1 = extremely thin)
     * @param {number} h Height in pixels (1 = extremely short)
     * @return {FidPromise} Resolved when the image is written
     */
    spriteObject.image = function (name, x, y, w, h) {
        var promises, scale;

        promises = [];
        promises.push(writeOne(spriteObject.normal, name + '.png', x, y, w, h));

        if (spriteObject.retinaScaleFactor) {
            scale = spriteObject.retinaScaleFactor;
            promises.push(writeOne(spriteObject.retina, name + "_retina.png", x + scale, y + scale, w + scale, h + scale));
        }

        return FidPromise.when(promises);
    };
}


/**
 * Cut the sprite according to the config entered.
 *
 * @param {Object} config
 * @return {FidPromise} result of slicing (errors/success)
 */
exports.cutSprite = function (config) {
    var spritePromise;
    spritePromise = this.loadSprite(config['sprite-name']);
    spritePromise = spritePromise.then(this.getRetinaScaleFactor);
    spritePromise = spritePromise.then(this.addImageWriter);
    return spritePromise;
};


/**
 * Calculate the retina scale factor based on the width of the regular sprite
 * and the width of the retina-enabled sprite
 *
 * @param {Object} spriteObject Loaded sprites
 * @return {Object} spriteObject with retinaScaleFactor set
 */
exports.getRetinaScaleFactor = function (spriteObject) {
    if (spriteObject.retina) {
        spriteObject.retinaScaleFactor = spriteObject.retina.width / spriteObject.normal.width;
    }

    return spriteObject;
};


/**
 * Load the sprites from the disk and parse as PNG files.  Returns a promise
 * that could provide both types (normal + retina) of parsed images.
 *
 * @param {string} name Non-retina sprite name
 * @return {FidPromise} Resolved with a sprite object
 */
exports.loadSprites = function (name) {
    var normalPromise, retinaName, retinaPromise;

    // Load the regular image.  On errors, reject the promise.
    normalPromise = new FidPromise();
    fs.exists(name, function (result) {
        if (!result) {
            normalPromise.reject(new Error('Sprite image does not exist'));
        } else {
            fs.createReadStream(name).pipe(new Png()).on('parsed', function () {
                normalPromise.resolve(this);
            });
        }
    });

    // Load the retina image if it exists.  Errors just resolve the promise
    // with undefined.
    retinaName = name.replace('sprite', 'sprite-retina');
    retinaPromise = new FidPromise();
    fs.exists(retinaName, function (result) {
        if (!result) {
            retinaPromise.resolve(undefined);
        } else {
            fs.createReadStream(retinaName).pipe(new Png()).on('parsed', function () {
                retinaPromise.resolve(this);
            });
        }
    });

    return FidPromise.when([
        normalPromise,
        retinaPromise
    ]).then(function (both) {
        return {
            normal: both[0],
            retina: both[1]
        };
    });
};


/**
 * Set up some quick variables for faster math
 */
config['checkbox-voffset'] = 10 * config['select-height'];
config['radio-voffset'] = config['checkbox-voffset'] + config['checkbox-height'];
config['upload-voffset'] = config['radio-voffset'] + config['radio-height'];
config['button-voffset'] = config['upload-voffset'] + 8 * config['upload-height'];


/**
 * Select
 */
image('select-right', 0, 0, config['sprite-size'], config['select-height']);
image('select-right_active', 0, config['select-height'], config['sprite-size'], config['select-height']);
image('select-right_hover', 0, config['select-height'] * 2, config['sprite-size'], config['select-height']);
image('select-right_active_hover', 0, config['select-height'] * 3, config['sprite-size'], config['select-height']);
image('select-right_disabled', 0, config['select-height'] * 4, config['sprite-size'], config['select-height']);

image('select-left', 0, config['select-height'] * 5, config['select-margin-left'], config['select-height']);
image('select-left_active', 0, config['select-height'] * 6, config['select-margin-left'], config['select-height']);
image('select-left_hover', 0, config['select-height'] * 7, config['select-margin-left'], config['select-height']);
image('select-left_active_hover', 0, config['select-height'] * 8, config['select-margin-left'], config['select-height']);
image('select-left_disabled', 0, config['select-height'] * 9, config['select-margin-left'], config['select-height']);

/**
 * Checkbox
 */
image('checkbox', 0, config['checkbox-voffset'], config['checkbox-width'], config['checkbox-height']);
image('checkbox_active', config['checkbox-width'], config['checkbox-voffset'], config['checkbox-width'], config['checkbox-height']);
image('checkbox_hover', config['checkbox-width'] * 2, config['checkbox-voffset'], config['checkbox-width'], config['checkbox-height']);
image('checkbox_active_hover', config['checkbox-width'] * 3, config['checkbox-voffset'], config['checkbox-width'], config['checkbox-height']);
image('checkbox_checked', config['checkbox-width'] * 4, config['checkbox-voffset'], config['checkbox-width'], config['checkbox-height']);
image('checkbox_active_checked', config['checkbox-width'] * 5, config['checkbox-voffset'], config['checkbox-width'], config['checkbox-height']);
image('checkbox_checked_hover', config['checkbox-width'] * 6, config['checkbox-voffset'], config['checkbox-width'], config['checkbox-height']);
image('checkbox_active_checked_hover', config['checkbox-width'] * 7, config['checkbox-voffset'], config['checkbox-width'], config['checkbox-height']);
image('checkbox_disabled', config['checkbox-width'] * 8, config['checkbox-voffset'], config['checkbox-width'], config['checkbox-height']);
image('checkbox_checked_disabled', config['checkbox-width'] * 9, config['checkbox-voffset'], config['checkbox-width'], config['checkbox-height']);

/**
 * Radio
 */
image('radio', 0, config['radio-voffset'], config['radio-width'], config['radio-height']);
image('radio_active', config['radio-width'], config['radio-voffset'], config['radio-width'], config['radio-height']);
image('radio_hover', config['radio-width'] * 2, config['radio-voffset'], config['radio-width'], config['radio-height']);
image('radio_active_hover', config['radio-width'] * 3, config['radio-voffset'], config['radio-width'], config['radio-height']);
image('radio_checked', config['radio-width'] * 4, config['radio-voffset'], config['radio-width'], config['radio-height']);
image('radio_active_checked', config['radio-width'] * 5, config['radio-voffset'], config['radio-width'], config['radio-height']);
image('radio_checked_hover', config['radio-width'] * 6, config['radio-voffset'], config['radio-width'], config['radio-height']);
image('radio_active_checked_hover', config['radio-width'] * 7, config['radio-voffset'], config['radio-width'], config['radio-height']);
image('radio_disabled', config['radio-width'] * 8, config['radio-voffset'], config['radio-width'], config['radio-height']);
image('radio_checked_disabled', config['radio-width'] * 9, config['radio-voffset'], config['radio-width'], config['radio-height']);

/**
 * File Upload
 */
image('file-filename-left', 0, config['upload-voffset'], config['sprite-size'], config['upload-height']);
image('file-filename-left_hover', 0, config['upload-voffset'] + config['upload-height'], config['sprite-size'], config['upload-height']);
image('file-filename-left_disabled', 0, config['upload-voffset'] + config['upload-height'] * 2, config['sprite-size'], config['upload-height']);
image('file-button-right', 0, config['upload-voffset'] + config['upload-height'] * 3, config['sprite-size'], config['upload-height']);
image('file-button-right_active', 0, config['upload-voffset'] + config['upload-height'] * 4, config['sprite-size'], config['upload-height']);
image('file-button-right_hover', 0, config['upload-voffset'] + config['upload-height'] * 5, config['sprite-size'], config['upload-height']);
image('file-button-right_active_hover', 0, config['upload-voffset'] + config['upload-height'] * 6, config['sprite-size'], config['upload-height']);
image('file-button-right_disabled', 0, config['upload-voffset'] + config['upload-height'] * 7, config['sprite-size'], config['upload-height']);

/**
 * Button
 */
image('button-right', 0, config['button-voffset'], config['sprite-size'], config['button-height']);
image('button-right_active', 0, config['button-voffset'] + config['button-height'], config['sprite-size'], config['button-height']);
image('button-right_hover', 0, config['button-voffset'] + config['button-height'] * 2, config['sprite-size'], config['button-height']);
image('button-right_disabled', 0, config['button-voffset'] + config['button-height'] * 3, config['sprite-size'], config['button-height']);
image('button-left', 0, config['button-voffset'] + config['button-height'] * 4, config['button-margin-left'], config['button-height']);
image('button-left_active', 0, config['button-voffset'] + config['button-height'] * 5, config['button-margin-left'], config['button-height']);
image('button-left_hover', 0, config['button-voffset'] + config['button-height'] * 6, config['button-margin-left'], config['button-height']);
image('button-left_disabled', 0, config['button-voffset'] + config['button-height'] * 7, config['button-margin-left'], config['button-height']);
