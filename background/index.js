(() => {
  var storage = md.storage(md);
  var inject = md.inject({storage});
  var detect = md.detect({storage, inject});
  var webrequest = md.webrequest({storage});
  var mathjax = md.mathjax();
  var xhr = md.xhr();
  var icon = md.icon({storage});

  var compilers = Object.keys(md.compilers)
    .reduce((all, compiler) => (
      all[compiler] = md.compilers[compiler]({storage}),
      all
    ), {});

  var messages = md.messages({storage, compilers, mathjax, xhr, webrequest, icon});

  chrome.tabs.onUpdated.addListener(detect.tab);
  chrome.runtime.onMessage.addListener(messages);

  icon();
})();
