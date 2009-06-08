/*

Uniform v1.0
Copyright © 2009 Josh Pyles / Pixelmatrix Design LLC
http://pixelmatrixdesign.com

Requires jQuery 1.3 or newer

Much thanks to Thomas Reynolds and Buck Wilson for their help and advice on this

License:
MIT License - http://www.opensource.org/licenses/mit-license.php

Usage:

$(function(){
	
	$("select, :radio, :checkbox").uniform();
	
});

You can customize the classes that Uniform uses:

$("select, :radio, :checkbox").uniform({
	selectClass: 'mySelectClass', 
	radioClass: 'myRadioClass', 
	checkboxClass: 'myCheckboxClass', 
	checkedClass: 'myCheckedClass', 
	focusClass: 'myFocusClass'
});

Enjoy!

*/

(function($) {
  $.uniform = {
    options: {
      selectClass:   'selector',
			radioClass: 'radio',
			checkboxClass: 'checker',
			checkedClass: 'checked',
      focusClass: 'focus'
    }
  };

	if($.browser.msie && $.browser.version < 7){
		$.selectOpacity = false;
	}else{
		$.selectOpacity = true;
	}

  $.fn.uniform = function(options) {
    
		options = $.extend($.uniform.options, options);
	
		function doSelect(elem){
			
			var divTag = $('<div />'),
	  			spanTag = $('<span />');
		
			divTag.addClass(options.selectClass);
			
			spanTag.html(elem.children(":selected").text());
			
			elem.css('opacity', 0);
			elem.wrap(divTag);
			elem.before(spanTag);
			
			//redefine variables
			
			divTag = elem.parent("div");
			spanTag = elem.siblings("span");
			
			elem.change(function() {
       	spanTag.text(elem.children(":selected").text());
     	})
     	.focus(function() {
      	divTag.addClass(options.focusClass);
     	})
     	.blur(function() {
      	divTag.removeClass(options.focusClass);
     	});
		}
		
		function doCheckbox(elem){
			
			var divTag = $('<div />'),
	  			spanTag = $('<span />');
			
			divTag.addClass(options.checkboxClass);
			
			//wrap with the proper elements
			$(elem).wrap(divTag);
			$(elem).wrap(spanTag);
			
			//redefine variables
			
			spanTag = elem.parent();
			divTag = spanTag.parent();

			//hide normal input and add focus classes
			$(elem)
			.css("opacity", 0)
			.focus(function(){
				
				divTag.addClass(options.focusClass);
			})
			.blur(function(){
				
				divTag.removeClass(options.focusClass);
			})
			.click(function(){
				
				if(!$(elem).attr("checked")){	
					//box was just unchecked, uncheck span
					spanTag.removeClass(options.checkedClass);	
				}else{
					//box was just checked, check span
					spanTag.addClass(options.checkedClass);
				}
			});

			//handle defaults
			if($(elem).attr("checked")){
				//box is checked by default, check our box
				spanTag.addClass(options.checkedClass);	
			}
		}
		
		function doRadio(elem){
			
			var divTag = $('<div />'),
	  			spanTag = $('<span />');
			
			divTag.addClass(options.radioClass);
			
			//wrap with the proper elements
			$(elem).wrap(divTag);
			$(elem).wrap(spanTag);

			//redefine variables
			
			spanTag = elem.parent();
			divTag = spanTag.parent();

			//hide normal input and add focus classes
			$(elem)
			.css("opacity", 0)
			.focus(function(){
				divTag.addClass(options.focusClass);
			})
			.blur(function(){
				divTag.removeClass(options.focusClass);
			})
			.click(function(){
				if(!$(elem).attr("checked")){
					//box was just unchecked, uncheck span
					spanTag.removeClass(options.checkedClass);	
				}else{
					//box was just checked, check span
					$("."+options.radioClass+" span."+options.checkedClass).removeClass(options.checkedClass);
					spanTag.addClass(options.checkedClass);
				}
			});

			//handle defaults
			if($(elem).attr("checked")){
				//box is checked by default, check span
				spanTag.addClass(options.checkedClass);	
			}
		}
		
    return this.each(function() {
			if($.selectOpacity){
				var elem = $(this);

				if(elem.is("select")){
					//element is a select
					doSelect(elem);

				}else if(elem.is(":checkbox")){
					//element is a checkbox
					doCheckbox(elem);

				}else if(elem.is(":radio")){
					//element is a radio
					doRadio(elem);
				}
			}
    });
  };
})(jQuery);