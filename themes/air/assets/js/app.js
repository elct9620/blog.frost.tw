(function() {

    var $html = document.getElementsByTagName('html')[0]

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
      }

    var initTurbolinks = function() {
        document.addEventListener("turbolinks:load", onPageReload)
    }

    document.addEventListener("DOMContentLoaded", function() {
        initTurbolinks()
    })

}())
