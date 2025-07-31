# 推荐域

## 系统概述

推荐服务应用视角方案

## 用例图

```mermaid
graph TD
    %% 用户交互流程
    User[用户] --> Enter[Get Started]
    Enter --> |新用户|AuthDevice[创建设备账号]
    AuthDevice --> Interest[收集用户兴趣]
    Enter --> |老用户|PersonalFeed[个性化推荐]
    Interest --> ColdStart[冷启动推荐]

    %% 系统推荐流程
    subgraph RecommendSystem[推荐系统]
        ColdStart --> |收集初始数据|UserModel[用户兴趣模型]
        UserModel --> |实时更新|PersonalFeed
        PersonalFeed --> |场景化推荐|HomePage[首页Feed getRecommendWorks]
        PersonalFeed --> |场景化推荐|CategoryPage[书籍页面 getRecommendBooks]
    end

    %% 数据收集流程
    subgraph DataCollection[数据服务]
        User --> |显性行为|ExplicitData[显性行为数据]
        User --> |隐性行为|ImplicitData[隐性行为数据]
        ExplicitData --> |更新模型|UserModel
        ImplicitData --> |更新模型|UserModel
    end

    %% 显性数据类型
    ExplicitData --> Like[点赞 Work]
    ExplicitData --> Follow[关注 Host]
    ExplicitData --> Favorite[收藏 Work / Book]

    %% 隐性数据类型
    ImplicitData --> Browse[浏览行为]
    ImplicitData --> Play[播放行为]
    ImplicitData --> Search[搜索历史]

    %% 推荐结果
    HomePage --> |推荐策略：default、new_horizon、mind_gym、personalized、trending、similar|RecommendResult[推荐结果]
    CategoryPage --> |推荐策略：similar|RecommendResult
    RecommendResult --> |用户行为数据收集|DataCollection
    RecommendResult --> |用户主动反馈|DataCollection
```

## 用例说明

#### 显性兴趣收集

- 用户注册时的兴趣标签选择
  - user_profiles 表
- 用户主动点赞、收藏、关注等互动行为记录
  - user_interacts 表

#### 推荐策略参数

- 个性化推荐（personalized）：基于用户历史行为和兴趣模型
- 热门推荐（trending）：基于实时热度和时间衰减
- 相似推荐（similar）：基于当前内容的相似内容

#### 场景化参数

- 首页Feed（home）
- 书籍页面（book）

#### 数据中心

##### 用户行为数据

- 点击行为
- 停留时长
- 播放进度
- 互动行为
- 分享行为

##### 内容特征数据

- 内容标签
- 内容质量指标
- 时效性指标
- 互动指标

## API

### 序列图

```mermaid
sequenceDiagram
    participant Client as 客户端
    participant API as API服务
    participant Algo as 推荐服务
    participant DataService as 数据分析服务
    participant DB as 数据库

    %% 兴趣收集流程
    Client->>API: GET /api/v1/configs/app_configs
    API-->>Client: 返回兴趣表单Key
    Client->>API: GET /api/v1/interests/{key}
    API-->>Client: 返回兴趣表单
    Client->>API: POST /api/v1/user-profiles
    Note over Client,API: 用户选择的兴趣标签
    API->>DB: 保存用户兴趣数据
    DB-->>API: 保存成功
    API->>Algo: 初始化用户兴趣数据
    Algo->>Algo: 构建并初始化兴趣模型
    Algo-->>API: 初始化完成
    API-->>Client: 返回成功响应

    %% Works推荐流程
    Client->>API: GET /recommend/works
    Note over Client,API: mode, strategy, scene, fields, pagination
    API->>Algo: 请求推荐Works
    Note over API,Algo: userId, timestamp
    Algo->>DataService: 获取用户行为数据
    DataService->>DB: 查询用户行为数据
    DB-->>DataService: 返回用户行为数据
    DataService-->>Algo: 返回用户行为数据
    Algo->>DB: 查询内容数据
    DB-->>Algo: 返回内容数据
    Algo->>Algo: 执行推荐策略
    Algo-->>API: 返回documentIds
    API->>DB: 查询完整Work数据
    DB-->>API: 返回Works数据
    API-->>Client: 返回推荐结果

    %% 用户行为数据收集流程
    Note over Client,DataService: 用户与推荐内容交互
    Client->>DataService: 发送用户行为数据
    Note over Client,DataService: 包含曝光、播放、停留时长、跳过等
    DataService->>DataService: 数据预处理和清洗
    DataService->>DB: 保存用户行为数据
    DB-->>DataService: 保存成功
    DataService->>Algo: 实时更新用户行为数据
    Note over DataService,Algo: 用于实时调整推荐策略

    %% Books推荐流程
    Client->>API: GET /recommend/books
    Note over Client,API: strategy, scene, sourceType, sourceId
    API->>Algo: 请求推荐Books
    Note over API,Algo: userId, timestamp
    Algo->>DB: 查询书籍数据
    DB-->>Algo: 返回书籍数据
    Algo->>Algo: 执行相似度计算
    Algo-->>API: 返回documentIds
    API->>DB: 查询完整Book数据
    DB-->>API: 返回Books数据
    API-->>Client: 返回推荐结果
```

### 获取兴趣表单Key

GET /api/v1/configs/app_configs

测试链接：https://api.dev.rd.ai/api/v1/configs/app_configs

### 获取兴趣表单

GET /api/v1/interests/{key}
测试链接：https://api.dev.rd.ai/api/v1/interests/interest_form_v2

### 保存用户兴趣

POST /api/v1/user-profiles

### 获取 Feed 配置

App 需要动态下发的 Feed 配置

GET /api/v1/configs/app_feed_configs

示例链接：https://api.dev.rd.ai/api/v1/configs/app_feed_configs

返回结果

```json
{
  "data": {
    "key": "app_feed_configs",
    "value": {
      "version": "1.0.0",
      "modes": [
        {
          "key": "default",
          "icon": "home",
          "name": "Default",
          "params": {
            "mode": "default"
          },
          "isDefault": true
        },
        {
          "key": "new_horizon",
          "icon": "compass",
          "name": "NewHorizon",
          "params": {
            "mode": "new_horizon"
          }
        },
        {
          "key": "mind_gym",
          "icon": "brain",
          "name": "MindGym",
          "params": {
            "mode": "mind_gym"
          }
        }
      ],
      "preload": {
        "enabled": true,
        "threshold": 3
      },
      "limit": 10
    }
  }
}
```

返回值说明

- modes：模式列表
  - params：模式参数，一种模式对应一种推荐策略，算法依赖的请求参数可能有多个，可以直接在配置中定义
- preload：预载配置
- limit：每页条数
- App 根据实际情况扩展

### Works 推荐

#### For App

GET /recommend/works

示例链接：https://api.dev.rd.ai/api/v1/recommend/works

##### 请求参数

- 推荐参数
  - mode：推荐模式 default|new_horizon|mind_gym
  - strategy：推荐策略 personalized|trending|similar
  - scene：场景标识 feed｜follow
- 字段参数
  - fields
  - populate
- 游标分页
  - pagination[limit]
  - pagination[cursor]
- 时间标识：timestamp

##### 返回响应

```
{
  "data": [works, ...],
  "meta": {
    "pagination": {
      "limit": 10,
      "next": "wkk17e4kl6j6u538jxr8v865",
      "hasMore": true
    }
  }
}
```

#### 推荐算法提供的接口

##### 请求参数

在 /recommend/works 接口上增加以下参数

- userId：用户Id
- 时间标识：timestamp

##### 返回响应

```json
{
  "data": [{ "documentId": "wkk17e4kl6j6u538jxr8v865" }, { "documentId": "wkk17e4kl6j6u538jxr8v862" }],
  "meta": {
    "pagination": {
      "limit": 10,
      "next": "wkk17e4kl6j6u538jxr8v865",
      "hasMore": true
    }
  }
}
```

### Books 推荐

#### For App

GET /recommend/books

示例链接：https://api.dev.rd.ai/api/v1/recommend/books

##### 请求参数

- 推荐参数
  - strategy：推荐策略 similar
  - scene：场景标识 home|book|after_reading
  - sourceType：book
  - sourceId：bookId
- 字段参数
  - fields
  - populate
- 游标分页
  - pagination[limit]
  - pagination[cursor]

##### 返回响应

```json
{
  "data": [books, ...],
  "meta": {
    "pagination": {
      "limit": 10,
      "next": "wkk17e4kl6j6u538jxr8v865",
      "hasMore": true
    }
  }
}
```

#### 推荐算法提供的接口

##### 请求参数

在 /recommend/books 接口上增加以下参数

- userId：用户Id
- 时间标识：timestamp

##### 返回响应

```json
{
  "data": [{ "documentId": "wkk17e4kl6j6u538jxr8v865" }, { "documentId": "wkk17e4kl6j6u538jxr8v862" }],
  "meta": {
    "pagination": {
      "limit": 10,
      "next": "wkk17e4kl6j6u538jxr8v865",
      "hasMore": true
    }
  }
}
```
