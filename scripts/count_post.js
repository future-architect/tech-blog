hexo.extend.helper.register('count_author', function(name) {
  return this.site.posts.filter(post => post.author === name).length;
});

// 参考: https://github.com/hexojs/hexo/issues/2189
hexo.extend.helper.register('count_tag', function(name) {
  return this.site.posts.filter(post => post.tags.filter(tag => tag.name === name).length > 0).length;
});

hexo.extend.helper.register('count_category', function(name) {
  return this.site.posts.filter(post => post.categories.filter(category => category.name === name).length > 0).length;
});
