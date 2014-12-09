PATH := $(PWD)/node_modules/.bin:$(PATH)

.PHONY: clean start assets

TRANSFORMS_DEV=   \
	-t ./objify     \
	-t glslify-live \
	-t glslify

TRANSFORMS_PRD= \
	-t ./objify   \
	-t envify     \
	-t uglifyify  \
	-t glslify    \
	-t glslify-optimize



assets: clean \
	luts/day.js luts/normal.js luts/night.js luts/sunset.js   \
	textures/water.js textures/grass.js textures/cardboard.js \
	luts/day2.js textures/dirt.js

clean:
	rm textures/*.js; true
	rm luts/*.js; true
	rm bundle.js; true
	rm disc.html; true

start: assets style.css
	npm explore glslify-live npm start &
	(beefy index.js:bundle.js --open -- $(TRANSFORMS_DEV))

bundle.js: assets
	(NODE_ENV=production browserify index.js $(TRANSFORMS_PRD) |\
		uglifyjs -cm >\
		bundle.js)

disc.html:
	(NODE_ENV=production browserify index.js $(TRANSFORMS_PRD) --full-paths |\
		uglifyjs -cm |\
		discify >\
		disc.html)

style.css: index.css
	myth index.css style.css

## TODO: investigate synchronous (or at least transparent
## and/or bulk) method of inlining and loading texture
## assets.

textures/water.js:
	(ndpack-image textures/water.png > textures/water.js)

textures/dirt.js:
	(ndpack-image textures/dirt.png > textures/dirt.js)

textures/cardboard.js:
	(ndpack-image textures/cardboard.png > textures/cardboard.js)

textures/grass.js:
	(ndpack-image textures/grass.png > textures/grass.js)

luts/day.js:
	(ndpack-image luts/day.png > luts/day.js)

luts/day2.js:
	(ndpack-image luts/day2.png > luts/day2.js)

luts/night.js:
	(ndpack-image luts/night.png > luts/night.js)

luts/sunset.js:
	(ndpack-image luts/sunset.png > luts/sunset.js)

luts/normal.js:
	(ndpack-image luts/normal.png > luts/normal.js)
