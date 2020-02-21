(function(){var $html=document.getElementsByTagName('html')[0]
var reloadDisqus=function(){if(typeof DISQUS==="undefined"){(function(){var dsq=document.createElement('script');dsq.type='text/javascript';dsq.async=true;dsq.src='//revo-skill-frost.disqus.com/embed.js';(document.getElementsByTagName('head')[0]||document.getElementsByTagName('body')[0]).appendChild(dsq);}())}else{DISQUS.reset({reload:true,config:function(){this.page.identifier=document.title
this.page.url=location.href}})}}
var onPageReload=function(ev){if(location.pathname!="/"){reloadDisqus()}
if(typeof FB!=="undefined"&&FB!==null){FB.XFBML.parse();}
if(typeof dataLayer!=="undefined"&&dataLayer!==null){dataLayer.push({'event':'turbolinks:load','virtualUrl':event.data.url});}}
var initTurbolinks=function(){document.addEventListener("turbolinks:load",onPageReload)}
document.addEventListener("DOMContentLoaded",function(){initTurbolinks()})}())