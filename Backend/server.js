const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const connectToDatabase = require('./config/db');
const canvasRoutes = require("./Routes/CanvasRoutes");
const cors = require('cors');
const userRoutes = require('./Routes/userRoutes');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

app.use(cors({
    origin: ['https://real-time-collaborative-whiteboard-three.vercel.app',
    'https://real-time-collaborative-whiteboard-mtnvdsks-projects.vercel.app',
    'https://real-time-collaborative-whiteboard-git-main-mtnvdsks-projects.vercel.app'
    ],
    methods: ['GET','POST','PUT','DELETE','OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.options("*", cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.json({ message: 'Backend server is running successfully!' });
});

app.use('/users', userRoutes);
app.use("/canvas", canvasRoutes);

// Connect to database
connectToDatabase();

const PORT = process.env.PORT || 3030;

// Socket.io for realtime collaboration
const io = new Server(server, {
    origin: [
        "https://real-time-collaborative-whiteboard-three.vercel.app",
        "https://real-time-collaborative-whiteboard-mtnvdsks-projects.vercel.app",
        "https://real-time-collaborative-whiteboard-git-main-mtnvdsks-projects.vercel.app"
    ],
    methods: ['GET','POST','PUT','DELETE','OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
});

io.use((socket, next) => {
    try {
        // Accept token via Socket.IO auth or headers for browser compatibility
        const authToken = (socket.handshake.auth && (socket.handshake.auth.token || socket.handshake.auth.Authorization))
            || socket.handshake.headers['authorization']
            || socket.handshake.headers['Authorization'];
        if (!authToken) return next(new Error('No auth token'));
        const token = String(authToken).startsWith('Bearer ')? String(authToken).slice(7): String(authToken);
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.userId || decoded.id || decoded._id || decoded.email;
        socket.userEmail = decoded.email;
        next();
    } catch (err) {
        next(err);
    }
});

io.on('connection', (socket) => {
    console.log('User connected:', socket.userId, 'Email:', socket.userEmail);
    
    socket.on('join-canvas', (canvasId) => {
        if (!canvasId) return;
        console.log('User', socket.userId, 'joining canvas:', canvasId);
        socket.join(`canvas:${canvasId}`);
        // Send confirmation back to the user
        socket.emit('canvas-joined', { canvasId, success: true });
    });
    
    socket.on('leave-canvas', (canvasId) => {
        if (!canvasId) return;
        console.log('User', socket.userId, 'leaving canvas:', canvasId);
        socket.leave(`canvas:${canvasId}`);
    });

    socket.on('update-canvas', ({ canvasId, elements }) => {
        if (!canvasId) return;
        console.log('User', socket.userId, 'updating canvas:', canvasId, 'Elements count:', elements.length);
        
        // Broadcast to everyone else in the room (exclude sender)
        const roomName = `canvas:${canvasId}`;
        const room = io.sockets.adapter.rooms.get(roomName);
        
        if (room && room.size > 1) {
            console.log('Broadcasting to room:', roomName, 'Users in room:', room.size);
            socket.to(roomName).emit('canvas-updated', { 
                canvasId, 
                elements,
                userId: socket.userId,
                timestamp: Date.now()
            });
        } else {
            console.log('No other users in room:', roomName);
        }
    });
    
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.userId);
    });
});

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});


