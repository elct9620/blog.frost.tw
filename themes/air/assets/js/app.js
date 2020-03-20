(function() {
  var $html = document.getElementsByTagName('html')[0]

  var disqusReload = false;
  var debounce = function(func, delay) {
    var timer = null;
    return function() {
      var context = this;
      var args = arguments;
      clearTimeout(timer)
      timer = setTimeout(function() {
        func.apply(context, args)
      }, delay)
    }
  }

  var reloadDisqus = debounce(function() {
    if(location.pathname == "/") {
      return
    }

    if(typeof DISQUS === "undefined") {
      (function() {
        var dsq = document.createElement('script');
        dsq.type = 'text/javascript';
        dsq.async = true;
        dsq.src = '//revo-skill-frost.disqus.com/embed.js';
        (document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(dsq);
      }())

      return
    }

    if (disqusReload) {
      DISQUS.reset({
        reload: true,
        config: function() {
          this.page.identifier = document.title
          this.page.url = location.href
        }
      })

      disqusReload = false;
    }
  }, 1000)

  var onPageReload = function(ev) {
    // Refresh Typekit
    // try { Typekit.load({async: true}) } catch(e) {}
    if (typeof FB !== "undefined" && FB !== null) { // Instance of FacebookSDK
      FB.XFBML.parse();
    }

    if (typeof dataLayer !== "undefined" && dataLayer !== null) {
      dataLayer.push({
        'event':'turbolinks:load',
        'virtualUrl': event.data.url
      });
    }

    disqusReload = true;
  }

  var onScroll = function(ev) {
    if(window.scrollY >= window.innerHeight / 4) {
      reloadDisqus()
    }
  }

  document.addEventListener("turbolinks:load", onPageReload)
  document.addEventListener("scroll", onScroll)
}())
