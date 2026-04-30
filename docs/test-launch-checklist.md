# Test Launch Checklist

## 1. 基础环境

- 准备 GitHub 仓库
- 准备 Vercel 账号
- 准备 Supabase 项目
- 复制 `.env.example` 为 `.env.local`

## 2. 前端验证

- `npm install --cache /tmp/london-2026-npm-cache`
- `npm run build -- --no-lint`
- 确认首页 `/` 可访问
- 确认比赛详情 `/match/m1` 可访问
- 确认 `/admin` 比赛管理页可访问

## 3. 数据接入

- 在 Supabase 执行 [`supabase/schema.sql`](/Users/dongyuq/Documents/New%20project/supabase/schema.sql)
- 创建 `matches / blessings / messages / message_likes / match_updates`
- 准备第一批比赛数据
- 设置数据来源字段：`source_name`、`source_url`
- 验证 `/api/matches`、`/api/blessings`、`/api/messages` 能正常返回

## 4. 上线前必须确认

- 小红书分享链接能直达比赛详情
- 页面移动端交互流畅
- 比赛即使未开赛也允许祈福
- 已结束比赛能还愿并显示纪念卡
- 留言点赞后漂浮墙表现正常
- 比赛页显示数据来源与更新时间

## 5. 灰度测试建议

- 先发给少量用户体验
- 先只开放 1 到 3 场重点比赛
- 人工维护比分，验证真实更新链路
- 记录用户从分享进入后的行为路径
