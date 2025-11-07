const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  address: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    index: true
  },
  username: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    minlength: 3,
    maxlength: 30,
    match: /^[a-zA-Z0-9_]+$/
  },
  email: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  avatar: {
    type: String,
    default: null
  },
  bio: {
    type: String,
    maxlength: 500,
    default: ''
  },
  isCreator: {
    type: Boolean,
    default: false
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  tokenBalance: {
    type: String,
    default: '0'
  },
  totalEarnings: {
    type: String,
    default: '0'
  },
  followers: [{
    type: String,
    lowercase: true
  }],
  following: [{
    type: String,
    lowercase: true
  }],
  socialLinks: {
    twitter: String,
    instagram: String,
    youtube: String,
    website: String
  },
  preferences: {
    emailNotifications: {
      type: Boolean,
      default: true
    },
    pushNotifications: {
      type: Boolean,
      default: true
    },
    language: {
      type: String,
      default: 'en'
    },
    currency: {
      type: String,
      default: 'ETH'
    }
  },
  stats: {
    contentViews: {
      type: Number,
      default: 0
    },
    totalTips: {
      type: Number,
      default: 0
    },
    totalPurchases: {
      type: Number,
      default: 0
    },
    joinDate: {
      type: Date,
      default: Date.now
    }
  }
}, {
  timestamps: true
});

// Indexes for better query performance
userSchema.index({ address: 1 });
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });
userSchema.index({ isCreator: 1 });
userSchema.index({ isVerified: 1 });

// Virtual for follower count
userSchema.virtual('followerCount').get(function() {
  return this.followers.length;
});

// Virtual for following count
userSchema.virtual('followingCount').get(function() {
  return this.following.length;
});

// Instance methods
userSchema.methods.follow = async function(userAddress) {
  if (!this.following.includes(userAddress.toLowerCase())) {
    this.following.push(userAddress.toLowerCase());
    await this.save();
  }
  return this;
};

userSchema.methods.unfollow = async function(userAddress) {
  this.following = this.following.filter(addr => addr !== userAddress.toLowerCase());
  await this.save();
  return this;
};

userSchema.methods.addFollower = async function(userAddress) {
  if (!this.followers.includes(userAddress.toLowerCase())) {
    this.followers.push(userAddress.toLowerCase());
    await this.save();
  }
  return this;
};

userSchema.methods.removeFollower = async function(userAddress) {
  this.followers = this.followers.filter(addr => addr !== userAddress.toLowerCase());
  await this.save();
  return this;
};

userSchema.methods.isFollowing = function(userAddress) {
  return this.following.includes(userAddress.toLowerCase());
};

userSchema.methods.updateStats = async function(type) {
  switch (type) {
    case 'view':
      this.stats.contentViews += 1;
      break;
    case 'tip':
      this.stats.totalTips += 1;
      break;
    case 'purchase':
      this.stats.totalPurchases += 1;
      break;
  }
  await this.save();
  return this;
};

// Static methods
userSchema.statics.findByAddress = function(address) {
  return this.findOne({ address: address.toLowerCase() });
};

userSchema.statics.findCreators = function() {
  return this.find({ isCreator: true })
    .sort({ totalEarnings: -1 })
    .limit(50);
};

userSchema.statics.findVerified = function() {
  return this.find({ isVerified: true })
    .sort({ followerCount: -1 })
    .limit(50);
};

userSchema.statics.searchUsers = function(query) {
  return this.find({
    $or: [
      { username: { $regex: query, $options: 'i' } },
      { address: { $regex: query, $options: 'i' } }
    ]
  });
};

// Pre-save middleware
userSchema.pre('save', function(next) {
  if (this.username) {
    this.username = this.username.toLowerCase();
  }
  if (this.email) {
    this.email = this.email.toLowerCase();
  }
  this.address = this.address.toLowerCase();
  next();
});

module.exports = mongoose.model('User', userSchema);