# (jQuery) Uniform

> A jQuery plugin to make your form controls look how you want them to. Now with HTML-5 attributes!

Works well with jQuery 1.6+, but we've received patches and heard that this works with jQuery 1.3.

[![NPM](https://nodei.co/npm/jquery.uniform.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/jquery.uniform/)

[![license](https://img.shields.io/github/license/AudithSoftworks/Uniform.svg?maxAge=2592000?style=plastic)](https://github.com/AudithSoftworks/Uniform/blob/master/LICENSE.txt)

## Installation

Packaging of Uniform comes with source SASS files and minified CSS files, ready for consumption in live/production environment. You can install Uniform via one of two methods listed below:

### Via NPM

Simply run:

    npm install --save jquery.uniform
    
To create minified file, run (though this isn't necessary, as the minified file is already included in the package):
    
    npm run build
    
Minified source file will be built inside ```dist/``` folder.

### Via Bower

    bower install --save jquery.uniform

### Un-minified CSS files

For your own development purposes, to get human-readable, un-minified CSS outputs, you will need to install Uniform via NPM (as shown above), install the necessary dependencies through ```npm install``` and then run ```gulp```. Doing so will recreate readable CSS files in ```dist/css``` folder. Invoking ```gulp --production``` however, will recreate minified CSS files (which is default behavior, what we already have in the ```dist``` folder).
    

## Implementation

There are two ways to go with this:

### Basic Implementation

Basically, you can use the final assets provided in ```dist``` folder out of the box.
 
Stylesheets and Javascript files should be linked in the ```<header>``` of your markup (the latter, coming after jQuery):

    <!-- Make sure your CSS file is listed before Javascript sources -->
	<link rel="stylesheet" href="/path-to-my-assets/uniform/dist/css/default.css" media="screen">
	<script src="/path-to-my-assets/jquery/dist/jquery.min.js"></script>
	<script src="/path-to-my-assets/uniform/dist/js/jquery.uniform.standalone.js"></script>

Or if you are using our bundled version - ```jquery.uniform.bundled.js``` file - which already comes with jQuery (beware not to include jQuery twice):

    <!-- Make sure your CSS file is listed before Javascript sources -->
	<link rel="stylesheet" href="/path-to-my-assets/uniform/dist/css/default.css" media="screen">
	<script src="/path-to-my-assets/uniform/dist/js/jquery.uniform.bundled.js"></script>

### Advanced Implementation

To have more control over your web assets, you can directly work with our SCSS and JS files, by importing them into or bundling with your own assets. Please be advised that our Gulp configuration (via Laravel-Elixir package) includes Auto-prefixer, i.e. browser prefixes are automatically added to CSS during the post-processing of SCSS files. Whatever your post-processing solution will be (Gulp-based or Compass), you need to make sure to include Auto-prefixer in that workflow. Our SCSS source files do not include browser prefixes out of the box! 


## Usage

See our <a href="https://github.com/AudithSoftworks/Uniform/wiki">Wiki page</a> for documentation.


## Reporting Bugs

It sure would be handy if you could create a test page to help illustrate bugs.  When you use the <a href="https://github.com/AudithSoftworks/Uniform/issues">GitHub Issue Tracker</a>, you could clone this [bug template gist](https://gist.github.com/4328659) or use [this jsfiddle](http://jsfiddle.net/fidian/JNCFP/) to help illustrate your point.

Even if you don't do that, all sorts of feedback is welcome, but narrowing down your problem or providing an example would immediately help narrow down the problem quickly.
