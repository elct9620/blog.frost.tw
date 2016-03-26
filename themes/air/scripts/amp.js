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

        // TODO: Should get image size and set correct size
        post.content = post.content.replace(/<img(.*?)>/ig, "<amp-img layout=\"responsive\" width=\"600\" height=\"300\"$1>")

        // Youtube Video Support
        post.content = post.content.replace(/\<iframe\s.*?\s?src\s*=\s*['|"]?[^\s'"]+(\/embed\/|watch\?v=)([a-zA-Z0-9_]+)['|"].*?\>.*?\<\/iframe\>/ig, "<amp-youtube width=\"1280\" height=\"720\" layout=\"responsive\" data-videoid=\"$2\"><\/amp-youtube>")

        // Strip inline style
        post.content = post.content.replace(/\<(.*?)style\s*=\s*['|"]?[^\s'"]+['|"]?(.*?)\>/ig, "<$1$2>")

        return {
            path: path,
            layout: layouts,
            data: post
        }
    })
})
