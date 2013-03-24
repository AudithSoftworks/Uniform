JS_MIN = jquery.uniform.min.js
THEME_CSS = $(patsubst %.scss, %.css, $(wildcard themes/*/css/*.scss))
THEME_CSS_MIN = $(patsubst %.css, %.min.css, $(THEME_CSS))
WWW_TARGETS = www/index.html www/stylesheets/multiple-themes.css
WWW_TARGETS += www/javascripts/jquery.uniform.js
WWW_TARGETS += www/javascripts/jquery.uniform.min.js
ZIP_THEME_TARGETS = www/downloads/uniform.agent.theme.zip
ZIP_THEME_TARGETS += www/downloads/uniform.aristo.theme.zip
ZIP_THEME_TARGETS += www/downloads/uniform.default.theme.zip
ZIP_THEME_TARGETS += www/downloads/uniform.jeans.theme.zip
WWW_TARGETS += $(ZIP_THEME_TARGETS)
CSS_THEME_TARGETS = www/stylesheets/uniform.agent.css
CSS_THEME_TARGETS += www/stylesheets/uniform.aristo.css
CSS_THEME_TARGETS += www/stylesheets/uniform.default.css
CSS_THEME_TARGETS += www/stylesheets/uniform.jeans.css
WWW_TARGETS += $(CSS_THEME_TARGETS)
WWW_TARGETS += www/downloads/theme-kit.zip

.PHONY: all clean

all: jquery.uniform.min.js $(JS_MIN) $(THEME_CSS) $(THEME_CSS_MIN) $(WWW_TARGETS)

www: www/javascripts/jquery.uniform.js www/javascripts/jquery.uniform.min.js $(WWW_TARGETS)

clean:
	rm -f jquery.uniform.min.js $(WWW_TARGETS) $(THEME_CSS) $(THEME_CSS_MIN)

%.min.js: %.js
	node_modules/.bin/uglifyjs jquery.uniform.js -o jquery.uniform.min.js -m -c
	
%.css: %.scss themes/_base/css/uniform._base.scss
	sass --load-path themes/_base/css --scss -s < $< > $@

%.min.css: %.scss themes/_base/css/uniform._base.scss
	sass --load-path themes/_base/css --scss -s --style=compressed < $< > $@

%.html: %.md
	node_modules/.bin/marked --gfm -i $< -o $@

www/downloads/theme-kit.zip: $(wildcard theme-kit/*) theme-kit/README.html
	rm -f $@
	( cd theme-kit; zip -r9 ../$@ * )

www/downloads/uniform.agent.theme.zip: $(wildcard themes/agent/*/*)
	rm -f $@
	( cd themes/agent; zip -r9 ../../$@ * )
	cp themes/agent/images/*.png www/images/

www/downloads/uniform.aristo.theme.zip: $(wildcard themes/aristo/*/*)
	rm -f $@
	( cd themes/aristo; zip -r9 ../../$@ * )
	cp themes/aristo/images/*.png www/images/

www/downloads/uniform.default.theme.zip: $(wildcard themes/default/*/*)
	rm -f $@
	( cd themes/default; zip -r9 ../../$@ * )
	cp themes/default/images/*.png www/images/

www/downloads/uniform.jeans.theme.zip: $(wildcard themes/jeans/*/*)
	rm -f $@
	( cd themes/jeans; zip -r9 ../../$@ * )
	cp themes/jeans/images/*.png www/images/

www/index.html: $(wildcard www-fragments/index-*) README.md
	cp www-fragments/index-start.html $@
	node_modules/.bin/marked --gfm -i README.md >> $@
	cat www-fragments/index-stop.html >> $@

www/javascripts/jquery.uniform.js: jquery.uniform.js
	cp jquery.uniform.js www/javascripts

www/javascripts/jquery.uniform.min.js: jquery.uniform.min.js
	cp jquery.uniform.min.js www/javascripts

www/stylesheets/multiple-themes.css: www/stylesheets/multiple-themes.scss $(wildcard themes/*/css/*.scss)
	sass --load-path www/stylesheets --scss -s < $< > $@

www/stylesheets/uniform.agent.css: themes/agent/css/uniform.agent.css
	cp $< $@

www/stylesheets/uniform.aristo.css: themes/aristo/css/uniform.aristo.css
	cp $< $@

www/stylesheets/uniform.default.css: themes/default/css/uniform.default.css
	cp $< $@

www/stylesheets/uniform.jeans.css: themes/jeans/css/uniform.jeans.css
	cp $< $@

