/*

Uniform v1.7.5
Copyright © 2009 Josh Pyles / Pixelmatrix Design LLC
http://pixelmatrixdesign.com

Requires jQuery 1.4 or newer

Much thanks to Thomas Reynolds and Buck Wilson for their help and advice on this

Disabling text selection is made possible by Mathias Bynens <http://mathiasbynens.be/>
and his noSelect plugin. <http://github.com/mathiasbynens/noSelect-jQuery-Plugin>

Also, thanks to David Kaneda and Eugene Bond for their contributions to the plugin

License:
MIT License - http://www.opensource.org/licenses/mit-license.php

Enjoy!

*/
/*jslint browser:true*/
/*global jQuery*/
(function ($) {

  'use strict';

	$.uniform = {
		defaults: {
			selectClass:   'selector',
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
			autoHide: true
		},
		elements: []
	};

	if ($.browser.msie && $.browser.version < 7) {
		$.support.selectOpacity = false;
	} else {
		$.support.selectOpacity = true;
	}

	$.fn.uniform = function (options) {

		// moved this to top of function to prevent 'used before defined...'
		function storeElement(elem) {
			//store this element in our global array
			elem = $(elem).get();
			if (elem.length > 1) {
				$.each(elem, function (i, val) {
					$.uniform.elements.push(val);
				});
			} else {
				$.uniform.elements.push(elem);
			}
		}

		function doInput(elem) {
			var $el = $(elem);
			$el.addClass($el.attr('type'));
			storeElement(elem);
		}

		function doTextarea(elem) {
			$(elem).addClass('uniform');
			storeElement(elem);
		}

		function doButton(elem) {
			var $el = $(elem),
				$div = $('<div>'),
				$span = $('<span>'),
				btnText = null;

			$div.addClass(options.buttonClass);

			if (options.useID && $el.attr('id') !== '') {
				$div.attr('id', options.idPrefix + '-' + $el.attr('id'));
			}

			if ($el.is('a') || $el.is('button')) {
				btnText = $el.text();
			} else if ($el.is(':submit') || $el.is(':reset') || $el.is('input[type=button]')) {
				btnText = $el.attr('value');
			}

			btnText = btnText === '' ? $el.is(':reset') ? 'Reset' : 'Submit' : btnText;

			$span.html(btnText);

			$el.css('opacity', 0);
			$el.wrap($div);
			$el.wrap($span);

			//redefine variables
			$div = $el.closest('div');
			$span = $el.closest('span');

			if ($el.is(':disabled')) {
				$div.addClass(options.disabledClass);
			}

			$div.bind({
				'mouseenter.uniform': function () {
					$div.addClass(options.hoverClass);
				},
				'mouseleave.uniform': function () {
					$div.removeClass(options.hoverClass);
					$div.removeClass(options.activeClass);
				},
				'mousedown.uniform touchbegin.uniform': function () {
					$div.addClass(options.activeClass);
				},
				'mouseup.uniform touchend.uniform': function () {
					$div.removeClass(options.activeClass);
				},
				'click.uniform touchend.uniform': function (e) {
					if ($(e.target).is('span') || $(e.target).is('div')) {
						if (elem[0].dispatchEvent) {
							var ev = document.createEvent('MouseEvents');
							ev.initEvent('click', true, true);
							elem[0].dispatchEvent(ev);
						} else {
							elem[0].click();
						}
					}
				}
			});

			elem.bind({
				'focus.uniform': function () {
					$div.addClass(options.focusClass);
				},
				'blur.uniform': function () {
					$div.removeClass(options.focusClass);
				}
			});

			$.uniform.noSelect($div);
			storeElement(elem);

		}

		function doSelect(elem) {
			var $el = $(elem),
				$div = $('<div />'),
				$span = $('<span />'),
				selected = elem.find(':selected:first');

			// I don't know what was attempted to be done here.  The `!$el.css('display') == 'none'`
			// makes absolutely no sense -- as `!$el.css('display')` will *ALWAYS* return false.  However,
			// deleting these 3 lines of code cause the plugin to perform exactly the same way.
			// if(!$el.css("display") == "none" && options.autoHide){
			// divTag.hide();
			// }

			$div.addClass(options.selectClass);

			if (options.useID && elem.attr('id') !== '') {
				$div.attr('id', options.idPrefix + '-' + elem.attr('id'));
			}

			if (selected.length === 0) {
				selected = elem.find('option:first');
			}
			$span.html(selected.html());

			elem.css('opacity', 0);
			elem.wrap($div);
			elem.before($span);

			//redefine variables
			$div = elem.parent('div');
			$span = elem.siblings('span');

			elem.bind({
				'change.uniform': function () {
					$span.text(elem.find(':selected').html());
					$div.removeClass(options.activeClass);
				},
				'focus.uniform': function () {
					$div.addClass(options.focusClass);
				},
				'blur.uniform': function () {
					$div.removeClass(options.focusClass);
					$div.removeClass(options.activeClass);
				},
				'mousedown.uniform touchbegin.uniform': function () {
					$div.addClass(options.activeClass);
				},
				'mouseup.uniform touchend.uniform': function () {
					$div.removeClass(options.activeClass);
				},
				'click.uniform touchend.uniform': function () {
					$div.removeClass(options.activeClass);
				},
				'mouseenter.uniform': function () {
					$div.addClass(options.hoverClass);
				},
				'mouseleave.uniform': function () {
					$div.removeClass(options.hoverClass);
					$div.removeClass(options.activeClass);
				},
				'keyup.uniform': function () {
					$span.text(elem.find(':selected').html());
				}
			});

			//handle disabled state
			if ($(elem).attr('disabled')) {
				//box is checked by default, check our box
				$div.addClass(options.disabledClass);
			}
			$.uniform.noSelect($span);

			storeElement(elem);

		}

		function doCheckbox(elem) {
			var $el = $(elem),
				$div = $('<div />'),
				$span = $('<span />');

			// I don't know what was attempted to be done here.  The `!$el.css('display') == 'none'`
			// makes absolutely no sense -- as `!$el.css('display')` will *ALWAYS* return false.  However,
			// deleting these 3 lines of code cause the plugin to perform exactly the same way.
			// if(!$el.css("display") == "none" && options.autoHide){
			// divTag.hide();
			// }

			$div.addClass(options.checkboxClass);

			//assign the id of the element
			if (options.useID && elem.attr('id') !== '') {
				$div.attr('id', options.idPrefix + '-' + elem.attr('id'));
			}

			//wrap with the proper elements
			$(elem).wrap($div);
			$(elem).wrap($span);

			//redefine variables
			$span = elem.parent();
			$div = $span.parent();

			//hide normal input and add focus classes
			$(elem)
				.css('opacity', 0)
				.bind({
					'focus.uniform': function () {
						$div.addClass(options.focusClass);
					},
					'blur.uniform': function () {
						$div.removeClass(options.focusClass);
					},
					'click.uniform touchend.uniform': function () {
						if (!$(elem).attr('checked')) {
							//box was just unchecked, uncheck span
							$span.removeClass(options.checkedClass);
						} else {
							//box was just checked, check span.
							$span.addClass(options.checkedClass);
						}
					},
					'mousedown.uniform touchbegin.uniform': function () {
						$div.addClass(options.activeClass);
					},
					'mouseup.uniform touchend.uniform': function () {
						$div.removeClass(options.activeClass);
					},
					'mouseenter.uniform': function () {
						$div.addClass(options.hoverClass);
					},
					'mouseleave.uniform': function () {
						$div.removeClass(options.hoverClass);
						$div.removeClass(options.activeClass);
					}
				});

			//handle defaults
			if ($(elem).attr('checked')) {
				//box is checked by default, check our box
				$span.addClass(options.checkedClass);
			}

			//handle disabled state
			if ($(elem).attr('disabled')) {
				//box is checked by default, check our box
				$div.addClass(options.disabledClass);
			}

			storeElement(elem);
		}

		function doRadio(elem) {
			var $el = $(elem),
				$div = $('<div />'),
				$span = $('<span />');


			// I don't know what was attempted to be done here.  The `!$el.css('display') == 'none'`
			// makes absolutely no sense -- as `!$el.css('display')` will *ALWAYS* return false.  However,
			// deleting these 3 lines of code cause the plugin to perform exactly the same way.
			// if(!$el.css("display") == "none" && options.autoHide){
			// divTag.hide();
			// }

			$div.addClass(options.radioClass);

			if (options.useID && elem.attr('id') !== '') {
				$div.attr('id', options.idPrefix + '-' + elem.attr('id'));
			}

			//wrap with the proper elements
			$(elem).wrap($div);
			$(elem).wrap($span);

			//redefine variables
			$span = elem.parent();
			$div = $span.parent();

			//hide normal input and add focus classes
			$(elem)
				.css('opacity', 0)
				.bind({
					'focus.uniform': function () {
						$div.addClass(options.focusClass);
					},
					'blur.uniform': function () {
						$div.removeClass(options.focusClass);
					},
					'click.uniform touchend.uniform': function () {
						var classes = options.radioClass.split(' ')[0];

						if (!$(elem).attr('checked')) {
							//box was just unchecked, uncheck span
							$span.removeClass(options.checkedClass);
						} else {
							//box was just checked, check span
							$('.' + classes + ' span.' + options.checkedClass + ':has([name="' + $(elem).attr('name') + '"])').removeClass(options.checkedClass);
							$span.addClass(options.checkedClass);
						}
					},
					'mousedown.uniform touchend.uniform': function () {
						if (!$(elem).is(':disabled')) {
							$div.addClass(options.activeClass);
						}
					},
					'mouseup.uniform touchbegin.uniform': function () {
						$div.removeClass(options.activeClass);
					},
					'mouseenter.uniform touchend.uniform': function () {
						$div.addClass(options.hoverClass);
					},
					'mouseleave.uniform': function () {
						$div.removeClass(options.hoverClass);
						$div.removeClass(options.activeClass);
					}
				});

			//handle defaults
			if ($(elem).attr('checked')) {
				//box is checked by default, check span
				$span.addClass(options.checkedClass);
			}
			//handle disabled state
			if ($(elem).attr('disabled')) {
				//box is checked by default, check our box
				$div.addClass(options.disabledClass);
			}

			storeElement(elem);

		}

		function doFile(elem) {
			//sanitize input
			var $el = $(elem),
				$div = $('<div />'),
				filenameTag = $('<span>' + options.fileDefaultText + '</span>'),
				btnTag = $('<span>' + options.fileBtnText + '</span>'),
				divWidth = null;

			// actions
			function setFilename() {
				var filename = $el.val();
				if (filename === '') {
					filename = options.fileDefaultText;
				} else {
					filename = filename.split(/[\/\\]+/);
					filename = filename[(filename.length - 1)];
				}
				filenameTag.text(filename);
			}


			// I don't know what was attempted to be done here.  The `!$el.css('display') == 'none'`
			// makes absolutely no sense -- as `!$el.css('display')` will *ALWAYS* return false.  However,
			// deleting these 3 lines of code cause the plugin to perform exactly the same way.
			// if(!$el.css("display") == "none" && options.autoHide){
			// divTag.hide();
			// }

			$div.addClass(options.fileClass);
			filenameTag.addClass(options.filenameClass);
			btnTag.addClass(options.fileBtnClass);

			if (options.useID && $el.attr('id') !== '') {
				$div.attr('id', options.idPrefix + '-' + $el.attr('id'));
			}

			//wrap with the proper elements
			$el.wrap($div);
			$el.after(btnTag);
			$el.after(filenameTag);

			//redefine variables
			$div = $el.closest('div');
			filenameTag = $el.siblings('.' + options.filenameClass);
			btnTag = $el.siblings('.' + options.fileBtnClass);

			//set the size
			if (!$el.attr('size')) {
				divWidth = $div.width();
				$el.attr('size', divWidth / 10);
			}

			// Account for input saved across refreshes
			setFilename();

			$el
				.css('opacity', 0)
				.bind({
					'focus.uniform': function () {
						$div.addClass(options.focusClass);
					},
					'blur.uniform': function () {
						$div.removeClass(options.focusClass);
					},
					'mousedown.uniform': function () {
						if (!$(elem).is(':disabled')) {
							$div.addClass(options.activeClass);
						}
					},
					'mouseup.uniform': function () {
						$div.removeClass(options.activeClass);
					},
					'mouseenter.uniform': function () {
						$div.addClass(options.hoverClass);
					},
					'mouseleave.uniform': function () {
						$div.removeClass(options.hoverClass);
						$div.removeClass(options.activeClass);
					}
				});

			// IE7 doesn't fire onChange until blur or second fire.
			if ($.browser.msie) {
				// IE considers browser chrome blocking I/O, so it
				// suspends tiemouts until after the file has been selected.
				$el.bind('click.uniform.ie7', function () {
					window.setTimeout(setFilename, 0);
				});
			} else {
				// All other browsers behave properly
				$el.bind('change.uniform', setFilename);
			}

			//handle defaults
			if ($el.attr('disabled')) {
				//box is checked by default, check our box
				$div.addClass(options.disabledClass);
			}

			$.uniform.noSelect(filenameTag);
			$.uniform.noSelect(btnTag);

			storeElement(elem);

		}

		$.uniform.restore = function (elem) {
			if (elem === undefined) {
				elem = $($.uniform.elements);
			}

			$(elem).each(function () {
				var index = null;

				if ($(this).is(':checkbox')) {
					//unwrap from span and div
					$(this).unwrap().unwrap();
				} else if ($(this).is('select')) {
					//remove sibling span
					$(this).siblings('span').remove();
					//unwrap parent div
					$(this).unwrap();
				} else if ($(this).is(':radio')) {
					//unwrap from span and div
					$(this).unwrap().unwrap();
				} else if ($(this).is(':file')) {
					//remove sibling spans
					$(this).siblings('span').remove();
					//unwrap parent div
					$(this).unwrap();
				} else if ($(this).is('button, :submit, :reset, a, input[type="button"]')) {
					//unwrap from span and div
					$(this).unwrap().unwrap();
				}

				//unbind events
				$(this).unbind('.uniform');

				//reset inline style
				$(this).css('opacity', 1);

				//remove item from list of uniformed elements
				index = $.inArray($(elem), $.uniform.elements);
				$.uniform.elements.splice(index, 1);
			});
		};

		//noSelect v1.0
		$.uniform.noSelect = function (elem) {
			function f() {
				return false;
			}
			$(elem).each(function () {
				this.onselectstart = this.ondragstart = f; // Webkit & IE
				$(this)
					.mousedown(f) // Webkit & Opera
					.css({ MozUserSelect: 'none' }); // Firefox
			});
		};

		$.uniform.update = function (elem) {
			if (elem === undefined) {
				elem = $($.uniform.elements);
			}
			//sanitize input
			elem = $(elem);

			elem.each(function () {
				//do to each item in the selector
				//function to reset all classes
				var $e = $(this),
					$span = null,
					$div = null,
					$filename = null,
					$button = null;

				if ($e.is('select')) {
					//element is a select
					$span = $e.siblings('span');
					$div = $e.parent('div');

					$div.removeClass(options.hoverClass + ' ' + options.focusClass + ' ' + options.activeClass);

					//reset current selected text
					$span.html($e.find(':selected').html());

					if ($e.is(':disabled')) {
						$div.addClass(options.disabledClass);
					} else {
						$div.removeClass(options.disabledClass);
					}

				} else if ($e.is(':checkbox')) {
					//element is a checkbox
					$span = $e.closest('span');
					$div = $e.closest('div');

					$div.removeClass(options.hoverClass + ' ' + options.focusClass + ' ' + options.activeClass);
					$span.removeClass(options.checkedClass);

					if ($e.is(':checked')) {
						$span.addClass(options.checkedClass);
					}
					if ($e.is(':disabled')) {
						$div.addClass(options.disabledClass);
					} else {
						$div.removeClass(options.disabledClass);
					}

				} else if ($e.is(':radio')) {
					//element is a radio
					$span = $e.closest('span');
					$div = $e.closest('div');

					$div.removeClass(options.hoverClass + ' ' + options.focusClass + ' ' + options.activeClass);
					$span.removeClass(options.checkedClass);

					if ($e.is(':checked')) {
						$span.addClass(options.checkedClass);
					}

					if ($e.is(':disabled')) {
						$div.addClass(options.disabledClass);
					} else {
						$div.removeClass(options.disabledClass);
					}
				} else if ($e.is(':file')) {
					$div = $e.parent('div');
					$filename = $e.siblings(options.filenameClass);
					$button = $e.siblings(options.fileBtnClass);

					$div.removeClass(options.hoverClass + ' ' + options.focusClass + ' ' + options.activeClass);

					$filename.text($e.val());

					if ($e.is(':disabled')) {
						$div.addClass(options.disabledClass);
					} else {
						$div.removeClass(options.disabledClass);
					}
				} else if ($e.is(':submit') || $e.is(':reset') || $e.is('button') || $e.is('a') || elem.is('input[type=button]')) {
					$div = $e.closest('div');
					$div.removeClass(options.hoverClass + ' ' + options.focusClass + ' ' + options.activeClass);

					if ($e.is(':disabled')) {
						$div.addClass(options.disabledClass);
					} else {
						$div.removeClass(options.disabledClass);
					}

				}

			});
		};

		options = $.extend({}, $.uniform.defaults, options);

		var el = this;
		//code for specifying a reset button
		if (options.resetSelector !== false) {
			$(options.resetSelector).mouseup(function () {
				function resetThis() {
					$.uniform.update(el);
				}
				window.setTimeout(resetThis, 10);
			});
		}

		return this.each(function () {
			if ($.support.selectOpacity) {
				var $element = $(this);

				if ($element.is('select')) {
					//element is a select
					if ($element.attr('multiple') !== true) {
						//element is not a multi-select
						if ($element.attr('size') === undefined || $element.attr('size') <= 1) {
							doSelect($element);
						}
					}

				} else if ($element.is(':checkbox')) {
					//element is a checkbox
					doCheckbox($element);

				} else if ($element.is(':radio')) {
					//element is a radio
					doRadio($element);

				} else if ($element.is(':file')) {
					//element is a file upload
					doFile($element);

				} else if ($element.is(':text, :password, input[type="email"]')) {
					doInput($element);

				} else if ($element.is('textarea')) {
					doTextarea($element);

				} else if ($element.is('a') || $element.is(':submit') || $element.is(':reset') || $element.is('button') || $element.is('input[type=button]')) {
					doButton($element);
				}

			}
		});
	};
}(jQuery));
