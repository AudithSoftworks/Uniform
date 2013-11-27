#!/usr/bin/env node
/**
 * Convert a 2.x style theme sprite map into separate images.
 *
 * Just a quick and dirty script that can be executed with `node` to chop
 * images up.  You will first need to modify the `config` settings, then
 * run this script inside the directory with your sprite PNG file.
 *
 * This merely writes out a script that uses ImageMagick to do the actual
 * cutting, as that was the fastest way to get this done for me.
 *
 * Usage:
 *
 * 1)  Edit the configuration below.
 * 2)  Save sprite-cutter.js somewhere.
 * 3)  `cd` into your theme directory.
 * 4)  `node sprite-cutter.js` to run the script.
 */

'use strict';
var config, FidPromise, fs, Png, spritePngPromise, zlib;
fs = require('fs');
Png = require('pngjs').PNG;
FidPromise = require('fid-promise');
zlib = require('zlib');

// All dimensions are in pixels.  You can pull them from your theme.
config = {
    'sprite-size': 493,  // Total image width
    'sprite-name': 'sprite.png',
    'button-height': 30,
    'button-margin-left': 13,
    'checkbox-height': 19,
    'checkbox-width': 19,
    'radio-height': 18,
    'radio-width': 18,
    'select-height': 26,
    'select-margin-left': 10,
    'upload-action-width': 85,
    'upload-filename-width': 82,
    'upload-height': 28,
    'upload-width': 190,

    /* 0 = no retina-enabled theme
     *
     * Otherwise, you want to specify the scale.  If your HD theme is double
     * the scale of your original, set RETINA to 2.
     */
    'RETINA': 0
};


/**
 * Settings for the Agent theme
 */
function configureAgent() {
    config['sprite-name'] = 'sprite-agent.png';
    config['button-height'] = 32;
    config['button-margin-left'] = 13;
    config['checkbox-height'] = 23;
    config['checkbox-width'] = 23;
    config['radio-height'] = 23;
    config['radio-width'] = 23;
    config['select-height'] = 32;
    config['select-margin-left'] = 12;
    config['upload-action-width'] = 90;
    config['upload-filename-width'] = 76;
    config['upload-height'] = 32;
    config['upload-width'] = 190;
}


/**
 * Settings for the Aristo theme
 */
function configureAristo() {
    config['sprite-name'] = 'sprite-aristo.png';
    config['button-height'] = 32;
    config['button-margin-left'] = 13;
    config['checkbox-height'] = 23;
    config['checkbox-width'] = 23;
    config['radio-height'] = 23;
    config['radio-width'] = 23;
    config['select-height'] = 32;
    config['select-margin-left'] = 10;
    config['upload-action-width'] = 90;
    config['upload-filename-width'] = 76;
    config['upload-height'] = 32;
    config['upload-width'] = 190;
}


/**
 * Settings for the Default theme
 */
function configureDefault() {
    config['sprite-name'] = 'sprite.png';
    config['button-height'] = 30;
    config['button-margin-left'] = 13;
    config['checkbox-height'] = 19;
    config['checkbox-width'] = 19;
    config['radio-height'] = 18;
    config['radio-width'] = 18;
    config['select-height'] = 26;
    config['select-margin-left'] = 10;
    config['upload-action-width'] = 82;
    config['upload-filename-width'] = 85;
    config['upload-height'] = 28;
    config['upload-width'] = 190;
}


/**
 * Settings for the Jeans theme, which uses a high definition (retina)
 * sprite as well.
 */
function configureJeans() {
    config['sprite-name'] = 'sprite-jeans.png';
    config['button-height'] = 30;
    config['button-margin-left'] = 13;
    config['checkbox-height'] = 19;
    config['checkbox-width'] = 19;
    config['radio-height'] = 18;
    config['radio-width'] = 18;
    config['select-height'] = 26;
    config['select-margin-left'] = 10;
    config['upload-action-width'] = 82;
    config['upload-filename-width'] = 85;
    config['upload-height'] = 28;
    config['upload-width'] = 190;
    config.RETINA = 2;
}


/**
 * Set up the config for your theme
 */
configureAgent();
//configureAristo();
//configureDefault();
//configureJeans();


/**
 * Set up some quick variables for faster math
 */
config['checkbox-voffset'] = 10 * config['select-height'];
config['radio-voffset'] = config['checkbox-voffset'] + config['checkbox-height'];
config['upload-voffset'] = config['radio-voffset'] + config['radio-height'];
config['button-voffset'] = config['upload-voffset'] + 8 * config['upload-height'];


// Load the sprite image into a PNG object
function loadSprites(name, retina) {
    var normalPng, retinaPng;

    normalPng = new FidPromise();
    fs.createReadStream(name).pipe(new Png()).on('parsed', function () {
        normalPng.resolve(this);
    });
    retinaPng = new FidPromise();

    if (retina) {
        fs.createReadStream(name.replace('sprite-', 'sprite-retina-')).pipe(new Png()).on('parsed', function () {
            retinaPng.resolve(this);
        });
    } else {
        retinaPng.resolve(undefined);
    }

    return FidPromise.when([
        normalPng,
        retinaPng
    ]).then(function (both) {
        return {
            normal: both[0],
            retinaSize: retina,
            retina: both[1]
        };
    });
}

spritePngPromise = loadSprites(config['sprite-name'], config.RETINA);


/**
 * Write the code to chop out an image
 *
 * @param {string} name Image name without ".png"
 * @param {number} x X coordinate in pixels (0 = left)
 * @param {number} y Y coordinage in pixels (0 = top)
 * @param {number} w Width in pixels (1 = extremely thin)
 * @param {number} h Height in pixels (1 = extremely short)
 */
function image(name, x, y, w, h) {
    function writeOne(srcPng, name, x, y, w, h) {
        var destPng;

        destPng = new Png({
            height: h,
            width: w
        });

        if (x + w > srcPng.width) {
            w = srcPng.width - x;
        }

        if (y + h > srcPng.height) {
            h = srcPng.height - y;
        }

        srcPng.bitblt(destPng, x, y, w, h, 0, 0);
        console.log(name, x, y, w, h);
        destPng.pack().pipe(fs.createWriteStream(name + '.png'));
    }

    spritePngPromise.then(function (spriteInput) {
        writeOne(spriteInput.normal, name, x, y, w, h);

        if (spriteInput.retinaSize) {
            x *= spriteInput.retinaSize;
            y *= spriteInput.retinaSize;
            w *= spriteInput.retinaSize;
            h *= spriteInput.retinaSize;
            writeOne(spriteInput.retina, name + '_retina', x, y, w, h);
        }
    }).then(null, function (e) {
        console.log('Error when copying sprite from (' + x + ', ' + y + ') size (' + w + ', ' + h + ') to make ' + name);
        console.log(e);
    });
}


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
