function author_to_url(author) {
  return ((this.config.author_generator || {}).url_map || {})[author] || author;
}

hexo.extend.helper.register('list_authors', function() {
  const count_posts = author => this.site.posts.filter(post => post.author === author).length;
  const authors = this.site.authors.map(author => `
      <li class="author-list-item">
          <a class="author-list-link" href="/authors/${author_to_url.call(this, author)}">${author}</a>
          <span class="author-list-count">${count_posts(author)}</span>
      </li>`).join('');

  return `<ul class="author-list">${authors}</ul>`;
});
