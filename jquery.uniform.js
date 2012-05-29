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

(function ($, undefined) {
	$.uniform = {
		options: {
			selectClass: 'selector',
			radioClass: 'radio',
			checkboxClass: 'checker',
			fileClass: 'uploader',
			filenameClass: 'filename',
			fileBtnClass: 'action',
			fileDefaultText: 'No file selected',
			fileBtnText: 'Choose File',
			checkedClass: 'checked',
			focusClass: 'focus',
			disabledClass: 'disabled',
			buttonClass: 'button',
			activeClass: 'active',
			hoverClass: 'hover',
			useID: true,
			idPrefix: 'uniform',
			resetSelector: false,
			autoHide: true,
			selectAutoWidth: false
		},
		elements: []
	};

	if ($.browser.msie && $.browser.version < 7) {
		$.support.selectOpacity = false;
	} else {
		$.support.selectOpacity = true;
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

		function doInput($el) {
			$el.addClass($el.attr("type"));
			storeElement($el);
		}

		function doTextarea($el) {
			$el.addClass("uniform");
			storeElement($el);
		}

		function doButton($el) {
			var divTag = $("<div>"),
				spanTag = $("<span>"),
				btnText;

			divTag.addClass(options.buttonClass);

			if (options.useID && $el.attr("id")) {
				divTag.attr("id", options.idPrefix + "-" + $el.attr("id"));
			}

			if ($el.is("a, button")) {
				btnText = $el.text();
			} else if ($el.is(":submit, :reset, input[type=button]")) {
				btnText = $el.attr("value");
			}

			btnText = btnText || ($el.is(":reset") ? "Reset" : "Submit");
			spanTag.text(btnText);

			$el.css("display", "none");
			$el.wrap(divTag);
			$el.wrap(spanTag);

			// Redefine variables
			divTag = $el.closest("div");
			spanTag = $el.closest("span");

			if ($el.is(":disabled")) {
				divTag.addClass(options.disabledClass);
			}

			divTag.bind("mouseenter.uniform", function () {
				divTag.addClass(options.hoverClass);
			}).bind("mouseleave.uniform", function () {
				divTag.removeClass(options.hoverClass);
				divTag.removeClass(options.activeClass);
			}).bind("mousedown.uniform touchbegin.uniform", function () {
				divTag.addClass(options.activeClass);
			}).bind("mouseup.uniform touchend.uniform", function () {
				divTag.removeClass(options.activeClass);
			}).bind("click.uniform touchend.uniform", function (e) {
				if ($(e.target).is("span, div")) {
					if ($el[0].dispatchEvent) {
						var ev = document.createEvent('MouseEvents');
						ev.initEvent('click', true, true);
						$el[0].dispatchEvent(ev);
					} else {
						$el.click();
					}
				}
			});

			$el.bind("focus.uniform", function () {
				divTag.addClass(options.focusClass);
			}).bind("blur.uniform", function () {
				divTag.removeClass(options.focusClass);
			});

			$.uniform.noSelect(divTag);
			storeElement($el);
		}

		function doSelect($el) {
			var divTag = $('<div />'),
				spanTag = $('<span />'),
				origElemWidth = $el.width();

			if ($el.css("display") == "none" && options.autoHide) {
				divTag.hide();
			}

			divTag.addClass(options.selectClass);

			/**
			 * Thanks to @MaxEvron @kjantzer and @furkanmustafa from GitHub
			 */
			if (options.selectAutoWidth) {
				var origDivWidth = divTag.width(),
					origSpanWidth = spanTag.width(),
					adjustDiff = origSpanWidth - origElemWidth;
				divTag.width(origDivWidth - adjustDiff + 25);
				$el.width(origElemWidth + 32);
				$el.css('left', '2px');
				spanTag.width(origElemWidth);
			}

			if (options.useID && $el.attr("id")) {
				divTag.attr("id", options.idPrefix + "-" + $el.attr("id"));
			}

			var selected = $el.find(":selected:first");

			if (!selected.length) {
				selected = $el.find("option:first");
			}

			spanTag.html(selected.html());

			$el.css('opacity', 0);
			$el.wrap(divTag);
			$el.before(spanTag);

			// Redefine variables
			divTag = $el.parent("div");
			spanTag = $el.siblings("span");

			if (options.selectAutoWidth) {
				var padding = parseInt(divTag.css("paddingLeft"), 10);
				spanTag.width(origElemWidth - padding - 15);
				$el.width(origElemWidth + padding);
				$el.css('min-width', origElemWidth + padding + 'px');
				divTag.width(origElemWidth + padding);
			}

			$el.bind("change.uniform", function () {
				spanTag.html($el.find(":selected").html());
				divTag.removeClass(options.activeClass);
			}).bind("focus.uniform", function () {
				divTag.addClass(options.focusClass);
			}).bind("blur.uniform", function () {
				divTag.removeClass(options.focusClass);
				divTag.removeClass(options.activeClass);
			}).bind("mousedown.uniform touchbegin.uniform", function () {
				divTag.addClass(options.activeClass);
			}).bind("mouseup.uniform touchend.uniform", function () {
				divTag.removeClass(options.activeClass);
			}).bind("click.uniform touchend.uniform", function () {
				divTag.removeClass(options.activeClass);
			}).bind("mouseenter.uniform", function () {
				divTag.addClass(options.hoverClass);
			}).bind("mouseleave.uniform", function () {
				divTag.removeClass(options.hoverClass);
				divTag.removeClass(options.activeClass);
			}).bind("keyup.uniform", function () {
				spanTag.html($el.find(":selected").html());
			});

			// Handle disabled state
			if ($el.is(":disabled")) {
				// Box is checked by default, check our box
				divTag.addClass(options.disabledClass);
			}

			$.uniform.noSelect(spanTag);
			storeElement($el);
		}

		function doCheckbox($el) {
			var divTag = $('<div />'),
				spanTag = $('<span />');

			if ($el.css("display") == "none" && options.autoHide) {
				divTag.hide();
			}

			divTag.addClass(options.checkboxClass);

			// Assign the id of the element
			if (options.useID && $el.attr("id")) {
				divTag.attr("id", options.idPrefix + "-" + $el.attr("id"));
			}

			// Wrap with the proper elements
			$el.wrap(divTag);
			$el.wrap(spanTag);

			// Redefine variables
			spanTag = $el.parent();
			divTag = spanTag.parent();

			// Hide normal input and add focus classes
			$el.css("opacity", 0).bind("focus.uniform", function () {
				divTag.addClass(options.focusClass);
			}).bind("blur.uniform", function () {
				divTag.removeClass(options.focusClass);
			}).bind("click.uniform touchend.uniform", function () {
				if ($el.is(":checked")) {
					// An unchecked box was clicked.  Change to checked.
					$el.attr("checked", "checked");
					spanTag.addClass(options.checkedClass);
				} else {
					// A checked box was clicked.  Change to unchecked.
					$el.removeAttr("checked");
					spanTag.removeClass(options.checkedClass);
				}
			}).bind("mousedown.uniform touchbegin.uniform", function () {
				divTag.addClass(options.activeClass);
			}).bind("mouseup.uniform touchend.uniform", function () {
				divTag.removeClass(options.activeClass);
			}).bind("mouseenter.uniform", function () {
				divTag.addClass(options.hoverClass);
			}).bind("mouseleave.uniform", function () {
				divTag.removeClass(options.hoverClass);
				divTag.removeClass(options.activeClass);
			});

			// Handle defaults
			if ($el.is(":checked")) {
				// Helpful when its checked by default
				$el.attr("checked", "checked");

				// Box is checked by default, check our box
				spanTag.addClass(options.checkedClass);
			}

			// Handle disabled state
			if ($el.is(":disabled")) {
				// Box is disabled by default, disable our box
				divTag.addClass(options.disabledClass);
			}

			storeElement($el);
		}

		function doRadio($el) {
			var divTag = $('<div />'),
				spanTag = $('<span />');

			if ($el.css("display") == "none" && options.autoHide) {
				divTag.hide();
			}

			divTag.addClass(options.radioClass);

			if (options.useID && $el.attr("id")) {
				divTag.attr("id", options.idPrefix + "-" + $el.attr("id"));
			}

			// Wrap with the proper elements
			$el.wrap(divTag);
			$el.wrap(spanTag);

			// Redefine variables
			spanTag = $el.parent();
			divTag = spanTag.parent();

			// Hide normal input and add focus classes
			$el.css("opacity", 0).bind("focus.uniform", function () {
				divTag.addClass(options.focusClass);
			}).bind("blur.uniform", function () {
				divTag.removeClass(options.focusClass);
			}).bind("click.uniform touchend.uniform", function () {
				if (!$el.is(":checked")) {
					// Box was just unchecked, uncheck span
					spanTag.removeClass(options.checkedClass);
				} else {
					// Box was just checked, check span
					var classes = options.radioClass.split(" ")[0];
					$("." + classes + " span." + options.checkedClass + ":has([name='" + $el.attr('name') + "'])").removeClass(options.checkedClass);
					spanTag.addClass(options.checkedClass);
				}
			}).bind("mousedown.uniform touchend.uniform", function () {
				if (!$el.is(":disabled")) {
					divTag.addClass(options.activeClass);
				}
			}).bind("mouseup.uniform touchbegin.uniform", function () {
				divTag.removeClass(options.activeClass);
			}).bind("mouseenter.uniform touchend.uniform", function () {
				divTag.addClass(options.hoverClass);
			}).bind("mouseleave.uniform", function () {
				divTag.removeClass(options.hoverClass);
				divTag.removeClass(options.activeClass);
			});

			// Handle defaults
			if ($el.is(":checked")) {
				// Box is checked by default, check span
				spanTag.addClass(options.checkedClass);
			}
			// Handle disabled state
			if ($el.is(":disabled")) {
				// Box is checked by default, check our box
				divTag.addClass(options.disabledClass);
			}

			storeElement($el);
		}

		function doFile($el) {
			var divTag = $('<div />'),
				filenameTag = $('<span>' + options.fileDefaultText + '</span>'),
				btnTag = $('<span>' + options.fileBtnText + '</span>');

			if ($el.css("display") == "none" && options.autoHide) {
				divTag.hide();
			}

			divTag.addClass(options.fileClass);
			filenameTag.addClass(options.filenameClass);
			btnTag.addClass(options.fileBtnClass);

			if (options.useID && $el.attr("id")) {
				divTag.attr("id", options.idPrefix + "-" + $el.attr("id"));
			}

			// Wrap with the proper elements
			$el.wrap(divTag);
			$el.after(btnTag);
			$el.after(filenameTag);

			// Redefine variables
			divTag = $el.closest("div");
			filenameTag = $el.siblings("." + options.filenameClass);
			btnTag = $el.siblings("." + options.fileBtnClass);

			// Set the size
			if (!$el.attr("size")) {
				$el.attr("size", divTag.width() / 10);
			}

			// Actions
			var setFilename = function () {
					var filename = $el.val();
					if (filename === '') {
						filename = options.fileDefaultText;
					} else {
						filename = filename.split(/[\/\\]+/);
						filename = filename[(filename.length - 1)];
					}
					filenameTag.text(filename);
				};

			// Account for input saved across refreshes
			setFilename();

			$el.css("opacity", 0).bind("focus.uniform", function () {
				divTag.addClass(options.focusClass);
			}).bind("blur.uniform", function () {
				divTag.removeClass(options.focusClass);
			}).bind("mousedown.uniform", function () {
				if (!$el.is(":disabled")) {
					divTag.addClass(options.activeClass);
				}
			}).bind("mouseup.uniform", function () {
				divTag.removeClass(options.activeClass);
			}).bind("mouseenter.uniform", function () {
				divTag.addClass(options.hoverClass);
			}).bind("mouseleave.uniform", function () {
				divTag.removeClass(options.hoverClass);
				divTag.removeClass(options.activeClass);
			});

			// IE7 doesn't fire onChange until blur or second fire.
			if ($.browser.msie) {
				// IE considers browser chrome blocking I/O, so it
				// suspends tiemouts until after the file has been selected.
				$el.bind('click.uniform.ie7', function () {
					setTimeout(setFilename, 0);
				});
			} else {
				// All other browsers behave properly
				$el.bind('change.uniform', setFilename);
			}

			// Handle defaults
			if ($el.is(":disabled")) {
				// Box is checked by default, check our box
				divTag.addClass(options.disabledClass);
			}

			$.uniform.noSelect(filenameTag);
			$.uniform.noSelect(btnTag);
			storeElement($el);
		}

		$.uniform.restore = function (elem) {
			if (elem == undefined) {
				elem = $($.uniform.elements);
			}

			$(elem).each(function () {
				// Skip not uniformed elements
				if (!$(this).data('uniformed')) {
					return;
				}
				if ($(this).is(":checkbox")) {
					// Unwrap from span and div
					$(this).unwrap().unwrap();
				} else if ($(this).is("select")) {
					// Remove sibling span
					$(this).siblings("span").remove();
					// Unwrap parent div
					$(this).unwrap();
				} else if ($(this).is(":radio")) {
					// Unwrap from span and div
					$(this).unwrap().unwrap();
				} else if ($(this).is(":file")) {
					// Remove sibling spans
					$(this).siblings("span").remove();
					// Unwrap parent div
					$(this).unwrap();
				} else if ($(this).is("button, :submit, :reset, a, input[type='button']")) {
					// Unwrap from span and div
					$(this).unwrap().unwrap();
				}

				// Unbind events
				$(this).unbind(".uniform");

				// Reset inline style
				$(this).css("opacity", "1");

				// Remove item from list of uniformed elements
				var index = $.inArray($(elem), $.uniform.elements);
				$.uniform.elements.splice(index, 1);
				$(this).removeData('uniformed');
			});
		};

		function storeElement($el) {
			// Mark the element as uniformed
			$el.data('uniformed', 'true');

			// Store this element in our global array
			elem = $el.get();

			if (elem.length > 1) {
				$.each(elem, function (i, val) {
					$.uniform.elements.push(val);
				});
			} else {
				$.uniform.elements.push(elem);
			}
		}

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
					MozUserSelect: 'none'
				}); // Firefox
			});
		};

		$.uniform.update = function (elem) {
			if (elem == undefined) {
				elem = $($.uniform.elements);
			}
			// Sanitize input
			elem = $(elem);

			elem.each(function () {
				// Do to each item in the selector
				// function to reset all classes
				var $e = $(this);

				if (!$e.data('uniformed')) {
					return;
				}

				if ($e.is("select")) {
					// Element is a select
					var spanTagSel = $e.siblings("span");
					var divTag = $e.parent("div");

					divTag.removeClass(options.hoverClass + " " + options.focusClass + " " + options.activeClass);

					// Reset current selected text
					spanTagSel.html($e.find(":selected").html());

					if ($e.is(":disabled")) {
						divTag.addClass(options.disabledClass);
					} else {
						divTag.removeClass(options.disabledClass);
					}
				} else if ($e.is(":checkbox")) {
					// Element is a checkbox
					var spanTagCb = $e.closest("span");
					var divTagCb = $e.closest("div");

					divTagCb.removeClass(options.hoverClass + " " + options.focusClass + " " + options.activeClass);
					spanTagCb.removeClass(options.checkedClass);

					if ($e.is(":checked")) {
						spanTagCb.addClass(options.checkedClass);
					}

					if ($e.is(":disabled")) {
						divTagCb.addClass(options.disabledClass);
					} else {
						divTagCb.removeClass(options.disabledClass);
					}
				} else if ($e.is(":radio")) {
					// Element is a radio
					var spanTagRad = $e.closest("span");
					var divTagRad = $e.closest("div");

					divTagRad.removeClass(options.hoverClass + " " + options.focusClass + " " + options.activeClass);
					spanTagRad.removeClass(options.checkedClass);

					if ($e.is(":checked")) {
						spanTagRad.addClass(options.checkedClass);
					}

					if ($e.is(":disabled")) {
						divTagRad.addClass(options.disabledClass);
					} else {
						divTagRad.removeClass(options.disabledClass);
					}
				} else if ($e.is(":file")) {
					var divTagFile = $e.parent("div");
					var filenameTag = $e.siblings("." + options.filenameClass);
					btnTag = $e.siblings(options.fileBtnClass);

					divTagFile.removeClass(options.hoverClass + " " + options.focusClass + " " + options.activeClass);

					filenameTag.text($e.val());

					if ($e.is(":disabled")) {
						divTagFile.addClass(options.disabledClass);
					} else {
						divTagFile.removeClass(options.disabledClass);
					}
				} else if ($e.is(":submit, :reset, button, a, input[type='button']")) {
					var divTagSubmit = $e.closest("div");
					divTagSubmit.removeClass(options.hoverClass + " " + options.focusClass + " " + options.activeClass);

					if ($e.is(":disabled")) {
						divTagSubmit.addClass(options.disabledClass);
					} else {
						divTagSubmit.removeClass(options.disabledClass);
					}
				}
			});
		};

		return this.each(function () {
			var $el = $(this);

			// Avoid uniforming elements already uniformed
			if ($el.data('uniformed')) {
				return;
			}

			// IE6 can't be styled
			if (!$.support.selectOpacity) {
				return;
			}

			if ($el.is("select")) {
				// Element is a select
				if (!this.multiple) {
					// Element is not a multi-select
					var elSize = $el.attr('size');

					if (elSize == undefined || elSize <= 1) {
						doSelect($el);
					}
				}
			} else if ($el.is(":checkbox")) {
				// Element is a checkbox
				doCheckbox($el);
			} else if ($el.is(":radio")) {
				// Element is a radio
				doRadio($el);
			} else if ($el.is(":file")) {
				// Element is a file upload
				doFile($el);
			} else if ($el.is(":text, :password, input[type='email'], input[type='search'], input[type='tel'], input[type='url'], input[type='datetime'], input[type='date'], input[type='month'], input[type='week'], input[type='time'], input[type='datetime-local'], input[type='number'], input[type='color']")) {
				doInput($el);
			} else if ($el.is("textarea")) {
				doTextarea($el);
			} else if ($el.is("a, :submit, :reset, button, input[type='button']")) {
				doButton($el);
			}
		});
	};
})(jQuery);
