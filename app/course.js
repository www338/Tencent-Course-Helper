const { ipcRenderer } = require('electron')

function clickSign() {
    'use strict';
    var elements = document.getElementsByClassName("s-btn s-btn--primary s-btn--m");
    for(var i = 0; i < elements.length; i++) {
        try {
            var element = elements[i];
            if(element.innerHTML == "签到") {
                element.click();
                setTimeout(clickConfirm,2000);
                break;
            }
        } catch(e) {
            ipcRenderer.send('course-log', '自动签到遇到错误' + e)
        }
    }
}

function clickConfirm() {
    'use strict';
    var elements2 = document.getElementsByClassName("s-btn s-btn--primary s-btn--m");
    for(var i = 0; i < elements2.length; i++) {
        try {
            var element = elements2[i];
            if(element.innerHTML == "确定") {
                element.click();
                break;
            }
        } catch(e) {
            console.log(e)
        }
    }
    ipcRenderer.send('course-log', '已签到')
}

function saySomething() {
    document.querySelector('#react-body > div.chat-ctn > div > div.app-main > div:nth-child(1) > div > div.text-editor > div.quill.text-editor-input.text-editor-input--withbtns > div > div.ql-editor.ql-blank > p').innerHTML = '1'
    setTimeout(() => {
        document.querySelector('#react-body > div.chat-ctn > div > div.app-main > div:nth-child(1) > div > div.text-editor > button.im-btn.text-editor-btn.btn-default.btn-s').click()
        ipcRenderer('course-log', '已自动发 1')
    }, 300)
}

document.addEventListener('DOMContentLoaded', (_) => {
    setTimeout(() => {
        if (document.getElementById('main_video') == undefined) {
            ipcRenderer.send('check-course-status', false)
            location.reload();
        } else {
            ipcRenderer.send('check-course-status', true)
            document.getElementById('video_mask').click()
            setInterval(clickSign, 5000);
            ipcRenderer.send('course-log', '自动签到脚本运行中...')
            setTimeout(() => saySomething(), 10000)
        }
    }, 5000)
})


