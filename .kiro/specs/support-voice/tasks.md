# 实施计划

- [x] 1. 更新 Voice content-type schema
  - 在 apps/cms/src/api/voice/content-types/voice/schema.json 中添加 language、gender、age、style 字段
  - 将 cloneStatus 从 integer 改为 enumeration 类型
  - 将 priority 字段重命名为 sort
  - _需求: 2.1, 5.1_

- [x] 2. 实现 Voice 服务层基础功能
  - [x] 2.1 在 voice service 中实现 findVoiceById 方法
    - 实现根据 ID 查找语音的逻辑
    - 处理用户权限验证（用户语音只能被所有者查看）
    - 隐藏其他用户的敏感信息
    - _需求: 2.1, 6.1, 6.2_

  - [x] 2.2 实现 findUserVoices 方法
    - 查询当前用户的所有克隆语音
    - 包含分页和排序功能
    - _需求: 1.2, 4.1_

  - [x] 2.3 实现 getUserVoiceCount 辅助方法
    - 统计用户已克隆的语音数量
    - 用于限制检查
    - _需求: 3.6_

- [x] 3. 实现 Voice 控制器层
  - [x] 3.1 更新 voice controller 的 findOne 方法
    - 调用 service 层的 findVoiceById
    - 处理错误响应
    - _需求: 2.1_

  - [x] 3.2 实现 getUserVoices 方法
    - 验证用户身份
    - 调用 service 层获取用户语音列表
    - 转换响应格式
    - _需求: 1.2, 6.3_

- [x] 4. 更新自定义路由
  - 在现有的 apps/cms/src/api/voice/routes/custom.ts 文件中添加 POST /voices/clone 路由
  - _需求: 3.3_

- [x] 5. 实现语音克隆功能
  - [x] 5.1 在 voice service 中实现 cloneUserVoice 方法
    - 验证用户语音数量限制
    - 处理音频文件上传到 S3
    - 调用 Minimax API 进行语音克隆
    - 创建语音记录并设置初始状态
    - _需求: 3.1, 3.2, 3.3, 3.6_

  - [x] 5.2 在 voice controller 中实现 cloneVoice 方法
    - 验证用户身份
    - 验证请求参数
    - 调用 service 层的克隆方法
    - 返回克隆任务信息
    - _需求: 3.3, 6.3_

  - [x] 5.3 实现异步状态更新机制
    - 实现 pollCloneStatus 方法
    - 定期检查 Minimax API 的克隆状态
    - 更新数据库中的 cloneStatus 和 isActive 字段
    - _需求: 3.4_

- [x] 6. 实现语音管理功能
  - [x] 6.1 覆写 voice controller 的 update 方法
    - 验证用户只能更新自己的克隆语音
    - 只允许更新 name 和 description 字段
    - _需求: 4.2, 4.3, 6.1_

  - [x] 6.2 覆写 voice controller 的 delete 方法
    - 验证用户只能删除自己的克隆语音
    - 调用 Minimax API 删除远程语音资源
    - 删除数据库记录和相关文件
    - _需求: 4.4, 4.5, 6.1_

- [-] 7. 实现语音列表和筛选功能
  - [x] 7.1 覆写 voice controller 的 find 方法
    - 返回系统语音和当前用户的语音
    - 支持分页参数
    - _需求: 1.1, 1.3_

  - [x] 7.2 在 service 层实现语音筛选逻辑
    - 支持按 language、gender、age、style、provider、type 筛选
    - 实现排序功能（按 sort 字段）
    - _需求: 5.3_

- [x] 8. 实现错误处理和验证
  - [x] 8.1 创建自定义验证中间件
    - 验证音频文件格式（MP3、WAV）
    - 验证文件大小（最大 50MB）
    - _需求: 3.2_

  - [x] 8.2 实现统一错误处理
    - 处理 Minimax API 错误
    - 处理文件上传错误
    - 返回友好的错误信息
    - _需求: 3.5_

- [ ] 9. 集成 Redis 缓存
  - [ ] 9.1 实现语音列表缓存
    - 缓存系统语音列表（TTL: 1小时）
    - 缓存用户语音列表（TTL: 5分钟）
    - _需求: 1.1_

  - [ ] 9.2 实现缓存失效策略
    - 在创建、更新、删除语音时清除相关缓存
    - 实现缓存预热机制
    - _需求: 4.6_

- [ ] 10. 编写测试用例
  - [ ] 10.1 编写服务层单元测试
    - 测试 findVoiceById 权限验证
    - 测试克隆数量限制
    - 测试状态转换逻辑
    - _需求: 6.1, 6.2, 3.6_

  - [ ] 10.2 编写 API 集成测试
    - 测试语音列表接口
    - 测试语音克隆流程
    - 测试权限控制
    - _需求: 1.1, 3.3, 6.3_

  - [ ] 10.3 编写端到端测试
    - 测试完整的语音克隆和使用流程
    - 测试错误场景
    - _需求: 3.4, 3.5_
