# Schedule Seed Notes

这份种子数据来自用户提供的赛程图：

- 文件：`/Users/dongyuq/Desktop/WechatIMG84.jpeg`
- 主题：`2026伦敦世界乒乓球团体锦标赛`
- 日期：`4月29日全日赛程`
- 标注来源：`草莓牛奶特别甜`

已整理成：

- [supabase/seed_matches_2026_04_29.sql](/Users/dongyuq/Documents/New%20project/supabase/seed_matches_2026_04_29.sql)

## 导入建议

1. 先执行 [supabase/schema.sql](/Users/dongyuq/Documents/New%20project/supabase/schema.sql)
2. 再执行 `seed_matches_2026_04_29.sql`
3. 导入后去 `/admin` 检查每场比赛的队名、分组、时间标签
4. 比赛开始后，优先在 `/admin` 手动更新比分和来源链接

## 当前处理方式

- 全部导入为 `phase='group'`
- 全部导入为 `stage='小组赛'`
- 初始状态为 `status='upcoming'`
- 初始比分为 `0:0`
- `source_name` 预填为 `草莓牛奶特别甜`
- `source_url` 先留空，后续可在后台补上具体微博链接

## 注意

由于原图是海报截图而不是结构化接口，个别队名或分组格式在正式导入前建议人工复核一次。
