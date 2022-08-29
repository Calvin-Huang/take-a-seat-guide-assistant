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

const inputTextUpdated = _.debounce((event) => {
  console.log(event.target.value)
}, 750)

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
  
}

function main() {
  if (!('webkitSpeechRecognition' in window)) {
    document.querySelector('#unavailable').classList.remove('inactive')
    return
  }
}

main()
