# Uniform

> A jQuery plugin to make your form controls look how you want them to. Now with HTML-5 attributes!

Works well with jQuery 1.6+, but we've received patches and heard that this works with jQuery 1.3.

[![NPM](https://nodei.co/npm/jquery.uniform.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/jquery.uniform/)

[![license](https://img.shields.io/github/license/AudithSoftworks/Uniform.svg?maxAge=2592000?style=plastic)](https://github.com/AudithSoftworks/Uniform/blob/master/LICENSE.txt)

## Installation

### Via NPM

Simply run:

    npm install --save jquery.uniform
    
To create minified file, run (though this isn't necessary, as the minified file is already included in the package):
    
    npm run build
    
Minified source file will be built inside ```dist/``` folder.

### Via Bower

    bower install --save jquery.uniform
    

## Implementation

Stylesheets and Javascript files should be linked in the ```<header>``` of your markup. Javascript files should be linked/included after jQuery:

    <!-- Make sure your CSS file is listed before jQuery -->
	<link rel="stylesheet" href="uniform.default.css" media="screen">
	<script src="jquery.min.js"></script>
	<script src="jquery.uniform.js"></script>

This relies upon a copy of jquery.uniform.js, uniform.default.css and the various images all being available on your webserver.


## Usage

See our <a href="https://github.com/AudithSoftworks/Uniform/wiki">Wiki page</a> for documentation.


## Reporting Bugs

It sure would be handy if you could create a test page to help illustrate bugs.  When you use the <a href="https://github.com/AudithSoftworks/Uniform/issues">GitHub Issue Tracker</a>, you could clone this [bug template gist](https://gist.github.com/4328659) or use [this jsfiddle](http://jsfiddle.net/fidian/JNCFP/) to help illustrate your point.

Even if you don't do that, all sorts of feedback is welcome, but narrowing down your problem or providing an example would immediately help narrow down the problem quickly.
