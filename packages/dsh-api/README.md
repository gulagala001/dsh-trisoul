# TriSoul Web UI 插件

提供 TriSoul 的 Web UI 界面，集成在 dsh web 应用中。

## 功能

### 1. 记忆中枢面板
- URL: http://127.0.0.1:3081/trisoul/memory
- 实时显示记忆库内容
- 搜索过滤功能
- 自动 30 秒刷新

### 2. AI 监控面板
- URL: http://127.0.0.1:3081/trisoul/monitor
- 监控 5 个后台 AI 的运行状态：
  - trisoul-surgeon（手术刀）
  - trisoul-memory（记忆消化）
  - trisoul-canvas（画布编排）
  - soul-A（谨慎审查者，temperature 0.3）
  - soul-B（务实工程师，temperature 0.7）
  - soul-C（边界猎人，temperature 1.0）
- 显示每个 AI 的：
  - 缓存 tokens（cached_tokens）
  - 上下文 tokens（prompt_tokens）
  - 输入 tokens（completion_tokens）
  - 输出 tokens（total_tokens）
  - 最后调用时间

### 3. AI 配置面板
- URL: http://127.0.0.1:3081/trisoul/settings
- 单独配置每个 AI 的：
  - provider（提供商）
  - model（模型）
  - temperature（温度）
- 保存配置后提示重启 dsh 生效

## API 端点

### 记忆 API
- `GET /api/memory/list` - 获取记忆列表
- `POST /api/memory/digest` - 触发记忆消化

### 监控 API
- `GET /api/monitor/stats` - 获取所有 AI 的统计信息

### 设置 API
- `GET /api/settings/config` - 获取当前配置
- `POST /api/settings/update` - 更新配置

## 技术实现

- 纯静态 HTML + 原生 JavaScript，零依赖
- 暗色主题，slate-dark 调色板
- 通过 dsh webServer 服务注册 HTTP 路由
- 前端通过 fetch API 调用后端接口
- 实时数据通过定时轮询获取（30 秒间隔）

## 集成方式

1. **添加到 profile package.json**：
```json
{
  "dependencies": {
    "@trisoul/dsh-api": "link:/path/to/packages/dsh-api"
  },
  "dsh": {
    "profile": {
      "plugins": [
        "@trisoul/dsh-api"
      ]
    }
  }
}
```

2. **添加到 cordis.patch.yml**（可选）：
```yaml
- insert:
    - id: trisoul-api
      name: '@trisoul/dsh-api'
```

3. **启动 dsh**：
```bash
npx -y @deepseek-ai/dsh --profile trisoul-web --host 127.0.0.1 --port 3081
```

## 后续改进

- [ ] 实时 WebSocket 推送代替轮询
- [ ] 配置热重载（无需重启）
- [ ] 记忆可视化图表
- [ ] AI 调用日志查看
- [ ] 导出记忆为 JSON/Markdown
