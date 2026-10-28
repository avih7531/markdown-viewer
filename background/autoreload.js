
md.autoreload = ({storage, xhr}) => {
  var state = storage.state
  var watchers = new Map()

  function normalize(text) {
    return String(text != null ? text : '').replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  }

  function isLocalUrl(url) {
    if (!url) {
      return false
    }
    if (/^file:/i.test(url)) {
      return true
    }
    try {
      var host = new URL(url).hostname
      return host === 'localhost' || host === '127.0.0.1' || host === '[::1]'
    }
    catch (err) {
      return false
    }
  }

  function isMarkdownUrl(url) {
    if (!isLocalUrl(url)) {
      return false
    }
    if (/^file:/i.test(url)) {
      return true
    }
    try {
      var u = new URL(url)
      var path = u.pathname + u.search + u.hash
      return new RegExp(state.match).test(path)
    }
    catch (err) {
      return false
    }
  }

  function stop(tabId) {
    var watch = watchers.get(tabId)
    if (watch) {
      clearInterval(watch.interval)
      watchers.delete(tabId)
    }
  }

  function start(tabId, url) {
    stop(tabId)
    if (!state.content.autoreload || !isMarkdownUrl(url)) {
      return
    }

    var current = ''
    var tick = () => {
      xhr.get(url, (err, body) => {
        if (err || body == null) {
          return
        }
        var md = normalize(body)
        if (!current) {
          current = md
          return
        }
        if (current !== md) {
          current = md
          chrome.tabs.sendMessage(tabId, {
            message: 'markdown-update',
            markdown: body,
          }, () => {
            chrome.runtime.lastError
          })
        }
      })
    }

    tick()
    watchers.set(tabId, {
      url: url,
      interval: setInterval(tick, 1000),
    })
  }

  function tryStart(tabId, url) {
    if (!tabId || !url || !state.content.autoreload || !isMarkdownUrl(url)) {
      stop(tabId)
      return
    }
    chrome.tabs.sendMessage(tabId, {message: 'ping'}, (res) => {
      if (chrome.runtime.lastError || !res || !res.ready) {
        return
      }
      start(tabId, url)
    })
  }

  function syncAll() {
    watchers.forEach((_, tabId) => stop(tabId))
    if (!state.content.autoreload) {
      return
    }
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach((tab) => {
        if (tab.id && tab.url) {
          tryStart(tab.id, tab.url)
        }
      })
    })
  }

  if (chrome.tabs && chrome.tabs.onRemoved) {
    chrome.tabs.onRemoved.addListener(stop)
  }

  if (storage.ready && typeof storage.ready.then === 'function') {
    storage.ready.then(syncAll)
  }
  else {
    syncAll()
  }

  return {
    syncAll: syncAll,
    watchTab: (tabId, url) => {
      stop(tabId)
      tryStart(tabId, url)
    },
  }
}
