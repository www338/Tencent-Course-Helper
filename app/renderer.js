const { ipcRenderer } = require('electron')
const csl = document.getElementById('console')

function log(msg) {
    let log = document.createElement("div")
    log.innerText = msg
    log.className = 'log'
    csl.appendChild(log)
    window.scrollTo({
        top: document.body.scrollHeight,
        behavior: "smooth"
    })
}

document.addEventListener('drop', (e) => {
    e.preventDefault()
    let file = e.dataTransfer.files;
    if (file.length > 1) {
        log('一次只允许拖拽一个文件')
    } else {
        let path = file[0].path
        ipcRenderer.send('drag-file', path)
    }
})

document.addEventListener('dragover', (e) => {
    e.preventDefault()
})

ipcRenderer.on('log', (_, msg) => {
    log(msg)
})