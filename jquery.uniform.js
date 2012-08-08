/*

Uniform v1.8.0+f
Copyright © 2009 Josh Pyles / Pixelmatrix Design LLC
http://pixelmatrixdesign.com

Requires jQuery 1.3 or newer

Much thanks to Thomas Reynolds and Buck Wilson for their help and advice on
this.

Disabling text selection is made possible by Mathias Bynens
<http://mathiasbynens.be/> and his noSelect plugin.
<http://github.com/mathiasbynens/noSelect-jQuery-Plugin>.

Also, thanks to David Kaneda and Eugene Bond for their contributions to the
plugin.

This version (+f) is from fidian's forked repository until the changes can
get merged upstream.  See https://github.com/fidian/uniform

License:
MIT License - http://www.opensource.org/licenses/mit-license.php

Enjoy!

*/
/*jslint browser: true*/
/*global jQuery*/

(function ($, undef) {
	"use strict";

	$.uniform = {
		// Default options that can be overridden globally or when uniformed
		// globally:  $.uniform.options.fileBtnText = "Pick A File";
		// on uniform:  $('input').uniform({fileBtnText: "Pick a File"});
		options: {
			selectClass: "selector",
			radioClass: "radio",
			checkboxClass: "checker",
			fileClass: "uploader",
			filenameClass: "filename",
			fileBtnClass: "action",
			fileDefaultText: "No file selected",  // Only text allowed
			fileBtnText: "Choose File",  // Only text allowed
			checkedClass: "checked",
			focusClass: "focus",
			disabledClass: "disabled",
			buttonClass: "button",
			activeClass: "active",
			hoverClass: "hover",
			useID: true,
			idPrefix: "uniform",
			resetSelector: false,
			autoHide: true,
			selectAutoWidth: false,
			submitDefaultText: "Submit",  // Only text allowed
			resetDefaultText: "Reset"  // Only text allowed
		},

		// All uniformed elements - DOM objects
		elements: []
	};

	var allowStyling = true,
		uniformHandlers = [
			{
				// Buttons
				match: function ($el) {
					return $el.is("button, :submit, :reset, a, input[type='button']");
				},
				apply: function ($el, options) {
					var $divTag = $("<div>"),
						$spanTag = $("<span>"),
						btnText;

					$divTag.addClass(options.buttonClass);

					if (options.useID && $el.attr("id")) {
						$divTag.attr("id", options.idPrefix + "-" + $el.attr("id"));
					}

					if ($el.is("a, button")) {
						btnText = $el.text();
					} else if ($el.is(":submit, :reset, input[type=button]")) {
						btnText = $el.attr("value");
					}

					btnText = btnText || ($el.is(":reset") ? options.resetDefaultText : options.submitDefaultText);
					$spanTag.text(btnText);
					$el.css("display", "none").wrap($divTag).wrap($spanTag);

					// Redefine variables
					$divTag = $el.closest("div");

					if ($el.is(":disabled")) {
						$divTag.addClass(options.disabledClass);
					}

					// Chaining bind instead of passing an object for older jQuery
					$divTag.bind("mouseenter.uniform", function () {
						$divTag.addClass(options.hoverClass);
					}).bind("mouseleave.uniform", function () {
						$divTag.removeClass(options.hoverClass);
						$divTag.removeClass(options.activeClass);
					}).bind("mousedown.uniform touchbegin.uniform", function () {
						$divTag.addClass(options.activeClass);
					}).bind("mouseup.uniform touchend.uniform", function () {
						$divTag.removeClass(options.activeClass);
					}).bind("click.uniform touchend.uniform", function (e) {
						if ($(e.target).is("span, div")) {
							if ($el[0].dispatchEvent) {
								var ev = document.createEvent("MouseEvents");
								ev.initEvent("click", true, true);
								$el[0].dispatchEvent(ev);
							} else {
								$el.click();
							}
						}
					});

					// Chaining bind instead of passing an object for older jQuery
					$el.bind("focus.uniform", function () {
						$divTag.addClass(options.focusClass);
					}).bind("blur.uniform", function () {
						$divTag.removeClass(options.focusClass);
					});

					$.uniform.noSelect($divTag);
					return $el;
				},
				remove: function ($el) {
					// Unwrap from span and div
					return $el.unwrap().unwrap();
				},
				update: function ($el, options) {
					var $divTag;
					$divTag = $el.closest("div");
					$divTag.removeClass(options.hoverClass + " " + options.focusClass + " " + options.activeClass);

					if ($el.is(":disabled")) {
						$divTag.addClass(options.disabledClass);
					} else {
						$divTag.removeClass(options.disabledClass);
					}

					return $el;
				}
			},
			{
				// Checkboxes
				match: function ($el) {
					return $el.is(":checkbox");
				},
				apply: function ($el, options) {
					var $divTag = $("<div />"),
						$spanTag = $("<span />");

					if ($el.css("display") === "none" && options.autoHide) {
						$divTag.hide();
					}

					$divTag.addClass(options.checkboxClass);

					// Assign the id of the element
					if (options.useID && $el.attr("id")) {
						$divTag.attr("id", options.idPrefix + "-" + $el.attr("id"));
					}

					// Wrap with the proper elements
					$el.wrap($divTag);
					$el.wrap($spanTag);

					// Redefine variables
					$spanTag = $el.parent();
					$divTag = $spanTag.parent();

					// Hide normal input and add focus classes
					// Chaining bind instead of passing an object for older jQuery
					$el.css("opacity", 0).bind("focus.uniform", function () {
						$divTag.addClass(options.focusClass);
					}).bind("blur.uniform", function () {
						$divTag.removeClass(options.focusClass);
					}).bind("click.uniform touchend.uniform", function () {
						if ($el.is(":checked")) {
							// An unchecked box was clicked.  Change to checked.
							$el.attr("checked", "checked");
							$spanTag.addClass(options.checkedClass);
						} else {
							// A checked box was clicked.  Change to unchecked.
							$el.removeAttr("checked");
							$spanTag.removeClass(options.checkedClass);
						}
					}).bind("mousedown.uniform touchbegin.uniform", function () {
						$divTag.addClass(options.activeClass);
					}).bind("mouseup.uniform touchend.uniform", function () {
						$divTag.removeClass(options.activeClass);
					}).bind("mouseenter.uniform", function () {
						$divTag.addClass(options.hoverClass);
					}).bind("mouseleave.uniform", function () {
						$divTag.removeClass(options.hoverClass);
						$divTag.removeClass(options.activeClass);
					});

					// Handle defaults
					if ($el.is(":checked")) {
						// Helpful when its checked by default
						$el.attr("checked", "checked");

						// Box is checked by default, check our box
						$spanTag.addClass(options.checkedClass);
					}

					// Handle disabled state
					if ($el.is(":disabled")) {
						// Box is disabled by default, disable our box
						$divTag.addClass(options.disabledClass);
					}

					return $el;
				},
				remove: function ($el) {
					return $el.unwrap().unwrap();
				},
				update: function ($el, options) {
					var $spanTag,
						$divTag;

					$spanTag = $el.closest("span");
					$divTag = $el.closest("div");

					$divTag.removeClass(options.hoverClass + " " + options.focusClass + " " + options.activeClass);
					$spanTag.removeClass(options.checkedClass);

					if ($el.is(":checked")) {
						$spanTag.addClass(options.checkedClass);
					}

					if ($el.is(":disabled")) {
						$divTag.addClass(options.disabledClass);
					} else {
						$divTag.removeClass(options.disabledClass);
					}
				}
			},
			{
				// File selection / uploads
				match: function ($el) {
					return $el.is(":file");
				},
				apply: function ($el, options) {
					var $divTag = $("<div />"),
						$filenameTag = $("<span />").text(options.fileDefaultText),
						$btnTag = $("<span />").text(options.fileBtnText),
						filename;

					if ($el.css("display") === "none" && options.autoHide) {
						$divTag.hide();
					}

					$divTag.addClass(options.fileClass);
					$filenameTag.addClass(options.filenameClass);
					$btnTag.addClass(options.fileBtnClass);

					if (options.useID && $el.attr("id")) {
						$divTag.attr("id", options.idPrefix + "-" + $el.attr("id"));
					}

					// Wrap with the proper elements
					$el.wrap($divTag);
					$el.after($btnTag);
					$el.after($filenameTag);

					// Redefine variables
					$divTag = $el.closest("div");
					$filenameTag = $el.siblings("." + options.filenameClass);
					$btnTag = $el.siblings("." + options.fileBtnClass);

					// Set the size
					if (!$el.attr("size")) {
						$el.attr("size", $divTag.width() / 10);
					}

					// Actions
					function setFilename() {
						filename = $el.val();

						if (filename === "") {
							filename = options.fileDefaultText;
						} else {
							filename = filename.split(/[\/\\]+/);
							filename = filename[(filename.length - 1)];
						}

						$filenameTag.text(filename);
					}

					// Account for input saved across refreshes
					setFilename();

					// Chaining bind instead of passing an object for older jQuery
					$el.css("opacity", 0).bind("focus.uniform", function () {
						$divTag.addClass(options.focusClass);
					}).bind("blur.uniform", function () {
						$divTag.removeClass(options.focusClass);
					}).bind("mousedown.uniform", function () {
						if (!$el.is(":disabled")) {
							$divTag.addClass(options.activeClass);
						}
					}).bind("mouseup.uniform", function () {
						$divTag.removeClass(options.activeClass);
					}).bind("mouseenter.uniform", function () {
						$divTag.addClass(options.hoverClass);
					}).bind("mouseleave.uniform", function () {
						$divTag.removeClass(options.hoverClass);
						$divTag.removeClass(options.activeClass);
					});

					// IE7 doesn't fire onChange until blur or second fire.
					if ($.browser.msie) {
						// IE considers browser chrome blocking I/O, so it
						// suspends tiemouts until after the file has been selected.
						$el.bind("click.uniform.ie7", function () {
							setTimeout(setFilename, 0);
						});
					} else {
						// All other browsers behave properly
						$el.bind("change.uniform", setFilename);
					}

					// Handle defaults
					if ($el.is(":disabled")) {
						// Box is checked by default, check our box
						$divTag.addClass(options.disabledClass);
					}

					$.uniform.noSelect($filenameTag);
					$.uniform.noSelect($btnTag);
					return $el;
				},
				remove: function ($el) {
					// Remove sibling spans
					$el.siblings("span").remove();
					// Unwrap parent div
					$el.unwrap();
					return $el;
				},
				update: function ($el, options) {
					var $divTag,
						$filenameTag,
						$btnTag;

					$divTag = $el.parent("div");
					$filenameTag = $el.siblings("." + options.filenameClass);
					$btnTag = $el.siblings(options.fileBtnClass);

					$divTag.removeClass(options.hoverClass + " " + options.focusClass + " " + options.activeClass);

					$filenameTag.text($el.val());

					if ($el.is(":disabled")) {
						$divTag.addClass(options.disabledClass);
					} else {
						$divTag.removeClass(options.disabledClass);
					}
				}
			},
			{
				// Input fields (text)
				match: function ($el) {
					return $el.is(":text, :password, input[type='email'], input[type='search'], input[type='tel'], input[type='url'], input[type='datetime'], input[type='date'], input[type='month'], input[type='week'], input[type='time'], input[type='datetime-local'], input[type='number'], input[type='color']");
				},
				apply: function ($el) {
					$el.addClass($el.attr("type"));
					return $el;
				},
				remove: function () {
				},
				update: function () {
				}
			},
			{
				// Radio buttons
				match: function ($el) {
					return $el.is(":radio");
				},
				apply: function ($el, options) {
					var $divTag = $("<div />"),
						$spanTag = $("<span />");

					if ($el.css("display") === "none" && options.autoHide) {
						$divTag.hide();
					}

					$divTag.addClass(options.radioClass);

					if (options.useID && $el.attr("id")) {
						$divTag.attr("id", options.idPrefix + "-" + $el.attr("id"));
					}

					// Wrap with the proper elements
					$el.wrap($divTag);
					$el.wrap($spanTag);

					// Redefine variables
					$spanTag = $el.parent();
					$divTag = $spanTag.parent();

					// Hide normal input and add focus classes
					// Chaining bind instead of passing an object for older jQuery
					$el.css("opacity", 0).bind("focus.uniform", function () {
						$divTag.addClass(options.focusClass);
					}).bind("blur.uniform", function () {
						$divTag.removeClass(options.focusClass);
					}).bind("click.uniform touchend.uniform", function () {
						if (!$el.is(":checked")) {
							// Box was just unchecked, uncheck span
							$spanTag.removeClass(options.checkedClass);
						} else {
							// Box was just checked, check span
							var classes = options.radioClass.split(" ")[0];
							$("." + classes + " span." + options.checkedClass + ":has([name='" + $el.attr("name") + "'])").removeClass(options.checkedClass);
							$spanTag.addClass(options.checkedClass);
						}
					}).bind("mousedown.uniform touchend.uniform", function () {
						if (!$el.is(":disabled")) {
							$divTag.addClass(options.activeClass);
						}
					}).bind("mouseup.uniform touchbegin.uniform", function () {
						$divTag.removeClass(options.activeClass);
					}).bind("mouseenter.uniform touchend.uniform", function () {
						$divTag.addClass(options.hoverClass);
					}).bind("mouseleave.uniform", function () {
						$divTag.removeClass(options.hoverClass);
						$divTag.removeClass(options.activeClass);
					});

					// Handle defaults
					if ($el.is(":checked")) {
						// Box is checked by default, check span
						$spanTag.addClass(options.checkedClass);
					}
					// Handle disabled state
					if ($el.is(":disabled")) {
						// Box is checked by default, check our box
						$divTag.addClass(options.disabledClass);
					}

					return $el;
				},
				remove: function ($el) {
					// Unwrap from span and div
					return $el.unwrap().unwrap();
				},
				update: function ($el, options) {
					var $spanTag,
						$divTag;

					$spanTag = $el.closest("span");
					$divTag = $el.closest("div");

					$divTag.removeClass(options.hoverClass + " " + options.focusClass + " " + options.activeClass);
					$spanTag.removeClass(options.checkedClass);

					if ($el.is(":checked")) {
						$spanTag.addClass(options.checkedClass);
					}

					if ($el.is(":disabled")) {
						$divTag.addClass(options.disabledClass);
					} else {
						$divTag.removeClass(options.disabledClass);
					}
				}
			},
			{
				// Select lists, but do not style multiselects
				match: function ($el) {
					var elSize;

					if ($el.is("select")) {
						if (!this.multiple) {
							elSize = $el.attr("size");

							if (elSize === undef || elSize <= 1) {
								return true;
							}
						}
					}

					return false;
				},
				apply: function ($el, options) {
					var $divTag = $("<div />"),
						$spanTag = $("<span />"),
						origElemWidth = $el.width(),
						origDivWidth,
						origSpanWidth,
						adjustDiff,
						$selected,
						padding,
						selectWidth;

					if ($el.css("display") === "none" && options.autoHide) {
						$divTag.hide();
					}

					$divTag.addClass(options.selectClass);

					// Thanks to @MaxEvron @kjantzer and @furkanmustafa from GitHub
					if (options.selectAutoWidth) {
						origDivWidth = $divTag.width();
						origSpanWidth = $spanTag.width();
						adjustDiff = origSpanWidth - origElemWidth;
						$divTag.width(origDivWidth - adjustDiff + 25);
						$el.width(origElemWidth + 32);
						$el.css("left", "2px");
						$spanTag.width(origElemWidth);
					}

					if (options.useID && $el.attr("id")) {
						$divTag.attr("id", options.idPrefix + "-" + $el.attr("id"));
					}

					$selected = $el.find(":selected:first");

					if (!$selected.length) {
						$selected = $el.find("option:first");
					}

					$spanTag.html($selected.html());

					$el.css("opacity", 0);
					$el.wrap($divTag);
					$el.before($spanTag);

					// Redefine variables
					$divTag = $el.parent("div");
					$spanTag = $el.siblings("span");

					if (options.selectAutoWidth) {
						padding = parseInt($divTag.css("paddingLeft"), 10);
						$spanTag.width(origElemWidth - padding - 15);
						$el.width(origElemWidth + padding);
						$el.css("min-width", origElemWidth + padding + "px");
						$divTag.width(origElemWidth + padding);
					}

					// Chaining bind instead of passing an object for older jQuery
					$el.bind("change.uniform", function () {
						$spanTag.html($el.find(":selected").html());
						$divTag.removeClass(options.activeClass);
					}).bind("focus.uniform", function () {
						$divTag.addClass(options.focusClass);
					}).bind("blur.uniform", function () {
						$divTag.removeClass(options.focusClass);
						$divTag.removeClass(options.activeClass);
					}).bind("mousedown.uniform touchbegin.uniform", function () {
						$divTag.addClass(options.activeClass);
					}).bind("mouseup.uniform touchend.uniform", function () {
						$divTag.removeClass(options.activeClass);
					}).bind("click.uniform touchend.uniform", function () {
						$divTag.removeClass(options.activeClass);
					}).bind("mouseenter.uniform", function () {
						$divTag.addClass(options.hoverClass);
					}).bind("mouseleave.uniform", function () {
						$divTag.removeClass(options.hoverClass);
						$divTag.removeClass(options.activeClass);
					}).bind("keyup.uniform", function () {
						$spanTag.html($el.find(":selected").html());
					});

					// Handle disabled state
					if ($el.is(":disabled")) {
						// Box is checked by default, check our box
						$divTag.addClass(options.disabledClass);
					}

					$.uniform.noSelect($spanTag);

					// Set the width of select behavior
					selectWidth = $el.width();
					$divTag.width(selectWidth);
					$spanTag.width(selectWidth - 25);

					return $el;
				},
				remove: function ($el) {
					// Remove sibling span
					$el.siblings("span").remove();
					// Unwrap parent div
					$el.unwrap();
					return $el;
				},
				update: function ($el, options) {
					var $spanTag,
						$divTag;

					$spanTag = $el.siblings("span");
					$divTag = $el.parent("div");

					$divTag.removeClass(options.hoverClass + " " + options.focusClass + " " + options.activeClass);

					// Reset current selected text
					$spanTag.html($el.find(":selected").html());

					if ($el.is(":disabled")) {
						$divTag.addClass(options.disabledClass);
					} else {
						$divTag.removeClass(options.disabledClass);
					}
				}
			},
			{
				// Textareas
				match: function ($el) {
					return $el.is("textarea");
				},
				apply: function ($el) {
					$el.addClass("uniform");
					return $el;
				},
				remove: function () {
				},
				update: function () {
				}
			}
		];

	// IE6 can't be styled - can't set opacity on select
	if ($.browser.msie && $.browser.version < 7) {
		allowStyling = false;
	}


	$.fn.uniform = function (options) {
		var el = this;
		options = $.extend({}, $.uniform.options, options);

		// Code for specifying a reset button
		if (options.resetSelector !== false) {
			$(options.resetSelector).mouseup(function () {
				window.setTimeout(function () {
					$.uniform.update(el);
				}, 10);
			});
		}

		return this.each(function () {
			var $el = $(this),
				i,
				handler;

			// Avoid uniforming elements already uniformed and
			// avoid uniforming browsers that don't work right
			if ($el.data("uniformed") || !allowStyling) {
				return;
			}

			for (i = 0; i < uniformHandlers.length; i = i + 1) {
				handler = uniformHandlers[i];

				if (handler.match($el, options)) {
					handler.apply($el, options);

					// Mark the element as uniformed and save options
					$el.data("uniformed", {
						options: options,
						remove: handler.remove,
						update: handler.update
					});

					// Store element in our global array
					$.uniform.elements.push($el.get(0));
					return;
				}
			}
		});
	};

	$.uniform.restore = function (elem) {
		if (elem === undef) {
			elem = $.uniform.elements;
		}

		var $elem = $(elem);

		$elem.each(function () {
			var $el = $(this),
				index,
				elementData;

			elementData = $el.data("uniformed");

			// Skip elements that are not uniformed
			if (!elementData) {
				return;
			}

			elementData.remove($el, elementData.options);

			// Unbind events
			$el.unbind(".uniform");

			// Reset inline style
			$el.css("opacity", "1");

			// Remove item from list of uniformed elements
			index = $.inArray(this, $.uniform.elements);

			if (index >= 0) {
				$.uniform.elements.splice(index, 1);
			}

			$el.removeData("uniformed");
		});
	};

	//noSelect v1.0
	$.uniform.noSelect = function (elem) {
		var f = function () {
			return false;
		};

		$(elem).each(function () {
			this.onselectstart = this.ondragstart = f; // Webkit & IE
			// .mousedown() for Webkit and Opera
			// .css for Firefox
			$(this).mousedown(f).css({
				MozUserSelect: "none"
			});
		});
	};

	$.uniform.update = function (elem) {
		if (elem === undef) {
			elem = $.uniform.elements;
		}

		var $elem = $(elem);

		$elem.each(function () {
			var $el = $(this),
				elementData;

			elementData = $el.data("uniformed");

			// Skip elements that are not uniformed
			if (!elementData) {
				return;
			}

			elementData.update($el, elementData.options);
		});
	};
}(jQuery));
