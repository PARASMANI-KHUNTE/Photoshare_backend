const express = require('express');
const router = express.Router();
const multer = require('multer');
const postModel = require('../Database/Models/Post.js');
const userModel = require('../Database/Models/User.js');
const Notification = require('../Database/Models/Notification.js')
const { v4: uuidv4 } = require('uuid');
const bucket = require('../Modules/FirebaseConfig.js'); // Import Firebase Storage bucket
const verifyToken = require('../Modules/VerifyToken.js')
const upload = multer({ storage: multer.memoryStorage() });
const {uploadToFirebase , deleteFromFirebase} = require('../Modules/uploadToFirebase.js')


// UploadPost route
router.post('/UploadPost', verifyToken, upload.single('file'), async (req, res) => {
  const { postTitle, postDesc } = req.body;
  const file = req.file;

  if (!postTitle || !postDesc || !file) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  try {
    const username = req.cookies.username;

    if (!username) {
      console.log('No username found in cookies.');
      return res.status(400).json({ success: false, message: 'Username not found in cookies' });
    }

    console.log(`File is uploaded by - ${username}`);

    // Normalize username case if necessary
    const normalizedUsername = username.toLowerCase();

    // Find the user by username
    const user = await userModel.findOne({ Username: normalizedUsername });

    if (!user) {
      console.log("User is not found.");
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    console.log(`User found: ${user}`);

    // Upload file using the separate module
    const downloadURL = await uploadToFirebase(file);

    // Save the post with file URL, user, and avatar
    const newPost = new postModel({
      PostTitle: postTitle,
      PostDesc: postDesc,
      ImageUrl: downloadURL,
      PostBy: user._id,
      PostByAvtarUrl: user.AvatarUrl,
    });

    await newPost.save();
    return res.status(200).json({ success: true, message: 'Post uploaded successfully' });
  } catch (error) {
    console.error('Error uploading post:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET all posts route
router.get('/posts',verifyToken, async (req, res) => {
    try {
        // Fetch all posts from the database
        const posts = await postModel.find().populate('PostBy', 'FullName Username AvatarUrl'); // Populating related user data
        
        return res.status(200).json({
            success: true,
            message: 'Posts retrieved successfully',
            posts: posts
        });
    } catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).send('Error fetching posts.');
    }
});



// GET posts by username route
router.get('/postByUser', verifyToken, async (req, res) => {
  const { username } = req.query; // Get the username from query parameters
  // const {username} = req.cookies.username;

  if (!username) {
    return res.status(400).json({ success: false, message: 'Username is required' });
  }

  try {
    // Fetch user by username (case-insensitive search using regex)
    const user = await userModel.findOne({ Username: { $regex: new RegExp("^" + username + "$", "i") } });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Fetch posts by user
    const posts = await postModel.find({ PostBy: user._id }).populate('PostBy', 'FullName Username AvatarUrl');

    return res.status(200).json({
      success: true,
      message: 'Posts retrieved successfully',
      posts: posts,
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    return res.status(500).send('Error fetching posts.');
  }
});


// PUT update post route
router.put('/posts/:postId', verifyToken, async (req, res) => {
  const { postId } = req.params;
  const { PostTitle, PostDesc } = req.body;

  try {
    // Find and update the post
    const updatedPost = await postModel.findByIdAndUpdate(
      postId,
      { PostTitle, PostDesc },
      { new: true } // Return the updated post
    );

    if (!updatedPost) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Post updated successfully',
      post: updatedPost
    });
  } catch (error) {
    console.error('Error updating post:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE post route
router.delete('/posts/:postId', verifyToken, async (req, res) => {
  const { postId } = req.params;

  try {
      // Find the post by ID
      const post = await postModel.findById(postId);
      if (!post) {
          return res.status(404).json({ success: false, message: 'Post not found' });
      }

      // Delete the file from Firebase Storage
      const fileName = post.ImageUrl.split('/').pop().split('?')[0]; // Extract file name from URL
      const file = bucket.file(`posts/${fileName}`);
      await file.delete();

      // Delete the post from the database
      await postModel.findByIdAndDelete(postId);

      return res.status(200).json({ success: true, message: 'Post deleted successfully' });
  } catch (error) {
      console.error('Error deleting post:', error);
      return res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/profile/avatar/:username', verifyToken, upload.single('avatar'), async (req, res) => {
  const { username } = req.params;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }

  try {
    // Check if user exists
    const user = await userModel.findOne({ Username: username });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const oldAvatarUrl = user.AvatarUrl;
    console.log(`Old Avatar URL - ${oldAvatarUrl}`);

    // Upload the new avatar to Firebase
    const newFolderName = `${username}_avatar_${Date.now()}`;
    const newAvatarUrl = await uploadToFirebase(file, `avatars/${newFolderName}`);
    console.log(`New Avatar URL - ${newAvatarUrl}`);

    // If there's an old avatar, delete it from Firebase
    if (oldAvatarUrl) {
      // Extract the actual file name from the old avatar URL
      const oldFileName = oldAvatarUrl.split('/').pop().split('?')[0]; // Extract the file name
      // Extract the folder name from the old avatar URL (assuming folder structure follows a pattern)
      const oldFolderName = oldAvatarUrl.split('/').slice(-2, -1)[0]; // Extract the folder name
      const oldFilePath = `avatars/${oldFolderName}/${oldFileName}`; // Construct the full file path

      console.log(`Old File Name - ${oldFileName}`);
      console.log(`Old Folder Name - ${oldFolderName}`);
      console.log(`Old File Path - ${oldFilePath}`);

      // Delete the old avatar from Firebase
      try {
        await deleteFromFirebase(oldFilePath);
        console.log('Old avatar deleted from Firebase.');
      } catch (err) {
        console.error('Error deleting old avatar from Firebase:', err);
      }
    }

    // Update user's avatar URL in the database
    user.AvatarUrl = newAvatarUrl;
    await user.save();

    // Update the avatar URL in all posts created by this user
    await postModel.updateMany(
      { PostBy: user._id },
      { PostByAvtarUrl: newAvatarUrl }
    );

    return res.status(200).json({ success: true, avatarUrl: newAvatarUrl });
  } catch (error) {
    console.error('Error uploading avatar:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});



router.get('/profile/:username', verifyToken, async (req, res) => {
  try {
    const { username } = req.params;
    
    // Find user by username
    const user = await userModel.findOne({ Username: username });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Return user details
    return res.status(200).json({
      success: true,
      user: {
        FullName: user.FullName,
        Username: user.Username,
        Email: user.Email,
        AvatarUrl: user.AvatarUrl,
        FollowerCount: user.FollowerCount,
        FollowingCount: user.FollowingCount
      }
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});


// Like or Unlike a post
router.post('/like', verifyToken, async (req, res) => {
  const { postId } = req.body;
  const username = req.cookies.username;
  console.log(`username - ${username}`);

  if (!username) {
    return res.status(400).json({ message: 'Username not found in cookies' });
  }

  try {
    // Find the post by its ID and populate the PostBy field (Post creator)
    const post = await postModel.findById(postId).populate('PostBy', 'Username'); // Populate the 'Username' of the post creator
    const user = await userModel.findOne({ Username: username }); // Assuming username is unique

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userId = user._id;
    console.log(`userId - ${userId}`);
    const userHasLiked = post.likedBy.includes(userId);

    if (userHasLiked) {
      // User has already liked the post, so we need to unlike it
      post.likedBy = post.likedBy.filter(id => id.toString() !== userId.toString());
    } else {
      // User has not liked the post yet, so we need to like it
      post.likedBy.push(userId);

      // Don't create notification if the user is liking their own post
      if (post.PostBy.Username !== username) {
        console.log(`Creating notification for ${username}`);
        console.log(`${user.Username}`)
        const newNotification = new Notification({
          postId: post._id.toString(),   // The ID of the post being liked         // The user who liked the post
          postTitle: post.PostTitle,     // Title of the post
          postOwner: post.PostBy.Username, // The post owner (who will receive the notification)
          postMediaUrl: post.ImageUrl,
          type: 'like',
          likedBy: user.Username    
        });

        await newNotification.save();
      }
    }

    // Save the updated post after like/unlike
    await post.save();

    return res.status(200).json({ 
      success: true, 
      message: userHasLiked ? 'Post unliked' : 'Post liked', 
      likeCount: post.likedBy.length 
    });

  } catch (error) {
    console.error('Error updating like status:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});





// Check if the user has liked a post
router.get('/likeStatus/:postId', verifyToken, async (req, res) => {
  const { postId } = req.params;
  const username = req.cookies.username; // Fetch username from cookies

  if (!username) {
    return res.status(400).json({ message: 'Username not found in cookies' });
  }

  try {
    // Find the user based on the username from cookies
    const user = await userModel.findOne({ Username: username });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userId = user._id;
    const post = await postModel.findById(postId);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const isLiked = post.likedBy.includes(userId);
    return res.status(200).json({ isLiked });
  } catch (error) {
    console.error('Error checking like status:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});


router.get('/getNotifications/:username',verifyToken, async (req, res) => {
  try {
    const username = req.params.username;
    const notifications = await Notification.find({ postOwner: username, isRead: false }).sort({ createdAt: -1 });
    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({ error: "Error fetching notifications" });
  }
});


router.get('/comments/:postId', async (req, res) => {
  try {
    // Find the post by its ID and return the PostComments field populated with username and avatarUrl
    const post = await postModel.findById(req.params.postId).select('PostComments');
    
    if (!post) return res.status(404).json({ message: 'Post not found' });

    // Send the comments data
    res.status(200).json({ comments: post.PostComments });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Route to add a comment
router.post('/comments/:postId', verifyToken, async (req, res) => {
  const { postId } = req.params;
  const { comment, commentBy } = req.body;
  const username = req.cookies.username;

  if (!username) {
    return res.status(400).json({ message: 'Username not found in cookies' });
  }

  try {
    // Fetch the user by username
    const user = await userModel.findOne({ Username: username });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const userId = user._id;

    // Find the post
    const post = await postModel.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    // Add the comment
    post.PostComments.push({
      comment,
      commentBy: {
        _id: userId,
        username: commentBy,
        avatarUrl: user.AvatarUrl // Add avatar URL if needed
      }
    });
    await post.save();

    // Find post owner
    const postOwner = await userModel.findById(post.PostBy);
    if (!postOwner) return res.status(404).json({ message: 'Post owner not found' });

    // Create a notification for the comment
    const notification = new Notification({
      postId,
      userId,
      username: commentBy,
      postTitle: post.PostTitle,
      postOwner: postOwner.Username,
      postMediaUrl: post.ImageUrl,
      type: 'comment'
    });

    await notification.save();

    res.status(200).json({ message: 'Comment added successfully', comment: post.PostComments[post.PostComments.length - 1] });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/comments/:postId/:commentId', verifyToken, async (req, res) => {
  const { postId, commentId } = req.params;
  const username = req.cookies.username;

  try {
    // Fetch the current user based on the username from cookies
    const curUs = await userModel.findOne({ Username: username });
    if (!curUs) {
      return res.status(404).json({ message: 'User not found' });
    }
    const userId = curUs._id;

    console.log(`post id - ${postId}`);
    console.log(`commentId - ${commentId}`);
    console.log(`userId - ${userId}`);

    // Find the post by ID
    const post = await postModel.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    // Find the comment in the PostComments array
    const comment = post.PostComments.id(commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    // Ensure the user deleting the comment is the comment author
    if (comment.commentBy._id.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Remove the comment from the array
    post.PostComments = post.PostComments.filter(c => c._id.toString() !== commentId.toString());
    await post.save();

    res.status(200).json({ message: 'Comment deleted successfully', comments: post.PostComments });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Route to get current user details
router.get('/me', verifyToken, async (req, res) => {
  try {
    const username = req.cookies.username;
    const curUs = await userModel.findOne({ Username: username });
    if (!curUs) {
      return res.status(404).json({ message: 'User not found' });
    }
    const userId = curUs._id;
    const user = await userModel.findById(userId).select('username avatarUrl');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json({ user });
  } catch (error) {
    console.error('Error fetching user details:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
