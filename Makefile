JS_MIN = jquery.uniform.min.js
THEME_CSS = $(patsubst %.scss, %.css, $(wildcard themes/*/css/*.scss))
THEME_CSS_MIN = $(patsubst %.css, %.min.css, $(THEME_CSS))
WWW_TARGETS = www/javascripts/jquery.uniform.min.js
ZIP_THEME_TARGETS = www/downloads/uniform.agent.theme.zip
ZIP_THEME_TARGETS += www/downloads/uniform.aristo.theme.zip
ZIP_THEME_TARGETS += www/downloads/uniform.default.theme.zip
WWW_TARGETS += $(ZIP_THEME_TARGETS)
CSS_THEME_TARGETS = www/stylesheets/uniform.agent.css
CSS_THEME_TARGETS += www/stylesheets/uniform.aristo.css
CSS_THEME_TARGETS += www/stylesheets/uniform.default.css
WWW_TARGETS += $(CSS_THEME_TARGETS)
WWW_TARGETS += www/downloads/theme-kit.zip
WWW_TARGETS += www/javascripts/themecss.js

all: jquery.uniform.min.js $(JS_MIN) $(THEME_CSS) $(THEME_CSS_MIN) $(WWW_TARGETS)

www: www/javascripts/jquery.uniform.min.js $(WWW_TARGETS)

clean:
	rm -f jquery.uniform.min.js $(WWW_TARGETS)

%.min.js: %.js
	node_modules/.bin/uglifyjs2 jquery.uniform.js -o jquery.uniform.min.js -m -c
	
%.css: %.scss
	sass --scss -s < $< > $@

%.min.css: %.scss
	sass --scss -s --style=compressed < $< > $@

%.html: %.md
	node_modules/.bin/marked --gfm -i $< -o $@

www/downloads/theme-kit.zip: $(wildcard theme-kit/*)
	( cd theme-kit; zip -r9 ../$@ * )

www/downloads/uniform.agent.theme.zip: $(wildcard themes/agent/*/*)
	( cd themes/agent; zip -r9 ../../$@ * )

www/downloads/uniform.aristo.theme.zip: $(wildcard themes/aristo/*/*)
	( cd themes/agent; zip -r9 ../../$@ * )

www/downloads/uniform.default.theme.zip: $(wildcard themes/default/*/*)
	( cd themes/agent; zip -r9 ../../$@ * )

www/index.html: www-fragments/index-start.html www-fragments/index-stop.html README.md
	cp www-fragments/index-start.html $@
	node_modules/.bin/marked --gfm -i README.md >> $@
	cat www-fragments/index-stop.html >> $@

www/javascripts/jquery.uniform.min.js: jquery.uniform.min.js
	cp jquery.uniform.min.js www/javascripts

www/javascripts/themecss.js: www-fragments/placeholder.css
	env echo -n "var themeCss = '" > $@
	cat $< | sed 's/\\/\\\\/g;s/\t/\\t/g;'"s/'/\\'/g" | perl -p -e "s/\\n/\\\\n'+\\n'/g" >> $@
	echo "';" >> $@

www/stylesheets/uniform.agent.css: themes/agent/css/uniform.agent.css
	cp $< $@

www/stylesheets/uniform.aristo.css: themes/aristo/css/uniform.aristo.css
	cp $< $@

www/stylesheets/uniform.default.css: themes/default/css/uniform.default.css
	cp $< $@

