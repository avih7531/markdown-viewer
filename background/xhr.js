
md.xhr = () => {

  var get = (url, done) => {
    ;(async () => {
      await new Promise(async (resolve, reject) => {
        try {
          // A cache-busting query makes file:/// URLs point at a different path.
          var target = /^file:/i.test(url) ? url : url + '?preventCache=' + Date.now()
          var res = await fetch(target, {
            cache: /^file:/i.test(url) ? 'reload' : 'no-store',
          })
          done(null, await res.text())
        }
        catch (err) {
          done(err)
        }
      })
    })()
  }

  return {get}
}
