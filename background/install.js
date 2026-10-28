md.install = () => {
  var fileOrigin = 'file:///*'

  function requestLocalFiles() {
    chrome.permissions.contains({origins: [fileOrigin]}, (granted) => {
      if (granted || chrome.runtime.lastError) {
        return
      }
      chrome.permissions.request({origins: [fileOrigin]})
    })
  }

  chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install' || details.reason === 'update') {
      requestLocalFiles()
    }
  })

  requestLocalFiles()
}
