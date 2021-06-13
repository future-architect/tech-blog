'use strict';

// 総投稿件数
hexo.extend.helper.register('count_articles', function() {
  return this.site.posts.length;
});
// 年別の投稿件数
hexo.extend.helper.register('count_articles_year', function(year) {
  return this.site.posts.filter(post => post.date.format("YYYY") === year.toString()).length;
});
// 年・月別の投稿件数
hexo.extend.helper.register('count_articles_month', function(year, month) {
  let mm = month.toString().padStart(2, '0');
  return this.site.posts.filter(post => post.date.format("YYYYMM") === year.toString() + mm).length;
});

// 著者に紐づく投稿件数
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

hexo.extend.helper.register('join_pagetag', function(name) {
  return this.page.tags.map(tag => tag.name).join(',');
});
