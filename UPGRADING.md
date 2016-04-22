# Upgrading To 2.0 And Later

Your sprite map will now support many new things and will need to be updated.  If you use custom backgrounds that are not in the sprite map, those will need updating as well.

The uniform.options object was renamed to uniform.defaults since they are the default options.  Other properties were renamed to be consistent or have less ambiguous names, such as `fileBtnClass` becoming `fileButtonClass`.

Previously, calls to update() would render all elements with the most recent set of options.  This has been fixed, but may change how your page looks.  Test to make sure things still render as expected.

$.uniform.noSelect is no longer exposed and has been updated to version 1.0.3.

$.uniform.restore() does not need to be global; you now can use $('#myId').uniform.restore() instead to just restore some elements.  Same thing for updates.

The sprite changed a bit.  The caps for select lists were moved to the left-hand side.  Button theming was added and the file upload images were reordered to match the select list order.  See the theme-kit/README.md file for further reading on this topic.
