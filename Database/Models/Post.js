const mongoose =  require('mongoose');



const CommentSchema = new mongoose.Schema({
  postId: String,  // the ID of the post being commented on
  comment: String, // the actual comment text
  commentBy: {     // the commenter information
    _id: mongoose.Schema.Types.ObjectId,
    username: String,
    avatarUrl: String
  },
  createdAt: { type: Date, default: Date.now }
});

const PostSchema = new mongoose.Schema({
    PostTitle: {
      type: String,
      require: true
    },
    PostDesc: {
      type: String,
      require: true
    },
    ImageUrl: {
      type: String,
      require: true
    },
    PostBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Reference to the User schema
      require: true
    },
    PostByAvtarUrl: {
      type: String,
      require: true
    },
    PostTime: {
      type: Date,
      default: Date.now
    },
    likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    PostComments: [CommentSchema]
  });




// Virtual field to get the like count
PostSchema.virtual('PostLikes').get(function() {
  return this.likedBy.length;
});
// Ensure virtuals are included in JSON and object output
PostSchema.set('toObject', { virtuals: true });
PostSchema.set('toJSON', { virtuals: true });

const post = mongoose.model('post',PostSchema);

module.exports = post;