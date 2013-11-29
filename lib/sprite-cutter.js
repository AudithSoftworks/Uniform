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
        var destPng, pngPipe, promise;

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
            pngPipe = fs.createWriteStream(name);
            pngPipe.on('error', function (err) {
                promise.reject(new Error('Unable to write ' + name + ":  " + err.toString()));
            });
            pngPipe.on('finish', function () {
                console.log('Wrote ' + name);
                promise.resolve();
            });
            pngPipe = destPng.pack().pipe(pngPipe);
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

    return spriteObject;
}


/**
 * Calculate the retina scale factor based on the width of the regular sprite
 * and the width of the retina-enabled sprite
 *
 * @param {Object} spriteObject Loaded sprites
 * @return {Object} spriteObject with retinaScaleFactor set
 */
function getRetinaScaleFactor(spriteObject) {
    if (spriteObject.retina) {
        spriteObject.retinaScaleFactor = spriteObject.retina.width / spriteObject.normal.width;
        console.log('Retina scale factor: ' + spriteObject.retinaScaleFactor);
    }

    return spriteObject;
}


/**
 * Load the sprites from the disk and parse as PNG files.  Returns a promise
 * that could provide both types (normal + retina) of parsed images.
 *
 * @param {string} name Non-retina sprite name
 * @return {FidPromise} Resolved with a sprite object
 */
function loadSprites(name) {
    var normalPromise, retinaName, retinaPromise;

    // Load the regular image.  On errors, reject the promise.
    normalPromise = new FidPromise();
    fs.exists(name, function (result) {
        if (!result) {
            normalPromise.reject(new Error('Sprite image does not exist: ' + name));
        } else {
            fs.createReadStream(name).pipe(new Png()).on('parsed', function () {
                console.log('Normal image size: ' + this.width + ' x ' + this.height);
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
            console.log('No retina image found: ' + retinaName);
            retinaPromise.resolve(undefined);
        } else {
            console.log('Retina image found: ' + retinaName);
            fs.createReadStream(retinaName).pipe(new Png()).on('parsed', function () {
                console.log('Retina image size: ' + this.width + ' x ' + this.height);
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
}


/**
 * Create a callback that will write all of the individual images from a sprite
 *
 * @param {Object} config
 * @return {Function}
 */
function writeBitsCallback(config) {
    /**
     * Write all of the bits for the sprite image
     *
     * @param {Object} spriteObject
     * @return {FidPromise} Resolved when the writes are done
     */
    return function (spriteObject) {
        var offset, promises;

        function writeRow(width, height, imageNames, x) {
            // Convert x to a number (only here in case you need to use x)
            x = +x || 0;
            imageNames.split(' ').forEach(function (name) {
                promises.push(spriteObject.image(name, x, offset, width, height));
                x += width;
            });
            offset += height;
        }

        offset = 0;
        promises = [];

        // Select, right cap
        writeRow(spriteObject.normal.width, config['select-height'], 'select-right');
        writeRow(spriteObject.normal.width, config['select-height'], 'select-right_active');
        writeRow(spriteObject.normal.width, config['select-height'], 'select-right_hover');
        writeRow(spriteObject.normal.width, config['select-height'], 'select-right_active_hover');
        writeRow(spriteObject.normal.width, config['select-height'], 'select-right_disabled');

        // Select, left cap
        writeRow(config['select-margin-left'], config['select-height'], 'select-left');
        writeRow(config['select-margin-left'], config['select-height'], 'select-left_active');
        writeRow(config['select-margin-left'], config['select-height'], 'select-left_hover');
        writeRow(config['select-margin-left'], config['select-height'], 'select-left_active_hover');
        writeRow(config['select-margin-left'], config['select-height'], 'select-left_disabled');

        // Checkboxes
        writeRow(config['checkbox-width'], config['checkbox-height'], 'checkbox checkbox_active checkbox_hover checkbox_active_hovercheckbox_checked checkbox_active_checked checkbox_checked_hover checkbox_active_checked_hover checkbox_disabled checkbox_checked_disabled');

        // Radios
        writeRow(config['radio-width'], config['radio-height'], 'radio radio_active radio_hover radio_active_hover radio_checked radio_active_checked radio_checked_hover radio_active_checked_hover radio_disabled radio_checked_disabled');

        // File upload, filename
        writeRow(spriteObject.normal.width, config['upload-height'], 'file-filename-left');
        writeRow(spriteObject.normal.width, config['upload-height'], 'file-filename-left_hover');
        writeRow(spriteObject.normal.width, config['upload-height'], 'file-filename-left_disabled');

        // File upload, browse button
        writeRow(spriteObject.normal.width, config['upload-height'], 'file-filename-right');
        writeRow(spriteObject.normal.width, config['upload-height'], 'file-filename-right_active');
        writeRow(spriteObject.normal.width, config['upload-height'], 'file-filename-right_hover');
        writeRow(spriteObject.normal.width, config['upload-height'], 'file-filename-right_active_hover');
        writeRow(spriteObject.normal.width, config['upload-height'], 'file-filename-right_disabled');

        // Buttons
        writeRow(spriteObject.normal.width, config['button-height'], 'button-right');
        writeRow(spriteObject.normal.width, config['button-height'], 'button-right_active');
        writeRow(spriteObject.normal.width, config['button-height'], 'button-right_hover');
        writeRow(spriteObject.normal.width, config['button-height'], 'button-right_disabled');
        writeRow(config['button-margin-left'], config['button-height'], 'button-left');
        writeRow(config['button-margin-left'], config['button-height'], 'button-left_active');
        writeRow(config['button-margin-left'], config['button-height'], 'button-left_hover');
        writeRow(config['button-margin-left'], config['button-height'], 'button-left_disabled');

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
    spritePromise = loadSprites(config['sprite-name']);
    spritePromise = spritePromise.then(getRetinaScaleFactor);
    spritePromise = spritePromise.then(addImageWriter);
    spritePromise = spritePromise.then(writeBitsCallback(config));
    return spritePromise;
};
