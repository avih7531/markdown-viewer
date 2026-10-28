var csv = (() => {
  var loaded = false

  function fenceKind(className) {
    if (/\blanguage-tsv\b/.test(className) || /(?:^|\s)tsv(?:\s|$)/.test(className)) {
      return 'tsv'
    }
    if (/\blanguage-csv\b/.test(className) || /(?:^|\s)csv(?:\s|$)/.test(className)) {
      return 'csv'
    }
    return null
  }

  function walkBlocks(html) {
    var blocks = []
    var re = /<pre[^>]*><code class="([^"]*)">([\s\S]+?)<\/code><\/pre>/gi
    var match
    while ((match = re.exec(html))) {
      var kind = fenceKind(match[1])
      if (kind) {
        blocks.push({kind: kind, raw: match[2]})
      }
    }
    return blocks
  }

  function decodeHtml(html) {
    var txt = document.createElement('textarea')
    txt.innerHTML = html
    return txt.value
  }

  function parseRow(line, delimiter) {
    var row = []
    var cell = ''
    var inQuotes = false

    for (var i = 0; i < line.length; i++) {
      var ch = line[i]
      if (inQuotes) {
        if (ch === '"') {
          if (line[i + 1] === '"') {
            cell += '"'
            i++
          }
          else {
            inQuotes = false
          }
        }
        else {
          cell += ch
        }
      }
      else if (ch === '"') {
        inQuotes = true
      }
      else if (ch === delimiter) {
        row.push(cell)
        cell = ''
      }
      else {
        cell += ch
      }
    }
    row.push(cell)
    return row
  }

  function parseTable(text, delimiter) {
    var lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter((line) => line.length)
    return lines.map((line) => parseRow(line, delimiter))
  }

  function escapeHtml(str) {
    return str.replace(/[&<>"]/g, (ch) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
    }[ch] || ch))
  }

  function compareCells(a, b) {
    var na = Number(a)
    var nb = Number(b)
    if (!Number.isNaN(na) && !Number.isNaN(nb) && a !== '' && b !== '') {
      return na - nb
    }
    return String(a).localeCompare(String(b), undefined, {numeric: true, sensitivity: 'base'})
  }

  function delimiterForKind(kind) {
    return kind === 'tsv' ? '\t' : ','
  }

  function escapeDelimitedCell(cell, delimiter) {
    var s = String(cell != null ? cell : '')
    if (delimiter === '\t') {
      return s
    }
    if (/[",\n\r]/.test(s)) {
      return '"' + s.replace(/"/g, '""') + '"'
    }
    return s
  }

  function serializeRow(row, delimiter) {
    return row.map((cell) => escapeDelimitedCell(cell, delimiter)).join(delimiter)
  }

  function serializeTableDom(table, kind) {
    var delimiter = delimiterForKind(kind)
    var lines = []
    var headRow = table.querySelector('thead tr')
    if (headRow) {
      lines.push(serializeRow(Array.from(headRow.children).map((th) => th.textContent), delimiter))
    }
    Array.from(table.querySelectorAll('tbody tr')).forEach((tr) => {
      lines.push(serializeRow(Array.from(tr.children).map((td) => td.textContent), delimiter))
    })
    return lines.join('\n')
  }

  function isTableModified(table, filter) {
    if (filter.value.trim()) {
      return true
    }
    return table.dataset.sortCol != null && table.dataset.sortCol !== ''
  }

  function syncModifiedState(host, filter, table, filterUi) {
    var modified = isTableModified(table, filter)
    host.classList.toggle('md-table-modified', modified)
    var state = filterUi && filterUi.querySelector('.md-table-state')
    var reset = filterUi && filterUi.querySelector('.md-table-reset')
    if (state) {
      state.hidden = !modified
    }
    if (reset) {
      reset.hidden = !modified
    }
    var copyBtn = host.querySelector('button.md-copy')
    if (copyBtn) {
      copyBtn.title = modified ? 'Copy visible table' : 'Copy original source from markdown'
    }
  }

  function positionFilterPanel(filterUi) {
    var panel = filterUi.querySelector('.md-table-filter-panel')
    var trigger = filterUi.querySelector('.md-table-filter-trigger')
    if (!panel || !trigger || panel.hidden) {
      return
    }
    var rect = trigger.getBoundingClientRect()
    var gap = 4
    var minWidth = 224
    panel.classList.add('md-table-filter-panel-floating')
    var width = Math.max(panel.offsetWidth, minWidth)
    var left = Math.max(8, Math.min(rect.right - width, window.innerWidth - width - 8))
    var top = rect.bottom + gap
    var panelHeight = panel.offsetHeight
    if (top + panelHeight > window.innerHeight - 8 && rect.top - gap - panelHeight >= 8) {
      top = rect.top - gap - panelHeight
    }
    panel.style.left = Math.round(left) + 'px'
    panel.style.top = Math.round(top) + 'px'
  }

  function clearFilterPanelPosition(filterUi) {
    if (!filterUi) {
      return
    }
    var panel = filterUi.querySelector('.md-table-filter-panel')
    if (panel) {
      panel.classList.remove('md-table-filter-panel-floating')
      panel.style.top = ''
      panel.style.left = ''
    }
    if (filterUi._mdReposition) {
      window.removeEventListener('scroll', filterUi._mdReposition, true)
      window.removeEventListener('resize', filterUi._mdReposition)
      filterUi._mdReposition = null
    }
  }

  function setFilterOpen(filterUi, open) {
    if (!filterUi) {
      return
    }
    var panel = filterUi.querySelector('.md-table-filter-panel')
    var trigger = filterUi.querySelector('.md-table-filter-trigger')
    filterUi.classList.toggle('md-table-filter-open', open)
    var wrap = filterUi.closest('.md-table-wrap')
    if (wrap) {
      wrap.classList.toggle('md-table-filter-open', open)
    }
    if (panel) {
      panel.hidden = !open
    }
    if (trigger) {
      trigger.setAttribute('aria-expanded', open ? 'true' : 'false')
    }
    if (filterUi._mdDismiss) {
      document.removeEventListener('mousedown', filterUi._mdDismiss)
      filterUi._mdDismiss = null
    }
    if (!open) {
      clearFilterPanelPosition(filterUi)
    }
    if (open) {
      filterUi._mdDismiss = (event) => {
        if (!filterUi.contains(event.target)) {
          setFilterOpen(filterUi, false)
        }
      }
      setTimeout(() => document.addEventListener('mousedown', filterUi._mdDismiss), 0)
      requestAnimationFrame(() => {
        positionFilterPanel(filterUi)
        filterUi._mdReposition = () => positionFilterPanel(filterUi)
        window.addEventListener('scroll', filterUi._mdReposition, true)
        window.addEventListener('resize', filterUi._mdReposition)
      })
    }
  }

  function filterIconSvg() {
    return '<svg class="md-filter-icon" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">'
      + '<path fill="currentColor" d="M2 2.25h12v1.25H2V2.25zm1.25 2.5L8 10.2v3.3h0v0l0 0V10.2l4.75-5.45H3.25z"/>'
      + '</svg>'
  }

  function rowsFromDomTable(table) {
    var headRow = table.querySelector('thead tr')
    var bodyRows
    if (headRow) {
      var head = Array.from(headRow.children).map((cell) => cell.textContent)
      bodyRows = Array.from(table.querySelectorAll('tbody tr'))
      var rows = [head]
      bodyRows.forEach((tr) => {
        rows.push(Array.from(tr.children).map((cell) => cell.textContent))
      })
      return rows
    }
    var allRows = Array.from(table.querySelectorAll('tr'))
    if (!allRows.length) {
      return []
    }
    headRow = allRows[0]
    var headCells = Array.from(headRow.children).map((cell) => cell.textContent)
    rows = [headCells]
    allRows.slice(1).forEach((tr) => {
      rows.push(Array.from(tr.children).map((cell) => cell.textContent))
    })
    return rows
  }

  function enhanceMarkdownTables() {
    var root = document.querySelector('#_html')
    if (!root) {
      return
    }
    Array.from(root.querySelectorAll('table')).forEach((table) => {
      if (table.closest('.md-table-wrap')) {
        return
      }
      var rows = rowsFromDomTable(table)
      if (!rows.length) {
        return
      }
      table.classList.add('md-gfm')
      var host = document.createElement('div')
      host.className = 'md-table-wrap md-copy-host'
      host.dataset.mdKind = 'tsv'
      table.parentNode.insertBefore(host, table)
      host.appendChild(table)
      attachTableControls(host, rows)
      var source = serializeTableDom(host.querySelector('table'), 'tsv')
      host.dataset.mdCopySource = source
      host.__mdGetCopyText = () => {
        if (host.classList.contains('md-table-modified')) {
          var tableEl = host.querySelector('table')
          return tableEl ? serializeTableDom(tableEl, 'tsv') : source
        }
        return host.dataset.mdCopySource || source
      }
    })
  }

  function resetTableView(host, table, rows, head, filter, filterUi) {
    filter.value = ''
    delete table.dataset.sortCol
    delete table.dataset.sortDir
    Array.from(table.querySelectorAll('thead th')).forEach((cell) => {
      cell.classList.remove('md-table-sort-active')
      cell.dataset.sortOrder = ''
    })
    renderBody(table, rows, head, '')
    setFilterOpen(filterUi, false)
    syncModifiedState(host, filter, table, filterUi)
  }

  function renderBody(table, rows, head, filterText) {
    var body = table.querySelector('tbody')
    if (!body) {
      return
    }
    var needle = filterText.trim().toLowerCase()
    var data = rows.slice(1).filter((row) => {
      if (!needle) {
        return true
      }
      return row.some((cell) => String(cell != null ? cell : '').toLowerCase().includes(needle))
    })

    var sortCol = table.dataset.sortCol != null ? parseInt(table.dataset.sortCol, 10) : -1
    var sortDir = table.dataset.sortDir === 'desc' ? -1 : 1
    if (sortCol >= 0) {
      data.sort((a, b) => compareCells(a[sortCol], b[sortCol]) * sortDir)
    }

    body.innerHTML = ''
    data.forEach((row) => {
      var tr = document.createElement('tr')
      head.forEach((_, index) => {
        var td = document.createElement('td')
        td.textContent = row[index] != null ? row[index] : ''
        tr.appendChild(td)
      })
      body.appendChild(tr)
    })
  }

  function attachTableControls(host, rows) {
    if (!rows.length) {
      return
    }

    var table = host.querySelector('table')
    if (!table) {
      return
    }

    var filterUi = document.createElement('div')
    filterUi.className = 'md-table-filter-ui'
    var trigger = document.createElement('button')
    trigger.type = 'button'
    trigger.className = 'md-table-filter-trigger'
    trigger.title = 'Filter rows'
    trigger.setAttribute('aria-label', 'Filter rows')
    trigger.setAttribute('aria-expanded', 'false')
    trigger.innerHTML = filterIconSvg()
    var panel = document.createElement('div')
    panel.className = 'md-table-filter-panel'
    panel.hidden = true
    var filter = document.createElement('input')
    filter.type = 'search'
    filter.className = 'md-table-filter'
    filter.placeholder = 'Filter rows…'
    filter.setAttribute('aria-label', 'Filter table rows')
    panel.appendChild(filter)
    var state = document.createElement('span')
    state.className = 'md-table-state'
    state.hidden = true
    state.textContent = 'Filtered'
    panel.appendChild(state)
    var reset = document.createElement('button')
    reset.type = 'button'
    reset.className = 'md-table-reset'
    reset.hidden = true
    reset.textContent = 'Reset'
    reset.title = 'Restore the original table from the markdown'
    panel.appendChild(reset)
    filterUi.appendChild(trigger)
    filterUi.appendChild(panel)
    var headRow = table.querySelector('thead tr')
    var filterAnchor = headRow && headRow.querySelector('th:last-child')
    if (filterAnchor) {
      filterAnchor.classList.add('md-table-filter-anchor')
      filterAnchor.appendChild(filterUi)
    }
    else {
      host.appendChild(filterUi)
    }

    trigger.addEventListener('click', (event) => {
      event.stopPropagation()
      var open = panel.hidden
      setFilterOpen(filterUi, open)
      if (open) {
        filter.focus()
      }
    })

    filter.addEventListener('blur', () => {
      setTimeout(() => {
        if (!filterUi.contains(document.activeElement)) {
          setFilterOpen(filterUi, false)
        }
      }, 0)
    })

    host.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        setFilterOpen(filterUi, false)
      }
    })

    var head = rows[0]
    Array.from(table.querySelectorAll('thead th')).forEach((th, index) => {
      th.classList.add('md-table-sort')
      th.tabIndex = 0
      th.setAttribute('role', 'button')
      th.title = 'Sort: ascending, then descending, then original order'
      var activate = (event) => {
        if (event.target.closest('.md-table-filter-ui')) {
          return
        }
        var current = parseInt(table.dataset.sortCol, 10)
        var sortCol = index
        var sortDir = 'asc'
        if (current === index) {
          if (table.dataset.sortDir === 'asc') {
            sortDir = 'desc'
          }
          else if (table.dataset.sortDir === 'desc') {
            sortCol = -1
          }
        }
        if (sortCol < 0) {
          delete table.dataset.sortCol
          delete table.dataset.sortDir
        }
        else {
          table.dataset.sortCol = String(sortCol)
          table.dataset.sortDir = sortDir
        }
        Array.from(table.querySelectorAll('thead th')).forEach((cell, col) => {
          var active = sortCol >= 0 && col === sortCol
          cell.classList.toggle('md-table-sort-active', active)
          cell.dataset.sortOrder = active ? table.dataset.sortDir : ''
        })
        renderBody(table, rows, head, filter.value)
        syncModifiedState(host, filter, table, filterUi)
      }
      th.addEventListener('click', activate)
      th.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          activate()
        }
      })
    })

    filter.addEventListener('input', () => {
      renderBody(table, rows, head, filter.value)
      syncModifiedState(host, filter, table, filterUi)
    })

    reset.addEventListener('click', (event) => {
      event.stopPropagation()
      resetTableView(host, table, rows, head, filter, filterUi)
    })

    syncModifiedState(host, filter, table, filterUi)
  }

  function tableHtml(rows) {
    if (!rows.length) {
      return '<table class="md-csv"></table>'
    }
    var head = rows[0]
    var body = rows.slice(1)
    var html = '<table class="md-csv"><thead><tr>'
    head.forEach((cell) => {
      html += '<th>' + escapeHtml(cell) + '</th>'
    })
    html += '</tr></thead><tbody>'
    body.forEach((row) => {
      html += '<tr>'
      head.forEach((_, index) => {
        html += '<td>' + escapeHtml(row[index] != null ? row[index] : '') + '</td>'
      })
      html += '</tr>'
    })
    html += '</tbody></table>'
    return html
  }

  return {
    render: () => {
      var blocks = walkBlocks(state.html)

      Array.from(document.querySelectorAll(
        'pre code.csv, pre code.tsv, pre code.language-csv, pre code.language-tsv'
      )).forEach((block, index) => {
        try {
          var match = blocks[index]
          var kind = match ? match.kind : block.classList.contains('tsv') ? 'tsv' : 'csv'
          var raw = decodeHtml((match ? match.raw : block.textContent).trim())
          raw = raw.replace(/^\uFEFF/, '').trim()
          var rows = parseTable(raw, kind === 'tsv' ? '\t' : ',')
          var host = document.createElement('div')
          host.className = 'md-table-wrap md-copy-host'
          host.dataset.mdCopySource = raw
          host.dataset.mdKind = kind
          host.innerHTML = tableHtml(rows)
          attachTableControls(host, rows)
          host.__mdGetCopyText = () => {
            if (host.classList.contains('md-table-modified')) {
              var tableEl = host.querySelector('table')
              return tableEl ? serializeTableDom(tableEl, kind) : raw
            }
            return host.dataset.mdCopySource || raw
          }
          block.parentElement.replaceWith(host)
        }
        catch (err) {
          console.error('Failed to render CSV/TSV table:', err)
        }
      })

      enhanceMarkdownTables()

      loaded = true
    }
  }
})()
