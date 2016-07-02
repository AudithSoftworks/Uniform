var gulp = require('gulp'),
    elixir = require('laravel-elixir');

elixir.config.assetsPath = 'src';
elixir.config.publicPath = 'dist';
elixir.config.buildPath = 'dist';
elixir.config.sourcemaps = false;
elixir.config.css.autoprefix.options.browsers = ['> 1%'];
elixir.config.css.sass.folder = 'scss';
elixir.config.versioning.buildFolder = '';

elixir(function (mix) {
    mix.sass('default.scss');
    mix.sass('agent.scss');
    mix.sass('aristo.scss');
    mix.sass('jeans.scss');

    mix.scripts(['jquery.uniform.js'], 'dist/js/jquery.uniform.standalone.js');
    mix.scripts(['node_modules/jquery/dist/jquery.js', 'src/js/jquery.uniform.js'], 'dist/js/jquery.uniform.bundled.js', './');
});
