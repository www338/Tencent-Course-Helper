const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const fs = require('fs')
const path = require('path')
const cron = require('node-cron')

const configPath = path.join(app.getPath('userData'), 'config.json')
const loginPath = path.join(__dirname, 'login.js')

let mainWindow
let loginWindow
let courses = new Array()
let courseWindows = new Map()
let courseTasks = new Array()
let initLogs = new Array()
let alreadyLogin = false

// 初始化
function init() {
  createWindow()
  createLoginWindow()
}

// 加载课程配置
function loadConfig() {
  if (fs.existsSync(configPath)) {
    let config = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
    for (let i = 0; i < config.length; i++) {
      courses.push(config[i])
    }
  }
}

// 创建定时任务
function createTasks() {
  for (let i = 0; i < courses.length; i++) {
    let course = courses[i]
    course.id = i
    let h = parseInt(course.start.split(":")[0])
    let m = parseInt(course.start.split(":")[1])
    let cronExp = '0 ' + m + ' ' + h + ' * * ' + course.weekday
    if (cron.validate(cronExp)) {
      let task = cron.schedule(cronExp, () => startCourse(course, 0))
      courseTasks.push(task)
      log('添加课程：' + course.name + '（id：' + course.id + '，星期：' + course.weekday + '，开始时间：' + course.start + '）')
      let offset = isCourseAlreadyStart(h, m, course.duration, course.weekday)
      if (offset != 0) {
        startCourse(course, offset)
      }
    } else {
      log('课程时间错误')
    }
  }
  if (courses.length == 0) {
    log('课程配置为空，请拖拽配置文件至该窗口以加载课程配置。')
  } else {
    log('课程配置加载完毕')
  }
}

// 销毁所有任务
function destroyAllTasks() {
  for (let i = 0; i < courseTasks.length; i++) {
    courseTasks[i].destroy()
  }
}

// 判断课程是否已开始
function isCourseAlreadyStart(hour, minute, duration, weekday) {
  let now = new Date()
  let nowTime = now.getHours() * 60 + now.getMinutes()
  let startTime = hour * 60 + minute
  let nowWeekday = now.getDay()
  if (nowWeekday == 0) nowWeekday = 7
  if (nowWeekday == weekday && nowTime >= startTime && nowTime <= startTime + duration) {
    let offset = nowTime - startTime
    if (offset == 0) offset = 1
    return offset
  }
  return 0
}

// 开始一节课程
function startCourse(course, offset) {
  log('课程 [' + course.name + '] 开始')
  courseWindows.set(course.id, createCourseWindow(course.id, course.url))
  let exitTime = course.duration - offset
  if (exitTime == 0) exitTime = 1
  exitTime += 10
  setTimeout(() => {
    exitCourse(course)
  }, 1000 * 60 * exitTime)
}

// 退出一节课
function exitCourse(course) {
  if (courseWindows.has(course.id)) {
    courseWindows.get(course.id).destroy()
    courseWindows.delete(course.id)
  }
  log('课程 [' + course.name + '] 已退出')
}

// 输出
function log(msg) {
  if (mainWindow != undefined) {
    console.log(msg)
    mainWindow.webContents.send('log', msg)
  } else {
    initLogs.push(msg)
  }
}

// 创建主窗口
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 400,
    height: 300,
    webPreferences: {
      nodeIntegration: true
    }
  })

  mainWindow.loadFile('./app/index.html')

  mainWindow.on('closed', function () {
    mainWindow = null
  })

  mainWindow.webContents.on('did-finish-load', function () {
    initLogs.forEach((msg) => {
      log(msg)
    })
  })
}

// 创建登录窗口
function createLoginWindow() {
  loginWindow = new BrowserWindow({
    width: 720,
    height: 520,
    webPreferences: {
      nodeIntegration: true,
      preload: loginPath
    }
  })

  loginWindow.loadURL('https://ke.qq.com')

  loginWindow.on('closed', function () {
    loginWindow = null
    if (!alreadyLogin) {
      mainWindow.destroy()
    }
  })
}

// 创建课程窗口
function createCourseWindow(id, url) {
  let window = new BrowserWindow({
    width: 1000,
    height: 520,
    webPreferences: {
      nodeIntegration: true,
      preload: path.join(__dirname, 'course.js')
    }
  })

  window.loadURL(url)

  window.on('closed', function () {
    courseWindows.delete(id)
    window = null
  })

  return window
}

app.on('ready', init)

ipcMain.on('check-login-status', (_, isLogin) => {
  if (isLogin) {
    alreadyLogin = true
    loginWindow.close()
    loginWindow = null
    log('已登录')
    loadConfig()
    createTasks()
  } else {
    log('请在打开的网页中登录')
  }
})

ipcMain.on('check-course-status', (_, isPlaying) => {
  if (isPlaying) {
    log('已进入课程直播间')
  } else {
    log('当前未开播，稍后将自动刷新...')
  }
})

ipcMain.on('course-log', (_, msg) => {
  log(msg)
})

ipcMain.on('drag-file', (_, filePath) => {
  log('path:' + filePath)
  if (filePath.substring(filePath.lastIndexOf(".") + 1) == 'json') {
    fs.readFile(filePath, (err, data) => {
      if (err) {
        throw err
      } else {
        destroyAllTasks()
        courses.splice(0, courses.length)
        fs.writeFile(configPath, data, (err) => {
          if (err) {
            throw err
          } else {
            loadConfig()
            createTasks()
            log('课程配置和任务已更新')
          }
        })
      }
    })
  } else {
    log('文件格式错误')
  }
})
