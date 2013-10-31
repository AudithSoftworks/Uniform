/*

Uniform v2.1.0
Copyright © 2009 Josh Pyles / Pixelmatrix Design LLC
http://pixelmatrixdesign.com

Requires jQuery 1.3 or newer

Much thanks to Thomas Reynolds and Buck Wilson for their help and advice on
this.

Disabling text selection is made possible by Mathias Bynens
<http://mathiasbynens.be/> and his noSelect plugin.
<https://github.com/mathiasbynens/jquery-noselect>, which is embedded.

Also, thanks to David Kaneda and Eugene Bond for their contributions to the
plugin.

Tyler Akins has also rewritten chunks of the plugin, helped close many issues,
and ensured version 2 got out the door.

License:
MIT License - http://www.opensource.org/licenses/mit-license.php

Enjoy!

*/
/*global jQuery, window, document, navigator*/

(function (jQuery, undef) {
    "use strict";


    var canStyleBrowser, isArray, uniformHandlers, uniformMethods, uniformSettings;


    /**
     * Function to call for every item in an object or array.
     *
     * @callback Uniform~iterator
     * @param {*} value
     * @param {string} key
     * @param {Object} object
     */

    /**
     * Iterate over an object
     *
     * @param {(Object|Array|jQuery)} obj
     * @param {Uniform~iterator} iterator
     */
    function iterate(obj, iterator) {
        var key, max;

        if (isArray(obj) || obj instanceof jQuery) {
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
     * Use .prop() if jQuery supports it, otherwise fall back to .attr()
     *
     * @param jQuery $el jQuery'd element on which we're calling attr/prop
     * @param ... All other parameters are passed to jQuery's function
     * @return The result from jQuery
     */
    function attrOrProp($el) {
        var args = Array.prototype.slice.call(arguments, 1);

        if ($el.prop) {
            // jQuery 1.6+
            return $el.prop.apply($el, args);
        }

        // jQuery 1.5 and below
        return $el.attr.apply($el, args);
    }


    /**
     * For backwards compatibility with older jQuery libraries, only bind
     * one thing at a time.  Also, this function adds our namespace to
     * events in one consistent location, shrinking the minified code.
     *
     * The properties on the events object are the names of the events
     * that we are supposed to add to.  It can be a space separated list.
     * The namespace will be added automatically.
     *
     * @param jQuery $el
     * @param Object options Uniform options for this element
     * @param Object events Events to bind, properties are event names
     */
    function bindMany($el, options, events) {
        iterate(events, function (action, key) {
            $el.bind(key.replace(/ |$/g, options.eventNamespace), action);
        });
    }


    /**
     * Add or remove a class, depending on if it's "enabled"
     *
     * @param jQuery $el Element that has the class added/removed
     * @param String className Class or classes to add/remove
     * @param Boolean enabled True to add the class, false to remove
     */
    function classUpdate($el, className, enabled) {
        if (enabled) {
            $el.addClass(className);
        } else {
            $el.removeClass(className);
        }
    }


    /**
     * Bind the hover, active, focus, and blur UI updates
     *
     * @param jQuery $el Original element
     * @param jQuery $target Target for the events (our div/span)
     * @param Object options Uniform options for the element $target
     */
    function bindUi($el, $target, options) {
        bindMany($el, options, {
            focus: function () {
                classUpdate($target, options.focusClass, 1);
            },
            blur: function () {
                classUpdate($target, options.focusClass);
                classUpdate($target, options.activeClass);
            },
            mouseenter: function () {
                classUpdate($target, options.hoverClass, 1);
            },
            mouseleave: function () {
                classUpdate($target, options.hoverClass);
                classUpdate($target, options.activeClass);
            },
            "mousedown touchbegin": function () {
                if (!$el.is(":disabled")) {
                    classUpdate($target, options.activeClass, 1);
                }
            },
            "mouseup touchend": function () {
                classUpdate($target, options.activeClass);
            }
        });
    }


    /**
     * Remove the hover, focus, active classes.
     *
     * @param jQuery $el Element with classes
     * @param Object options Uniform options for the element
     */
    function classClearStandard($el, options) {
        classUpdate($el, options.hoverClass + " " + options.focusClass + " " + options.activeClass);
    }


    /**
     * Updating the "checked" property can be a little tricky.  This
     * changed in jQuery 1.6 and now we can pass booleans to .prop().
     * Prior to that, one either adds an attribute ("checked=checked") or
     * removes the attribute.
     *
     * @param jQuery $tag Our Uniform span/div
     * @param jQuery $el Original form element
     * @param Object options Uniform options for this element
     */
    function classUpdateChecked($tag, $el, options) {
        var c = "checked",
            isChecked = $el.is(":" + c);

        if ($el.prop) {
            // jQuery 1.6+
            $el.prop(c, isChecked);
        } else {
            // jQuery 1.5 and below
            if (isChecked) {
                $el.attr(c, c);
            } else {
                $el.removeAttr(c);
            }
        }

        classUpdate($tag, options.checkedClass, isChecked);
    }


    /**
     * Set or remove the "disabled" class for disabled elements, based on
     * if the 
     *
     * @param jQuery $tag Our Uniform span/div
     * @param jQuery $el Original form element
     * @param Object options Uniform options for this element
     */
    function classUpdateDisabled($tag, $el, options) {
        classUpdate($tag, options.disabledClass, $el.is(":disabled"));
    }


    /**
     * Wrap an element inside of a container or put the container next
     * to the element.  See the code for examples of the different methods.
     *
     * Returns the container that was added to the HTML.
     *
     * @param jQuery $el Element to wrap
     * @param jQuery $container Add this new container around/near $el
     * @param String method One of "after", "before" or "wrap"
     * @return $container after it has been cloned for adding to $el
     */
    function divSpanWrap($el, $container, method) {
        switch (method) {
        case "after":
            // Result:  <element /> <container />
            $el.after($container);
            return $el.next();
        case "before":
            // Result:  <container /> <element />
            $el.before($container);
            return $el.prev();
        case "wrap":
            // Result:  <container> <element /> </container>
            $el.wrap($container);
            return $el.parent();
        }

        return null;
    }


    /**
     * Create a div/span combo for uniforming an element
     *
     * @param jQuery $el Element to wrap
     * @param Object options Options for the element, set by the user
     * @param Object divSpanConfig Options for how we wrap the div/span
     * @return Object Contains the div and span as properties
     */
    function divSpan($el, options, divSpanConfig) {
        var $div, $span, id;

        if (!divSpanConfig) {
            divSpanConfig = {};
        }

        divSpanConfig = jQuery.extend({
            bind: {},
            divClass: null,
            divWrap: "wrap",
            spanClass: null,
            spanHtml: null,
            spanWrap: "wrap"
        }, divSpanConfig);

        $div = jQuery('<div />');
        $span = jQuery('<span />');

        // Automatically hide this div/span if the element is hidden.
        // Do not hide if the element is hidden because a parent is hidden.
        if (options.autoHide && $el.is(':hidden') && $el.css('display') === 'none') {
            $div.hide();
        }

        if (divSpanConfig.divClass) {
            classUpdate($div, divSpanConfig.divClass, 1);
        }

        if (options.wrapperClass) {
            classUpdate($div, options.wrapperClass, 1);
        }

        if (divSpanConfig.spanClass) {
            classUpdate($span, divSpanConfig.spanClass, 1);
        }

        id = attrOrProp($el, 'id');

        if (options.useID && id) {
            attrOrProp($div, 'id', options.idPrefix + '-' + id);
        }

        if (divSpanConfig.spanHtml) {
            $span.html(divSpanConfig.spanHtml);
        }

        $div = divSpanWrap($el, $div, divSpanConfig.divWrap);
        $span = divSpanWrap($el, $span, divSpanConfig.spanWrap);
        classUpdateDisabled($div, $el, options);
        return {
            div: $div,
            span: $span
        };
    }


    /**
     * Wrap an element with a span to apply a global wrapper class
     *
     * @param jQuery $el Element to wrap
     * @param object options
     * @return jQuery Wrapper element
     */
    function wrapWithWrapperClass($el, options) {
        var $span;

        if (!options.wrapperClass) {
            return null;
        }

        $span = jQuery('<span />');
        classUpdate($span, options.wrapperClass, 1);
        $span = divSpanWrap($el, $span, "wrap");
        return $span;
    }


    /**
     * Test if high contrast mode is enabled.
     *
     * In high contrast mode, background images can not be set and
     * they are always returned as 'none'.
     *
     * @return boolean True if in high contrast mode
     */
    function highContrast() {
        var c, $div, el, rgb;

        // High contrast mode deals with white and black
        rgb = 'rgb(120,2,153)';
        $div = jQuery('<div style="width:0;height:0;color:' + rgb + '">');
        jQuery('body').append($div);
        el = $div.get(0);

        // $div.css() will get the style definition, not
        // the actually displaying style
        if (window.getComputedStyle) {
            c = window.getComputedStyle(el, '').color;
        } else {
            c = (el.currentStyle || el.style || {}).color;
        }

        $div.remove();
        return c.replace(/ /g, '') !== rgb;
    }


    /**
     * Change text into safe HTML
     *
     * @param String text
     * @return String HTML version
     */
    function htmlify(text) {
        if (!text) {
            return "";
        }

        return jQuery('<span />').text(text).html();
    }


    /**
     * Test if the element is a multiselect
     *
     * @param jQuery $el Element
     * @return boolean true/false
     */
    function isMultiselect($el) {
        var elSize;

        if ($el[0].multiple) {
            return true;
        }

        elSize = attrOrProp($el, "size");

        if (!elSize || elSize <= 1) {
            return false;
        }

        return true;
    }


    /**
     * Meaningless utility function.  Used mostly for improving minification.
     *
     * @return false
     */
    function returnFalse() {
        return false;
    }


    /**
     * noSelect plugin, very slightly modified
     * http://mths.be/noselect v1.0.3
     *
     * @param jQuery $elem Element that we don't want to select
     * @param Object options Uniform options for the element
     */
    function noSelect($elem, options) {
        var none = 'none';

        bindMany($elem, options, {
            'selectstart dragstart mousedown': returnFalse
        });
        $elem.css({
            MozUserSelect: none,
            msUserSelect: none,
            webkitUserSelect: none,
            userSelect: none
        });
    }


    /**
     * Updates the filename tag based on the value of the real input
     * element.
     *
     * @param jQuery $el Actual form element
     * @param jQuery $filenameTag Span/div to update
     * @param Object options Uniform options for this element
     */
    function setFilename($el, $filenameTag, options) {
        var filename = $el.val();

        if (filename === "") {
            filename = options.fileDefaultHtml;
        } else {
            filename = filename.split(/[\/\\]+/);
            filename = filename[(filename.length - 1)];
        }

        $filenameTag.text(filename);
    }


    /**
     * Function from jQuery to swap some CSS values, run a callback,
     * then restore the CSS.  Modified to pass JSLint and handle undefined
     * values with 'use strict'.
     *
     * @param jQuery $elements Elements
     * @param object newCss CSS values to swap out
     * @param Function callback Function to run
     */
    function swap($elements, newCss, callback) {
        var restore;

        restore = [];
        iterate($elements, function (element) {
            iterate(newCss, function (css, name) {
                restore.push({
                    el: element,
                    name: name,
                    old: element.style[name]
                });
                element.style[name] = css;
            });
        });
        callback();
        iterate(restore, function (item) {
            item.el.style[item.name] = item.old;
        });
    }


    /**
     * The browser doesn't provide sizes of elements that are not visible.
     * This will clone an element and add it to the DOM for calculations.
     *
     * @param jQuery $el
     * @param String method
     */
    function sizingInvisible($el, callback) {
        var targets;

        // We wish to target ourselves and any parents as long as
        // they are not visible
        targets = $el.parents();
        targets.push($el[0]);
        targets = targets.not(':visible');
        swap(targets, {
            visibility: "hidden",
            display: "block",
            position: "absolute"
        }, callback);
    }


    /**
     * Standard way to unwrap the div/span combination from an element
     *
     * @param jQuery $el Element that we wish to preserve
     * @param Object options Uniform options for the element
     * @return Function This generated function will perform the given work
     */
    function unwrapUnwrapUnbindFunction($el, options) {
        return function () {
            $el.unwrap().unwrap().unbind(options.eventNamespace);
        };
    }


    uniformHandlers = [  // Objects that take care of "unification"
        {
            // Buttons
            match: function ($el) {
                return $el.is("a, button, :submit, :reset, input[type='button']");
            },
            apply: function ($el, options) {
                var $div, defaultSpanHtml, ds, getHtml, isReset;
                isReset = $el.is(':reset');
                defaultSpanHtml = options.submitDefaultHtml;

                if (isReset) {
                    defaultSpanHtml = options.resetDefaultHtml;
                }

                if ($el.is("a, button")) {
                    // Use the HTML inside the tag
                    getHtml = function () {
                        return $el.html() || defaultSpanHtml;
                    };
                } else {
                    // Use the value property of the element
                    getHtml = function () {
                        return htmlify(attrOrProp($el, "value")) || defaultSpanHtml;
                    };
                }

                ds = divSpan($el, options, {
                    divClass: options.buttonClass,
                    spanHtml: getHtml()
                });
                $div = ds.div;
                bindUi($el, $div, options);
                noSelect($div, options);
                return {
                    remove: function () {
                        // Move $el out
                        $div.after($el);

                        // Remove div and span
                        $div.remove();
                        return $el;
                    },
                    update: function () {
                        classClearStandard($div, options);
                        classUpdateDisabled($div, $el, options);
                        $el.detach();
                        ds.span.html(getHtml()).append($el);
                    }
                };
            }
        },
        {
            // Checkboxes
            match: function ($el) {
                return $el.is(":checkbox");
            },
            apply: function ($el, options) {
                var ds, $div, $span;
                ds = divSpan($el, options, {
                    divClass: options.checkboxClass
                });
                $div = ds.div;
                $span = ds.span;

                // Add focus classes, toggling, active, etc.
                bindUi($el, $div, options);
                bindMany($el, options, {
                    "click touchend": function () {
                        classUpdateChecked($span, $el, options);
                    }
                });
                classUpdateChecked($span, $el, options);
                return {
                    remove: unwrapUnwrapUnbindFunction($el, options),
                    update: function () {
                        classClearStandard($div, options);
                        classUpdate($span, options.checkedClass);
                        classUpdateChecked($span, $el, options);
                        classUpdateDisabled($div, $el, options);
                    }
                };
            }
        },
        {
            // File selection / uploads
            match: function ($el) {
                return $el.is(":file");
            },
            apply: function ($el, options) {
                var ds, $div, $filename, $button;

                // The "span" is the button
                ds = divSpan($el, options, {
                    divClass: options.fileClass,
                    spanClass: options.fileButtonClass,
                    spanHtml: options.fileButtonHtml,
                    spanWrap: "after"
                });
                $div = ds.div;
                $button = ds.span;
                $filename = jQuery("<span />").html(options.fileDefaultHtml);
                classUpdate($filename, options.filenameClass, 1);
                $filename = divSpanWrap($el, $filename, "after");

                // Set the size
                if (!attrOrProp($el, "size")) {
                    attrOrProp($el, "size", $div.width() / 10);
                }

                // Actions
                function filenameUpdate() {
                    setFilename($el, $filename, options);
                }

                bindUi($el, $div, options);

                // Account for input saved across refreshes
                filenameUpdate();

                // IE7 doesn't fire onChange until blur or second fire.
                if (uniformSettings.isMsie) {
                    // IE considers browser chrome blocking I/O, so it
                    // suspends tiemouts until after the file has
                    // been selected.
                    bindMany($el, options, {
                        click: function () {
                            $el.trigger("change");
                            setTimeout(filenameUpdate, 0);
                        }
                    });
                } else {
                    // All other browsers behave properly
                    bindMany($el, options, {
                        change: filenameUpdate
                    });
                }

                noSelect($filename, options);
                noSelect($button, options);
                return {
                    remove: function () {
                        // Remove filename and button
                        $filename.remove();
                        $button.remove();

                        // Unwrap parent div, remove events
                        return $el.unwrap().unbind(options.eventNamespace);
                    },
                    update: function () {
                        classClearStandard($div, options);
                        setFilename($el, $filename, options);
                        classUpdateDisabled($div, $el, options);
                    }
                };
            }
        },
        {
            // Input fields (text)
            match: function ($el) {
                if ($el.is("input")) {
                    var t = (" " + attrOrProp($el, "type") + " ").toLowerCase(),
                        allowed = " color date datetime datetime-local email month number password search tel text time url week ";
                    return allowed.indexOf(t) >= 0;
                }

                return false;
            },
            apply: function ($el, options) {
                var elType, $wrapper;

                elType = attrOrProp($el, "type");
                classUpdate($el, options.inputClass, 1);
                $wrapper = wrapWithWrapperClass($el, options);
                bindUi($el, $el, options);

                if (options.inputAddTypeAsClass) {
                    classUpdate($el, elType, 1);
                }

                return {
                    remove: function () {
                        classUpdate($el, options.inputClass);

                        if (options.inputAddTypeAsClass) {
                            classUpdate($el, elType);
                        }

                        if ($wrapper) {
                            $el.unwrap();
                        }
                    },
                    update: returnFalse
                };
            }
        },
        {
            // Radio buttons
            match: function ($el) {
                return $el.is(":radio");
            },
            apply: function ($el, options) {
                var ds, $div, $span;
                ds = divSpan($el, options, {
                    divClass: options.radioClass
                });
                $div = ds.div;
                $span = ds.span;

                // Add classes for focus, handle active, checked
                bindUi($el, $div, options);
                bindMany($el, options, {
                    "click touchend": function () {
                        var name;
                        // Find all radios with the same name, then update
                        // them with jQuery().uniform('update') so the right
                        // per-element options are used
                        name = attrOrProp($el, 'name');
                        // Escape odd characters - issue #325
                        name = name.replace(/(["\\])/g, '\\$1');
                        uniformSettings.update(':radio[name="' + name + '"]');
                    }
                });
                classUpdateChecked($span, $el, options);
                return {
                    remove: unwrapUnwrapUnbindFunction($el, options),
                    update: function () {
                        classClearStandard($div, options);
                        classUpdateChecked($span, $el, options);
                        classUpdateDisabled($div, $el, options);
                    }
                };
            }
        },
        {
            // Select lists, but do not style multiselects here
            match: function ($el) {
                if ($el.is("select") && !isMultiselect($el)) {
                    return true;
                }

                return false;
            },
            apply: function ($el, options) {
                var ds, $div, $span, origElemWidth, origFontSize;

                function getOrigElemWidth() {
                    var toChange = {
                        borderWidth: "0px",
                        display: "inline",
                        width: "auto"
                    };

                    if (origFontSize) {
                        toChange.fontSize = origFontSize;
                    }

                    swap($el, toChange, function () {
                        sizingInvisible($el, function () {
                            origElemWidth = $el.width();

                            if (!origFontSize) {
                                origFontSize = $el.css('fontSize');
                            }
                        });
                    });
                }

                function setAutoWidth() {
                    var divWidth, spanWidth;

                    // Use the width of the select and adjust the
                    // span and div accordingly
                    swap(jQuery([ $span[0], $div[0] ]), {
                        // Force "display: block" - related to bug #287
                        display: "block",
                        width: ''
                    }, function () {
                        var spanPad;
                        spanPad = $span.outerWidth() - $span.width();
                        divWidth = origElemWidth + spanPad;
                        spanWidth = origElemWidth;
                    });
                    $div.width(divWidth);
                    $span.width(spanWidth);
                }

                if (options.selectAutoWidth) {
                    getOrigElemWidth();
                }

                ds = divSpan($el, options, {
                    divClass: options.selectClass,
                    spanHtml: ($el.find(":selected:first") || $el.find("option:first")).html(),
                    spanWrap: "before"
                });
                $div = ds.div;
                $span = ds.span;

                if (options.selectAutoWidth) {
                    setAutoWidth();
                } else {
                    // Force the select to fill the size of the div
                    classUpdate($div, 'fixedWidth', 1);
                }

                // Take care of events
                bindUi($el, $div, options);
                bindMany($el, options, {
                    change: function () {
                        $span.html($el.find(":selected").html());
                        classUpdate($div, options.activeClass);
                    },
                    "click touchend": function () {
                        // IE7 and IE8 may not update the value right
                        // until after click event - issue #238
                        var selHtml = $el.find(":selected").html();

                        if ($span.html() !== selHtml) {
                            // Change was detected
                            // Fire the change event on the select tag
                            $el.trigger('change');
                        }
                    },
                    keyup: function () {
                        $span.html($el.find(":selected").html());
                    }
                });
                noSelect($span, options);
                return {
                    remove: function () {
                        // Remove sibling span
                        $span.remove();

                        // Unwrap parent div
                        $el.unwrap().unbind(options.eventNamespace);
                        return $el;
                    },
                    update: function () {
                        if (options.selectAutoWidth) {
                            getOrigElemWidth();
                        }
                        classClearStandard($div, options);
                        $span.html($el.find(":selected:first").html());
                        classUpdateDisabled($div, $el, options);

                        if (options.selectAutoWidth) {
                            // Remove the width that was set in setAutoWidth()
                            setAutoWidth();
                        }
                    }
                };
            }
        },
        {
            // Select lists - multiselect lists only
            match: function ($el) {
                if ($el.is("select") && isMultiselect($el)) {
                    return true;
                }

                return false;
            },
            apply: function ($el, options) {
                var $wrapper;

                classUpdate($el, options.selectMultiClass, 1);
                $wrapper = wrapWithWrapperClass($el, options);
                bindUi($el, $el, options);

                return {
                    remove: function () {
                        classUpdate($el, options.selectMultiClass);

                        if ($wrapper) {
                            $el.unwrap();
                        }
                    },
                    update: returnFalse
                };
            }
        },
        {
            // Textareas
            match: function ($el) {
                return $el.is("textarea");
            },
            apply: function ($el, options) {
                var $wrapper;

                classUpdate($el, options.textareaClass, 1);
                $wrapper = wrapWithWrapperClass($el, options);
                bindUi($el, $el, options);

                return {
                    remove: function () {
                        classUpdate($el, options.textareaClass);

                        if ($wrapper) {
                            $el.unwrap();
                        }
                    },
                    update: returnFalse
                };
            }
        }
    ];


    jQuery.uniform = uniformSettings = {
        // Default options that can be overridden globally or when uniformed
        // globally:  $.uniform.defaults.fileButtonHtml = "Pick A File";
        // on uniform:  $('input').uniform({fileButtonHtml: "Pick a File"});
        defaults: {
            activeClass: "active",
            autoHide: true,
            buttonClass: "button",
            checkboxClass: "checker",
            checkedClass: "checked",
            disabledClass: "disabled",
            eventNamespace: ".uniform",
            fileButtonClass: "action",
            fileButtonHtml: "Choose File",
            fileClass: "uploader",
            fileDefaultHtml: "No file selected",
            filenameClass: "filename",
            focusClass: "focus",
            hoverClass: "hover",
            idPrefix: "uniform",
            inputAddTypeAsClass: true,
            inputClass: "uniform-input",
            radioClass: "radio",
            resetDefaultHtml: "Reset",
            selectAutoWidth: true,
            selectClass: "selector",
            selectMultiClass: "uniform-multiselect",
            submitDefaultHtml: "Submit",  // Only text allowed
            textareaClass: "uniform",
            useID: true,
            wrapperClass: null
        },

        // All uniformed elements - DOM objects
        elements: [],

        // Browser detection by feature detection - IE only
        isMsie: navigator.cpuClass && !navigator.product,


        /**
         * Removing Uniform from all elements
         *
         * To maintain compatibility with earlier versions, you can pass elements
         * into this method.
         *
         * @param {jQuery} [elem] Remove from only these elements
         * @return {jQuery} Affected elements
         */
        restore: function (elem) {
            var target = uniformSettings.elements;

            if (elem) {
                target = elem;
            }

            return jQuery(target).uniform('restore');
        },


        /**
         * Update Uniform on all elements that are Uniformed
         *
         * To maintain compatibility with earlier versions, you can pass elements
         * into this method.
         *
         * @param {jQuery} [elem] Remove from only these elements
         * @return {jQuery} Affected elements
         */
        update: function (elem) {
            var target = uniformSettings.elements;

            if (elem) {
                target = elem;
            }

            return jQuery(target).uniform('update');
        }
    };


    uniformMethods = {
        /**
         * Apply Uniform styling to elements.
         *
         * @param {Object} [userOptions] Options to tweak the styling
         */
        apply: function (userOptions) {
            var options = jQuery.extend({}, uniformSettings.defaults, userOptions);

            // Only uniform on browsers that work
            if (!canStyleBrowser()) {
                return this;
            }

            iterate(this, function (el) {
                var $el = jQuery(el),
                    callbacks;  // Outside iterate() to help short-circuit

                // Avoid uniforming elements already uniformed - just update
                if ($el.data("uniformed")) {
                    uniformSettings.update($el);
                    return;
                }

                // See if we have any handler for this type of element
                iterate(uniformHandlers, function (handler) {
                    if (!callbacks && handler.match($el)) {
                        callbacks = handler.apply($el, options);
                        $el.data("uniformed", callbacks);

                        // Store element in our global array
                        uniformSettings.elements.push($el.get(0));
                    }
                });
            });
        },


        /**
         * Remove Uniform styling from the elements
         */
        restore: function () {
            iterate(this, function (el) {
                var $el = jQuery(el),
                    elementData = $el.data('uniformed'),
                    index;

                // Only restore elements that are uniformed
                if (elementData) {
                    // Unbind events, remove additional markup that was added
                    elementData.remove();

                    // Remove item from list of uniformed elements
                    index = jQuery.inArray(this, uniformSettings.elements);

                    if (index !== 0) {
                        uniformSettings.elements.splice(index, 1);
                    }

                    $el.removeData("uniformed");
                }
            });
            return this;
        },


        /**
         * Update the elements to reflect new values, styling, etc
         */
        update: function () {
            iterate(this, function (el) {
                var $el = jQuery(el),
                    elementData = $el.data('uniformed');

                if (elementData) {
                    elementData.update($el);
                }
            });
            return this;
        }
    };


    /**
     * Apply uniform to jQuery elements - uses the standard "method comes first"
     * invocation style for jQuery plugins.
     *
     * @param {string} [method]
     * @return {jQuery} Affected elements
     */
    jQuery.fn.uniform = function (method, options) {
        if (typeof method !== 'string') {
            options = method;
            method = 'apply';
        }

        if (!uniformMethods[method]) {
            throw new Error('Unsupported Uniform method: ' + method);
        }

        uniformMethods[method].call(this, options);
        return this;
    };


    // Shims
    if (Array.isArray) {
        isArray = Array.isArray;
    } else {
        isArray = function (obj) {
            // Pretty fast - http://jsperf.com/isarray-shim/4
            return Object.prototype.toString.call(obj) === "[object Array]";
        };
    }


    /**
     * Detect if the browser can be styled or not.  This function replaces
     * itself when ran in order to improve speed.
     *
     * @return {boolean}
     */
    canStyleBrowser = function () {
        var isMsieSevenOrNewer = (window.XMLHttpRequest !== undef);

        if ((uniformSettings.isMsie && !isMsieSevenOrNewer) || highContrast()) {
            // Can not style IE6 or lower - can't set opacity on select
            // Can not style browsers in high contrast mode - no backgrounds
            canStyleBrowser = returnFalse;
        } else {
            canStyleBrowser = function () { return true; };
        }
        return canStyleBrowser();
    };
}(jQuery));
