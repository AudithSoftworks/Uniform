/*global $*/
$(function () {
	'use strict';
	$("#docs h3").click(function () {
		$(this).nextUntil('h3').slideToggle();
		return false;
	}).nextUntil('h3').toggle();
	$(".parameter").hide();
	$("select, input[type='checkbox'], input[type='radio'], input[type='file']").uniform();
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
	$("a.btn[rel='theme']").click(function () {
		$("#example").toggleClass("aristo");
		return false;
	});
});
