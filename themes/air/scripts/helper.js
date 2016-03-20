// Template Helper

hexo.extend.helper.register('is_amp', function() {
    return Boolean(this.page.__amp)
})

hexo.extend.helper.register('amp_url', function(permalink) {
    return permalink + 'amp/'
})

