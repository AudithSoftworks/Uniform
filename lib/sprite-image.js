'use strict';

var FidPromise, fs, Png;

FidPromise = require('fid-promise');
fs = require('fs');
Png = require('pngjs').PNG;

function SpriteImage(filename) {
    var filenameParts;

    // Only operate on PNG files
    if (!filename.match(/\.png$/)) {
        return;
    }

    filenameParts = filename.replace(/\.png$/, '').split('_');
    this.filename = filename;
    this.groups = this.determineGroups(filenameParts.shift());
    this.height = null;  // Destination height, not actual height
    this.imageExtra = filenameParts.join('_');
    this.left = null;  // Destination position
    this.repeating = false;  // Flag is this is a repeating image
    this.rightAligned = false;  // If true, image should appear on the right
    this.png = null;
    this.top = null;  // Destination position
    this.width = null;  // Destination width, not actual width
}

SpriteImage.prototype.camelCase = function (str) {
    return str.replace(/-([a-z])/g, function (matches) {
        return matches[1].toUpperCase();
    });
};

SpriteImage.prototype.determineGroups = function (groupName) {
    var groups, sansPosition;

    groups = [
        'all',
        groupName
    ];
    sansPosition = groupName.replace(/(Left|Middle|Right)$/, '');
    groups.push(sansPosition);

    if (groupName.match(/Middle$/)) {
        groups.push('middle');
        this.repeating = true;
    }

    if (groupName.match(/Right$/)) {
        this.rightAligned = true;
    }

    return groups;
};

SpriteImage.prototype.load = function () {
    var myself, promise;

    myself = this;
    promise = new FidPromise();
    fs.createReadStream(this.filename).pipe(new Png()).on('parsed', function () {
        console.log('Loaded ' + myself.filename);
        myself.png = this;
        myself.width = this.width;
        myself.height = this.height;
        promise.resolve();
    });
    return promise;
};

module.exports = SpriteImage;
