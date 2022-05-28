const express = require('express')
const { Server } = require('socket.io')
const { createServer } = require('http')

const app = express()
const server = createServer(app)
const io = new Server(server)

app.use(express.static('public'))

const users = []

io.on('connection', (socket) => {
  console.log('a user connected', socket.id)

  socket.on('login', (username) => {
    if (users.find((user) => user.username === username))
      return socket.emit('login-failure', 'Username already taken')

    users.push({ id: socket.id, username })
    socket.emit('login-success', { users })
    socket.broadcast.emit('user-joined', { username, users })
  })

  socket.on('disconnect', () => {
    console.log('user disconnected', socket.id)
    const index = users.findIndex((user) => user.id === socket.id)
    if (index === -1) return
    users.splice(index, 1)
    socket.broadcast.emit('user-left', { users })
  })

  socket.on('join-room', ({ name }) => {
    console.log('join room', name)
    const user = users.find((user) => user.username === name)
    if (!user) return
    socket.join(user.id)
    socket.emit('join-room-success')
    socket.broadcast.to(user.id).emit('join-request', {
      room: user.id,
      user: users.find((user) => user.id === socket.id).username,
    })
  })

  socket.on('accept-request', ({ room }) => {
    console.log('accept request', room)
    socket.join(room)
    socket.emit('join-room-success')
    io.in(room).emit('accept-request-success', { room })
  })

  socket.on('play', ({ xy, room, user }) => {
    console.log('play', xy, room, user)
    io.in(room).emit('play', { xy, user })
  })
})

server.listen(process.env.PORT || 4242, () => {
  console.log('listening')
})
