(function(){var $html=document.getElementsByTagName('html')[0]
var onPageReload=function(ev){if(typeof FB!=="undefined"&&FB!==null){FB.XFBML.parse();}
if(typeof dataLayer!=="undefined"&&dataLayer!==null){dataLayer.push({'event':'turbolinks:load','virtualUrl':event.data.url});}}
var initTurbolinks=function(){document.addEventListener("turbolinks:load",onPageReload)}
document.addEventListener("DOMContentLoaded",function(){initTurbolinks()})}())