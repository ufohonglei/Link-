# Link+ API 接口文档

**Base URL：** `http://link.codepool.ai/api`

**认证方式：** Bearer Token（JWT）  
在需要认证的接口请求头中携带：
```
Authorization: Bearer <token>
```

**限流：** 每个 IP 15 分钟内最多 100 次请求

---

## 认证模块 `/api/auth`

### 注册

**POST** `/api/auth/register`

**请求体：**
```json
{
  "email": "user@example.com",
  "name": "张三",
  "password": "123456"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| email | string | ✅ | 邮箱，需符合邮箱格式 |
| name | string | ✅ | 姓名，2~50 个字符 |
| password | string | ✅ | 密码，至少 6 个字符 |

**成功响应** `201`：
```json
{
  "message": "注册成功",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "张三",
    "createdAt": "2026-01-01T00:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**失败响应：**
| 状态码 | 说明 |
|--------|------|
| 400 | 邮箱格式不正确 / 该邮箱已被注册 / 参数校验失败 |
| 500 | 服务器内部错误 |

---

### 登录

**POST** `/api/auth/login`

**请求体：**
```json
{
  "email": "user@example.com",
  "password": "123456"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| email | string | ✅ | 邮箱 |
| password | string | ✅ | 密码 |

**成功响应** `200`：
```json
{
  "message": "登录成功",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "张三"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**失败响应：**
| 状态码 | 说明 |
|--------|------|
| 400 | 参数校验失败 |
| 401 | 邮箱或密码错误 |
| 500 | 服务器内部错误 |

---

### 获取当前用户信息

**GET** `/api/auth/me`

> 🔒 需要认证

**成功响应** `200`：
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "张三",
    "createdAt": "2026-01-01T00:00:00.000Z"
  }
}
```

**失败响应：**
| 状态码 | 说明 |
|--------|------|
| 401 | 未携带 Token 或 Token 无效 |
| 404 | 用户不存在 |
| 500 | 服务器内部错误 |

---

## 书签模块 `/api/bookmarks`

> 🔒 以下所有接口均需要认证

---

### 获取书签列表

**GET** `/api/bookmarks`

**Query 参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| category | string | ❌ | 按分类筛选，不传则返回全部 |

**示例：**
```
GET /api/bookmarks
GET /api/bookmarks?category=工作
```

**成功响应** `200`：
```json
{
  "bookmarks": [
    {
      "id": "uuid",
      "title": "GitHub",
      "url": "https://github.com",
      "category": "工作",
      "userId": "uuid",
      "createdAt": "2026-01-01T00:00:00.000Z",
      "updatedAt": "2026-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### 获取分类列表

**GET** `/api/bookmarks/categories`

**成功响应** `200`：
```json
{
  "categories": [
    { "name": "工作", "count": 5 },
    { "name": "学习", "count": 3 },
    { "name": "未分类", "count": 2 }
  ]
}
```

---

### 创建书签

**POST** `/api/bookmarks`

**请求体：**
```json
{
  "title": "GitHub",
  "url": "https://github.com",
  "category": "工作"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| title | string | ✅ | 书签标题，最多 200 个字符 |
| url | string | ✅ | 书签链接，需为有效 URL |
| category | string | ❌ | 分类，最多 50 个字符，默认 `未分类` |

**成功响应** `201`：
```json
{
  "message": "书签创建成功",
  "bookmark": {
    "id": "uuid",
    "title": "GitHub",
    "url": "https://github.com",
    "category": "工作",
    "userId": "uuid",
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-01-01T00:00:00.000Z"
  }
}
```

**失败响应：**
| 状态码 | 说明 |
|--------|------|
| 400 | 参数校验失败（标题为空 / URL 格式错误等） |
| 401 | 未授权 |
| 409 | 该书签链接已存在 |
| 500 | 服务器内部错误 |

---

### 批量创建书签

**POST** `/api/bookmarks/bulk`

> 用于从浏览器扩展批量导入书签，无效书签会自动跳过

**请求体：**
```json
{
  "bookmarks": [
    { "title": "GitHub", "url": "https://github.com", "category": "工作" },
    { "title": "Google", "url": "https://google.com", "category": "常用" }
  ]
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| bookmarks | array | ✅ | 书签数组，不能为空 |

**成功响应** `201`：
```json
{
  "message": "成功导入 2 个书签，跳过重复 1 个，无效 0 个",
  "bookmarks": [...]
}
```

**失败响应：**
| 状态码 | 说明 |
|--------|------|
| 400 | 未提供有效的书签数组 |
| 401 | 未授权 |
| 500 | 服务器内部错误 |

---

### 更新书签

**PUT** `/api/bookmarks/:id`

**Path 参数：**

| 参数 | 说明 |
|------|------|
| id | 书签 ID |

**请求体（字段均为可选）：**
```json
{
  "title": "新标题",
  "url": "https://new-url.com",
  "category": "新分类"
}
```

**成功响应** `200`：
```json
{
  "message": "书签更新成功",
  "bookmark": {
    "id": "uuid",
    "title": "新标题",
    "url": "https://new-url.com",
    "category": "新分类",
    "userId": "uuid",
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-01-01T00:00:00.000Z"
  }
}
```

**失败响应：**
| 状态码 | 说明 |
|--------|------|
| 400 | 参数校验失败 |
| 401 | 未授权 |
| 404 | 书签不存在或无权操作 |
| 500 | 服务器内部错误 |

---

### 删除书签

**DELETE** `/api/bookmarks/:id`

**Path 参数：**

| 参数 | 说明 |
|------|------|
| id | 书签 ID |

**成功响应** `200`：
```json
{
  "message": "书签删除成功"
}
```

**失败响应：**
| 状态码 | 说明 |
|--------|------|
| 401 | 未授权 |
| 404 | 书签不存在或无权操作 |
| 500 | 服务器内部错误 |

---

### 清空全部书签

**DELETE** `/api/bookmarks/clear`

> 🔒 需要认证，只会删除当前登录用户的所有书签

**成功响应** `200`：
```json
{
  "message": "已清空 10 个书签"
}
```

**失败响应：**
| 状态码 | 说明 |
|--------|------|
| 401 | 未授权 |
| 500 | 服务器内部错误 |

### 健康检查

**GET** `/health`

无需认证

**成功响应** `200`：
```json
{
  "status": "ok",
  "timestamp": "2026-01-01T00:00:00.000Z"
}
```

---

## 通用错误格式

所有错误响应均为以下格式：

```json
{
  "error": "错误描述信息"
}
```

| 状态码 | 含义 |
|--------|------|
| 400 | 请求参数错误 |
| 401 | 未授权（Token 缺失或无效） |
| 404 | 资源不存在 |
| 429 | 请求过于频繁（触发限流） |
| 500 | 服务器内部错误 |
