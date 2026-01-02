# API Configuration Guide

## Overview

This document describes how to configure the Bilibili extraction API endpoints for the application.

## Configuration Method

The application uses environment variables to configure API endpoints. This allows for easy switching between different API providers or environments without code changes.

### Environment Variables

Create a `.env` file in the project root with the following variables:

```env
# Base URL for the Bilibili extraction API
VITE_API_BASE_URL=https://api.example.com

# API timeout in milliseconds (default: 30000)
VITE_API_TIMEOUT=30000

# Enable retry logic for failed requests (default: true)
VITE_API_ENABLE_RETRY=true
```

**Note:** A `.env.example` file is provided as a template. Copy it to `.env` and update with actual values.

## Required API Endpoints

The application expects the following API endpoints to be available:

### 1. Video Extraction Endpoint

**Endpoint:** `POST /extract`

**Purpose:** Extract video download URLs from a Bilibili video link

**Request Headers:**
```
Content-Type: application/json
g-footer: <hash of request data + timestamp>
g-timestamp: <unix timestamp in seconds>
```

**Request Body:**
```json
{
  "link": "https://www.bilibili.com/video/BV1UNs6zBEkN"
}
```

**Expected Response:**
```json
{
  "text": "Video title or description",
  "medias": [
    {
      "media_type": "mp4",
      "resource_url": "https://download.url/video.mp4",
      "preview_url": "https://preview.url/thumbnail.jpg"
    }
  ],
  "overseas": 0
}
```

**Response Fields:**
- `text` (string): Video title or description
- `medias` (array): Array of available media formats
  - `media_type` (string): Format type (e.g., "mp4", "flv")
  - `resource_url` (string): Direct download URL
  - `preview_url` (string): Thumbnail/preview image URL
- `overseas` (number): Overseas availability flag

### 2. Video Search Endpoint

**Endpoint:** `GET /search`

**Purpose:** Search for Bilibili videos by keyword

**Request Headers:**
```
Content-Type: application/json
g-footer: <hash of request data + timestamp>
g-timestamp: <unix timestamp in seconds>
```

**Query Parameters:**
- `q` (string): Search query
- `pn` (number): Page number (default: 1)

**Expected Response:**
```json
{
  "result": {
    "video": [
      {
        "bvid": "BV1UNs6zBEkN",
        "title": "Video Title",
        "pic": "https://thumbnail.url/image.jpg",
        "duration": "12:34",
        "author": "Uploader Name",
        "play": 10000,
        "pubdate": 1234567890
      }
    ]
  },
  "page": {
    "count": 100,
    "pn": 1,
    "ps": 20
  }
}
```

## Header Generation

The application automatically generates required headers for API requests:

### g-timestamp
- Current Unix timestamp in seconds
- Generated at request time
- Example: `1704067200`

### g-footer
- MD5 hash of request data + timestamp
- Format: `md5(JSON.stringify(requestData) + timestamp)`
- Example: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`

**Note:** The current implementation uses a simple MD5 hash. If the actual API requires a different signing algorithm (e.g., HMAC-SHA256 with a secret key), update the `generateFooter()` method in `src/services/APIClient.ts`.

## Testing API Configuration

### 1. Verify Environment Variables

Check that environment variables are loaded correctly:

```typescript
console.log('API Base URL:', import.meta.env.VITE_API_BASE_URL);
console.log('API Timeout:', import.meta.env.VITE_API_TIMEOUT);
console.log('Retry Enabled:', import.meta.env.VITE_API_ENABLE_RETRY);
```

### 2. Test API Connectivity

Create a simple test to verify API connectivity:

```typescript
import { createAPIClient } from './services/APIClient';

async function testAPI() {
  const client = createAPIClient();
  
  try {
    // Test extraction endpoint
    const result = await client.extractVideo('https://www.bilibili.com/video/BV1UNs6zBEkN');
    console.log('Extraction successful:', result);
  } catch (error) {
    console.error('Extraction failed:', error);
  }
  
  try {
    // Test search endpoint
    const results = await client.searchVideos('test', 1);
    console.log('Search successful:', results);
  } catch (error) {
    console.error('Search failed:', error);
  }
}

testAPI();
```

### 3. Verify Response Format

Ensure the API responses match the expected format:

- Check that all required fields are present
- Verify data types match expectations
- Test with various video IDs and search queries
- Verify error responses are handled correctly

## Common Issues and Solutions

### Issue: "Invalid response format" errors

**Cause:** API response structure doesn't match expected format

**Solution:**
1. Log the actual API response to see the structure
2. Update the response parsing logic in `APIClient.ts` if needed
3. Verify the API documentation matches implementation

### Issue: "Network error" or timeout

**Cause:** API endpoint is unreachable or slow

**Solution:**
1. Verify the `VITE_API_BASE_URL` is correct
2. Check network connectivity
3. Increase `VITE_API_TIMEOUT` if needed
4. Verify the API server is running

### Issue: Authentication/authorization errors

**Cause:** Header generation doesn't match API requirements

**Solution:**
1. Verify the `g-footer` generation algorithm matches API requirements
2. Check if additional headers are needed (e.g., API key, authorization token)
3. Update `generateHeaders()` method in `APIClient.ts` if needed

### Issue: CORS errors in development

**Cause:** Browser blocking cross-origin requests

**Solution:**
1. Configure Vite proxy in `vite.config.ts`:
```typescript
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'https://actual-api-url.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
});
```
2. Update `VITE_API_BASE_URL` to use the proxy: `/api`

## Updating API Configuration

### For Development

1. Update `.env` file with new values
2. Restart the development server (`npm run electron:dev`)
3. Test the changes

### For Production Build

1. Update `.env` file before building
2. Run the build: `npm run build:portable`
3. The environment variables will be embedded in the build

**Note:** Environment variables are embedded at build time. To change them after building, you need to rebuild the application.

## Security Considerations

### Protecting API Credentials

If the API requires authentication credentials (API keys, secrets):

1. **Never commit credentials to version control**
   - `.env` is already in `.gitignore`
   - Use `.env.example` for templates only

2. **Use environment-specific files**
   - `.env.development` for development
   - `.env.production` for production
   - Vite automatically loads the correct file

3. **Consider using a secrets manager**
   - For production deployments
   - Inject secrets at build/runtime

### API Key Rotation

If the API uses keys that need rotation:

1. Update the `.env` file with new credentials
2. Rebuild the application
3. Distribute the new executable

## Alternative Configuration Methods

### 1. Configuration File

Instead of environment variables, you can use a JSON configuration file:

```typescript
// config.json
{
  "api": {
    "baseURL": "https://api.example.com",
    "timeout": 30000,
    "enableRetry": true
  }
}

// Load in APIClient.ts
import config from '../config.json';
const DEFAULT_CONFIG = config.api;
```

**Pros:** Easy to edit without rebuilding
**Cons:** Configuration file is visible in the executable

### 2. Runtime Configuration

Allow users to configure API endpoints through the UI:

```typescript
// Store in localStorage or electron-store
const config = {
  baseURL: localStorage.getItem('api_base_url') || 'https://api.example.com'
};
```

**Pros:** Users can change endpoints without rebuilding
**Cons:** More complex, requires UI for configuration

## Next Steps

1. **Obtain actual API endpoints**
   - Contact API provider or check documentation
   - Get authentication credentials if required

2. **Update .env file**
   - Replace `https://api.example.com` with actual URL
   - Update timeout if needed

3. **Test API connectivity**
   - Run the test script above
   - Verify responses match expected format

4. **Update header generation if needed**
   - Check if `g-footer` algorithm is correct
   - Add any additional required headers

5. **Document any API-specific requirements**
   - Rate limits
   - Authentication requirements
   - Special headers or parameters

## References

- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Axios Configuration](https://axios-http.com/docs/req_config)
- API Client Implementation: `src/services/APIClient.ts`
