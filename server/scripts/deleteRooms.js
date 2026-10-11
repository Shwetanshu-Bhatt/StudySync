// Temporary script to delete all chat rooms
const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

async function deleteAllRooms() {
  try {
    if (!MONGODB_URI) throw new Error('Set MONGODB_URI or MONGO_URI before deleting rooms');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const ChatRoom = require('../models/ChatRoom');
    const ChatMessage = require('../models/ChatMessage');

    const roomsResult = await ChatRoom.deleteMany({});
    console.log(`Deleted ${roomsResult.deletedCount} chat rooms`);

    const messagesResult = await ChatMessage.deleteMany({});
    console.log(`Deleted ${messagesResult.deletedCount} chat messages`);

    console.log('All chat data deleted successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

deleteAllRooms();
