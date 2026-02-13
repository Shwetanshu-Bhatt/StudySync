// Temporary script to delete all chat rooms
const mongoose = require('mongoose');

// Use the EXACT same MongoDB URI from server/.env
const MONGODB_URI = 'mongodb+srv://shwetanshubhatt_db_owner:hL1fSCz3pnt742e1@studysyncmain.0znirwf.mongodb.net/studysync?retryWrites=true&w=majority';

async function deleteAllRooms() {
  try {
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
