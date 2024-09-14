const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  FullName: {
    type: String,
    require: true,
    trim: true // Remove leading/trailing whitespace
  },
  Email: {
    type: String,
    require: true,
    unique: true,
    trim: true, // Remove leading/trailing whitespace
    lowercase: true // Convert email to lowercase for case-insensitive comparisons
  },
  Username: {
    type: String,
    require: true,
    unique: true,
    trim: true, // Remove leading/trailing whitespace
    lowercase: true // Convert username to lowercase for case-insensitive comparisons
  },
  Password: {
    type: String,
    require: true
  },
  IsVerified: {
    type: Boolean,
    default: false
  },
  Date: {
    type: Date,
    default: Date.now
  },
  AvatarUrl: {
    type: String,
    trim: true // Remove leading/trailing whitespace (optional)
  },
  FollowerCount: {
    type: Number,
    default: 0
  },
  FollowingCount: {
    type: Number,
    default: 0
  },
  Followings: {
    type: [{
      followerName: {
        type: String,
        trim: true // Remove leading/trailing whitespace (optional)
      },
      followerUrl: {
        type: String,
        trim: true // Remove leading/trailing whitespace (optional)
      },
      followerAvatarUrl: { // Use consistent naming (Avatar vs Avtar)
        type: String,
        trim: true // Remove leading/trailing whitespace (optional)
      }
    }],
    default: []
  },
  Followers: {
    type: [{
      followerName: {
        type: String,
        trim: true // Remove leading/trailing whitespace (optional)
      },
      followerUrl: {
        type: String,
        trim: true // Remove leading/trailing whitespace (optional)
      },
      followerAvatarUrl: { // Use consistent naming (Avatar vs Avtar)
        type: String,
        trim: true // Remove leading/trailing whitespace (optional)
      }
    }],
    default: []
  }
});

const User = mongoose.model('User', UserSchema); // Capitalize model name

module.exports = User;