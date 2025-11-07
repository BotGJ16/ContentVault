const axios = require('axios');
const CryptoJS = require('crypto-js');
const fs = require('fs');
const path = require('path');

class WalrusService {
  constructor() {
    this.baseUrl = process.env.WALRUS_RPC_URL || 'https://walrus-testnet.rpc.mystenlabs.com';
    this.publisherUrl = process.env.WALRUS_PUBLISHER_URL || 'https://walrus-testnet.publisher.mystenlabs.com';
    this.aggrUrl = process.env.WALRUS_AGGR_URL || 'https://walrus-testnet.aggr.mystenlabs.com';
    this.apiKey = process.env.WALRUS_API_KEY;
  }

  // Upload file to Walrus
  async uploadFile(file, metadata = {}) {
    try {
      const formData = new FormData();
      
      // Read file buffer
      const fileBuffer = fs.readFileSync(file.path);
      const fileBlob = new Blob([fileBuffer]);
      
      formData.append('file', fileBlob, file.originalname);
      formData.append('metadata', JSON.stringify(metadata));

      const response = await axios.post(
        `${this.publisherUrl}/v1/store`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` }),
          },
          timeout: 300000, // 5 minutes timeout for large files
        }
      );

      if (response.data.newlyCreated) {
        return {
          blobId: response.data.newlyCreated.blobObject.blobId,
          storageResource: response.data.newlyCreated.blobObject.storageResource,
          registeredEpoch: response.data.newlyCreated.blobObject.registeredEpoch,
          success: true,
        };
      } else if (response.data.alreadyCertified) {
        return {
          blobId: response.data.alreadyCertified.blobId,
          storageResource: response.data.alreadyCertified.storageResource,
          registeredEpoch: response.data.alreadyCertified.registeredEpoch,
          success: true,
        };
      }

      throw new Error('Unexpected response format from Walrus');
    } catch (error) {
      console.error('Error uploading to Walrus:', error);
      throw new Error(`Failed to upload to Walrus: ${error.message}`);
    }
  }

  // Read blob from Walrus
  async readBlob(blobId) {
    try {
      const response = await axios.get(
        `${this.aggrUrl}/v1/${blobId}`,
        {
          responseType: 'arraybuffer',
          timeout: 60000, // 1 minute timeout
        }
      );

      return {
        data: Buffer.from(response.data),
        contentType: response.headers['content-type'],
        success: true,
      };
    } catch (error) {
      console.error('Error reading from Walrus:', error);
      throw new Error(`Failed to read from Walrus: ${error.message}`);
    }
  }

  // Get blob metadata
  async getBlobMetadata(blobId) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/v1/${blobId}/metadata`,
        {
          timeout: 30000,
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error getting blob metadata:', error);
      throw new Error(`Failed to get blob metadata: ${error.message}`);
    }
  }

  // Check if blob exists
  async blobExists(blobId) {
    try {
      await axios.head(`${this.baseUrl}/v1/${blobId}/metadata`, { timeout: 10000 });
      return true;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return false;
      }
      throw error;
    }
  }

  // Delete blob (if supported by the Walrus instance)
  async deleteBlob(blobId) {
    try {
      const response = await axios.delete(
        `${this.publisherUrl}/v1/${blobId}`,
        {
          headers: {
            ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` }),
          },
          timeout: 60000,
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error deleting blob:', error);
      throw new Error(`Failed to delete blob: ${error.message}`);
    }
  }

  // Encrypt file before upload
  encryptFile(fileBuffer, key) {
    try {
      const encrypted = CryptoJS.AES.encrypt(fileBuffer.toString('base64'), key);
      return Buffer.from(encrypted.toString(), 'utf-8');
    } catch (error) {
      console.error('Error encrypting file:', error);
      throw new Error(`Failed to encrypt file: ${error.message}`);
    }
  }

  // Decrypt file after download
  decryptFile(encryptedBuffer, key) {
    try {
      const encryptedData = encryptedBuffer.toString('utf-8');
      const decrypted = CryptoJS.AES.decrypt(encryptedData, key);
      const decryptedBase64 = decrypted.toString(CryptoJS.enc.Utf8);
      return Buffer.from(decryptedBase64, 'base64');
    } catch (error) {
      console.error('Error decrypting file:', error);
      throw new Error(`Failed to decrypt file: ${error.message}`);
    }
  }

  // Generate encryption key
  generateEncryptionKey() {
    return CryptoJS.lib.WordArray.random(256/8).toString();
  }

  // Upload encrypted file
  async uploadEncryptedFile(file, encryptionKey = null) {
    try {
      const key = encryptionKey || this.generateEncryptionKey();
      
      // Read and encrypt file
      const fileBuffer = fs.readFileSync(file.path);
      const encryptedBuffer = this.encryptFile(fileBuffer, key);
      
      // Create temporary encrypted file
      const encryptedFilePath = path.join('/tmp', `encrypted_${Date.now()}_${file.originalname}`);
      fs.writeFileSync(encryptedFilePath, encryptedBuffer);
      
      // Upload encrypted file
      const encryptedFile = {
        ...file,
        path: encryptedFilePath,
        size: encryptedBuffer.length,
      };
      
      const uploadResult = await this.uploadFile(encryptedFile, {
        originalName: file.originalname,
        originalSize: file.size,
        encrypted: true,
      });
      
      // Clean up temporary file
      fs.unlinkSync(encryptedFilePath);
      
      return {
        ...uploadResult,
        encryptionKey: key,
      };
    } catch (error) {
      console.error('Error uploading encrypted file:', error);
      throw error;
    }
  }

  // Download and decrypt file
  async downloadAndDecryptFile(blobId, encryptionKey) {
    try {
      const result = await this.readBlob(blobId);
      const decryptedBuffer = this.decryptFile(result.data, encryptionKey);
      
      return {
        data: decryptedBuffer,
        contentType: result.contentType,
        success: true,
      };
    } catch (error) {
      console.error('Error downloading and decrypting file:', error);
      throw error;
    }
  }

  // Get storage status
  async getStorageStatus() {
    try {
      const response = await axios.get(`${this.baseUrl}/v1/system/status`, {
        timeout: 10000,
      });
      
      return response.data;
    } catch (error) {
      console.error('Error getting storage status:', error);
      throw new Error(`Failed to get storage status: ${error.message}`);
    }
  }

  // Estimate storage cost
  async estimateStorageCost(fileSize) {
    try {
      const response = await axios.post(
        `${this.publisherUrl}/v1/cost`,
        { size: fileSize },
        { timeout: 30000 }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error estimating storage cost:', error);
      throw new Error(`Failed to estimate storage cost: ${error.message}`);
    }
  }
}

module.exports = WalrusService;