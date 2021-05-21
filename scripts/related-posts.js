const maxCount = 3;

hexo.extend.helper.register('list_related_posts', function(post) {

  // 同じ著者の一覧
  const sameAuthorPosts = this.site.posts.data.filter(p => p.author === post.author);

  // 記事が持つタグに紐づく記事をすべて収集
  const tagRelatedPosts = post.tags.data.flatMap(tag => tag.posts.data);

  const postList = sameAuthorPosts.concat(tagRelatedPosts).filter(tagPost => tagPost._id !== post._id);

  let relatedPosts = reduceTag(postList);
  relatedPosts.sort(dynamicSort('date', false));
  relatedPosts.sort(dynamicSort('count', false));

  const count = Math.min(maxCount, postList.length);
  if(count === 0){
    return `<p class="related-posts-none">No related post.</p>`;
  }

  let result = "";
  for (var i = 0; i < count; i++) {
    result += `<li class="related-posts-item"><span>${relatedPosts[i].date.format('YYYY.MM.DD')}</span><a class="related-posts-link" href=/${relatedPosts[i].path}>${relatedPosts[i].title}</a></li>`;
  }

  return `
  <div class="widget">
    <ul class="nav related-posts">${result}</ul>
  </div>`;
});

function reduceTag(posts) {
  return posts.reduce((newPosts, post) => {
    const i = objectArrayIndexOf(newPosts, post._id);
    if(i === -1){
      post.count = 1;
      newPosts.push(post);
    }else{
      newPosts[i].count += 1;
    }
    return newPosts;
  }, []);
}

function objectArrayIndexOf(array, id) {
  for(let i = 0; i < array.length; i++){
    if (array[i]._id === id) return i;
  }
  return -1;
}

function dynamicSort(property, isAscending) {
  let sortOrder = -1;
  if (isAscending) sortOrder = 1;
  return function (a, b) {
    const result = (a[property] < b[property]) ? -1 :
                 (a[property] > b[property]) ? 1 : 0;
    return result * sortOrder;
  };
}

