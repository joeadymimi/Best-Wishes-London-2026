insert into public.matches (
  id,
  phase,
  group_name,
  stage,
  status,
  table_name,
  team_a,
  team_b,
  score_a,
  score_b,
  detail,
  scheduled_label,
  note,
  together_now,
  fortune,
  source_name,
  source_url
)
values
  ('2026-05-02-1700-t1-chn-w-rom', 'group', '女团Group 1', '小组赛', 'upcoming', 'T1', '中国女团', '罗马尼亚', 0, 0, '待更新', '5月2日 17:00', '中国队第一阶段赛程', 0, 0, '草莓牛奶特别甜', null),
  ('2026-05-02-1930-t1-chn-m-eng', 'group', '男团Group 1', '小组赛', 'upcoming', 'T1', '中国男团', '英格兰', 0, 0, '待更新', '5月2日 19:30', '中国队第一阶段赛程', 0, 0, '草莓牛奶特别甜', null),
  ('2026-05-03-0000-t4-chn-w-tpe', 'group', '女团Group 1', '小组赛', 'upcoming', 'T4', '中国女团', '中国台北', 0, 0, '待更新', '5月3日 0:00', '中国队第一阶段赛程', 0, 0, '草莓牛奶特别甜', null),
  ('2026-05-03-0230-t4-chn-m-kor', 'group', '男团Group 1', '小组赛', 'upcoming', 'T4', '中国男团', '韩国', 0, 0, '待更新', '5月3日 2:30', '中国队第一阶段赛程', 0, 0, '草莓牛奶特别甜', null),
  ('2026-05-03-1930-t1-chn-m-swe', 'group', '男团Group 1', '小组赛', 'upcoming', 'T1', '中国男团', '瑞典', 0, 0, '待更新', '5月3日 19:30', '中国队第一阶段赛程', 0, 0, '草莓牛奶特别甜', null),
  ('2026-05-03-1930-t4-chn-w-kor', 'group', '女团Group 1', '小组赛', 'upcoming', 'T4', '中国女团', '韩国', 0, 0, '待更新', '5月3日 19:30', '中国队第一阶段赛程', 0, 0, '草莓牛奶特别甜', null)
on conflict (id) do nothing;
