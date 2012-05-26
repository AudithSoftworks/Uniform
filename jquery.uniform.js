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

(function($) {
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
			autoHide: true
		},
		elements: []
	};
	
	$.support.selectOpacity = !($.browser.msie && $.browser.version < 7);
	
	$.uniform.restore = function(elem) {
		var el = elem || $($.uniform.elements);
	
		el.each(function(){
			var self = $(this);
			
			if (self.is(':button, :submit, :reset')) {
				self.parent().html(self);
			}
			if (self.is(':checkbox, :radio, :button, :submit, :reset, a')) {
				self.unwrap().unwrap();
			}
			if (self.is('select, :file')) {
				self.unwrap().siblings('span').remove();
			}
			
			self.removeClass(self.attr('type') + ' uniform');
			
			//unbind events and reset inline style
			self.unbind('.uniform').css('opacity', '1');
			
			//remove item from list of uniformed elements
			var index = $.inArray(el, $.uniform.elements);
			$.uniform.elements.splice(index, 1);
		});
		
		return this;
	};
	
	//noSelect v1.0
	$.uniform.noSelect = function(el) {
		function f() {
			return false;
		};
		
		el.each(function(){
			this.onselectstart = this.ondragstart = f; // Webkit & IE
			
			$(this)
				.mousedown(f) // Webkit & Opera
				.css({ MozUserSelect: 'none' }); // Firefox
		});
		
		return this;
	};

	$.uniform.update = function(elem) {
		var el = elem || $($.uniform.elements);
		this.restore(el);
		el.uniform();
	};
	
	$.fn.uniform = function(options) {
		if (typeof options === 'string') {
			if (options in $.uniform) {
				return $.uniform[options](this);
			}
			return false;
		}
	
		options = $.extend($.uniform.options, options);

		var el = this;
		//code for specifying a reset button
		if (options.resetSelector) {
			$(options.resetSelector).mouseup(function(){
				function resetThis() {
					$.uniform.update(el);
				}
				setTimeout(resetThis, 10);
			});
		}
		
		var doInput = function(el) {
			storeElement(el.addClass(el.attr('type')));
		}
		
		var doTextarea = function(el) {
			storeElement(el.addClass('uniform'));
		}
		
		var doButton = function(el) {
			var divTag = $('<div>'),
			    spanTag = $('<span>');
			
			divTag.addClass(options.buttonClass);
			
			if (options.useID && el.attr('id')) {
				divTag.attr('id', options.idPrefix + '-' + el.attr('id'));
			}
			
			var btnText = el.val() || el.text() || el.is(':reset') && 'Reset' || el.is(':submit') && 'Submit' || '';
			
			spanTag.html(btnText);
			
			el.css('opacity', 0).wrap(divTag).wrap(spanTag);
			
			//redefine variables
			divTag = el.closest('div');
			spanTag = el.closest('span');
			
			if (el.is(':disabled')) {
				divTag.addClass(options.disabledClass);
			}
			
			divTag.bind({
				'mouseenter.uniform': function(){
					divTag.addClass(options.hoverClass);
				},
				'mouseleave.uniform': function(){
					divTag.removeClass(options.hoverClass + ' ' + options.activeClass);
				},
				'mousedown.uniform touchbegin.uniform': function(){
					divTag.addClass(options.activeClass);
				},
				'mouseup.uniform touchend.uniform': function(){
					divTag.removeClass(options.activeClass);
				},
				'click.uniform touchend.uniform': function(e){
					if ($(e.target).is('span, div')) {
						el.trigger('click');
					}
				}
			});
			
			el.bind({
				'focus.uniform': function(){
					divTag.addClass(options.focusClass);
				},
				'blur.uniform': function(){
					divTag.removeClass(options.focusClass);
				}
			});
			
			$.uniform.noSelect(divTag);
			
			storeElement(el);
		}

		var doSelect = function(el){
			var divTag = $('<div>'),
			    spanTag = $('<span>');
			
			// It make no sense. !el.css('display') always return false. False never will be equal to 'none'.
			// What the purpose of autoHide?
			if (!el.css('display') == 'none' && options.autoHide) {
				divTag.hide();
			}

			divTag.addClass(options.selectClass);

			if (options.useID && el.attr('id')) {
				divTag.attr('id', options.idPrefix + '-' + el.attr('id'));
			}
			
			spanTag.html(el.find(':selected').text() || el.find('option:first').text());
			
			el.css('opacity', 0).wrap(divTag).before(spanTag);

			//redefine variables
			divTag = el.parent();
			spanTag = el.siblings('span');

			el.bind({
				'change.uniform': function(){
					spanTag.text(el.find(':selected').text());
					divTag.removeClass(options.activeClass);
				},
				'focus.uniform': function(){
					divTag.addClass(options.focusClass);
				},
				'blur.uniform': function(){
					divTag.removeClass(options.focusClass + ' ' + options.activeClass);
				},
				'mousedown.uniform touchbegin.uniform': function(){
					divTag.addClass(options.activeClass);
				},
				'mouseup.uniform touchend.uniform': function(){
					divTag.removeClass(options.activeClass);
				},
				'click.uniform touchend.uniform': function(){
					divTag.removeClass(options.activeClass);
				},
				'mouseenter.uniform': function(){
					divTag.addClass(options.hoverClass);
				},
				'mouseleave.uniform': function(){
					divTag.removeClass(options.hoverClass + ' ' + options.activeClass);
				},
				'keyup.uniform': function(){
					spanTag.text(el.find(':selected').text());
				}
			});
			
			//handle disabled state
			if (el.attr('disabled')) {
				//box is checked by default, check our box
				divTag.addClass(options.disabledClass);
			}
			
			$.uniform.noSelect(spanTag);
			
			storeElement(el);
		}

		var doCheckbox = function(el) {
			var divTag = $('<div>'),
			    spanTag = $('<span>');
			
			// It make no sense. !el.css('display') always return false. False never will be equal to 'none'.
			// What the purpose of autoHide?
			if (!el.css('display') == 'none' && options.autoHide) {
				divTag.hide();
			}
			
			divTag.addClass(options.checkboxClass);

			//assign the id of the element
			if (options.useID && el.attr('id')) {
				divTag.attr('id', options.idPrefix + '-' + el.attr('id'));
			}

			//wrap with the proper elements
			el.wrap(divTag).wrap(spanTag);

			//redefine variables
			spanTag = el.parent();
			divTag = spanTag.parent();

			//hide normal input and add focus classes
			el.css('opacity', 0).bind({
				'focus.uniform': function(){
					divTag.addClass(options.focusClass);
				},
				'blur.uniform': function(){
					divTag.removeClass(options.focusClass);
				},
				'click.uniform touchend.uniform': function(){
					var method = el.attr('checked') ? 'add' : 'remove';
					spanTag[method + 'Class'](options.checkedClass);
				},
				'mousedown.uniform touchbegin.uniform': function(){
					divTag.addClass(options.activeClass);
				},
				'mouseup.uniform touchend.uniform': function(){
					divTag.removeClass(options.activeClass);
				},
				'mouseenter.uniform': function(){
					divTag.addClass(options.hoverClass);
				},
				'mouseleave.uniform': function(){
					divTag.removeClass(options.hoverClass + ' ' + options.activeClass);
				}
			});
			
			//handle defaults
			if (el.attr('checked')) {
				//box is checked by default, check our box
				spanTag.addClass(options.checkedClass);
			}

			//handle disabled state
			if (el.attr('disabled')) {
				//box is checked by default, check our box
				divTag.addClass(options.disabledClass);
			}

			storeElement(el);
		}

		var doRadio = function(el) {
			var divTag = $('<div>'),
			    spanTag = $('<span>');
					
			// It make no sense. !el.css('display') always return false. False never will be equal to 'none'.
			// What the purpose of autoHide?
			if (!el.css('display') == 'none' && options.autoHide) {
				divTag.hide();
			}

			divTag.addClass(options.radioClass);

			if (options.useID && el.attr('id')) {
				divTag.attr('id', options.idPrefix + '-' + el.attr('id'));
			}

			//wrap with the proper elements
			el.wrap(divTag).wrap(spanTag);

			//redefine variables
			spanTag = el.parent();
			divTag = spanTag.parent();

			//hide normal input and add focus classes
			el.css('opacity', 0).bind({
				'focus.uniform': function(){
					divTag.addClass(options.focusClass);
				},
				'blur.uniform': function(){
					divTag.removeClass(options.focusClass);
				},
				'click.uniform touchend.uniform': function(){
					if (!el.attr('checked')) {
						//box was just unchecked, uncheck span
						spanTag.removeClass(options.checkedClass);
					} else {
						//box was just checked, check span
						$('.' + options.radioClass.replace(' ', '.') + ' span.' + options.checkedClass + ':has([name=' + el.attr('name') + '])').removeClass(options.checkedClass);
						spanTag.addClass(options.checkedClass);
					}
				},
				'mousedown.uniform touchend.uniform': function(){
					if (!el.is(':disabled')) {
						divTag.addClass(options.activeClass);
					}
				},
				'mouseup.uniform touchbegin.uniform': function(){
					divTag.removeClass(options.activeClass);
				},
				'mouseenter.uniform touchend.uniform': function(){
					divTag.addClass(options.hoverClass);
				},
				'mouseleave.uniform': function(){
					divTag.removeClass(options.hoverClass + ' ' + options.activeClass);
				}
			});

			//handle defaults
			if (el.attr('checked')) {
				//box is checked by default, check span
				spanTag.addClass(options.checkedClass);
			}
			//handle disabled state
			if (el.attr('disabled')) {
				//box is checked by default, check our box
				divTag.addClass(options.disabledClass);
			}

			storeElement(el);
		}

		var doFile = function(el) {
			var divTag = $('<div>'),
			    filenameTag = $('<span>', {text: options.fileDefaultText}),
			    btnTag = $('<span>', {text: options.fileBtnText});
			
			// It make no sense. !el.css('display') always return false. False never will be equal to 'none'.
			// What the purpose of autoHide?
			if (!el.css('display') == 'none' && options.autoHide) {
				divTag.hide();
			}

			divTag.addClass(options.fileClass);
			filenameTag.addClass(options.filenameClass);
			btnTag.addClass(options.fileBtnClass);

			if (options.useID && el.attr('id')) {
				divTag.attr('id', options.idPrefix + '-' + el.attr('id'));
			}

			//wrap with the proper elements
			el.wrap(divTag).after(btnTag).after(filenameTag);

			//redefine variables
			divTag = el.parent();
			filenameTag = el.siblings('.' + options.filenameClass);
			btnTag = el.siblings('.' + options.fileBtnClass);

			//set the size
			if (!el.attr('size')) {
				var divWidth = divTag.width();
				el.attr('size', divWidth / 10);
			}

			//actions
			var setFilename = function(){
				var filename = el.val().split(/[\/\\]+/);
				filename = filename && filename[filename.length - 1] || options.fileDefaultText;
				
				filenameTag.text(filename);
			};

			// Account for input saved across refreshes
			setFilename();

			el.css('opacity', 0).bind({
				'focus.uniform': function(){
					divTag.addClass(options.focusClass);
				},
				'blur.uniform': function(){
					divTag.removeClass(options.focusClass);
				},
				'mousedown.uniform': function(){
					if (!el.is(':disabled')) {
						divTag.addClass(options.activeClass);
					}
				},
				'mouseup.uniform': function(){
					divTag.removeClass(options.activeClass);
				},
				'mouseenter.uniform': function(){
					divTag.addClass(options.hoverClass);
				},
				'mouseleave.uniform': function(){
					divTag.removeClass(options.hoverClass + ' ' + options.activeClass);
				}
			});

			// IE7 doesn't fire onChange until blur or second fire.
			if ($.browser.msie) {
				// IE considers browser chrome blocking I/O, so it
				// suspends tiemouts until after the file has been selected.
				el.bind('click.uniform.ie7', function(){
					setTimeout(setFilename, 0);
				});
			} else {
				// All other browsers behave properly
				el.bind('change.uniform', setFilename);
			}

			//handle defaults
			if (el.attr('disabled')) {
				//box is checked by default, check our box
				divTag.addClass(options.disabledClass);
			}
			
			$.uniform.noSelect(filenameTag);
			$.uniform.noSelect(btnTag);
			
			storeElement(el);
		}

		var storeElement = function(elem) {
			//store this element in our global array
			$.each(elem, function(i, val) {
				$.uniform.elements.push(val);
			});
		}

		return this.each(function(){
			if ($.support.selectOpacity) {
				var elem = $(this);

				if (elem.is('select') && !elem.attr('multiple') && !elem.attr('size') || elem.attr('size') <= 1) {
					//element is not a multi-select
					doSelect(elem);
				} else if (elem.is(':checkbox')) {
					//element is a checkbox
					doCheckbox(elem);
				} else if (elem.is(':radio')) {
					//element is a radio
					doRadio(elem);
				} else if (elem.is(':file')) {
					//element is a file upload
					doFile(elem);
				} else if (elem.is(':text, :password, input[type=email]')) {
					doInput(elem);
				} else if (elem.is('textarea')) {
					doTextarea(elem);
				} else if (elem.is('a') || elem.is(':submit') || elem.is(':reset') || elem.is('button') || elem.is('input[type=button]')) {
					doButton(elem);
				}
					
			}
		});
	};
})(jQuery);