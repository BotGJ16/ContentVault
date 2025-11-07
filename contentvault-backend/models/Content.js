const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    maxlength: 1000
  },
  creatorAddress: {
    type: String,
    required: true,
    lowercase: true,
    index: true
  },
  type: {
    type: String,
    enum: ['image', 'video', 'audio', 'document'],
    required: true
  },
  walrusBlobId: {
    type: String,
    required: true,
    unique: true
  },
  encryptionKey: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    default: 0,
    min: 0
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  uploadTimestamp: {
    type: Number,
    default: Date.now,
    index: true
  },
  accessExpiration: {
    type: Number,
    default: 0 // 0 means no expiration
  },
  totalEarnings: {
    type: Number,
    default: 0
  },
  accessCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  tags: [{
    type: String,
    lowercase: true,
    trim: true
  }],
  thumbnail: {
    type: String,
    default: null
  },
  metadata: {
    originalName: String,
    originalSize: Number,
    mimeType: String,
    duration: Number, // for audio/video
    dimensions: {
      width: Number,
      height: Number
    }
  }
}, {
  timestamps: true
});

// Indexes for better query performance
contentSchema.index({ creatorAddress: 1, uploadTimestamp: -1 });
contentSchema.index({ type: 1, isActive: 1 });
contentSchema.index({ tags: 1 });
contentSchema.index({ price: 1, isPublic: 1 });
contentSchema.index({ accessCount: -1 });
contentSchema.index({ totalEarnings: -1 });

// Virtual for creator info
contentSchema.virtual('creator', {
  ref: 'User',
  localField: 'creatorAddress',
  foreignField: 'address',
  justOne: true
});

// Instance methods
contentSchema.methods.incrementAccessCount = async function() {
  this.accessCount += 1;
  await this.save();
  return this.accessCount;
};

contentSchema.methods.addEarnings = async function(amount) {
  this.totalEarnings += amount;
  await this.save();
  return this.totalEarnings;
};

contentSchema.methods.isAccessibleBy = function(userAddress) {
  if (this.isPublic) return true;
  if (this.creatorAddress.toLowerCase() === userAddress.toLowerCase()) return true;
  
  // Check if user has purchased access (would need to check purchase records)
  // This is a placeholder for the actual access control logic
  return false;
};

// Static methods
contentSchema.statics.findByCreator = function(address) {
  return this.find({ 
    creatorAddress: address.toLowerCase(), 
    isActive: true 
  }).sort({ uploadTimestamp: -1 });
};

contentSchema.statics.findPublicContent = function() {
  return this.find({ 
    isPublic: true, 
    isActive: true 
  }).sort({ uploadTimestamp: -1 });
};

contentSchema.statics.findPremiumContent = function() {
  return this.find({ 
    isPublic: false, 
    isActive: true,
    price: { $gt: 0 }
  }).sort({ totalEarnings: -1 });
};

contentSchema.statics.searchContent = function(query) {
  return this.find({
    $and: [
      { isActive: true },
      {
        $or: [
          { title: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } },
          { tags: { $in: [new RegExp(query, 'i')] } }
        ]
      }
    ]
  });
};

module.exports = mongoose.model('Content', contentSchema);