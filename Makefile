SHELL := /bin/bash
.SHELLFLAGS := -eu -o pipefail -c

s:
	node_modules/.bin/hexo s

g:
	snssharecount > temp.json
	mv temp.json sns_count_cache.json
	echo "refresh sns_count_cache.json"
	ga > ga_cache.json
	echo "refresh ga_cache.json"
	node_modules/.bin/hexo g
	git add .
	git commit -m "$(ARG)"
	git push origin HEAD
	node_modules/.bin/hexo g --force
	cd public
	git add .
	git commit -m "$(ARG)"
	git push origin HEAD

