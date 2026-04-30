# London 2026 Blessing App

这是一个面向测试上线的 `Next.js` 移动端 H5 骨架，当前包含：

- 首页赛事分组与晋级视图
- 单场比赛详情页：`/match/[id]`
- 祈福互动、留言点赞、漂浮墙、还愿、纪念卡
- 浏览器本地持久化，方便在接数据库前做真机体验
- Supabase 环境变量占位和后台入口预留

## 本地启动

1. 安装依赖
2. 复制 `.env.example` 为 `.env.local`
3. 运行：

```bash
npm install
npm run dev
```

## 下一步接入 Supabase

1. 在 Supabase 创建项目
2. 把 `NEXT_PUBLIC_SUPABASE_URL` 和 `NEXT_PUBLIC_SUPABASE_ANON_KEY` 写入 `.env.local`
3. 把 `components/app-client.tsx` 里的本地存储读写替换成真实 API / Supabase 调用
4. 把 `/admin` 从占位页扩成比赛管理后台

这一步现在已经推进到：

- 前台通过 `/api/*` 路由读写数据
- 有 Supabase 环境变量时，仓库层会优先尝试读写数据库
- 没有 Supabase 时，会自动回落到内存 mock，方便继续测试交互
- `/admin` 已经是一个最小可用的比赛管理页骨架

## 推荐上线顺序

1. 先部署前端到 Vercel 做测试链接
2. 真机验证首页、比赛详情页和分享路径
3. 再接真实比赛数据、留言和祈福存储
4. 最后再做视觉强化和动效打磨

## 部署资料

- [Vercel + Supabase 部署步骤](/Users/dongyuq/Documents/New%20project/docs/vercel-supabase-deploy.md)
- [环境变量与发布前检查](/Users/dongyuq/Documents/New%20project/docs/env-and-release-check.md)
- [测试上线 checklist](/Users/dongyuq/Documents/New%20project/docs/test-launch-checklist.md)
