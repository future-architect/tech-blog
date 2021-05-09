hexo.extend.helper.register('count_author', function(name) {
  return this.site.posts.filter(post => post.author === name).length;
});
