'use strict';

var FidPromise;

FidPromise = require('fid-promise');

function SpriteImageGroup(name) {
    this.images = [];
    this.name = name;
}

SpriteImageGroup.prototype.add = function (image) {
    this.images.push(image);
};

SpriteImageGroup.prototype.forEach = function (callback, context) {
    this.images.forEach(callback, context);
};

SpriteImageGroup.prototype.getDimensions = function () {
    var result;

    function maxDimension(dimension, image) {
        if (result[dimension] !== image[dimension]) {
            result[dimension] = Math.max(result[dimension], image[dimension]);
            result[dimension + 'Changes'] += 1;

            return 1;
        }

        return 0;
    }

    result = {
        dimensionChanges: 0,
        height: 0,
        heightChanges: 0,
        width: 0,
        widthChanges: 0
    };
    this.images.forEach(function (image) {
        var dimensionChanges;
        dimensionChanges = maxDimension('height', image);
        dimensionChanges += maxDimension('width', image);

        if (dimensionChanges) {
            result.dimensionChanges += 1;
        }
    });
    return result;
};

SpriteImageGroup.prototype.load = function () {
    var promises;

    promises = [];
    this.images.forEach(function (image) {
        promises.push(image.load());
    });

    return FidPromise.when(promises);
};

SpriteImageGroup.prototype.setDimension = function (dimension, size) {
    this.images.forEach(function (image) {
        image[dimension] = size;
    });
};

module.exports = SpriteImageGroup;
