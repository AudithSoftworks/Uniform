'use strict';

var FidPromise, fs, path, Png, SpriteImage, SpriteImageGroup, zlib;

FidPromise = require('fid-promise');
fs = require('fs');
path = require('path');
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
        'inputTextMiddle',
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
    var lastGroupName, lastRight, lastTop, layout, middleWidth, width;

    width = this.imageGroups.all.getDimensions().width;

    if (this.imageGroups.middle) {
        middleWidth = this.imageGroups.middle.getDimensions().width;

        // If there are middle tiles, they need to repeat exactly
        if (middleWidth) {
            width = Math.ceil(width / middleWidth) * middleWidth;
        }
    }

    layout = {
        height: 0,  // This needs to get updated
        images: [],  // All SpriteImage objects with positioning set
        width: width  // Read only
    };
    lastGroupName = null;
    lastRight = 0;
    lastTop = 0;

    // The images are spaced out to provide a 1px border between any two
    // images.
    this.imageGroups.all.forEach(function (image) {
        // 1 pixel border between images.
        if (lastGroupName === image.groupName && !image.flags.leftAligned && !image.flags.rightAligned && !image.flags.repeating && lastRight + image.width < layout.width) {
            // Things in the same group might be on the same line.
            // In here, the group allows images to be appended and there
            // was room for more.
            image.top = lastTop;  // This included the bottom border already
            image.left = lastRight;  // Border on the right already there
        } else {
            image.top = layout.height;
            layout.height += image.height + 1;  // Border on the bottom

            if (image.flags.rightAligned) {
                image.left = layout.width - image.width;
            } else {
                image.left = 0;
            }
        }

        layout.images.push(image);
        lastRight = image.left + image.width + 1;  // Border on the right
        lastTop = image.top;
        lastGroupName = image.groupName;
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
            myself.addImageToGroups(new SpriteImage(path.resolve(dir, fn), myself.imageGroupNames));
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

SpriteMaker.prototype.writeLess = function (dest, png) {
    var less, promise;

    function property(image, name, value) {
        less += '@' + image.lessName + '_' + name + ': ' + value + ";\n";
    }

    this.mustBeValidated('writeLess');
    this.mustHaveLayout('writeLess');

    less = "/* Automatically generated by sprite-maker\n";
    less += " * " + (new Date()).toString() + " */\n";
    less += "\n";
    less += "@background-image: url(" + png + ");\n";
    less += "\n";
    this.layout.images.forEach(function (image) {
        // Use the expanded dimensions, not real ones.
        property(image, 'height', image.width);
        property(image, 'width', image.width);
        property(image, 'left', image.left);
        property(image, 'top', image.top);
        less += "\n";
    });

    promise = new FidPromise();
    fs.writeFile(dest, less, function (err) {
        if (err) {
            promise.reject(new Error('Error writing to ' + dest + ': ' + err.toString()));
        } else {
            promise.resolve();
        }
    });
    return promise;
};

SpriteMaker.prototype.writeSprite = function (dest) {
    var destPng, pngPipe, promise;

    this.mustBeValidated('writeSprite');
    this.mustHaveLayout('writeSprite');

    // Create a new PNG
    destPng = new Png({
        deflateStrategy: 1,  // I have better sizes with 1 than the default (3)
        height: this.layout.height,
        width: this.layout.width
    });

    this.layout.images.forEach(function (image) {
        var x;

        // Use the true width and height, not the width and height that
        // is on the image object itself.
        if (image.flags.repeating) {
            x = image.left;

            while (x < destPng.width) {
                image.png.bitblt(destPng, 0, 0, image.png.width, image.png.height, x, image.top);
                x += image.png.width;
            }
        } else {
            image.png.bitblt(destPng, 0, 0, image.png.width, image.png.height, image.left, image.top);
        }
    });

    promise = new FidPromise();

    try {
        pngPipe = fs.createWriteStream(dest);
        pngPipe.on('error', function (err) {
            promise.reject(new Error('Unable to write to ' + dest + ': ' + err.toString()));
        });
        pngPipe.on('finish', function () {
            pngPipe.end();
            promise.resolve();
        });
        destPng.pack().pipe(pngPipe);
    } catch (err) {
        promise.reject('Error when writing sprite map: ' + err.toString());
    }

    return promise;
};

module.exports = SpriteMaker;
