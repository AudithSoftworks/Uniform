Uniform
=======

Sexy form elements with jQuery. Now with HTML5 attributes

Version 1.8 (not yet released)

Works well with jQuery 1.6+.  We've received patches to make it work with older versions of jQuery, back through version 1.3.

Licensed under the [MIT License](http://www.opensource.org/licenses/mit-license.php)

Installation
------------

Installation of Uniform is quite simple. First, make sure you have jQuery 1.4+ installed. Then you’ll want to link to the jquery.uniform.js file and uniform.default.css in the head area of your page:

    <script src="jquery.uniform.js" type="text/javascript"></script>
    <link rel="stylesheet" href="uniform.default.css" type="text/css"
    media="screen" charset="utf-8" />

Basic usage
-----------

Using Uniform can be quite easy as well. Simply call:

    $("select").uniform();

To "uniform" all possible form elements, just do something like this.  Things that can't get styled appropriately will be skipped by Uniform.

    $("select, input, a.button, button").uniform();

A complete tag in the HEAD section of your site can therefore look like this:

    <script type='text/javascript'>
      $(function(){
        $("select, input:checkbox, input:radio, input:file").uniform();
      });
    </script>

Remember that it is essential to first follow the steps in the Installation section, above.

Extra parameters
----------------

You can pass in extra parameters to control certain aspects of Uniform. To pass in parameters, use syntax like this:

    $("select").uniform({
      param1: value,
      param2: value,
      param3: value
    });

Alternately, you can specify global defaults by using the `defaults` property.

    $.uniform.defaults.checkedClass = "uniformCheckedClass";
	$.uniform.defaults.fileBtnText = "Pick a file";

### activeClass (string)

*Default:* "active"

Sets the class given to elements when they are active (pressed).

    $("select").uniform({activeClass: 'myActiveClass'});

### autoHide (boolean)

*Default:* true

If this option is set to true, Uniform will hide the new elements if the existing elements are currently hidden using `display: none`.

If you want to show a select or checkbox you'll need to show the new Uniform div instead of the child element.

### buttonClass (string)

*Default:* "button"

Sets the class given to a button that's been uniformed

    $("input[type=button]").uniform({buttonClass: 'myBtnClass'});

### checkboxClass (string)

*Default:* "checker"

Sets the class given to the wrapper div for checkbox elements.

    $(":checkbox").uniform({checkboxClass: 'myCheckClass'});

### checkedClass (string)

*Default:* "checked"

Sets the class given to elements when they are checked (radios and checkboxes).

    $(":radio, :checkbox").uniform({checkedClass: 'myCheckedClass'});

### disabledClass (string)

*Default:* "disabled"

Sets the class given to elements when they are disabled.

    $("select").uniform({disabledClass: 'myDisabledClass'});

### fileBtnClass (string)

*Default:* "action"

Sets the class given to div inside a file upload container that acts as the "Choose file" button.

    $(":file").uniform({fileBtnClass: 'myFileBtnClass'});

### fileBtnText (string)

*Default:* "Choose File"

Sets the text written on the action button inside a file upload input.

    $(":file").uniform({fileBtnText: 'Choose&hellip;'});

### fileClass (string)

*Default:* "uploader"

Sets the class given to the wrapper div for file upload elements.

    $(":file").uniform({fileClass: 'myFileClass'});

### fileDefaultText (string)

*Default:* "No file selected"

Sets the text written in the filename div of a file upload input when there is no file selected.

    $(":file").uniform({fileDefaultText: 'Select a file please'});

### filenameClass (string)

*Default:* "filename"

Sets the class given to div inside a file upload container that spits out the filename.

    $(":file").uniform({filenameClass: 'myFilenameClass'});

### focusClass (string)

*Default:* "focus"

Sets the class given to elements when they are focused.

    $("select").uniform({focusClass: 'myFocusClass'});

### hoverClass (string)

*Default:* "hover"

Sets the class given to elements when they are currently hovered.

    $("select").uniform({hoverClass: 'myHoverClass'});

### idPrefix (string)

*Default:* "uniform"

If useID is set to true, this string is prefixed to element ID’s and attached to the container div of each uniformed element. If you have a checkbox with the ID of "remember-me" the container div would have the ID "uniform-remember-me".

    $("select").uniform({idPrefix: 'container'});

### radioClass (string)

*Default:* "radio"

Sets the class given to the wrapper div for radio elements.

    $(":radio").uniform({radioClass: 'myRadioClass'});

### resetDefaultText (string)

*Default:* "Reset"

This text is what's shown on form reset buttons.  It is very similar to submitDefaultText.

    $("input[type='reset']).uniform({resetDefaultText: "Clear"});

### resetSelector (boolean/string)

*Default:* false

This parameter allows you to use a jQuery-style selector to point to a "reset" button in your form if you have one. Use false if you have no "reset" button, or a selector string that points to the reset button if you have one.

    $("select").uniform({resetSelector: 'input[type="reset"]'});

### selectAutoWidth (boolean)

*Default:* true

If this option is set to true, Uniform will try to fit the select width to the actual content.  If the select is populated via JavaScript, it is recommended to set a custom width for the element (`style="width:XX"`) or uniform it after being populated.

### selectClass (string)

*Default:* "selector"

Sets the class given to the wrapper div for select elements.

    $("select").uniform({selectClass: 'mySelectClass'});

### submitDefaultText (string)

*Default:* "Submit"

This text is what's shown on form submit buttons.  It is very similar to resetDefaultText.

    $("input[type='submit']).uniform({resetDefaultText: "Submit Form"});

### useID (boolean)

*Default:* true

If true, sets an ID on the container div of each form element. The ID is a prefixed version of the same ID of the form element.

    $("select").uniform({useID: false});

Additional Functions
--------------------

In addition to the parameters, there are a couple of other ways you can interact with Uniform.

### $.uniform.update([elem/selector string]);

If you need to change values on the form dynamically you must tell Uniform to update that element’s style. Fortunately, it’s very simple. Just call this function, and Uniform will do the rest.

    $.uniform.update("#myUpdatedCheckbox");

If you don't mind updating all Uniformed elements or just don’t specifically know which element to update, you can just leave out the parameter (see below) and Uniform will update all Uniformed elements on the page:

    $.uniform.update();

### $.uniform.restore([elem/selector string]);

If you want to "un-uniform" something, simply call this function. It will remove the inline styles, extra dom elements, and event handlers, effectively restoring the element to it's previous state.

    $.uniform.restore("select");

### $.uniform.elements[]

You can get an array of all the elements that have been Uniformed at any time using this public variable.  I don't advise changing the contents!

    var uniforms = $.uniform.elements;

Customizing CSS
---------------

To edit the CSS of Uniform it is highly recommended to not edit the theme files, but to override them using CSS. Make sure your CSS file comes after the uniform theme css file in the HEAD section.

It's common to want to resize the selects or other elements. The best way is to set the width property on the div element, span element and the form element itself. Look through the theme CSS in the `PRESENTATION` section to see where the width property is currently set.

Tips & Tricks
-------------

Uniform is supposed to be pretty simple, but there are a few things that can be tricky. Here are some tips that may make your experience simpler:

* Remember to change the CSS classes in the theme if you change the parameters for elements’ classes. This can be tedious work, but if you don’t do it, it’s not going to look correct. Find and Replace is your friend.

* Uniform cannot automatically sniff out dynamic value changes. If you make changes to elements in JavaScript or using a Reset button of some kind remember to call $.uniform.update(); to sync the changes with Uniform.

* Uniform is disabled in IE6. It’s not possible to fix due to the way IE6 handles form elements. If you care about IE6 users, give it a quick look to make sure your "naked" form elements look alright in there.

* You’re on your own for styling text inputs and more. Fortunately, things that are not handled by Uniform are pretty easy to skin. :)

* Uniform does not support multiselect.  At least not yet.  Patches to add support are certainly welcome!

* There is a bug in Safari 5.1 that will cause the web rendering process to crash when you use custom fonts.  For more information, see [Issue #183](https://github.com/pixelmatrix/uniform/issues/183).

* With IE 7-9, sometimes the "change" event doesn't get fired or doesn't get triggered at the right time.  When we detect a change, Uniform may submit its own "change" event on the element.  See [Issue #152](https://github.com/pixelmatrix/uniform/issues/152) and [Issue #238](https://github.com/pixelmatrix/uniform/issues/238).

* If you have ideas, or bugs, please post them in [GitHub](https://github.com/pixelmatrix/uniform). We rely on our users' for improvement ideas and bug reports. Without your participation, Uniform will stay static.

Upgrading To 1.8
----------------

Your sprite map will now support many new things and will need to be updated.  If you use custom backgrounds that are not in the sprite map, those will need updating as well.

The uniform.options object was renamed to uniform.defaults since they are the default options.

Previously, calls to update() would render all elements with the most recent set of options.  This has been fixed, but may change how your page looks.  Test to make sure things still render as expected.

Various option names have changed to be less ambiguous or have a consistent naming scheme.
