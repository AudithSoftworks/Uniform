/*global $, themeCss*/
$(function () {
	'use strict';
	function makeEqual(type) {
		type = '#' + type;
		$(type + "Height").keyup(function () {
			if ($(type + "Equal").is(":checked")) {
				$(type + "Width").val($(this).val());
			}
		});
		$(type + "Width").keyup(function () {
			if ($(type + "Equal").is(":checked")) {
				$(type + "Height").val($(this).val());
			}
		});
		$(type + "Equal").click(function () {
			if ($(this).is(":checked")) {
				$(type + "Height").val($(type + "Width").val());
			}
		});
	}
	makeEqual('radio');
	makeEqual('check');
    $(".btn").click(function () {
		var replacements = [],
			offset = 0,
			grab = {},
			states = {
				bar: ["normal", "active", "hover", "hoveractive", "disabled"],
				filename: ["normal", "hover", "disabled"],
				tile: ["normal", "active", "hover", "hoveractive", "checked", "checkedactive", "checkedhover", "checkedhoveractive", "disabled", "disabledchecked"]
			},
			idx,
			r,
			css;

		function px(val) {
			if (val === "right" || val === 0) {
				return val;
			}

			return val + "px";
		}

		function sprites(name, horiz, vert, horizChange, vertChange, labelsReal) {
			var labels = labelsReal.slice(0);
			while (labels.length) {
				replacements[name + '.' + labels.shift()] = px(horiz) + " " + px(vert);
				horiz += horizChange;
				vert += vertChange;
			}

			return vert;
		}

		// Get some values and convert them to numbers
		$('.autoGrab').each(function () {
			var $e = $(this),
				id = $e.attr('id');
			grab[id] = $e.val();
		});

		// First five rows are select spans
		offset = sprites('select', "right", offset, "", -grab.selectHeight, states.bar);
		replacements['select.height'] = px(grab.selectHeight);

		// Next five rows are select divs - the cap on the left side
		offset = sprites('selectCap', 0, offset, 0, -grab.selectHeight, states.bar);

		// 10 checkbox states on a single row
		offset = sprites('checkbox', 0, offset, -grab.checkWidth, 0, states.tile);
		replacements['checkbox.height'] = px(grab.checkHeight);
		replacements['checkbox.width'] = px(grab.checkWidth);
		offset -= grab.checkHeight;

		// 10 radio states on a single row
		offset = sprites('radio', 0, offset, -grab.radioWidth, 0, states.tile);
		replacements['radio.height'] = px(grab.radioHeight);
		replacements['radio.width'] = px(grab.radioWidth);
		offset -= grab.checkHeight;

		// Filename - three separate rows
		offset = sprites('filename', 0, offset, 0, -grab.fileHeight, states.filename);
		replacements['filename.height'] = px(grab.fileHeight);

		// File browse button - five states
		offset = sprites('fileBtn', "right", offset, "", -grab.fileHeight, states.bar);

		// Buttons - five states for the spans
		offset = sprites('button', "right", offset, "", -grab.buttonHeight, states.bar);
		replacements['button.height'] = px(grab.buttonHeight);

		// Button caps - five states for the divs
		offset = sprites('buttonCap', 0, offset, 0, -grab.buttonHeight, states.bar);

		// Build the CSS file
		css = themeCss;

		for (idx in replacements) {
			if (replacements.hasOwnProperty(idx)) {
				r = new RegExp('\\{' + idx + '\\}', 'g');
				css = css.replace(r, replacements[idx]);
			}
		}

		$("#code").text(css).focus().select();
		$("#download-btn").downloadify({
			swf: "media/downloadify.swf",
			downloadImage: "images/download.png",
			width: 175,
			height: 32,
			filename: "uniform.yourtheme.css",
			data: css,
			dataType: "string"
		});
        return false;
    });
});
