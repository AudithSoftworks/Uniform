'use strict';

var FidPromise, fs, Png, SpriteImage, SpriteImageGroup, zlib;

FidPromise = require('fid-promise');
fs = require('fs');
Png = require('pngjs').PNG;
SpriteImage = require('./sprite-image');
SpriteImageGroup = require('./sprite-image-group');
zlib = require('zlib');  // Used for constants

function SpriteMaker() {
    this.layout = null;
    // Unique images - they will be in here at most 1 time
    this.imageGroups = {};
    this.imageGroupNames = [
        'buttonLeft',
        'buttonMiddle',
        'buttonRight',
        'checkbox',
        'fileButtonLeft',
        'fileButtonMiddle',
        'fileButtonRight',
        'fileFilenameLeft',
        'fileFilenameMiddle',
        'fileFilenameRight',
        'radio',
        'selectLeft',
        'selectMiddle',
        'selectRight'
    ];
    this.validated = null;
}

SpriteMaker.prototype.addImageToGroups = function (image) {
    var myself;

    // Only add if the image will probably fit our patterns
    if (!image.groups || !image.groups.length) {
        return;
    }

    myself = this;
    image.groups.forEach(function (groupName) {
        if (!myself.imageGroups[groupName]) {
            myself.imageGroups[groupName] = new SpriteImageGroup(groupName);
        }

        myself.imageGroups[groupName].add(image);
    });
};

SpriteMaker.prototype.calculateLayout = function () {
    var layout, middleWidth, width;

    width = this.imageGroups.all.getDimensions().width;

    if (this.imageGroups.middle) {
        middleWidth = this.imageGroups.middle.getDimensions().width;

        // If there are middle tiles, they need to repeat exactly
        if (middleWidth) {
            width = Math.ceil(middleWidth / width) * middleWidth;
        }
    }

    layout = {
        height: 0,  // This needs to get updated
        images: [],  // All SpriteImage objects with positioning set
        width: width  // Read only
    };

    this.imageGroups.all.forEach(function (image) {
        // The heights are spaced out to provide a 1px border on the top
        // and bottom of all images.  We don't tile images left/right in
        // a way that browser anti-aliasing will mess with the image.
        image.top = layout.height + 1;
        layout.height += image.height + 2;

        if (image.rightAligned) {
            image.left = layout.width - image.width;
        } else {
            image.left = 0;
        }
    });

    this.layout = layout;
};

SpriteMaker.prototype.loadImages = function (dir) {
    var myself, promise;
    myself = this;
    promise = new FidPromise();
    fs.readdir(dir, function (err, files) {
        if (err) {
            promise.reject(err);
        } else {
            promise.resolve(files);
        }
    });
    return promise.then(function (files) {
        files.sort();

        // Add files to our list of names
        files.forEach(function (fn) {
            myself.addImageToGroups(new SpriteImage(fn));
        });

        if (!myself.imageGroups.all) {
            throw new Error('No image files found');
        }

        return myself.imageGroups.all.load();
    });
};

SpriteMaker.prototype.mustBeValidated = function (fn) {
    if (this.validated === null) {
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
    var myself;

    function sameSizeInGroup(groupName) {
        var dimensions, group;

        group = myself.imageGroups[groupName];

        if (!group) {
            return;
        }

        dimensions = group.getDimensions();

        if (dimensions.dimensionChanges > 1) {
            console.log(group.name + ' has inconsistent image dimensions');
            myself.validated = false;
            group.setDimension('height', dimensions.height);
            group.setDimension('width', dimensions.width);
        }
    }

    function sameForFamily(dimension, group) {
        var dimensions;

        if (!group) {
            return;
        }

        dimensions = group.getDimensions();

        if (dimensions[dimension + 'Changes'] > 1) {
            console.log('All images in ' + group.name + ' should have the same ' + dimension);
            myself.validated = false;
            group.setDimension(dimension, dimensions[dimension]);
        }
    }

    this.validated = true;
    myself = this;

    // All images in a group should be the same size
    this.imageGroupNames.forEach(sameSizeInGroup);

    // All images across "families" should have similar dimensions
    sameForFamily('height', this.imageGroups.button);
    sameForFamily('height', this.imageGroups.fileButton);
    sameForFamily('height', this.imageGroups.fileFilename);
    sameForFamily('height', this.imageGroups.select);
    sameForFamily('width', this.imageGroups.middle);
    return this.validated;
};

SpriteMaker.prototype.writeLess = function (dest) {
    this.mustBeValidated('writeLess');
    this.mustHaveLayout('writeLess');
    console.log('should write less to ' + dest);
};

SpriteMaker.prototype.writeSprite = function (dest) {
    this.mustBeValidated('writeSprite');
    this.mustHaveLayout('writeSprite');
    console.log('should write sprite to ' + dest);
};

module.exports = SpriteMaker;
