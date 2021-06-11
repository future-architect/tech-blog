'use strict';

const pagination = require('hexo-pagination');
const {getSNSCnt} = require('./lib/sns');

hexo.extend.generator.register("author", function(locals) {
    const posts = locals.posts;

    let coworkPosts = new Map();
    posts.filter(post => Array.isArray(post.author)).forEach(post => {
      post.author.forEach(name => {
        coworkPosts.set(name, [].concat([post]).concat(coworkPosts[name] || []));
      });
    });

    const authorPosts = posts.map(post => post.author).filter(author => !Array.isArray(author)).unique().map(author => ({name:author, posts:posts.find({author})}));

    const generator_config = this.config.author_generator || {};
    const per_page = generator_config.per_page || this.config.per_page || 10;

    return authorPosts.reduce((result, author) => {
      author.posts.data = author.posts.data.concat(coworkPosts.get(author.name) || []); // 共著分を追加

      const posts = author.posts.sort('-date');

      const snsCnt = posts.map(post => post.permalink).map(url => getSNSCnt(url)).reduce((acc, cur) => acc + cur);

      const data = pagination('authors/' + author_to_url.call(this, author.name), posts, {
          layout: ['author', 'archive', 'index'],
          perPage: per_page,
          data: {
              author: author.name,
              authorSNSCnt: snsCnt
          }
      });
      return result.concat(data);
    }, []);
});

// Authro Root Page
hexo.extend.generator.register("authors", function(locals) {
   return  pagination('authors', locals.posts.slice(0, 1), {
        layout: ['authors', 'archive', 'index'],
    });
});

function author_to_url(author) {
  return ((this.config.author_generator || {}).url_map || {})[author] || author;
}

hexo.extend.helper.register('list_authors', function() {
  let coworkPosts = new Map();
  this.site.posts.filter(post => Array.isArray(post.author)).forEach(post => {
    post.author.forEach(name => {
      coworkPosts.set(name, [].concat([post]).concat(coworkPosts[name] || []));
    });
  });

  const count_posts = author => this.site.posts.filter(post => post.author === author).length + (coworkPosts.get(author) || []).length; // 共著分を追加
  const compareFunc = (a, b) => count_posts(b) - count_posts(a);

  const postRankings = this.site.authors.filter(author => !Array.isArray(author)).sort(compareFunc)

  const authors = postRankings.map(author => `
      <li class="author-list-item">
          <a class="author-list-link" href="/authors/${author_to_url.call(this, author)}">${author}</a>
          <span class="author-list-count">${count_posts(author)} 件</span>
      </li>`).join('');

  return `<ul class="author-list">${authors}</ul>`;
});

hexo.extend.helper.register('post_author_link', function(post) {
  const authors = [].concat(post.author || 'Anonymous');

  const link = authors.map(author =>
    `<li><a href="/authors/${encodeURI(author)}">${author}</a></li>`
  ).join("")

  return `<li class="blog-info-item">${link}</li>`
});

// 著者数を表示
hexo.extend.helper.register('count_authors', function() {
  const coAuthors = this.site.posts.filter(post => Array.isArray(post.author)).map(post => post.author).flat();
  const singleAuthors = this.site.posts.filter(post => !Array.isArray(post.author)).map(post => post.author);
  return coAuthors.concat(singleAuthors).unique().length;
});

hexo.extend.helper.register('post_author_link', function(post) {
  const authors = [].concat(post.author || 'Anonymous');

  const link = authors.map(author =>
    `<li><a href="/authors/${encodeURI(author)}">${author}</a></li>`
  ).join("")

  return `<li class="blog-info-item">${link}</li>`
});

