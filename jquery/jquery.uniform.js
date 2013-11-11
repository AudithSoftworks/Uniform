// Things to track
//    classes
//    id, name, other attributes?
//    readonly, indeterminate, readonly, disabled
//    value, checked
//    options, text, inner HTML
//    hidden/visible

/**
 * Uniform.js version 3.0.0
 *
 * Style form elements the way *you* want.
 *
 * Requires jQuery 1.3 or newer
 *
 * This is released under the MIT License.
 * http://www.opensource.org/licenses/mit-license.php
 */
/*global jQuery*/
(function (wind, jQuery) {
    // Passing in the root object and jQuery for minification.
    'use strict';


    var canStyleBrowser, checkedClass, dataProperty, eventNamespace, focusClass, formElementSelector, hoverClass, isArray, uniformClassPrefix, uniformHandlers, uniformMethods, uniformWatchesByElement;

    // Class to add for "checked" radios and checkboxes
    checkedClass = 'checked';

    // Property name for calls to jQuery.prototype.data()
    dataProperty = 'uniform.js';

    // Namespace for events
    eventNamespace = '.uniformjs';

    // Class applied for focus
    focusClass = 'focus';

    // Everything Uniform can style.  It's ok to have some extras here.
    formElementSelector = 'a,button,input,textarea';

    // Class applied for hover
    hoverClass = 'hover';

    // Class prefix to apply to all wrappers
    uniformClassPrefix = 'uniformjs-';

    /**
     * Function to call for every item in an object or array
     *
     * @callback Uniform~iterator
     * @param {*} value
     * @param {string} key
     * @param {Object} object
     */

    /**
     * Iterate over an object or Array.  Must work in older browsers
     * and ancient JavaScript implementations, thus we avoid
     * Object.keys() and Array.prototype.forEach().
     *
     * @param {(Object|Array|jQuery)} obj
     * @param {Uniform~iterator} iterator
     */
    function iterate(obj, iterator) {
        var key, max;

        if (obj instanceof jQuery) {
            // Do not use jQuery's .each() method as it is far slower
            max = obj.length;

            for (key = 0; key < max; key += 1) {
                iterator(jQuery(obj[key]), key, obj);
            }
        } else if (isArray(obj)) {
            max = obj.length;

            for (key = 0; key < max; key += 1) {
                iterator(obj[key], key, obj);
            }
        } else {
            for (key in obj) {
                if (obj.hasOwnProperty(key)) {
                    iterator(obj[key], key, obj);
                }
            }
        }
    }


    /**
     * jQuery 1.4 adds support for binding with an object.  To support
     * jQuery 1.3, we simulate this ourselves by only binding one thing
     * at a time.  Also, this function adds our namespace to events in
     * one consistent location, shrinking the minified code.
     *
     * The properties on the events object are the names of the events
     * that we are supposed to add to.  It can be a space separated list.
     * The namespace will be added automatically.
     *
     * @param {jQuery} $element
     * @param {Object} events Events to bind, properties are event names
     */
    function bindMany($element, events) {
        iterate(events, function (action, key) {
            $element.bind(key.replace(/ |$/g, eventNamespace), action);
        });
    }


    /**
     * Detect if the browser can be styled or not.
     *
     * Replaces `canStyleBrowser` with a function that merely returns
     * true or false, so the result is cached.
     *
     * @return {boolean}
     */
    canStyleBrowser = function () {
        var result;

        /**
         * Test if high contrast mode is enabled.
         *
         * In high contrast mode, background images can not be set and
         * they are always returned as 'none'.
         *
         * This must run after the page loads.
         *
         * @return {boolean} True if in high contrast mode
         */
        function isHighContrastMode() {
            var c, $div, el, rgb;

            // High contrast mode deals with white and black
            rgb = 'rgb(120,2,153)';
            $div = jQuery('<div style="width:0;height:0;color:' + rgb + '">');
            jQuery('body').append($div);
            el = $div.get(0);

            // $div.css() will get the style definition, not
            // the style that is actually being displayed.
            if (wind.getComputedStyle) {
                c = wind.getComputedStyle(el, '').color;
            } else {
                c = (el.currentStyle || el.style || {}).color;
            }

            $div.remove();
            return c.replace(/ /g, '') !== rgb;
        }

        if (isHighContrastMode()) {
            // Can't style anything in high contrast mode because we can
            // not set the background images.
            result = false;
        } else if (wind.navigator.cpuClass && !wind.navigator.product) {
            // IE, but what version?
            if (wind.XMLHttpRequest) {
                // IE7 or newer.
                result = true;
            } else {
                // Can not style IE6 or lower because we can't set the opacity
                // on <select> elements.
                result = false;
            }
        } else {
            // Non-IE browsers.  Let's hope they work.
            result = true;
        }

        canStyleBrowser = function () {
            return result;
        };

        return canStyleBrowser();
    };


    /**
     * Gets form elements, posibly including the top level element that is
     * passed in.  Very similar to jQuery's .find() method but can also
     * match the current element as well.
     *
     * @param {jQuery} $startingPoint
     * @return {jQuery}
     */
    function getFormElements($startingPoint) {
        var $children;

        $children = $startingPoint.find(formElementSelector);

        if ($startingPoint.is(formElementSelector)) {
            if ($children.addBack) {
                // jQuery 1.8
                return $children.addBack();
            }

            // jQuery 1.2+
            return $children.andSelf();
        }

        return $children;
    }

    /**
     * Use a native isArray if available
     *
     * @param {*} obj
     * @return {boolean} True if the object is an array
     */
    isArray = Array.isArray || function (obj) {
        // Pretty fast - http://jsperf.com/isarray-shim/4
        return Object.prototype.toString.call(obj) === "[object Array]";
    };


    /**
     * Return true if the current node is in the current document
     *
     * @param {jQuery} $element
     * @return {boolean}
     */
    function isInDom($element) {
        var element;
        element = $element.get(0);

        while (element.parentNode) {
            element = element.parentNode;
        }

        return element === wind.document;
    }

    /**
     * Add or remove a class from an element
     *
     * @param {jQuery} $element
     * @param {string} className
     * @param {*} isEnabled Any truthy value enables the class
     */
    function setClass($element, className, isEnabled) {
        if (!isEnabled) {
            $element.removeClass(className);
        } else {
            $element.addClass(className);
        }
    }


    /**
     * Return a function that moves the element out of a wrapper and then
     * deletes the wrapper from the DOM.  It performs the opposite of
     * wrap().
     *
     * @see wrap
     * @param {jQuery} $element
     * @param {jQuery} $wrapper
     * @return {Function}
     */
    function unwrapFunction($element, $wrapper) {
        return function () {
            $element.unbind(eventNamespace);
            $wrapper.after($element);
            $wrapper.remove();
        };
    }


    /**
     * Return the index of the object that is for registered watches
     * for the given $element.
     *
     * @param {jQuery} $element
     * @return {number} 0-based index or -1 on failure
     */
    function watchElementIndex($element) {
        var element, i, max;

        element = $element;
        max = uniformWatchesByElement.length;

        for (i = 0; i < max; i += 1) {
            if (uniformWatchesByElement[i].element === element) {
                return i;
            }
        }

        return -1;
    }


    /**
     * Find the watches for an element or make a new one
     *
     * @param {jQuery} $element
     * @return {Object}
     */
    function watchElement($element) {
        var i, newObject;

        i = watchElementIndex($element);

        if (i > -1) {
            return uniformWatchesByElement[i];
        }

        // Not there.  Add to the front as we are likely to add multiple
        // watches for the same element.
        newObject = {
            $element: $element,
            watches: []
        };
        uniformWatchesByElement.unshift(newObject);
        return newObject;
    }


    /**
     * Add a watcher
     *
     * @param {jQuery} $element
     * @param {Function} latch
     * @param {Function} hook
     */
    function watchAdd($element, latch, hook) {
        var lastResult;

        // Add the element and add this watcher to that element
        watchElement($element).watches.push(function () {
            var newResult;

            newResult = latch();

            if (newResult === lastResult) {
                return false;
            }

            hook(newResult);
            lastResult = newResult;
            return true;
        });
    }


    /**
     * Run the given watches for an index.
     *
     * @param {number} index
     */
    function watchRun(index) {
        var $element, i, watches, watchDef;

        watchDef = uniformWatchesByElement[index];
        $element = watchDef.$element;

        // If the element is no longer uniformed or if it has left
        // the DOM, we stop watches on it.
        if (!$element.data(dataProperty) || !isInDom($element)) {
            uniformWatchesByElement.splice(index, 1);
        } else {
            // Element exists - run all watches
            watches = watchDef.watches;

            for (i = watches.length - 1; i >= 0; i -= 1) {
                watches[i]();
            }
        }
    }


    /**
     * Wrap an element with a "uniform" div.  Every element that Uniform.js
     * manages will be wrapped by this element.  Everything done in here needs
     * to be undone with unwrap().
     *
     * @see unwrapFunction
     * @param {jQuery} $element
     * @return {jQuery} Wrapper element
     */
    function wrap($element, classSuffix) {
        var $wrapper;
        $element.wrap('<div class="' + uniformClassPrefix + classSuffix + '"/>');
        $wrapper = $element.parent();  // Get reference to new element in DOM
        bindMany($element, {
            focus: function () {
                setClass($wrapper, focusClass, 1);
            },
            blur: function () {
                setClass($wrapper, focusClass);
            },
            mouseenter: function () {
                setClass($wrapper, hoverClass, 1);
            },
            mouseleave: function () {
                setClass($wrapper, hoverClass);
            }
            // FIXME: active?
        });

        return $wrapper;
    }


    /**
     * Array of objects for watching elements to see if they need to
     * be updated.  Create watches with watchAdd().
     *
     * Structure of the objects looks like this:
     *     {
     *         element: jQuery,
     *         watches: [ Function, Function, Function, ... ]
     *     }
     *
     * @see watchAdd
     * @type {Array.<Function>}
     */
    uniformWatchesByElement = [];

    /**
     * A matcher to see if an element can be styled using this handler.
     *
     * @typedef {Function} Uniform~handlerMatch
     * @param {jQuery} $element
     * @return {boolean} true if this handler can style the element
     */

    /**
     * Style the given element.  Returns a special object that will perform
     * updates and maintenance for the element.
     *
     * @typedef {Function} Uniform~handlerApply
     * @param {jQuery} $element
     * @return {Function} How to remove the styling
     */

    /**
     * A single Uniform.js handler for a category of input elements.
     *
     * @typedef {Object} Uniform~handler
     * @property {Uniform~handlerMatch} match
     * @property {Uniform~handlerApply} apply
     */

    /**
     * How to apply Uniform.js to elements.  Each object in this array
     * will style one category of input elements.
     *
     * @type {Array.<Uniform~handler>}
     */
    uniformHandlers = [
        {
            // Checkboxes
            match: function ($element) {
                return $element.is(':checkbox');
            },
            apply: function ($element) {
                var element, $wrapper;
                $wrapper = wrap($element, 'checkbox');
                element = $element.get(0);

                // Detect changes to "checked"
                watchAdd($element, function () {
                    return element.checked;
                }, function (newVal) {
                    setClass($wrapper, checkedClass, newVal);
                });

                return unwrapFunction($element, $wrapper);
            }
        },
        {
            // Radio buttons
            match: function ($element) {
                return $element.is(':radio');
            },
            apply: function ($element) {
                var element, $wrapper;
                $wrapper = wrap($element, 'radio');
                element = $element.get(0);

                // Detect changes to "checked"
                watchAdd($element, function () {
                    return element.checked;
                }, function (newVal) {
                    setClass($element, checkedClass, newVal);
                });

                return unwrapFunction($element, $wrapper);
            }
        },
        {
            match: function ($element) {
                return $element.is('textarea');
            },
            apply: function ($element) {
                var $wrapper;

                $wrapper = wrap($element, 'textarea');
                return unwrapFunction($element, $wrapper);
            }
        }
    ];

    // Special container for methods that Uniform is exposing
    uniformMethods = {
        /**
         * Apply Uniform.js to an element or to any matching elements
         * under $target.  Avoids double-application of Uniform.js to
         * elements.
         *
         * @param {jQuery} $target
         */
        apply: function ($target) {
            // Only apply styling on browsers that support our needs
            if (canStyleBrowser()) {
                iterate(getFormElements($target), function ($element) {
                    var handlerFound;

                    // Do not double-uniform elements
                    if (!$element.data(dataProperty)) {
                        iterate(uniformHandlers, function (handler) {
                            if (!handlerFound && handler.match($element)) {
                                handlerFound = handler.apply($element);
                                $element.data(dataProperty, handlerFound);
                            }
                        });
                    } else {
                        // If already styled, update the element
                        uniformMethods.update($element);
                    }
                });
            }
        },

        /**
         * Remove Uniform.js styling from $target or from any form element
         * under $target.
         *
         * @param {jQuery} $target
         */
        restore: function ($target) {
            iterate(getFormElements($target), function ($element) {
                var data, i;

                data = $element.data(dataProperty);

                if (data) {
                    i = watchElementIndex($element);

                    if (i > -1) {
                        uniformWatchesByElement.splice(i, 1);
                    }

                    $element.removeData(dataProperty);
                    data.restore();
                }
            });
        },

        /**
         * Immediately update $target or any form element under $target that
         * already is styled by Uniform.js.  Used when you update properties
         * on an element and you absolutely must not wait for the polling to
         * update how the element is seen by the user.
         *
         * @param {jQuery} $target
         */
        update: function ($target) {
            iterate(getFormElements($target), function ($element) {
                var i;

                i = watchElementIndex($element);

                if (i >= -1) {
                    watchRun(i);
                }
            });
        }
    };


    /**
     * Apply Uniform.js to DOM elements or call a specific Uniform.js
     * method, using the typical style for jQuery plugins.
     *
     * @param {string} [method]
     * @param {*} options Typically an object of options
     * @return {jQuery}
     */
    jQuery.fn.uniform = function (method, options) {
        if (typeof method !== 'string') {
            options = method;
            method = 'apply';
        }

        if (!uniformMethods[method]) {
            throw new Error('Unsupported Uniform.js method:  ' + method);
        }

        uniformMethods[method].call(null, this, options);
        return this;
    };


    /**
     * Start watching for changes
     *
     * Avoid iterate() so we perform better.  This is called a *LOT*.
     */
    setInterval(function () {
        var i;

        // Start from the end of the array and work forward.  This is
        // because splice can cut the current item out of the array.
        for (i = uniformWatchesByElement.length - 1; i >= 0; i -= 1) {
            watchRun(i);
        }
    }, 100);
}(this, jQuery));
