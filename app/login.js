const { ipcRenderer } = require('electron')

document.addEventListener('DOMContentLoaded', (_) => {
    let user = document.querySelector('#js_logout_outer > p > a > span')
    setTimeout(() => {
        if (user.textContent == '') {
            ipcRenderer.send('check-login-status', false)
            setTimeout(() => {
                document.querySelector('#js_login').click()
            }, 1000)
        } else {
            ipcRenderer.send('check-login-status', true)
        }
    }, 1000)
})
