# ContentVault Deployment Guide

## Overview
This guide provides step-by-step instructions for deploying ContentVault DApp for the Walrus Buildathon.

## Prerequisites
- Node.js 16+ and npm/yarn
- MetaMask wallet with testnet ETH
- Git
- Docker (optional)
- Walrus testnet access

## Deployment Steps

### 1. Environment Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/contentvault.git
cd contentvault

# Install dependencies for all components
npm run install:all

# Or install individually
cd contentvault-frontend && npm install
cd ../contentvault-backend && npm install
cd ../contentvault-contracts && npm install
```

### 2. Smart Contract Deployment

```bash
cd contentvault-contracts

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Deploy contracts to testnet
npm run deploy:testnet

# Or deploy to mainnet
npm run deploy:mainnet

# Save contract addresses for frontend configuration
```

### 3. Backend Deployment

```bash
cd contentvault-backend

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Database setup
npm run db:migrate
npm run db:seed

# Start development server
npm run dev

# Or start production server
npm run start:prod
```

### 4. Frontend Deployment

```bash
cd contentvault-frontend

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Build for production
npm run build

# Start development server
npm run dev

# Or deploy to Vercel/Netlify
npm run deploy
```

## Environment Variables

### Frontend (.env.local)
```
NEXT_PUBLIC_WALRUS_RPC_URL=https://walrus-testnet.rpc.mystenlabs.com
NEXT_PUBLIC_CHAIN_ID=5
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_TOKEN_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_BACKEND_URL=https://api.contentvault.io
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
```

### Backend (.env)
```
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://...
JWT_SECRET=your_jwt_secret
WALRUS_PRIVATE_KEY=your_private_key
WALRUS_RPC_URL=https://walrus-testnet.rpc.mystenlabs.com
ETHERSCAN_API_KEY=your_etherscan_api_key
```

### Contracts (.env)
```
PRIVATE_KEY=your_private_key
INFURA_PROJECT_ID=your_infura_id
ETHERSCAN_API_KEY=your_etherscan_api_key
```

## Cloud Deployment Options

### Vercel (Frontend)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Railway/Render (Backend)
```bash
# Connect your GitHub repo
# Set environment variables in dashboard
# Deploy automatically on push
```

### AWS/GCP (Full Stack)
```bash
# Use provided Terraform configurations
terraform init
terraform plan
terraform apply
```

## Testing

### Run Tests
```bash
# Frontend tests
npm run test:frontend

# Backend tests
npm run test:backend

# Contract tests
npm run test:contracts

# Integration tests
npm run test:integration
```

### Manual Testing Checklist
- [ ] Wallet connection works
- [ ] Content upload to Walrus
- [ ] Payment processing
- [ ] Content access control
- [ ] AI recommendations
- [ ] Encryption/decryption
- [ ] Mobile responsiveness

## Security Considerations

### Smart Contract Security
- Contracts audited with Slither
- Reentrancy protection implemented
- Access control with role-based permissions
- Emergency pause functionality

### Backend Security
- Rate limiting implemented
- JWT authentication
- Input validation and sanitization
- CORS configuration
- Helmet security headers

### Frontend Security
- Content Security Policy
- HTTPS enforcement
- Secure wallet integration
- Input validation

## Monitoring & Analytics

### Backend Monitoring
```bash
# PM2 for process management
npm install -g pm2
pm2 start server.js --name contentvault-api

# Logging with Winston
logs stored in ./logs directory
```

### Frontend Analytics
```bash
# Google Analytics 4
# Mixpanel for user tracking
# Sentry for error tracking
```

## Troubleshooting

### Common Issues

1. **Wallet Connection Failed**
   - Check MetaMask network settings
   - Ensure correct chain ID
   - Verify RPC URLs

2. **Content Upload Failed**
   - Check Walrus RPC connectivity
   - Verify file size limits
   - Check encryption keys

3. **Payment Processing Failed**
   - Verify contract addresses
   - Check gas prices
   - Ensure sufficient balance

4. **AI Recommendations Not Working**
   - Check TensorFlow installation
   - Verify model initialization
   - Check interaction data

### Debug Mode
```bash
# Enable debug logging
DEBUG=contentvault:* npm run dev

# Verbose logging
LOG_LEVEL=verbose npm run dev
```

## Performance Optimization

### Frontend Optimization
- Code splitting with Next.js
- Image optimization with next/image
- Lazy loading for content
- Service worker for caching

### Backend Optimization
- Database indexing
- Redis caching
- API response compression
- Rate limiting

### Storage Optimization
- Content compression
- Thumbnail generation
- CDN integration
- Lazy loading

## Backup & Recovery

### Database Backup
```bash
# MongoDB backup
mongodump --uri="mongodb://..." --out=./backup

# Automated daily backups
# Store in cloud storage (S3, GCS)
```

### Contract State Backup
- Monitor contract events
- Backup critical state
- Emergency recovery procedures

## Support & Maintenance

### Regular Maintenance
- Update dependencies monthly
- Monitor contract events
- Review security logs
- Performance optimization

### Community Support
- Discord server setup
- Documentation updates
- Bug bounty program
- Regular community calls

## Success Metrics

### Technical Metrics
- Uptime: 99.9%
- Response time: <200ms
- Error rate: <0.1%
- Content delivery: <2s

### Business Metrics
- User acquisition
- Creator onboarding
- Content uploads
- Revenue generated

## Next Steps

### Post-Hackathon
1. Security audit
2. Performance optimization
3. Feature enhancements
4. Community growth
5. Partnership development

### Scaling Plan
1. Multi-chain support
2. Advanced AI features
3. Enterprise solutions
4. Mobile app launch
5. API marketplace

## Resources

### Documentation
- [API Documentation](https://docs.contentvault.io/api)
- [Smart Contract Docs](https://docs.contentvault.io/contracts)
- [Integration Guide](https://docs.contentvault.io/integration)

### Community
- [Discord Server](https://discord.gg/contentvault)
- [Twitter](https://twitter.com/contentvault)
- [GitHub Issues](https://github.com/yourusername/contentvault/issues)

### Support
- Email: support@contentvault.io
- Technical Support: tech@contentvault.io
- Business Inquiries: business@contentvault.io

---

Built with ❤️ for the decentralized creator economy.