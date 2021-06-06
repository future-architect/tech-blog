'use strict';

const pagination = require('hexo-pagination');

// /tags
hexo.extend.generator.register("tags", function(locals) {
   return  pagination('tags', locals.posts, {
        layout: ['tags', 'archive', 'index'],
    });
});

hexo.extend.helper.register('count_tags', function() {
  return this.site.posts.map(post => post.tags).flat().unique().length;
});
