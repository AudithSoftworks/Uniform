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


    /**
     * Options that can be passed to .uniform()
     *
     * @typedef {Object} Uniform~options
     * @property {string} fileButtonHtml
     * @property {string} fileDefaultHtml
     * @property {string} resetText
     * @property {string} submitText
     * @property {string} theme
     */


    var canStyleBrowser, dataProperty, formElementSelector, isArray, uniformHandlers, uniformMethods, uniformWatchesByElement;

    // Property name for calls to jQuery.prototype.data()
    dataProperty = 'uniform.js';

    // Everything Uniform can style.  It's ok to have some extras here.
    formElementSelector = 'a,button,input,textarea';

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
            $element.bind(key.replace(/ |$/g, '.uniformjs'), action);
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
     * Insert a new div before a given element
     *
     * @param {jQuery} $element
     * @param {string} classes
     * @return {jQuery} new element after DOM insertion
     */
    function insertBefore($element, classes) {
        $element.before('<div class="' + classes + '"/>');
        return $element.prev();
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
     * Test if the element is a multiselect
     *
     * @param {DOMNode} element
     * @return {boolean}
     */
    function isMultiselect(element) {
        return element.multiple || (element.size && element.size > 1);
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
     * wrapOuter().
     *
     * @see wrapOuter
     * @param {jQuery} $element
     * @param {jQuery} $wrapper
     * @return {Function}
     */
    function unwrapOuterFunction($element, $wrapper) {
        return function () {
            $element.unbind('.uniformjs');
            setClass($element, 'expand', 1);
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
        var lastResult, watcher;

        watcher = function () {
            var newResult;

            newResult = latch();

            if (newResult !== lastResult) {
                hook(newResult, lastResult);
                lastResult = newResult;
            }
        };

        // Add this watcher for the element
        watchElement($element).watches.push(watcher);

        // Run the watcher once to update elements immediately
        watcher();
    }


    /**
     * Remove watches at a given index
     *
     * @param {number} index
     * @return {Array.<Uniform~watchDef>}
     */
    function watchRemove(index) {
        return uniformWatchesByElement.splice(index, 1);
    }


    /**
     * Clean up a watch if it should not run any longer
     *
     * @param {number} index
     */
    function watchCleanup(index) {
        var $element, watchDef;

        watchDef = uniformWatchesByElement[index];
        $element = watchDef.$element;

        // If the element has left the DOM ...
        if (!isInDom($element)) {
            // Remove the watch, cleanup data, remove styling
            watchRemove(index);
            watchDef.$element.removeData(dataProperty);
            watchDef.restore();
        } else if (!$element.data(dataProperty)) {
            // Element is not uniformed any more but watches
            // were not cleaned up.
            watchRemove(index);
        }
    }

    /**
     * Run the given watches for an index.
     *
     * @param {number} index
     */
    function watchRun(index) {
        var i, watches;

        watches = uniformWatchesByElement[index].watches;

        for (i = watches.length - 1; i >= 0; i -= 1) {
            watches[i]();
        }
    }


    /**
     * Set up a watch on $element to toggle an arbitrary class on $watcher
     * when the same property is toggled on $element.
     *
     * @param {string} property
     * @param {jQuery} $element
     * @param {jQuery} $wrapper
     */
    function monitorProperty(property, $element, $wrapper) {
        var element;

        element = $element.get(0);

        // Detect changes to "disabled"
        watchAdd($element, function () {
            // Pulled from jQuery selector-native.js
            return element[property];
        }, function (newVal) {
            setClass($wrapper, property, newVal);
        });
    }


    /**
     * Set up a watch on $element to toggle the 'checked' class on $wrapper.
     *
     * @param {jQuery} $element
     * @param {jQuery} $wrapper
     */
    function monitorChecked($element, $wrapper) {
        monitorProperty('checked', $element, $wrapper);
    }


    /**
     * Keep our classes in sync with the target element
     *
     * @param {jQuery} $element
     * @param {jQuery} $wrapper
     */
    function monitorClasses($element, $wrapper) {
        var element;

        function splitClasses(str) {
            // Trim
            if (str.trim) {
                // Use native when possible
                str = str.trim();
            } else {
                // IE doesn't match non-breaking spaces with \s
                str = str.replace(/^[\s\xA0]+/, '').replace(/[\s\xA0]+$/, '');
            }

            // Consolidate
            return str.split(/[\s\xA0]+/, ' ');
        }

        element = $element.get(0);

        // Detect changes to classes
        watchAdd($element, function () {
            return element.className;
        }, function (newVal, oldVal) {
            if (oldVal) {
                iterate(splitClasses(oldVal), function (className) {
                    setClass($wrapper, className);
                });
            }

            iterate(splitClasses(newVal), function (className) {
                setClass($wrapper, className, 1);
            });
        });
    }


    /**
     * Set up a watch on $element to toggle the 'disabled' class on $wrapper.
     *
     * @param {jQuery} $element
     * @param {jQuery} $wrapper
     */
    function monitorDisabled($element, $wrapper) {
        monitorProperty('disabled', $element, $wrapper);
    }


    /**
     * Set up a watch on $element to toggle the 'indeterminate' class on
     * $wrapper.
     *
     * @param {jQuery} $element
     * @param {jQuery} $wrapper
     */
    function monitorIndeterminate($element, $wrapper) {
        monitorProperty('indeterminate', $element, $wrapper);
    }


    /**
     * Set up a watch on $element to toggle the 'readonly' class on $wrapper.
     *
     * @param {jQuery} $element
     * @param {jQuery} $wrapper
     */
    function monitorReadonly($element, $wrapper) {
        monitorProperty('readonly', $element, $wrapper);
    }


    /**
     * Wrap an element with a new element.  Give the new element some classes.
     * Returns the new element after it was added to the DOM.
     *
     * @param {jQuery} $element
     * @param {string} classes
     * @return {jQuery}
     */
    function wrap($element, classes) {
        $element.wrap('<div class="' + classes + '"/>');
        return $element.parent();
    }


    /**
     * Wrap an element with a "uniform" div.  Every element that Uniform.js
     * manages will be wrapped by this element.  Everything done in here needs
     * to be undone with unwrapOuterFunction().
     *
     * @see unwrapOuterFunction
     * @param {jQuery} $element
     * @param {Uniform~options} options
     * @return {jQuery} Wrapper element
     */
    function wrapOuter($element, options, classSuffix) {
        var $wrapper;

        $wrapper = wrap($element, 'uniformjs ' + options.theme + ' '  + classSuffix);
        bindMany($element, {
            focus: function () {
                setClass($wrapper, 'focus', 1);
            },
            blur: function () {
                setClass($wrapper, 'focus');
                setClass($wrapper, 'active');
            },
            mouseenter: function () {
                setClass($wrapper, 'hover', 1);
            },
            mouseleave: function () {
                setClass($wrapper, 'hover');
                setClass($wrapper, 'active');
            },
            'mousedown touchbegin': function () {
                if (!$element.get(0).disabled) {
                    setClass($wrapper, 'active', 1);
                }
            },
            'mouseup touchend': function () {
                setClass($wrapper, 'active');
            }
        });
        setClass($element, 'expand');
        monitorClasses($element, $wrapper);
        monitorDisabled($element, $wrapper);
        monitorReadonly($element, $wrapper);

        return $wrapper;
    }


    /**
     * A single watcher object that contains all of the watches for
     * a given element.
     *
     * @see watchAdd
     * @typedef {Object} Uniform~watchDef
     * @property {jQuery} $element
     * @property {Array.<Function>} watches Callbacks to execute
     */

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
     * @type {Array.<Uniform~watchDef>}
     */
    uniformWatchesByElement = [];

    /**
     * A matcher to see if an element can be styled using this handler.
     *
     * @typedef {Function} Uniform~handlerMatch
     * @param {DOMNode} element Used $element.get(0)
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
            // Buttons using innerHtml
            match: function (element) {
                var name;

                name = element.nodeName.toLowerCase();

                // Pulled directly from Sizzle
                return name === 'a' || name === 'button';
            },
            apply: function ($element, options) {
                var element, $middle, $wrapper;

                $wrapper = wrapOuter($element, options, 'button');
                $middle = insertBefore($element, 'button-middle');
                wrap($middle, 'button-right');
                element = $element.get(0);

                // Copy the innerHTML
                watchAdd($element, function () {
                    return element.innerHTML;
                }, function (newVal) {
                    $middle.html(newVal);
                });
                return unwrapOuterFunction($element, $wrapper);
            }
        },
        {
            // Buttons using value
            match: function (element) {
                // Pulled directly from Sizzle
                return element.nodeName.toLowerCase() === 'input' && (element.type === 'button' || element.type === 'submit' || element.type === 'reset');
            },
            apply: function ($element, options) {
                var element, $middle, $wrapper;

                $wrapper = wrapOuter($element, options, 'button');
                $middle = insertBefore($element, 'button-middle');
                wrap($middle, 'button-right');
                element = $element.get(0);

                // Copy the value as text
                watchAdd($element, function () {
                    return element.value;
                }, function (newVal) {
                    if (!newVal) {
                        if (element.type === 'submit') {
                            newVal = options.submitText;
                        } else if (element.type === 'reset') {
                            newVal = options.resetText;
                        }
                    }

                    setClass($wrapper, 'default', !newVal);
                    $middle.text(newVal);
                });

                return unwrapOuterFunction($element, $wrapper);
            }
        },
        {
            // Checkboxes
            match: function (element) {
                // Pulled directly from Sizzle
                return element.nodeName.toLowerCase() === 'input' && element.type === 'checkbox';
            },
            apply: function ($element, options) {
                var $wrapper;

                $wrapper = wrapOuter($element, options, 'checkbox');
                monitorChecked($element, $wrapper);
                monitorIndeterminate($element, $wrapper);

                return unwrapOuterFunction($element, $wrapper);
            }
        },
        {
            // File selection / uploads
            match: function (element) {
                // Pulled directly from Sizzle
                return element.nodeName.toLowerCase() === 'input' && element.type === 'file';
            },
            apply: function ($element, options) {
                var $button, element, $filename, $wrapper;

                $wrapper = wrapOuter($element, options, 'file');

                // File upload button
                $button = insertBefore($element, 'file-button-middle');
                wrap($button, 'file-button');
                wrap($button, 'file-button-right');
                $button.html(options.fileButtonHtml);

                // File filename
                $filename = insertBefore($element, 'file-filename-middle');
                wrap($filename, 'file-filename');
                wrap($filename, 'file-filename-right');
                element = $element.get(0);

                watchAdd($element, function () {
                    return element.value;
                }, function (newVal) {
                    setClass($wrapper, 'default', !newVal);

                    if (!newVal) {
                        $filename.html(options.fileDefaultHtml);
                    } else {
                        $filename.text(newVal);
                    }
                });

                return unwrapOuterFunction($element, $wrapper);
            }
        },
        {
            // Input fields that can't be styled much
            match: function (element) {
                var allowed;
                allowed = " color date datetime datetime-local email month number password search tel text time url week ";
                // Pulled directly from Sizzle
                return element.nodeName.toLowerCase() === 'input' && allowed.indexOf(" " + element.type + " ") >= 0;
            },
            apply: function ($element, options) {
                var $wrapper;

                $wrapper = wrapOuter($element, options, 'input');

                return unwrapOuterFunction($element, $wrapper);
            }
        },
        {
            // Radios
            match: function (element) {
                // Pulled directly from Sizzle
                return element.nodeName.toLowerCase() === 'input' && element.type === 'radio';
            },
            apply: function ($element, options) {
                var $wrapper;

                $wrapper = wrapOuter($element, options, 'radio');
                monitorChecked($element, $wrapper);
                monitorIndeterminate($element, $wrapper);

                return unwrapOuterFunction($element, $wrapper);
            }
        },
        {
            // Select (not multiselect)
            match: function (element) {
                // Pulled directly from Sizzle
                return element.nodeName.toLowerCase() === 'select' && isMultiselect(element);
            },
            apply: function ($element, options) {
                var $wrapper;

                // FIXME:  All sorts of wrong here.
                $wrapper = wrapOuter($element, options, 'select');

                return unwrapOuterFunction($element, $wrapper);
            }
        },
        {
            // Select (multiselect)
            match: function (element) {
                // Pulled directly from Sizzle
                return element.nodeName.toLowerCase() === 'select' && isMultiselect(element);
            },
            apply: function ($element, options) {
                var $wrapper;

                $wrapper = wrapOuter($element, options, 'multiselect');

                return unwrapOuterFunction($element, $wrapper);
            }
        },
        {
            // Textareas
            match: function (element) {
                // Pulled directly from Sizzle
                return element.nodeName.toLowerCase() === 'textarea';
            },
            apply: function ($element, options) {
                var $wrapper;

                $wrapper = wrapOuter($element, options, 'textarea');

                return unwrapOuterFunction($element, $wrapper);
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
        apply: function ($target, options) {
            // FIXME:  Configure options
            options = options || {};
            options.fileButtonHtml = options.fileButtonHtml || "Choose File";
            options.fileDefaultHtml = options.fileDefaultHtml || "No file selected";
            options.resetText = options.resetText || "Reset";
            options.submitText = options.submitText || "Submit";
            options.theme = options.theme || "default";

            // Only apply styling on browsers that support our needs
            if (canStyleBrowser()) {
                iterate(getFormElements($target), function ($element) {
                    var handlerFound, element;

                    // Do not double-uniform elements
                    if (!$element.data(dataProperty)) {
                        element = $element.get(0);
                        iterate(uniformHandlers, function (handler) {
                            if (!handlerFound && handler.match(element)) {
                                handlerFound = handler.apply($element, options);
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
                        // Removes watches and erases the data from the element
                        watchRemove(i);
                    }

                    // Clean up the data
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


    /**
     * Clean out things automatically when elements are removed from
     * the DOM or other drastic changes occur.
     */
    setInterval(function () {
        var i;

        // Start from the end of the array and work forward.  This is
        // because splice can cut the current item out of the array.
        for (i = uniformWatchesByElement.length - 1; i >= 0; i -= 1) {
            watchCleanup(i);
        }
    }, 2000);
}(this, jQuery));
