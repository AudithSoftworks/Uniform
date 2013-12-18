'use strict';

var FidPromise, fs, Png;

FidPromise = require('fid-promise');
fs = require('fs');
Png = require('pngjs').PNG;

function SpriteImage(filename, baseGroupNames) {
    var filenameParts, groupName;

    this.filename = filename;
    filenameParts = filename.toLowerCase().replace(/\.png$/, '');
    filenameParts = this.camelCase(filenameParts).split('_');

    // Only operate on PNG files
    if (!filename.match(/\.png$/)) {
        return;
    }

    groupName = filenameParts.shift();

    // Only allow ones that start with specific prefixes, which are then
    // used for grouping images.
    if (baseGroupNames.indexOf(groupName) === -1) {
        return;
    }

    this.groupName = groupName;
    this.groups = this.determineGroups(groupName);
    this.height = null;  // Destination height, not actual height
    this.imageExtra = filenameParts.join('_');
    this.left = null;  // Destination position
    this.flags = this.determineFlags(groupName);
    this.png = null;
    this.top = null;  // Destination position
    this.width = null;  // Destination width, not actual width
    this.lessName = this.groupName;

    if (this.imageExtra) {
        this.lessName += '_' + this.imageExtra;
    }
}

SpriteImage.prototype.camelCase = function (str) {
    return str.replace(/-([a-z])/g, function (matches) {
        return matches[1].toUpperCase();
    });
};

SpriteImage.prototype.determineFlags = function (groupName) {
    var flags;
    flags = {
        leftAligned: groupName.match(/Left$/),
        repeating: groupName.match(/Middle$/),
        rightAligned: groupName.match(/Right$/)
    };
    return flags;
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
    }

    return groups;
};

SpriteImage.prototype.load = function () {
    var myself, promise;

    myself = this;
    promise = new FidPromise();
    fs.createReadStream(this.filename).pipe(new Png()).on('parsed', function () {
        myself.png = this;
        myself.width = this.width;
        myself.height = this.height;
        promise.resolve();
    });
    return promise;
};

module.exports = SpriteImage;
