# 环境变量与发布前检查

## 环境变量

当前项目测试上线至少需要：

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 发布前最后检查

- `npm install --cache /tmp/london-2026-npm-cache`
- `npm run build -- --no-lint`
- Supabase 表已创建
- 种子数据已导入
- `/admin` 可编辑比赛
- 至少一场中国队比赛可打开
- 数据来源文案正常显示
- 小红书分享链接已准备好

## 推荐首批分享链接

- `/match/2026-05-02-1700-t1-chn-w-rom`
- `/match/2026-05-02-1930-t1-chn-m-eng`
- `/match/2026-05-03-0230-t4-chn-m-kor`
- `/match/2026-05-03-1930-t4-chn-w-kor`

## 推荐首批测试文案方向

- 中国队赛前祈福入口
- 今晚焦点战一起上香
- 比赛页可留言、点赞、还愿
