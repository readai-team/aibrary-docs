## 用户域

### ER 图

```mermaid
erDiagram
    User ||--|| Role : "有一个"
    Role ||--o{ Permission: "有多个"
    User ||--|| UserProfile : "有一个"
    User ||--o| UserSetting : "有一个"

    User {
      string username "用户名"
      string email "邮箱"
      uid device "设备标识"
      string provider "device,local,google,apple,facebook"
      string password "密码"
      string resetPasswordToken "重置密码 token"
      string confirmationToken "激活邮箱账号 token"
      boolean confirmed "账号是否激活邮箱"
      boolean blocked "账号是否被禁用"
      boolean isCompletedProfile "账号是否完善资料"
      boolean isCompletedInterest "账号是否完善兴趣"
      relation role "角色"
      relation userProfile "用户资料"
      relation userSetting "用户设置"
    }

    UserProfile {
      relation user "oneToOne"
      string firstName
      string lastName
      media avatar
      string description
      integer age
      enumeration gender "male, female, non-binary"
      string interestFormKey
      json interestFormInfo
    }

    UserSetting {
      relation user "oneToOne"
      enumeration preferredLanguage "en, zh, zh-Hans"
    }

    Role {
      relation user "oneToMany"
      string name
      string description
      string type
      relation permissions "oneToMany"
    }

    Permission {
      relation role "manyToOne"
      string action
    }
```

### 用例图

```mermaid
graph LR
    %% 认证相关用例
    Auth[认证] --> DeviceUser[设备账号]
    DeviceUser --> |/auth/device|AuthDevice[设备授权登录]
    DeviceUser --> |/auth/local/register|BindEmail[绑定邮箱登录方式]
    DeviceUser --> BindThirdParty[绑定三方登录方式]
    BindThirdParty --> |/auth/facebook/callback|BindFacebookAuth[Facebook认证]
    BindThirdParty --> |/auth/google/callback|BindGoogleAuth[Google认证]
    BindThirdParty --> |/auth/apple/callback|BindAppleAuth[Apple认证]

    Auth[认证] --> EmailUser[邮箱账号]
    Auth[认证] --> ThirdPartyUser[三方账号]
    EmailUser --> |/auth/local/register|Register[邮箱注册]
    EmailUser --> |/auth/send-email-confirmation|SendConfirmationEmail[发送激活邮件]
    EmailUser --> |/auth/email-confirmation|ConfirmUserEmail[激活邮箱账号]
    EmailUser --> |/auth/local|AuthLocal[邮箱登录]
    EmailUser --> |/auth/forgot-password|ForgotPassword[忘记密码]
    EmailUser --> |/auth/reset-password|RestPassword[重置密码]
    EmailUser --> |/auth/change-password|ChangePassword[修改密码]
    ThirdPartyUser --> |/auth/facebook/callback|FacebookAuth[Facebook认证]
    ThirdPartyUser --> |/auth/google/callback|GoogleAuth[Google认证]
    ThirdPartyUser --> |/auth/apple/callback|AppleAuth[Apple认证]
    Auth --> Logout[登出账号]

     %% 用户相关用例
    User --> |GET /users/me|GetUserInfo[获取用户信息]
    User --> UpdateUserInfo[修改用户信息]
    User --> |DELETE /users/me|DeleteUserInfo[删除用户账号]

    UpdateUserInfo --> |POST /user-profile|UpdateUserProfile[修改用户资料]
    UpdateUserInfo --> |POST /user-setting|UpdateUserSetting[修改用户设置]
```

### Schema 设计

#### User

```JSON
{
  "kind": "collectionType",
  "collectionName": "up_users",
  "info": {
    "name": "user",
    "description": "",
    "singularName": "user",
    "pluralName": "users",
    "displayName": "User"
  },
  "options": {
    "draftAndPublish": false
  },
  "attributes": {
    "username": {
      "type": "string",
      "minLength": 3,
      "unique": true,
      "configurable": false,
      "required": true
    },
    "email": {
      "type": "email",
      "minLength": 6,
      "configurable": false,
      "required": true
    },
    "device": {
      "type": "uid",
      "configurable": false
    },
    "provider": {
      "type": "string",
      "configurable": false,
      "hidden": false
    },
    "password": {
      "type": "password",
      "minLength": 6,
      "configurable": false,
      "private": true,
      "searchable": false
    },
    "resetPasswordToken": {
      "type": "string",
      "configurable": false,
      "private": true,
      "searchable": false
    },
    "confirmationToken": {
      "type": "string",
      "configurable": false,
      "private": true,
      "searchable": false
    },
    "confirmed": {
      "type": "boolean",
      "default": false,
      "configurable": false
    },
    "blocked": {
      "type": "boolean",
      "default": false,
      "configurable": false
    },
    "role": {
      "type": "relation",
      "relation": "manyToOne",
      "target": "plugin::users-permissions.role",
      "inversedBy": "users",
      "configurable": false
    },
    "isCompletedProfile": {
      "type": "boolean",
      "default": false
    },
    "isCompletedInterest": {
      "type": "boolean",
      "default": false
    },
    "userProfile": {
      "type": "relation",
      "relation": "oneToOne",
      "target": "api::user-profile.user-profile",
      "inversedBy": "user"
    },
    "userSetting": {
      "type": "relation",
      "relation": "oneToOne",
      "target": "api::user-setting.user-setting",
      "inversedBy": "user"
    }
  }
}
```

#### UserProfile

```json
{
  "kind": "collectionType",
  "collectionName": "user_profiles",
  "info": {
    "singularName": "user-profile",
    "pluralName": "user-profiles",
    "displayName": "UserProfile"
  },
  "options": {
    "draftAndPublish": false
  },
  "attributes": {
    "user": {
      "type": "relation",
      "relation": "oneToOne",
      "target": "plugin::users-permissions.user",
      "mappedBy": "userProfile"
    },
    "firstName": {
      "type": "string"
    },
    "lastName": {
      "type": "string"
    },
    "avatar": {
      "type": "media",
      "multiple": false,
      "required": false,
      "allowedTypes": ["images"]
    },
    "age": {
      "type": "integer",
      "min": 0
    },
    "gender": {
      "type": "enumeration",
      "enum": ["male", "female", "non-binary"]
    },
    "elevation": {
      "type": "enumeration",
      "enum": [
        "Emotions",
        "Motivation",
        "Nutrition",
        "Habits",
        "Self-confidence",
        "Mindset",
        "Self-care",
        "Exercise",
        "Empathy",
        "Love&Relationships",
        "Personal Finance",
        "Creativity",
        "Innovation",
        "Leadership",
        "Technology"
      ]
    },
    "toipics": {
      "type": "enumeration",
      "enum": [
        "Steve Jobs",
        "Richard Branson",
        "LeBron James",
        "Opera Winfrey",
        "Emma Watson",
        "Serena Williams",
        "Jeff Bezos",
        "Kevin Hart",
        "Brene Brown"
      ]
    },
    "interestFormKey": {
      "type": "string"
    },
    "interestFormInfo": {
      "type": "json"
    }
  }
}
```

#### UserSetting

```json
{
  "kind": "collectionType",
  "collectionName": "user_settings",
  "info": {
    "singularName": "user-setting",
    "pluralName": "user-settings",
    "displayName": "UserSetting"
  },
  "options": {
    "draftAndPublish": false
  },
  "attributes": {
    "user": {
      "type": "relation",
      "relation": "oneToOne",
      "target": "plugin::users-permissions.user",
      "mappedBy": "userSetting"
    },
    "preferredLanguage": {
      "type": "enumeration",
      "enum": ["en", "zh", "zh-Hans"]
    }
  }
}
```

### 核心场景

#### 设备授权登录

1. 创建设备唯一标识（did）
2. 调用 `/api/auth/device` 接口注册/登录设备账号
3. 获取 JWT token 和用户信息

```typescript
// 设备注册/登录请求
POST / api / auth / device;
Body: {
  device: string; // 设备唯一标识
}

// 响应
Response: {
  data: {
    jwt: string; // JWT Token
    user: User; // 用户信息
  }
}
```

#### 账号绑定流程

设备账号可以绑定以下邮箱登录方式和三方登录方式：

#### 设备账号绑定邮箱登录方式

```typescript
POST /api/auth/local/register
Header: Authorization: Bearer Token
Body: {
  email: string;    // 邮箱
  password: string; // 密码
}
```

```mermaid
flowchart TD
    A[开始] --> B[设备账号发起绑定邮箱请求]
    B --> C[验证邮箱格式和密码规则]
    C --> |验证不通过| D[返回错误信息]
    D --> B
    C --> |验证通过| E[检查邮箱是否已被其他账号绑定]
    E --> |已被绑定| F[提示邮箱已被使用]
    F --> B
    E --> |未被绑定| G[更新设备账号信息]
    G --> H[更新provider为local]
    H --> I[更新role为authenticated]
    I --> J[设置email和password]
    J --> K[生成确认Token]
    K --> L[发送激活邮件]
    L --> M[等待用户激活]
    M --> N[用户点击激活链接]
    N --> O[验证确认Token]
    O --> |Token无效| P[提示激活失败]
    P --> M
    O --> |Token有效| Q[更新confirmed为true]
    Q --> R[绑定完成]
```

##### 设备账号绑定三方登录方式（Google/Facebook/Apple）

```typescript
// 发起第三方授权
GET /api/connect/[provider]
// 授权回调
GET /api/connect/[provider]/callback
// Web 登录
Header: Authorization: Bearer Token
GET /api/auth/[provider]/callback
// SDK 登录
Header: Authorization: Bearer Token
POST /api/auth/[provider]/callback
```

流程图

```mermaid
flowchart TD
    A[开始] --> B[设备账号发起三方授权请求]
    B --> C{是否使用 Web 授权}

    %% Web 授权流程
    C --> |是| D[跳转到三方授权页面]
    D --> E[用户授权]
    E --> |用户拒绝| F[返回错误信息]
    F --> B
    E --> |用户同意| G[获取授权码]
    G --> H[回调处理]

    %% SDK 授权流程
    C --> |否| I[调用 SDK 授权]
    I --> J[获取 SDK 授权信息]
    J --> |授权失败| K[返回错误信息]
    K --> B
    J --> |授权成功| L[发送授权信息到服务端]

    %% 共同的处理流程
    H --> M[验证授权信息]
    L --> M
    M --> |验证失败| N[提示授权失败]
    N --> B
    M --> |验证通过| O[获取三方用户信息]
    O --> P[检查邮箱是否被其他账号使用]
    P --> |已被使用| Q[切换设备账号为该账号]
    Q --> R[结束]
    P --> |未被使用| S[更新设备账号信息]
    S --> T[更新 provider 为对应三方]
    T --> U[更新 role 为 authenticated]
    U --> V[更新 email 和头像]
    V --> W[更新 confirmed 为 true]
    W --> R
```

#### 邮箱注册流程

```typescript
POST / auth / local / register;
```

流程图

```mermaid
flowchart TD
    %% 邮箱注册流程
    A[开始] --> B[用户提交注册信息]
    B --> C[验证邮箱格式和密码规则]
    C --> |验证不通过| D[返回错误信息]
    D --> B
    C --> |验证通过| E[检查邮箱是否已注册]
    E --> |已注册| F[提示邮箱已存在]
    F --> B
    E --> |未注册| G[创建用户账号]
    G --> H[生成确认Token]
    H --> I[发送激活邮件]
    I --> J[等待用户激活]

    %% 激活邮箱账号流程
    J --> K[用户点击激活链接]
    K --> L[验证确认Token]
    L --> |Token无效| M[提示激活失败]
    L --> |Token有效| N[更新用户状态为已激活]
    N --> O[重定向到登录页]

    %% 邮箱登录流程
    O --> P[用户输入邮箱密码]
    P --> Q[验证邮箱和密码]
    Q --> |验证失败| R[提示登录失败]
    R --> P
    Q --> |验证通过| S[检查账号状态]
    S --> |未激活| T[提示需要激活账号]
    T --> U[重新发送激活邮件]
    U --> J
    S --> |已激活| V[生成JWT Token]
    V --> W[返回用户信息和Token]
    W --> X[登录成功]

    %% 重新发送激活邮件流程
    Y[用户请求重发激活邮件] --> Z[验证邮箱是否存在]
    Z --> |邮箱不存在| AA[返回错误信息]
    Z --> |邮箱存在| BB[检查账号状态]
    BB --> |已激活| CC[提示账号已激活]
    BB --> |未激活| DD[重新生成确认Token]
    DD --> EE[发送新的激活邮件]
    EE --> J
```

// 设备注册/登录请求
POST /api/auth/device

App 用网页授权
// 发起第三方授权
GET /api/connect/[provider]?callback=/api/connect/[provider]?callback=[API_BASE_URL]/api/auth/[provider]/redirect
// 授权回调
GET /api/connect/[provider]/callback
// Web 登录
Header: Authorization: Bearer Token

App 用 SDK 授权
Header: Authorization: Bearer Token
POST /api/auth/[provider]/callback

```mermaid
flowchart TD
    %% Web 授权流程
    A[开始] --> Q[设备授权登录]

    Q --> |POST /api/auth/device|B{设备账号绑定第三方登录}
    B --> |Web 授权| C[发起第三方授权]
    C --> |GET /api/v1/connect/:provider?callback=API_BASE_URL/api/v1/connect/:provider/callback| D[跳转第三方授权页面]
    D --> N[获取授权信息]
    N --> R[授权回调中转]
    R --> |GET /api/v1/auth/:provider/redirect|E[授权回调结果]
    E --> |GET /api/v1/auth/:provider/callback| H[获取 user 和 jwt]

    %% SDK 授权流程
    B --> |SDK 授权| I[发起第三方授权]
    I --> J[获取授权信息]
    J --> K[授权回调结果]
    K --> |POST /api/v1/auth/:provider/callback| H

    %% 结束流程
    H --> M[结束]
```

#### 权限控制

##### JWT Token

每次发送 API 请求时，服务器都会检查 Authorization 标头是否存在，并验证发出请求的用户是否有权访问资源。
要以用户身份发出 API 请求，请将 JWT 放入请求 Authorization 的标头中 GET。
任何没有 token 的请求都会默认拥有 public 角色权限。

##### 角色定义

- Public：未登录用户
- Authenticated：已登录用户，设备账号也属于已登录用户
- Subscribed：订阅用户

##### 权限配置

- 权限上 Public 有的，Authenticated、Subscribed 肯定有
- 权限范围 Subscribed > Authenticated > Public

##### 错误处理

- 401 Unauthorized：
  错误类型：UnauthorizedError
  错误原因：token 无效、token 失效
  处理逻辑：退回至启动页

- 403 Forbidden：
  错误类型：ForbiddenError。
  错误原因：该用户的角色没有接口权限。
  处理逻辑：提示用户当前操作无权限，或跳转到权限不足的提示页面。
