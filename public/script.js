const socket = io()
const userListDOM = document.getElementById('user-list')
const gridRoot = document.getElementById('grid-root')
let otherPlayer = ''
let localName = ''
let roomName = ''

document.getElementById('login-button').addEventListener('click', (e) => {
  e.preventDefault()
  const username = document.getElementById('username').value
  if (username === '') return
  localName = username
  socket.emit('login', username)
})

socket.on('login-success', (data) => {
  dataToDom(data)
  document.getElementById('login-form').style.display = 'none'
})

socket.on('login-failure', alert)
socket.on('user-joined', dataToDom)
socket.on('user-left', (data) => {
  dataToDom(data)
  if (data.find((user) => user.username === otherPlayer)) return resetGame()
})

function dataToDom({ users }) {
  const html = users
    .map((user) => {
      return user.username === localName
        ? ''
        : `<li class="user-card button" >${user.username}</li>`
    })
    .join('')
  userListDOM.innerHTML = html
}

document.addEventListener('click', (e) => {
  if (e.target.classList.contains('user-card')) {
    const name = e.target.innerText
    socket.emit('join-room', { name })
  }
})

socket.on('join-request', (data) => {
  const { room, user } = data
  // if (confirm(`${data.username} wants to join your room. Accept?`))
  otherPlayer = user
  console.log('join request', data)
  socket.emit('accept-request', { room })
})

socket.on('join-room-success', () => {
  userListDOM.style.display = 'none'
})

socket.on('accept-request-success', ({ room }) => {
  initGrid()
  roomName = room
})

function resetGame() {
  location.reload()
}

function initGrid() {
  console.log('init game')
  gridRoot.innerHTML = `
    <span class="cell" id="00"></span>
    <span class="cell" id="01"></span>
    <span class="cell" id="02"></span>
    <span class="cell" id="10"></span>
    <span class="cell" id="11"></span>
    <span class="cell" id="12"></span>
    <span class="cell" id="20"></span>
    <span class="cell" id="21"></span>
    <span class="cell" id="22"></span>
  `
}

document.addEventListener('click', (e) => {
  if (e.target.classList.contains('cell')) {
    const id = e.target.id
    play(id)
  }
})

function play(id) {
  socket.emit('play', { xy: id, room: roomName, user: localName })
}

socket.on('play', ({ xy, user }) => {
  console.log('play', xy, user)
  const cell = document.getElementById(xy)
  if (user === localName) {
    cell.classList.add('local')
    cell.classList.remove('other')
  } else {
    cell.classList.add('other')
    cell.classList.remove('local')
  }
})
