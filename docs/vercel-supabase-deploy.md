# Vercel + Supabase 测试上线步骤

这份文档的目标很直接：把当前项目部署成一个可分享的测试链接。

## 1. 准备代码仓库

1. 在 GitHub 创建一个新仓库
2. 把当前项目上传到仓库根目录
3. 确认这些文件已经存在：
   - `package.json`
   - `app/`
   - `components/`
   - `lib/`
   - `.env.example`
   - `supabase/schema.sql`

## 2. 创建 Supabase 项目

1. 打开 [Supabase](https://supabase.com/)
2. 新建一个 project
3. 进入 SQL Editor
4. 先执行：
   [supabase/schema.sql](/Users/dongyuq/Documents/New%20project/supabase/schema.sql)
5. 再执行：
   [supabase/seed_matches_2026_04_29.sql](/Users/dongyuq/Documents/New%20project/supabase/seed_matches_2026_04_29.sql)
6. 如果你想先主推中国队，再执行：
   [supabase/seed_matches_china_stage1.sql](/Users/dongyuq/Documents/New%20project/supabase/seed_matches_china_stage1.sql)

## 3. 获取环境变量

在 Supabase 项目里找到：

- `Project URL`
- `anon public key`

对应到本项目需要的环境变量：

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 4. 在 Vercel 部署

1. 打开 [Vercel](https://vercel.com/)
2. 导入 GitHub 仓库
3. Framework 选择 `Next.js`
4. Build Command 保持默认
5. Output Directory 保持默认
6. 在 Environment Variables 里填写：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
7. 点击 Deploy

## 5. 首次部署后检查

部署完成后，优先检查这几个地址：

- `/`
- `/admin`
- `/match/2026-05-02-1700-t1-chn-w-rom`
- `/match/2026-05-03-0230-t4-chn-m-kor`

## 6. 重点验证事项

### 首页

- 是否能看到中国队专区
- 是否能看到完整分组与晋级
- 是否能继续上次那场比赛

### 比赛详情页

- 是否显示更新时间
- 是否显示来源
- 祈福、留言、点赞是否正常
- 漂浮墙是否更新

### 后台

- `/admin` 能否打开
- 能否切换比赛
- 能否修改比分、状态、备注、来源

## 7. 分享测试建议

第一批不要直接发首页，优先发具体比赛页：

- `中国女团 vs 罗马尼亚`
- `中国男团 vs 韩国`
- `中国女团 vs 韩国`

原因：

- 用户点进去就能进入具体应援场景
- 比首页更容易触发互动
- 更符合小红书内容传播逻辑

## 8. 建议的测试发布顺序

1. 先自己手机打开测试
2. 再发给少量朋友内测
3. 再从小红书灰度发 1 到 2 条内容
4. 观察用户是否会：
   - 点进比赛
   - 祈福
   - 留言
   - 二次回访
