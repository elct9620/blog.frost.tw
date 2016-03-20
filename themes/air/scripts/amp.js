// AMP Generator

// TODO: Support all type page using AMP
hexo.extend.generator.register('amp', function(locals) {
    var posts = locals.posts.sort('-date').toArray()
    var length = posts.length

    return posts.map(function(post, index) {
        var layout = post.layout
        var path = post.path + 'amp/' // Create AMP path

        if(!layout || layout === 'false') {
            return {
                path: path,
                data: post.content
            }
        }


        if (index) post.prev = posts[index - 1];
        if (index < length - 1) post.next = posts[index + 1];

        var layouts = ['amp', 'post', 'page', 'index'];
        if (layout !== 'amp') layouts.unshift(layout);

        post.__amp = true;

        return {
            path: path,
            layout: layouts,
            data: post
        }
    })
})
