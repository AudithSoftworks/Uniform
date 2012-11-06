/*global $, window, document*/

(function () {
	'use strict';
	var theme = 'aristo',
		params = window.location.search,
		i,
		keyValue;

	if (params) {
		params = params.substr(1).split('&');

		for (i = 0; i < params.length; i += 1) {
			keyValue = params[i].split('=');
			if (keyValue[0] === 'theme') {
				if (' agent aristo default '.indexOf(' ' + keyValue[1] + ' ') >= 0) {
					theme = keyValue[1];
				}
			}
		}
	}

	// Courtesy of Nathan Hartwell <njhartwell@gmail.com>
	$('head').append('<link type="text/css" rel="stylesheet" href="stylesheets/uniform.' + theme + '.css" />');

	$(function () {
		$("#theme").val(theme).change(function () {
			this.form.submit();
			return false;
		});
		$("#docs h3").click(function () {
			$(this).nextUntil('h3').slideToggle();
			return false;
		}).nextUntil('h3').toggle();
		$(".parameter").hide();
		$("select, input, .controls a").uniform();
		$("a.btn[rel='disable']").live("click", function () {
			$("select, input[type='checkbox'], input[type='radio'], input[type='file']").attr("disabled", true);
			$.uniform.update();
			$(this).attr("rel", "enable").text("Enable All");
			return false;
		});
		$("a.btn[rel='enable']").live("click", function () {
			$("select, input[type='checkbox'], input[type='radio'], input[type='file']").removeAttr("disabled");
			$.uniform.update();
			$(this).attr("rel", "disable").text("Disable All");
			return false;
		});
		$("a.btn[rel='reset']").click(function () {
			$("form").get(0).reset();
			$.uniform.update();
			return false;
		});
	});
}());
