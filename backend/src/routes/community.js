import express from 'express';
import { body, validationResult } from 'express-validator';
import { protect } from '../middleware/auth.js';
import CommunityPost from '../models/CommunityPost.js';
import { localStorage } from '../config/database.js';

const router = express.Router();

// Helper: enrich posts with author name
function enrichPost(post) {
  if (!post) return null;
  const user = localStorage.findOne('users', { id: post.userId });
  return {
    ...post,
    id: post.id,
    _id: post.id,
    author: post.anonymous ? 'Anonymous' : (user ? user.name : 'Unknown'),
    replies: (post.replies || []).map(reply => {
      const replyUser = localStorage.findOne('users', { id: reply.userId });
      return { ...reply, author: replyUser ? replyUser.name : 'Unknown' };
    }),
  };
}

// Get all posts
router.get('/posts', async (req, res) => {
  try {
    const { category, limit = 20, skip = 0 } = req.query;
    const query = category ? { category } : {};
    let posts = localStorage.find('communityPosts', query);
    posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    posts = posts.slice(parseInt(skip), parseInt(skip) + parseInt(limit));
    res.json({ success: true, posts: posts.map(enrichPost) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single post
router.get('/posts/:id', async (req, res) => {
  try {
    const post = localStorage.findOne('communityPosts', { id: req.params.id });
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json({ success: true, post: enrichPost(post) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create post
router.post('/posts', [
  protect,
  body('title').trim().notEmpty().isLength({ max: 200 }),
  body('content').trim().notEmpty(),
  body('category').isIn(['career', 'finance', 'housing', 'relationships', 'health', 'legal']),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { title, content, category, anonymous } = req.body;
    const post = await CommunityPost.create({
      userId: req.user.id,
      title, content, category,
      anonymous: anonymous || false,
    });

    req.user.xp += 10;
    req.user.calculateLevel();
    await req.user.save();

    res.status(201).json({ success: true, post: enrichPost(post), xpEarned: 10 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update post
router.put('/posts/:id', [
  protect,
  body('title').optional().trim().notEmpty(),
  body('content').optional().trim().notEmpty(),
], async (req, res) => {
  try {
    const post = localStorage.findOne('communityPosts', { id: req.params.id, userId: req.user.id });
    if (!post) return res.status(404).json({ error: 'Post not found or unauthorized' });

    const { title, content } = req.body;
    const updates = {};
    if (title) updates.title = title;
    if (content) updates.content = content;
    const updated = localStorage.update('communityPosts', { id: post.id }, updates);

    res.json({ success: true, post: enrichPost(updated) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete post
router.delete('/posts/:id', protect, async (req, res) => {
  try {
    const post = localStorage.findOne('communityPosts', { id: req.params.id, userId: req.user.id });
    if (!post) return res.status(404).json({ error: 'Post not found or unauthorized' });
    localStorage.delete('communityPosts', { id: post.id });
    res.json({ success: true, message: 'Post deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Like post
router.post('/posts/:id/like', protect, async (req, res) => {
  try {
    const post = localStorage.findOne('communityPosts', { id: req.params.id });
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const likedBy = post.likedBy || [];
    const alreadyLiked = likedBy.includes(req.user.id);
    const newLikedBy = alreadyLiked
      ? likedBy.filter(id => id !== req.user.id)
      : [...likedBy, req.user.id];

    localStorage.update('communityPosts', { id: post.id }, {
      likes: newLikedBy.length,
      likedBy: newLikedBy,
    });

    res.json({ success: true, likes: newLikedBy.length, liked: !alreadyLiked });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add reply
router.post('/posts/:id/replies', [
  protect,
  body('content').trim().notEmpty(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const post = localStorage.findOne('communityPosts', { id: req.params.id });
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const newReply = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      userId: req.user.id,
      content: req.body.content,
      likes: 0,
      likedBy: [],
      createdAt: new Date().toISOString(),
    };

    const replies = [...(post.replies || []), newReply];
    const updated = localStorage.update('communityPosts', { id: post.id }, { replies });

    req.user.xp += 5;
    req.user.calculateLevel();
    await req.user.save();

    res.json({ success: true, post: enrichPost(updated), xpEarned: 5 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Like reply
router.post('/posts/:postId/replies/:replyId/like', protect, async (req, res) => {
  try {
    const post = localStorage.findOne('communityPosts', { id: req.params.postId });
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const replies = post.replies || [];
    const replyIndex = replies.findIndex(r => r.id === req.params.replyId);
    if (replyIndex === -1) return res.status(404).json({ error: 'Reply not found' });

    const reply = replies[replyIndex];
    const likedBy = reply.likedBy || [];
    const alreadyLiked = likedBy.includes(req.user.id);
    const newLikedBy = alreadyLiked
      ? likedBy.filter(id => id !== req.user.id)
      : [...likedBy, req.user.id];

    replies[replyIndex] = { ...reply, likes: newLikedBy.length, likedBy: newLikedBy };
    localStorage.update('communityPosts', { id: post.id }, { replies });

    res.json({ success: true, likes: newLikedBy.length, liked: !alreadyLiked });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
