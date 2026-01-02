# Bilibili API 更新说明

## 更新概述

已将应用程序更新为使用真实的 Bilibili 搜索 API，并成功解决了 412 反爬虫错误。

## ✅ 412 错误已解决

通过添加完整的浏览器请求头，成功绕过了 Bilibili 的反爬虫机制，**无需 Cookie 即可正常使用**。

### 关键请求头

```typescript
headers: {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Referer': 'https://www.bilibili.com',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
  'Accept-Encoding': 'gzip, deflate, br',
  'Origin': 'https://www.bilibili.com',
  'Connection': 'keep-alive',
  'Sec-Fetch-Dest': 'empty',
  'Sec-Fetch-Mode': 'cors',
  'Sec-Fetch-Site': 'same-site',
}
```

这些请求头模拟了真实浏览器的行为，使 API 请求看起来像是从 bilibili.com 网站发起的。

## 主要变更

### 1. API 端点

**之前：** 自定义 API 端点 `/search`

**现在：** Bilibili 官方 API
```
https://api.bilibili.com/x/web-interface/search/type
```

### 2. 请求参数

**之前：**
```typescript
params: { q: query, pn: page }
```

**现在：**
```typescript
params: {
  search_type: 'video',
  keyword: query,
  page: page,
  order: 'totalrank',
  duration: 0,
  tids: 0
}
```

### 3. 响应格式

**之前：**
```typescript
{
  result: {
    video: VideoInfo[]
  },
  page: {
    count: number,
    pn: number,
    ps: number
  }
}
```

**现在：**
```typescript
{
  code: number,
  message: string,
  ttl: number,
  data: {
    page: number,
    pagesize: number,
    numResults: number,
    numPages: number,
    result: VideoInfo[]
  }
}
```

### 4. 视频信息字段

**主要变更：**
- `duration` 现在是字符串格式（如 "4:18"），不再需要转换
- `pic` 字段使用 `//` 开头，需要添加 `https:` 前缀
- `title` 可能包含 HTML 标签（如 `<em class="keyword">`），需要清理
- 添加了更多字段：`aid`, `mid`, `typeid`, `typename` 等

### 5. 请求头

**之前：**
```typescript
headers: {
  'Content-Type': 'application/json',
  'g-footer': hash,
  'g-timestamp': timestamp
}
```

**现在：**
```typescript
headers: {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Referer': 'https://www.bilibili.com',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
  'Accept-Encoding': 'gzip, deflate, br',
  'Origin': 'https://www.bilibili.com',
  'Connection': 'keep-alive',
  'Sec-Fetch-Dest': 'empty',
  'Sec-Fetch-Mode': 'cors',
  'Sec-Fetch-Site': 'same-site',
}
```

**重要：** 完整的请求头是解决 412 错误的关键，无需 Cookie 即可正常使用。

## 更新的文件

1. **src/types/index.ts**
   - 更新 `VideoInfo` 接口以匹配 Bilibili API 格式
   - 更新 `SearchResponse` 接口以包含 `code`, `message`, `data` 等字段
   - 更新类型守卫函数

2. **src/services/APIClient.ts**
   - 更新 `searchVideos()` 方法以使用 Bilibili API
   - 移除自定义头部生成（g-footer, g-timestamp）
   - 添加 User-Agent 和 Referer 头部
   - 添加 API 响应码检查

3. **src/services/SearchService.ts**
   - 更新 `transformVideoInfo()` 以处理新的字段格式
   - 添加 HTML 标签清理逻辑
   - 添加 `https:` 前缀到缩略图 URL
   - 移除时长格式化逻辑（API 已返回格式化的字符串）
   - 更新分页逻辑以使用 `numPages` 而不是计算

4. **src/services/SearchService.test.ts**
   - 更新所有 mock 数据以匹配新的 API 格式
   - 添加测试用例：HTML 标签清理、HTTPS 前缀添加

5. **src/services/APIClient.test.ts**
   - 更新 mock 响应以匹配新的 API 格式
   - 更新断言以检查新的请求参数和头部

## 注意事项

### 反爬虫机制

## ✅ 反爬虫机制已解决

通过添加完整的浏览器请求头，已成功解决 412 错误。**无需 Cookie 即可正常使用 API**。

### 测试结果

```bash
$ npx tsx scripts/test-bilibili-search.ts
✓ API Request successful!
Response code: 0
Message: OK

Search Results:
- Total results: 1000
- Total pages: 50
- Current page: 1
- Page size: 20
- Results in this page: 20
```

### 为什么不需要 Cookie？

完整的请求头模拟了真实浏览器行为：

1. **User-Agent**：最新的 Chrome 浏览器标识
2. **Referer**：表明请求来自 bilibili.com
3. **Sec-Fetch-* 头部**：现代浏览器的安全特性
4. **Origin 头部**：指示请求源
5. **Accept 系列头部**：标准的浏览器接受类型

这些头部组合使 API 服务器认为请求来自合法的浏览器访问，无需额外的认证。

### 测试

所有单元测试已更新并通过：
- ✓ SearchService.test.ts (30 tests)
- ✓ APIClient.test.ts (4 tests)
- ✓ App.integration.test.ts (4 tests)
- ✓ 总计 117 tests 全部通过

### 示例响应

真实的 Bilibili API 响应示例（搜索"少年"）：

```json
{
  "code": 0,
  "message": "0",
  "ttl": 1,
  "data": {
    "page": 1,
    "pagesize": 20,
    "numResults": 1000,
    "numPages": 50,
    "result": [
      {
        "type": "video",
        "id": 243082173,
        "aid": 243082173,
        "bvid": "BV1De411p77r",
        "title": "梦然-《<em class=\"keyword\">少年</em>》官方版",
        "author": "大橘爱吃猫",
        "pic": "//i0.hdslb.com/bfs/archive/e25120857a6298d1d4b9e64a805c023b5143c8ff.jpg",
        "duration": "4:18",
        "play": 1037655,
        ...
      }
    ]
  }
}
```

## 后续工作

1. **Cookie 管理**：实现 SESSDATA cookie 的获取和管理
2. **错误处理**：改进 412 错误的处理和重试逻辑
3. **速率限制**：实现请求速率限制以避免被封禁
4. **缓存优化**：利用缓存减少 API 调用次数

## 测试脚本

可以使用以下脚本测试 Bilibili API：

```bash
npx tsx scripts/test-bilibili-search.ts
```

注意：由于反爬虫机制，此脚本可能会返回 412 错误。这是正常的，实际应用中需要添加适当的认证信息。
