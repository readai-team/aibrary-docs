# 反馈模块

## 概述

反馈模块是一个通用的用户反馈收集和管理系统，用于处理多种类型的用户反馈，包括内容反馈、内容举报和产品反馈。支持：

1. 多实体反馈：支持对 Work、Book、Host 等多种内容实体的反馈
2. 灵活配置：支持扩展问题类型和反馈类型
3. 问题处理：反馈状态全程可追踪，支持处理备注

## 用例图

```mermaid
graph TB
    subgraph 用户提交反馈
        User((用户))
        User --> SubmitFeedback[提交反馈记录]
        SubmitFeedback --> ContentFeedback[内容反馈]
        ContentFeedback --> WorkFeedback[Work 内容反馈]
        ContentFeedback --> BookFeedback[Book 内容反馈]
        ContentFeedback --> HostFeedback[Host 内容反馈]
        SubmitFeedback --> ContentReport[内容举报]
        SubmitFeedback --> ProductFeedback[产品反馈]
        User --> ViewFeedback[查看反馈记录]
    end

    subgraph 管理员处理反馈
        Admin((管理员))
        Admin --> ViewAllFeedback[查看反馈]
        Admin --> ProcessFeedback[处理反馈]
    end
```

## 活动图

```mermaid
stateDiagram-v2
    [*] --> 选择反馈类型

    state 用户提交反馈 {
        选择反馈类型 --> 选择实体类型: 内容反馈
        选择反馈类型 --> 选择举报实体: 内容举报
        选择反馈类型 --> 填写产品反馈: 产品反馈

        选择实体类型 --> 选择具体实体
        选择举报实体 --> 选择举报原因
        选择举报原因 --> 填写举报内容
        选择具体实体 --> 填写反馈内容
        填写产品反馈 --> 填写反馈内容
        填写反馈内容 --> 提交反馈
        填写举报内容 --> 提交举报
    }


    提交反馈 --> 发送飞书通知
    提交举报 --> 发送飞书通知
    发送飞书通知 --> 等待处理
    state 管理员处理反馈 {
        等待处理 --> 查看反馈详情
        查看反馈详情 --> 处理反馈
        state 处理反馈 {
            [*] --> 选择处理结果
            选择处理结果 --> 填写处理备注
            填写处理备注 --> 更新状态
            更新状态 --> [*]
        }
    }

    处理反馈 --> 已解决: 解决
    处理反馈 --> 不处理: 拒绝
    已解决 --> [*]
    不处理 --> [*]
```

# E-R 图

```mermaid
erDiagram
    Feedback {
        int id "自增ID"
        string document_id "文档ID"
        string issue_type "问题类型：内容反馈contentFeedback | 内容举报contentReport | 产品反馈 productFeedback"
        string entity_type "实体类型：work|book|host"
        string entity_id "关联实体ID"
        string feedback_type "反馈类型"
        text description "反馈描述"
        json screenshots "反馈截图"
        string status "处理状态：pending|resolved|rejected"
        text note "处理备注"
        datetime handled_at "处理时间"
        datetime created_at "创建时间"
        datetime updated_at "更新时间"
        relation user "提交用户"
        relation admin "处理人"
    }
```

## API 设计

### 2.1 获取反馈配置

```typescript
// 获取反馈配置
GET /config/feedback
Response:
{
  issueTypes: {
    contentFeedback: {
      label: "内容反馈",
      feedbackTypes: [
        { value: 'incorrect_info', label: '信息错误' },
        { value: 'content_quality', label: '内容质量问题' }
        // ...
      ]
    },
    contentReport: {
      label: "内容举报",
      feedbackTypes: [
        { value: 'inappropriate', label: '不当内容' },
        { value: 'copyright', label: '版权问题' }
        // ...
      ]
    },
    productFeedback: {
      label: "产品反馈",
      feedbackTypes: [
        { value: 'bug', label: '功能异常' },
        { value: 'suggestion', label: '功能建议' }
        // ...
      ]
    }
  }
}
```

### 2.2 用户提交反馈

````typescript
// 提交反馈
POST /feedbacks
Request Body: {
  issueType: string;
  entityType?: string;
  entityId?: string;
  feedbackType: string;
  description: string;
  screenshots?: string[];
  contactInfo?: string;
}

// 上传反馈截图
POST /feedbacks/upload
Request: FormData (file)
Response: {
  url: string;
}


### 2.3 获取用户反馈列表
```typescript
// 获取用户反馈列表
GET /user/feedbacks
````
