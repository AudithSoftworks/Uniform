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
/*global jQuery, window, document*/

(function ($, undef) {
	"use strict";

	$.uniform = {
		// Default options that can be overridden globally or when uniformed
		// globally:  $.uniform.defaults.fileBtnText = "Pick A File";
		// on uniform:  $('input').uniform({fileBtnText: "Pick a File"});
		defaults: {
			activeClass: "active",
			autoHide: true,
			buttonClass: "button",
			checkboxClass: "checker",
			checkedClass: "checked",
			disabledClass: "disabled",
			fileBtnClass: "action",
			fileBtnText: "Choose File",  // Only text allowed
			fileClass: "uploader",
			fileDefaultText: "No file selected",  // Only text allowed
			filenameClass: "filename",
			focusClass: "focus",
			hoverClass: "hover",
			idPrefix: "uniform",
			radioClass: "radio",
			resetDefaultText: "Reset",  // Only text allowed
			resetSelector: false,
			selectAutoWidth: false,
			selectClass: "selector",
			submitDefaultText: "Submit",  // Only text allowed
			useID: true
		},

		// All uniformed elements - DOM objects
		elements: []
	};

	// For backwards compatibility with older jQuery libraries
	// Also adds our namespace in one consistent location and shrinks the
	// resulting minified code
	function bindMany($el, events) {
		var name, namespaced;

		for (name in events) {
			if (events.hasOwnProperty(name)) {
				namespaced = name.replace(/ |$/g, ".uniform");
				$el.bind(name, events[name]);
			}
		}
	}

	// Update the filename tag based on $el's value
	function setFilename($el, $filenameTag, options) {
		var filename = $el.val();

		if (filename === "") {
			filename = options.fileDefaultText;
		} else {
			filename = filename.split(/[\/\\]+/);
			filename = filename[(filename.length - 1)];
		}

		$filenameTag.text(filename);
	}

	function classClearStandard($el, options) {
		$el.removeClass(options.hoverClass + " " + options.focusClass + " " + options.activeClass);
	}

	function classToggle($el, className, enabled) {
		if (enabled) {
			$el.addClass(className);
		} else {
			$el.removeClass(className);
		}
	}

	function classToggleChecked($tag, $el, options) {
		var isChecked = $el.is(":checked");

		if (isChecked) {
			$el.attr("checked", "checked");
		} else {
			$el.removeAttr("checked");
		}

		classToggle($tag, options.checkedClass, $el.is(":checked"));
	}

	function classToggleDisabled($tag, $el, options) {
		classToggle($tag, options.disabledClass, $el.is(":disabled"));
	}

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

					classToggleDisabled($divTag, $el, options);
					bindMany($divTag, {
						"mouseenter": function () {
							$divTag.addClass(options.hoverClass);
						},
						"mouseleave": function () {
							$divTag.removeClass(options.hoverClass);
							$divTag.removeClass(options.activeClass);
						},
						"mousedown touchbegin": function () {
							$divTag.addClass(options.activeClass);
						},
						"mouseup touchend": function () {
							$divTag.removeClass(options.activeClass);
						},
						"click touchend": function (e) {
							if ($(e.target).is("span, div")) {
								if ($el[0].dispatchEvent) {
									var ev = document.createEvent("MouseEvents");
									ev.initEvent("click", true, true);
									$el[0].dispatchEvent(ev);
								} else {
									$el.click();
								}
							}
						}
					});
					bindMany($el, {
						"focus": function () {
							$divTag.addClass(options.focusClass);
						},
						"blur": function () {
							$divTag.removeClass(options.focusClass);
						}
					});

					$.uniform.noSelect($divTag);
					return $el;
				},
				remove: function ($el) {
					// Unwrap from span and div
					return $el.unwrap().unwrap();
				},
				update: function ($el, options) {
					var $divTag = $el.closest("div");
					classClearStandard($divTag, options);
					classToggleDisabled($divTag, $el, options);
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
					$el.css("opacity", 0);
					bindMany($el, {
						"focus": function () {
							$divTag.addClass(options.focusClass);
						},
						"blur": function () {
							$divTag.removeClass(options.focusClass);
						},
						"click touchend": function () {
							classToggleChecked($spanTag, $el, options);
						},
						"mousedown touchbegin": function () {
							$divTag.addClass(options.activeClass);
						},
						"mouseup touchend": function () {
							$divTag.removeClass(options.activeClass);
						},
						"mouseenter": function () {
							$divTag.addClass(options.hoverClass);
						},
						"mouseleave": function () {
							$divTag.removeClass(options.hoverClass);
							$divTag.removeClass(options.activeClass);
						}
					});

					classToggleChecked($spanTag, $el, options);
					classToggleDisabled($divTag, $el, options);
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
					classClearStandard($divTag, options);
					$spanTag.removeClass(options.checkedClass);
					classToggleChecked($spanTag, $el, options);
					classToggleDisabled($divTag, options);
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
						$btnTag = $("<span />").text(options.fileBtnText);

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
					function filenameUpdate() {
						setFilename($el, $filenameTag, options);
					}

					// Account for input saved across refreshes
					filenameUpdate();

					$el.css("opacity", 0);
					bindMany($el, {
						"focus": function () {
							$divTag.addClass(options.focusClass);
						},
						"blur": function () {
							$divTag.removeClass(options.focusClass);
						},
						"mousedown": function () {
							if (!$el.is(":disabled")) {
								$divTag.addClass(options.activeClass);
							}
						},
						"mouseup": function () {
							$divTag.removeClass(options.activeClass);
						},
						"mouseenter": function () {
							$divTag.addClass(options.hoverClass);
						},
						"mouseleave": function () {
							$divTag.removeClass(options.hoverClass);
							$divTag.removeClass(options.activeClass);
						}
					});

					// IE7 doesn't fire onChange until blur or second fire.
					if ($.browser.msie) {
						// IE considers browser chrome blocking I/O, so it
						// suspends tiemouts until after the file has been selected.
						bindMany($el, {
							"click": function () {
								setTimeout(filenameUpdate, 0);
							}
						});
					} else {
						// All other browsers behave properly
						bindMany($el, {
							"change": filenameUpdate
						});
					}

					classToggleDisabled($divTag, $el, options);
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
					$btnTag = $el.siblings("." + options.fileBtnClass);
					classClearStandard($divTag, options);
					setFilename($el, $filenameTag, options);
					classToggleDisabled($divTag, $el, options);
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
					$el.css("opacity", 0);
					bindMany($el, {
						"focus": function () {
							$divTag.addClass(options.focusClass);
						},
						"blur": function () {
							$divTag.removeClass(options.focusClass);
						},
						"click touchend": function () {
							// Untoggle the rest of the radios
							var radioClass = options.radioClass.split(" ")[0],
								otherRadioSpans = "." + radioClass + " span." + options.checkedClass + ":has([name='" + $el.attr("name") + "'])";
							$(otherRadioSpans).each(function () {
								var $spanTag = $(this),
									$el = $spanTag.find(":radio");
								classToggleChecked($spanTag, $el, options);
							});

							// Toggle me
							classToggleChecked($spanTag, $el, options);
						},
						"mousedown touchend": function () {
							if (!$el.is(":disabled")) {
								$divTag.addClass(options.activeClass);
							}
						},
						"mouseup touchbegin": function () {
							$divTag.removeClass(options.activeClass);
						},
						"mouseenter touchend": function () {
							$divTag.addClass(options.hoverClass);
						},
						"mouseleave": function () {
							$divTag.removeClass(options.hoverClass);
							$divTag.removeClass(options.activeClass);
						}
					});

					classToggleChecked($spanTag, $el, options);
					classToggleDisabled($divTag, $el, options);
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
					classClearStandard($divTag, options);
					classToggleChecked($spanTag, $el, options);
					classToggleDisabled($divTag, $el, options);
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

					bindMany($el, {
						"change": function () {
							$spanTag.html($el.find(":selected").html());
							$divTag.removeClass(options.activeClass);
						},
						"focus": function () {
							$divTag.addClass(options.focusClass);
						},
						"blur": function () {
							$divTag.removeClass(options.focusClass);
							$divTag.removeClass(options.activeClass);
						},
						"mousedown touchbegin": function () {
							$divTag.addClass(options.activeClass);
						},
						"mouseup touchend": function () {
							$divTag.removeClass(options.activeClass);
						},
						"click touchend": function () {
							$divTag.removeClass(options.activeClass);
						},
						"mouseenter": function () {
							$divTag.addClass(options.hoverClass);
						},
						"mouseleave": function () {
							$divTag.removeClass(options.hoverClass);
							$divTag.removeClass(options.activeClass);
						},
						"keyup": function () {
							$spanTag.html($el.find(":selected").html());
						}
					});

					classToggleDisabled($divTag, $el, options);
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
					classClearStandard($divTag, options);

					// Reset current selected text
					$spanTag.html($el.find(":selected").html());

					classToggleDisabled($divTag, $el, options);
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
