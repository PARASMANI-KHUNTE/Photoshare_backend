const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'post',
    require: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    require: true
  },
  username: {
    type: String, // Username of the user who triggered the notification
    require: true
  },
  postTitle: {
    type: String,
    require: true
  },
  postOwner: {
    type: String, // Username of the post owner receiving the notification
    require: true
  },
  postMediaUrl: {
    type: String, // (Optional) Media URL from the post
  },
  type: {
    type: String, // 'like' or 'comment'
    require: true
  },
  likedBy: {
    type: String,
  },
  isRead: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Notification', notificationSchema);
