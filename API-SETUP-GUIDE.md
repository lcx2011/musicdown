# Bilibili API Setup Guide

## Overview

This guide explains how to configure the actual Bilibili extraction API endpoints for the application. The application requires a backend API service that can extract video download URLs from Bilibili video links and search for videos.

## Prerequisites

Before configuring the API, you need:

1. **A Bilibili extraction API service** - This can be:
   - A self-hosted extraction service
   - A third-party Bilibili API provider
   - Bilibili's official API (requires authentication)

2. **API endpoint URL** - The base URL where your API is hosted

3. **API documentation** - Understanding of the request/response format

## Step 1: Obtain API Endpoint

### Option A: Self-Hosted API (Recommended)

If you're running your own Bilibili extraction service:

1. Deploy your extraction API service
2. Note the base URL (e.g., `https://your-api-server.com`)
3. Ensure the following endpoints are available:
   - `POST /extract` - Extract video download URLs
   - `GET /search` - Search for videos

### Option B: Third-Party API Service

If using a third-party service:

1. Sign up for the service
2. Obtain your API endpoint URL
3. Get any required authentication credentials (API keys, tokens)
4. Review their API documentation for request/response format

### Option C: Bilibili Official API

If using Bilibili's official API:

1. Register for Bilibili Open Platform
2. Create an application and get credentials
3. Note the API endpoint and authentication requirements
4. Review Bilibili's API documentation

## Step 2: Update Environment Configuration

1. **Copy the example environment file:**
   ```bash
   copy .env.example .env
   ```

2. **Edit the `.env` file:**
   ```env
   # Replace with your actual API endpoint
   VITE_API_BASE_URL=https://your-actual-api-endpoint.com
   
   # Adjust timeout if needed (in milliseconds)
   VITE_API_TIMEOUT=30000
   
   # Enable/disable retry logic
   VITE_API_ENABLE_RETRY=true
   ```

3. **Save the file**

## Step 3: Verify API Requirements

The application expects the API to provide the following endpoints:

### Endpoint 1: Video Extraction

**URL:** `POST {VITE_API_BASE_URL}/extract`

**Request Headers:**
```
Content-Type: application/json
g-footer: <MD5 hash of request body + timestamp>
g-timestamp: <Unix timestamp in seconds>
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
- `text` (string, required): Video title or description
- `medias` (array, required): Array of available media formats
  - `media_type` (string, required): Format type (e.g., "mp4", "flv")
  - `resource_url` (string, required): Direct download URL
  - `preview_url` (string, required): Thumbnail/preview image URL
- `overseas` (number, required): Overseas availability flag (0 or 1)

### Endpoint 2: Video Search

**URL:** `GET {VITE_API_BASE_URL}/search`

**Request Headers:**
```
Content-Type: application/json
g-footer: <MD5 hash of query params + timestamp>
g-timestamp: <Unix timestamp in seconds>
```

**Query Parameters:**
- `q` (string, required): Search query
- `pn` (number, optional): Page number (default: 1)

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

## Step 4: Update Header Generation (If Needed)

The application automatically generates required headers for API requests:

### Current Implementation

The `g-footer` header is currently generated using MD5 hash:

```typescript
// In src/services/APIClient.ts
private generateFooter(data: string, timestamp: string): string {
  const hash = crypto
    .createHash('md5')
    .update(data + timestamp)
    .digest('hex');
  return hash;
}
```

### If Your API Uses Different Signing

If your API requires a different signing algorithm (e.g., HMAC-SHA256 with a secret key):

1. **Open `src/services/APIClient.ts`**

2. **Update the `generateFooter` method:**

   ```typescript
   // Example: HMAC-SHA256 with secret key
   private generateFooter(data: string, timestamp: string): string {
     const secret = process.env.VITE_API_SECRET || 'your-secret-key';
     const hmac = crypto
       .createHmac('sha256', secret)
       .update(data + timestamp)
       .digest('hex');
     return hmac;
   }
   ```

3. **Add the secret to `.env`:**
   ```env
   VITE_API_SECRET=your-actual-secret-key
   ```

### If Your API Requires Additional Headers

If your API requires additional headers (e.g., API key, authorization token):

1. **Open `src/services/APIClient.ts`**

2. **Update the `generateHeaders` method:**

   ```typescript
   private generateHeaders(data: unknown): Record<string, string> {
     const timestamp = this.generateTimestamp();
     const dataString = JSON.stringify(data);
     const footer = this.generateFooter(dataString, timestamp);

     return {
       'Content-Type': 'application/json',
       'g-footer': footer,
       'g-timestamp': timestamp,
       // Add your custom headers here
       'X-API-Key': process.env.VITE_API_KEY || '',
       'Authorization': `Bearer ${process.env.VITE_API_TOKEN || ''}`,
     };
   }
   ```

3. **Add the credentials to `.env`:**
   ```env
   VITE_API_KEY=your-api-key
   VITE_API_TOKEN=your-api-token
   ```

## Step 5: Test API Configuration

Run the API test script to verify your configuration:

```bash
npm run test:api
```

The test script will:
1. ✓ Verify environment variables are loaded
2. ✓ Test API client initialization
3. ✓ Test video extraction endpoint
4. ✓ Test video search endpoint
5. ✓ Test error handling
6. ✓ Verify header generation

### Expected Output

If everything is configured correctly:

```
╔════════════════════════════════════════════════╗
║   Bilibili API Configuration Test Suite       ║
╚════════════════════════════════════════════════╝

=== Test 1: Environment Variables ===
ℹ VITE_API_BASE_URL: https://your-api.com
ℹ VITE_API_TIMEOUT: 30000
ℹ VITE_API_ENABLE_RETRY: true
✓ Base URL is valid
✓ Environment variables configured correctly

=== Test 2: API Client Initialization ===
✓ API client created successfully

=== Test 3: Video Extraction Endpoint ===
ℹ Testing with video URL: https://www.bilibili.com/video/BV1UNs6zBEkN
ℹ Sending extraction request...
✓ Extraction request successful
ℹ Response text: Video Title
ℹ Number of media formats: 1
✓ Response format is valid

=== Test 4: Video Search Endpoint ===
ℹ Testing with search query: 测试
ℹ Sending search request...
✓ Search request successful
ℹ Total results: 100
✓ Response format is valid

=== Test 5: Error Handling ===
✓ Error handled correctly

=== Test 6: Header Generation ===
✓ Header generation is implemented

╔════════════════════════════════════════════════╗
║   Test Summary                                 ║
╚════════════════════════════════════════════════╝
✓ Environment Variables
✓ API Client Initialization
✓ Video Extraction
✓ Video Search
✓ Error Handling
✓ Header Generation

Total: 6/6 tests passed

✓ All tests passed! API configuration is correct.
```

### Troubleshooting Test Failures

#### Test 1 Fails: Environment Variables

**Problem:** `.env` file not found or variables not set

**Solution:**
1. Ensure `.env` file exists in project root
2. Copy from `.env.example` if needed
3. Verify `VITE_API_BASE_URL` is set and not the placeholder value

#### Test 3 Fails: Video Extraction

**Problem:** API endpoint not responding or wrong format

**Solutions:**
1. **Check API endpoint URL:**
   - Verify the URL is correct
   - Ensure the `/extract` endpoint exists
   - Test with curl or Postman

2. **Check request format:**
   - Verify your API expects `{ "link": "..." }` in request body
   - Update request format in `APIClient.ts` if different

3. **Check response format:**
   - Verify your API returns the expected structure
   - Update `parseExtractionResponse()` method if format differs

4. **Check authentication:**
   - Verify headers are correct
   - Update `generateFooter()` if signing algorithm differs
   - Add any required authentication headers

#### Test 4 Fails: Video Search

**Problem:** Search endpoint not responding or wrong format

**Solutions:**
1. **Check search endpoint:**
   - Verify the `/search` endpoint exists
   - Check if query parameters are correct (`q` and `pn`)

2. **Check response format:**
   - Verify your API returns `result.video` array
   - Update parsing logic if format differs

#### Network Errors

**Problem:** Connection timeout or refused

**Solutions:**
1. Check if API server is running
2. Verify firewall/network settings
3. Increase `VITE_API_TIMEOUT` in `.env`
4. Check if VPN or proxy is required

## Step 6: Update Response Parsing (If Needed)

If your API returns a different response format, update the parsing logic:

### For Extraction Response

Edit `src/services/APIClient.ts`:

```typescript
private parseExtractionResponse(data: unknown): ExtractionResponse {
  // Add your custom parsing logic here
  // Ensure it returns the ExtractionResponse interface format
  
  const response = data as any;
  
  // Example: If your API has different field names
  return {
    text: response.title || response.text,
    medias: response.media_list || response.medias,
    overseas: response.is_overseas || response.overseas || 0,
  };
}
```

### For Search Response

If search response format differs, update the `SearchService` to transform it:

Edit `src/services/SearchService.ts` to handle your API's response format.

## Step 7: Test in Application

After configuration:

1. **Start the development server:**
   ```bash
   npm run electron:dev
   ```

2. **Test search functionality:**
   - Enter a search query
   - Verify results are displayed
   - Check console for any errors

3. **Test download functionality:**
   - Click download on a video
   - Verify download starts
   - Check if file is saved to desktop

## Step 8: Build for Production

Once everything works in development:

1. **Build the portable executable:**
   ```bash
   npm run build:portable
   ```

2. **Test the built application:**
   - Run the generated `.exe` file
   - Verify all functionality works
   - Test on target Windows 7 32-bit system

## Common API Providers

### Self-Hosted Solutions

1. **bilibili-API-collect** - Community-maintained Bilibili API documentation
   - GitHub: https://github.com/SocialSisterYi/bilibili-API-collect
   - Provides API endpoints and authentication methods

2. **you-get** - Video downloader that supports Bilibili
   - Can be wrapped in a REST API
   - GitHub: https://github.com/soimort/you-get

3. **annie** - Fast video downloader
   - Supports Bilibili
   - GitHub: https://github.com/iawia002/annie

### Third-Party Services

Check for Bilibili video extraction API services online. Ensure they:
- Support the required endpoints
- Have acceptable rate limits
- Provide reliable uptime
- Match the expected request/response format

## Security Considerations

### Protecting API Credentials

1. **Never commit `.env` to version control**
   - `.env` is already in `.gitignore`
   - Only commit `.env.example` as a template

2. **Use environment-specific files:**
   ```
   .env.development  - For development
   .env.production   - For production builds
   ```

3. **For production builds:**
   - Set environment variables before building
   - Or use a secrets manager
   - Or prompt user for API endpoint on first run

### API Rate Limiting

If your API has rate limits:

1. **Implement rate limiting in the application:**
   - Add delay between requests
   - Queue requests
   - Show user-friendly messages when rate limited

2. **Update retry configuration:**
   - Adjust retry delays in `src/utils/retry.ts`
   - Increase backoff multiplier

## Next Steps

After successful configuration:

1. ✓ API endpoints configured
2. ✓ Test script passes
3. ✓ Application works in development
4. ✓ Build and test portable executable
5. → Proceed to manual testing (Task 17)
6. → Deploy to target environment

## Support

If you encounter issues:

1. Check the test script output for specific errors
2. Review API documentation from your provider
3. Check network connectivity and firewall settings
4. Verify API endpoint is accessible from your network
5. Review application logs for detailed error messages

## References

- API Client Implementation: `src/services/APIClient.ts`
- API Configuration: `API-CONFIG.md`
- Test Script: `scripts/test-api.ts`
- Environment Variables: `.env` and `.env.example`
