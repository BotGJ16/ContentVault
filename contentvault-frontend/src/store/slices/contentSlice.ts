import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { contentApi } from '@/services/api';

export interface Content {
  id: string;
  title: string;
  description: string;
  creator: string;
  creatorAddress: string;
  type: 'image' | 'video' | 'audio' | 'document';
  thumbnail?: string;
  walrusBlobId: string;
  encryptionKey?: string;
  price: number;
  isPublic: boolean;
  isPremium: boolean;
  uploadTimestamp: number;
  accessExpiration?: number;
  totalEarnings: number;
  accessCount: number;
  isActive: boolean;
  tags: string[];
}

export interface ContentUpload {
  title: string;
  description: string;
  file: File;
  price: number;
  isPublic: boolean;
  tags: string[];
  accessExpiration?: number;
}

interface ContentState {
  contents: Content[];
  featuredContent: Content[];
  userContent: Content[];
  purchasedContent: Content[];
  currentContent: Content | null;
  isLoading: boolean;
  error: string | null;
  uploadProgress: number;
  hasMore: boolean;
  page: number;
}

const initialState: ContentState = {
  contents: [],
  featuredContent: [],
  userContent: [],
  purchasedContent: [],
  currentContent: null,
  isLoading: false,
  error: null,
  uploadProgress: 0,
  hasMore: true,
  page: 1,
};

// Async thunks
export const fetchContent = createAsyncThunk(
  'content/fetchContent',
  async (params: { page?: number; limit?: number; category?: string; search?: string }) => {
    const response = await contentApi.getContent(params);
    return response.data;
  }
);

export const fetchFeaturedContent = createAsyncThunk(
  'content/fetchFeaturedContent',
  async () => {
    const response = await contentApi.getFeaturedContent();
    return response.data;
  }
);

export const fetchUserContent = createAsyncThunk(
  'content/fetchUserContent',
  async (address: string) => {
    const response = await contentApi.getUserContent(address);
    return response.data;
  }
);

export const fetchPurchasedContent = createAsyncThunk(
  'content/fetchPurchasedContent',
  async (address: string) => {
    const response = await contentApi.getPurchasedContent(address);
    return response.data;
  }
);

export const uploadContent = createAsyncThunk(
  'content/uploadContent',
  async (data: ContentUpload, { dispatch }) => {
    const response = await contentApi.uploadContent(data, (progress) => {
      dispatch(setUploadProgress(progress));
    });
    return response.data;
  }
);

export const purchaseContent = createAsyncThunk(
  'content/purchaseContent',
  async ({ contentId, price }: { contentId: string; price: number }) => {
    const response = await contentApi.purchaseContent(contentId, price);
    return response.data;
  }
);

export const tipCreator = createAsyncThunk(
  'content/tipCreator',
  async ({ contentId, amount }: { contentId: string; amount: number }) => {
    const response = await contentApi.tipCreator(contentId, amount);
    return response.data;
  }
);

const contentSlice = createSlice({
  name: 'content',
  initialState,
  reducers: {
    setCurrentContent: (state, action: PayloadAction<Content | null>) => {
      state.currentContent = action.payload;
    },
    setUploadProgress: (state, action: PayloadAction<number>) => {
      state.uploadProgress = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    resetUploadProgress: (state) => {
      state.uploadProgress = 0;
    },
    addContent: (state, action: PayloadAction<Content>) => {
      state.contents.unshift(action.payload);
      state.userContent.unshift(action.payload);
    },
    updateContentInState: (state, action: PayloadAction<Content>) => {
      const index = state.contents.findIndex(c => c.id === action.payload.id);
      if (index !== -1) {
        state.contents[index] = action.payload;
      }
      
      const userIndex = state.userContent.findIndex(c => c.id === action.payload.id);
      if (userIndex !== -1) {
        state.userContent[userIndex] = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch content
      .addCase(fetchContent.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchContent.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload.page === 1) {
          state.contents = action.payload.data;
        } else {
          state.contents = [...state.contents, ...action.payload.data];
        }
        state.hasMore = action.payload.hasMore;
        state.page = action.payload.page;
      })
      .addCase(fetchContent.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch content';
      })
      // Fetch featured content
      .addCase(fetchFeaturedContent.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchFeaturedContent.fulfilled, (state, action) => {
        state.isLoading = false;
        state.featuredContent = action.payload;
      })
      .addCase(fetchFeaturedContent.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch featured content';
      })
      // Fetch user content
      .addCase(fetchUserContent.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchUserContent.fulfilled, (state, action) => {
        state.isLoading = false;
        state.userContent = action.payload;
      })
      .addCase(fetchUserContent.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch user content';
      })
      // Fetch purchased content
      .addCase(fetchPurchasedContent.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchPurchasedContent.fulfilled, (state, action) => {
        state.isLoading = false;
        state.purchasedContent = action.payload;
      })
      .addCase(fetchPurchasedContent.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch purchased content';
      })
      // Upload content
      .addCase(uploadContent.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(uploadContent.fulfilled, (state, action) => {
        state.isLoading = false;
        state.uploadProgress = 100;
        state.contents.unshift(action.payload);
        state.userContent.unshift(action.payload);
      })
      .addCase(uploadContent.rejected, (state, action) => {
        state.isLoading = false;
        state.uploadProgress = 0;
        state.error = action.error.message || 'Failed to upload content';
      })
      // Purchase content
      .addCase(purchaseContent.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(purchaseContent.fulfilled, (state, action) => {
        state.isLoading = false;
        state.purchasedContent.push(action.payload);
      })
      .addCase(purchaseContent.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to purchase content';
      })
      // Tip creator
      .addCase(tipCreator.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(tipCreator.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(tipCreator.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to send tip';
      });
  },
});

export const {
  setCurrentContent,
  setUploadProgress,
  clearError,
  resetUploadProgress,
  addContent,
  updateContentInState,
} = contentSlice.actions;

export default contentSlice.reducer;