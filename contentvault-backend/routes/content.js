const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/auth');
const Content = require('../models/Content');
const User = require('../models/User');
const WalrusService = require('../services/walrus');
const { body, validationResult } = require('express-validator');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|mp4|mp3|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Error: File type not allowed!'));
    }
  }
});

const walrusService = new WalrusService();

// Get all content with pagination and filtering
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 12, category, search, sortBy = 'newest' } = req.query;
    
    let query = { isActive: true };
    
    if (category && category !== 'all') {
      query.type = category;
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    
    let sortOptions = {};
    switch (sortBy) {
      case 'popular':
        sortOptions = { accessCount: -1 };
        break;
      case 'earnings':
        sortOptions = { totalEarnings: -1 };
        break;
      case 'newest':
      default:
        sortOptions = { uploadTimestamp: -1 };
        break;
    }
    
    const content = await Content.find(query)
      .populate('creator', 'username avatar')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Content.countDocuments(query);
    
    res.json({
      data: content,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
      hasMore: page < Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error fetching content:', error);
    res.status(500).json({ error: 'Failed to fetch content' });
  }
});

// Get featured content
router.get('/featured', async (req, res) => {
  try {
    const featuredContent = await Content.find({ 
      isActive: true, 
      isFeatured: true 
    })
      .populate('creator', 'username avatar')
      .sort({ accessCount: -1 })
      .limit(8);
    
    res.json(featuredContent);
  } catch (error) {
    console.error('Error fetching featured content:', error);
    res.status(500).json({ error: 'Failed to fetch featured content' });
  }
});

// Get user's content
router.get('/user/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const { page = 1, limit = 12 } = req.query;
    
    const content = await Content.find({ 
      creatorAddress: address.toLowerCase(),
      isActive: true 
    })
      .sort({ uploadTimestamp: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Content.countDocuments({ 
      creatorAddress: address.toLowerCase(),
      isActive: true 
    });
    
    res.json({
      data: content,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Error fetching user content:', error);
    res.status(500).json({ error: 'Failed to fetch user content' });
  }
});

// Get user's purchased content
router.get('/purchased/:address', auth, async (req, res) => {
  try {
    const { address } = req.params;
    const { page = 1, limit = 12 } = req.query;
    
    // This would typically query purchase records
    // For now, returning empty array
    res.json({
      data: [],
      totalPages: 0,
      currentPage: page,
      total: 0
    });
  } catch (error) {
    console.error('Error fetching purchased content:', error);
    res.status(500).json({ error: 'Failed to fetch purchased content' });
  }
});

// Upload content
router.post('/upload', auth, upload.single('file'), [
  body('title').notEmpty().withMessage('Title is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('price').isNumeric().withMessage('Price must be a number'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const { title, description, price, isPublic, tags } = req.body;
    const creatorAddress = req.user.address;
    
    // Upload file to Walrus
    const uploadResult = await walrusService.uploadEncryptedFile(req.file);
    
    // Create content record
    const content = new Content({
      title,
      description,
      creatorAddress,
      type: req.file.mimetype.split('/')[0],
      walrusBlobId: uploadResult.blobId,
      encryptionKey: uploadResult.encryptionKey,
      price: parseFloat(price),
      isPublic: isPublic === 'true',
      tags: tags ? JSON.parse(tags) : [],
      uploadTimestamp: Date.now(),
      isActive: true
    });
    
    await content.save();
    
    // Clean up uploaded file
    fs.unlinkSync(req.file.path);
    
    res.status(201).json(content);
  } catch (error) {
    console.error('Error uploading content:', error);
    res.status(500).json({ error: 'Failed to upload content' });
  }
});

// Purchase content access
router.post('/purchase/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { price } = req.body;
    const userAddress = req.user.address;
    
    const content = await Content.findById(id);
    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }
    
    if (content.isPublic) {
      return res.status(400).json({ error: 'Content is free' });
    }
    
    if (content.creatorAddress === userAddress) {
      return res.status(400).json({ error: 'Cannot purchase own content' });
    }
    
    // Record purchase (in real implementation, this would involve smart contract interaction)
    content.accessCount += 1;
    content.totalEarnings += price * 0.95; // 95% to creator
    await content.save();
    
    res.json({ 
      success: true, 
      message: 'Content purchased successfully',
      encryptionKey: content.encryptionKey 
    });
  } catch (error) {
    console.error('Error purchasing content:', error);
    res.status(500).json({ error: 'Failed to purchase content' });
  }
});

// Tip creator
router.post('/tip/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;
    const userAddress = req.user.address;
    
    const content = await Content.findById(id);
    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }
    
    // Record tip (in real implementation, this would involve smart contract interaction)
    content.totalEarnings += amount * 0.95; // 95% to creator
    await content.save();
    
    res.json({ success: true, message: 'Tip sent successfully' });
  } catch (error) {
    console.error('Error sending tip:', error);
    res.status(500).json({ error: 'Failed to send tip' });
  }
});

// Get single content
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const content = await Content.findById(id)
      .populate('creator', 'username avatar');
    
    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }
    
    res.json(content);
  } catch (error) {
    console.error('Error fetching content:', error);
    res.status(500).json({ error: 'Failed to fetch content' });
  }
});

// Update content
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, price, isPublic } = req.body;
    const userAddress = req.user.address;
    
    const content = await Content.findById(id);
    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }
    
    if (content.creatorAddress !== userAddress) {
      return res.status(403).json({ error: 'Not authorized to update this content' });
    }
    
    content.title = title || content.title;
    content.description = description || content.description;
    content.price = price !== undefined ? price : content.price;
    content.isPublic = isPublic !== undefined ? isPublic : content.isPublic;
    
    await content.save();
    
    res.json(content);
  } catch (error) {
    console.error('Error updating content:', error);
    res.status(500).json({ error: 'Failed to update content' });
  }
});

// Delete content
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userAddress = req.user.address;
    
    const content = await Content.findById(id);
    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }
    
    if (content.creatorAddress !== userAddress) {
      return res.status(403).json({ error: 'Not authorized to delete this content' });
    }
    
    content.isActive = false;
    await content.save();
    
    res.json({ success: true, message: 'Content deleted successfully' });
  } catch (error) {
    console.error('Error deleting content:', error);
    res.status(500).json({ error: 'Failed to delete content' });
  }
});

module.exports = router;