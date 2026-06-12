const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const authRoute = require('./routes/auth');

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB কানেক্টেড'))
  .catch((err) => console.log('MongoDB এরর:', err));

app.use('/api/auth', authRoute);

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

const onlineUsers = {};

io.on('connection', (socket) => {
  console.log('একজন কানেক্ট করেছে:', socket.id);

  socket.on('user_online', (userId) => {
    onlineUsers[socket.id] = userId;
    socket.join(userId);
    console.log('ইউজার অনলাইন:', userId);
  });

  socket.on('send_private_message', ({ to, message }) => {
    console.log('মেসেজ পাঠানো হচ্ছে:', to, message.text);
    io.to(to).emit('receive_private_message', message);
    socket.emit('receive_private_message', message);
  });

  socket.on('disconnect', () => {
    delete onlineUsers[socket.id];
    console.log('ডিসকানেক্ট:', socket.id);
  });
});

const PORT = 5000;
server.listen(PORT, () => {
  console.log(`সার্ভার চলছে http://localhost:${PORT}`);
});