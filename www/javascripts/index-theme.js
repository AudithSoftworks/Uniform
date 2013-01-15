/*global $, window*/

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
				if (' agent aristo default jeans '.indexOf(' ' + keyValue[1] + ' ') >= 0) {
					theme = keyValue[1];
				}
			}
		}
	}

	// Courtesy of Nathan Hartwell <njhartwell@gmail.com>
	$('head').append('<link type="text/css" rel="stylesheet" href="stylesheets/uniform.' + theme + '.css" />');
	$(function () {
		$("#theme").val(theme);
	});
}());
