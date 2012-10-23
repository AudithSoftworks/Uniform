/*

Uniform v2.0.0
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

License:
MIT License - http://www.opensource.org/licenses/mit-license.php

Enjoy!

*/
/*global jQuery, window, document*/

(function ($, undef) {
	"use strict";

	// TODO:  Use a bunch of strings here for better minification

	$.uniform = {
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
			radioClass: "radio",
			resetDefaultHtml: "Reset",
			resetSelector: false,  // We'll use our own function when you don't specify one
			selectAutoWidth: false,
			selectClass: "selector",
			submitDefaultHtml: "Submit",  // Only text allowed
			useID: true
		},

		// All uniformed elements - DOM objects
		elements: []
	};

	/**
	 * Change text into safe HTML
	 *
	 * @param Sting text
	 * @return String HTML version
	 */
	function htmlify(text) {
		if (!text) {
			return "";
		}

		return $('<span />').text(text).html();
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
		var name, namespaced;

		for (name in events) {
			if (events.hasOwnProperty(name)) {
				namespaced = name.replace(/ |$/g, options.eventNamespace);
				$el.bind(name, events[name]);
			}
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
				$target.addClass(options.focusClass);
			},
			blur: function () {
				$target.removeClass(options.focusClass);
				$target.removeClass(options.activeClass);
			},
			mouseenter: function () {
				$target.addClass(options.hoverClass);
			},
			mouseleave: function () {
				$target.removeClass(options.hoverClass);
				$target.removeClass(options.activeClass);
			},
			"mousedown touchbegin": function () {
				if (!$el.is(":disabled")) {
					$target.addClass(options.activeClass);
				}
			},
			"mouseup touchend": function () {
				$target.removeClass(options.activeClass);
			}
		});
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

		if (elSize === undef || elSize <= 1) {
			return false;
		}

		return true;
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
	 * Remove the hover, focus, active classes.
	 *
	 * @param jQuery $el Element with classes
	 * @param Object options Uniform options for the element
	 */
	function classClearStandard($el, options) {
		$el.removeClass(options.hoverClass + " " + options.focusClass + " " + options.activeClass);
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

		divSpanConfig = $.extend({
			bind: {},
			css: null,
			divClass: null,
			divWrap: "wrap",
			spanClass: null,
			spanHtml: null,
			spanWrap: "wrap"
		}, divSpanConfig);

		$div = $('<div />');
		$span = $('<span />');

		if (options.autoHide && !($el.is(':visible'))) {
			$div.hide();
		}

		if (divSpanConfig.divClass) {
			$div.addClass(divSpanConfig.divClass);
		}

		if (divSpanConfig.spanClass) {
			$span.addClass(divSpanConfig.spanClass);
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

		if (divSpanConfig.css) {
			$el.css(divSpanConfig.css);
		}

		classUpdateDisabled($div, $el, options);
		return {
			div: $div,
			span: $span
		};
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

	var allowStyling = true,
		uniformHandlers = [
			{
				// Buttons
				match: function ($el) {
					return $el.is("button, :submit, :reset, a, input[type='button']");
				},
				apply: function ($el, options) {
					var $div, spanHtml, ds, tagName;
					spanHtml = options.submitDefaultHtml;
					tagName = $el[0].tagName.toUpperCase();

					if ($el.is(":reset")) {
						spanHtml = options.resetDefaultHtml;
					}

					if ($el.is("a, button")) {
						spanHtml = $el.html() || spanHtml;
					} else if ($el.is(":submit, :reset, input[type=button]")) {
						spanHtml = htmlify(attrOrProp($el, "value")) || spanHtml;
					}

					ds = divSpan($el, options, {
						css: {
							display: "none"
						},
						divClass: options.buttonClass,
						spanHtml: spanHtml
					});
					$div = ds.div;
					bindUi($el, $div, options);
					bindMany($div, options, {
						"click touchend": function (e) {
							var ev, res, target, href;

							if ($(e.target).is("span, div")) {
								if ($el[0].dispatchEvent) {
									ev = document.createEvent("MouseEvents");
									ev.initEvent("click", true, true);
									res = $el[0].dispatchEvent(ev);

									if ((jQuery.browser.msie || jQuery.browser.mozilla) && tagName === "A" && res) {
										target = attrOrProp($el, 'target');
										href = attrOrProp($el, 'href');

										if (!target || target === '_self') {
											document.location.href = href;
										} else {
											window.open(href, target);
										}
									}
								} else {
									$el.click();
								}
							}
						}
					});
					noSelect($div, options);
					return {
						remove: unwrapUnwrapUnbindFunction($el, options),
						update: function () {
							classClearStandard($div, options);
							classUpdateDisabled($div, $el, options);
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
						css: { opacity: 0 },
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
							$span.removeClass(options.checkedClass);
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
						css: { opacity: 0 },
						divClass: options.fileClass,
						spanClass: options.fileButtonClass,
						spanHtml: options.fileButtonHtml,
						spanWrap: "after"
					});
					$div = ds.div;
					$button = ds.span;
					$filename = $("<span />").html(options.fileDefaultHtml);
					$filename.addClass(options.filenameClass);
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
					if ($.browser.msie) {
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
				apply: function ($el) {
					var elType = attrOrProp($el, "type");
					$el.addClass(elType);
					return {
						remove: function () {
							$el.removeClass(elType);
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
						css: {
							opacity: 0
						},
						divClass: options.radioClass
					});
					$div = ds.div;
					$span = ds.span;

					// Add classes for focus, handle active, checked
					bindUi($el, $div, options);
					bindMany($el, options, {
						"click touchend": function () {
							// Deselect the rest of the radios
							var radioClass = options.radioClass.split(" ")[0],
								otherRadioSpans = "." + radioClass + " span." + options.checkedClass + ":has([name='" + attrOrProp($el, "name") + "'])";
							$(otherRadioSpans).each(function () {
								var $spanTag = $(this),
									$el = $spanTag.find(":radio");
								classUpdateChecked($spanTag, $el, options);
							});

							// Select me
							classUpdateChecked($span, $el, options);
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
				// Select lists, but do not style multiselects
				match: function ($el) {
					var elSize;

					if ($el.is("select") && !isMultiselect($el)) {
						return true;
					}

					return false;
				},
				apply: function ($el, options) {
					var ds, $div, $span, origElemWidth, px;
					origElemWidth = $el.width();
					ds = divSpan($el, options, {
						css: {
							opacity: 0,
							// The next two need some review
							left: "2px",
							width: (origElemWidth + 32) + "px"
						},
						divClass: options.selectClass,
						spanHtml: ($el.find(":selected:first") || $el.find("option:first")).html(),
						spanWrap: "before"
					});
					$div = ds.div;
					$span = ds.span;

					if (options.selectAutoWidth) {
						// This needs some critical review
						$div.width($("<div />").width() - $("<span />").width() + origElemWidth + 25);
						px = parseInt($div.css("paddingLeft"), 10);
						$span.width(origElemWidth - px - 15);
						$el.width(origElemWidth + px);
						$el.css("min-width", origElemWidth + px + "px");
						$div.width(origElemWidth + px);
					} else {
						// Set the width of select behavior
						px = $el.width();
						$div.width(px);
						$span.width(px - 25);
					}

					bindUi($el, $div, options);
					bindMany($el, options, {
						change: function () {
							$span.html($el.find(":selected").html());
							$div.removeClass(options.activeClass);
						},
						"click touchend": function () {
							// IE7 and IE8 may not update the value right
							// until click - issue #238
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
							classClearStandard($div, options);

							// Reset current selected text
							$span.html($el.find(":selected").html());
							classUpdateDisabled($div, $el, options);
						}
					};
				}
			},
			{
				// Select lists - multiselect lists only
				match: function ($el) {
					var elSize;

					if ($el.is("select") && isMultiselect($el)) {
						return true;
					}

					return false;
				},
				apply: function ($el) {
					$el.addClass("uniform-multiselect");
					return {
						remove: function () {
							$el.removeClass("uniform-multiselect");
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
				apply: function ($el) {
					$el.addClass("uniform");
					return {
						remove: function () {
							$el.removeClass("uniform");
						},
						update: returnFalse
					};
				}
			}
		];

	// IE6 can't be styled - can't set opacity on select
	if ($.browser.msie && $.browser.version < 7) {
		allowStyling = false;
	}

	$.fn.uniform = function (options) {
		var el = this;
		options = $.extend({}, $.uniform.defaults, options);

		// Code for specifying a reset button
		if (options.resetSelector !== false) {
			$(options.resetSelector).mouseup(function () {
				window.setTimeout(function () {
					$.uniform.update(el);
				}, 10);
			});
		}

		return this.each(function () {
			var $el = $(this), i, handler, callbacks;

			// Avoid uniforming elements already uniformed - just update
			if ($el.data("uniformed")) {
				$.uniform.update($el);
			}

			// Avoid uniforming browsers that don't work right
			if ($el.data("uniformed") || !allowStyling) {
				return;
			}

			for (i = 0; i < uniformHandlers.length; i = i + 1) {
				handler = uniformHandlers[i];

				if (handler.match($el, options)) {
					callbacks = handler.apply($el, options);

					// Mark the element as uniformed and save options
					$el.data("uniformed", callbacks);

					// Store element in our global array
					$.uniform.elements.push($el.get(0));
					return;
				}
			}
		});
	};

	$.uniform.restore = $.fn.uniform.restore = function (elem) {
		if (elem === undef) {
			elem = $.uniform.elements;
		}

		$(elem).each(function () {
			var $el = $(this), index, elementData;
			elementData = $el.data("uniformed");

			// Skip elements that are not uniformed
			if (!elementData) {
				return;
			}

			// Unbind events, remove additional markup that was added
			elementData.remove();

			// Remove item from list of uniformed elements
			index = $.inArray(this, $.uniform.elements);

			if (index >= 0) {
				$.uniform.elements.splice(index, 1);
			}

			$el.removeData("uniformed");
		});
	};

	$.uniform.update = $.fn.uniform.update = function (elem) {
		if (elem === undef) {
			elem = $.uniform.elements;
		}

		$(elem).each(function () {
			var $el = $(this), elementData;
			elementData = $el.data("uniformed");

			// Skip elements that are not uniformed
			if (!elementData) {
				return;
			}

			elementData.update($el, elementData.options);
		});
	};
}(jQuery));
