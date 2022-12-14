function GetOrInitSpeechRecognintion() {
  if (this.recognition) {
    return this.recognition
  }
  const recognition = new webkitSpeechRecognition()
  recognition.lang = 'cmn-Hant-TW'
  recognition.continuous = true
  recognition.interimResults = true

  recognition.onerror = recognitionOnError
  recognition.onresult = recognitionOnResult

  this.recognition = recognition
  return this.recognition
}

function recognitionOnError (event) {
  let message = '未知的錯誤'
  switch (event.error) {
    case 'no-speech': {
      message = '沒有收到輸入'
      break
    }
    case 'audio-capture': {
      message = '沒有麥克風'
      break
    }
    case 'not-allowed': {
      message = '沒有權限，請開啟權限'
      break
    }
  }

  document.querySelector('#start-record-btn').classList.remove('inactive')
  document.querySelector('#end-record-btn').classList.add('inactive')

  window.alert(message)
}

function recognitionOnResult (event) {
  let finalTranscript = ''
  let interimTranscript = ''

  for (let i = event.resultIndex; i < event.results.length; ++i) {
    if (event.results[i].isFinal) {
      finalTranscript += event.results[i][0].transcript
    } else {
      interimTranscript += event.results[i][0].transcript
    }
  }
  document.querySelector('#input-text').value = finalTranscript || interimTranscript
  inputTextUpdated({ target: { value: finalTranscript || interimTranscript } })
}

let currentValue = ''
const inputTextUpdated = _.debounce(async (event) => {
  if (!event.target.value || currentValue === event.target.value) {
    return
  }

  document.querySelector('#start-hint').classList.add('inactive')
  document.querySelector('#search-table').classList.add('inactive')
  document.querySelector('#no-result-hint').classList.add('inactive')
  document.querySelector('#loading-spinner').classList.remove('inactive')

  try {
    const hits = await fetch('/search', {
      headers: {
        'Content-Type': 'application/json'
      },
      method: 'POST',
      body: JSON.stringify({ text: event.target.value }),
    }).then((resp) => resp.json())

    const groupTemplate = document.querySelector('#result-template')

    const groups = hits.map((hit) => {
      const dom = document.createElement(groupTemplate.dataset.tagname || 'div')
      dom.classList.add(...groupTemplate.classList)
      dom.innerHTML = groupTemplate.innerHTML
        .replace(/\{\{groupName\}\}/g, hit.group_name)
        .replace(/\{\{name\}\}/g, hit.name)
        .replace(/\{\{score\}\}/g, hit.score)
      return dom
    })

    if (groups.length === 0) {
      document.querySelector('#no-result-hint').classList.remove('inactive')
    } else {
      const resultSection = document.querySelector('#result')
      resultSection.innerHTML = ''
      resultSection.append(...groups)

      document.querySelector('#search-table').classList.remove('inactive')
    }
  } catch (error) {
    window.alert(`API 錯誤，查詢失敗 (${error})`)
    document.querySelector('#start-hint').classList.remove('inactive')
  }

  document.querySelector('#loading-spinner').classList.add('inactive')
  endRecordClicked()

  currentValue = event.target.value
}, 1000)

function startRecordClicked() {
  const recogintion = GetOrInitSpeechRecognintion()

  recogintion.start()

  document.querySelector('#start-record-btn').classList.add('inactive')
  document.querySelector('#end-record-btn').classList.remove('inactive')
}

function endRecordClicked() {
  const recogintion = GetOrInitSpeechRecognintion()

  recogintion.stop()

  document.querySelector('#start-record-btn').classList.remove('inactive')
  document.querySelector('#end-record-btn').classList.add('inactive')
}

function resetClicked() {
  const recogintion = GetOrInitSpeechRecognintion()

  recogintion.stop()

  document.querySelector('#input-text').value = ''

  document.querySelector('#start-record-btn').classList.remove('inactive')
  document.querySelector('#end-record-btn').classList.add('inactive')
  document.querySelector('#start-hint').classList.remove('inactive')
  document.querySelector('#search-table').classList.add('inactive')
  document.querySelector('#no-result-hint').classList.add('inactive')
  document.querySelector('#loading-spinner').classList.add('inactive')
}

function main() {
  if (!('webkitSpeechRecognition' in window)) {
    document.querySelector('#unavailable').classList.remove('inactive')
    document.querySelector('#start-record-btn').setAttribute('disabled', '')
    return
  }
}

main()
