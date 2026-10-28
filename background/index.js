(() => {
  var storage = md.storage(md)
  var inject = md.inject({storage})
  var detect = md.detect({storage, inject})
  var webrequest = md.webrequest({storage})
  var mathjax = md.mathjax()
  var xhr = md.xhr()
  var autoreload = md.autoreload({storage, xhr})
  var autoreloadSync = autoreload.syncAll
  var icon = md.icon({storage})

  var compilers = Object.keys(md.compilers)
    .reduce((all, compiler) => (
      all[compiler] = md.compilers[compiler]({storage}),
      all
    ), {})

  var messages = md.messages({storage, compilers, mathjax, xhr, webrequest, icon, autoreload: autoreloadSync})

  md.install()

  chrome.tabs.onUpdated.addListener((tabId, info, tab) => {
    detect.tab(tabId, info, tab)
    if (info.status === 'complete' && tab && tab.url) {
      setTimeout(() => autoreload.watchTab(tabId, tab.url), 600)
    }
  })
  chrome.runtime.onMessage.addListener(messages)

  icon()
})()
