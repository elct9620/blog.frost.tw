(function() {

    var reloadDisqus = function() {
        if(typeof DISQUS === "undefined") {
            (function() {
                var dsq = document.createElement('script');
                dsq.type = 'text/javascript';
                dsq.async = true;
                dsq.src = '//' + disqus_shortname + '.disqus.com/embed.js';
                (document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(dsq);
            }())
        } else {
            DISQUS.reset({
                reload: true,
                config: function() {
                    this.page.identifier = document.title
                    this.page.url = location.href
                }
            })
        }
    }

    var onPageReload = function() {
        // Refresh Typekit
        Typekit.load()

        // Reload Disqus
        if(location.pathname != "/") {
            // Prevent homepage reload Disqus
            reloadDisqus()
        }
    }

    var initTurbolinks = function() {
        document.addEventListener("turbolinks:load", onPageReload)
    }

    document.addEventListener("DOMContentLoaded", function() {
        initTurbolinks()
    })

}())

