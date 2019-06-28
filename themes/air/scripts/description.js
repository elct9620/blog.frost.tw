/**
 * Description Helper
 */

hexo.extend.helper.register('description', function(post, site, is_category, is_tag, __) {
  var description = []

  if (post.current >= 1) {
    description.push(__('page', post.current))
  }

  if(is_category() || is_tag()) {
    description.push(post.category || post.tag)
  }

  description.push(post.description || post.excerpt || site.description)

  return description.join(' | ')
})
