# mwaiting002.github.io

muxintian（Bilibili 昵称 Mwaitwait）的个人介绍页。研三研究生，研究具身智能与计算机视觉。

静态 HTML / CSS / JS，放在仓库根目录，由 GitHub Pages 从默认分支发布：<https://mwaiting002.github.io>

本地预览：

```bash
python3 -m http.server 8000
```

然后打开 <http://localhost:8000>。页面不依赖构建步骤，也不加载第三方统计。图片、样式和脚本都使用相对路径。视频 1–8 使用 `assets/covers-styled/` 里的封面；视频 9–12 没有本地封面，用页面里的插画占位卡。

首页「场景」一节有一个本地 WebGL 实验台（没有 WebGL 时退回三个项目链接）和一张只包含页面上已有技术的技能图。终端用反引号或 `>_` 打开，命令会跳到这些区块或项目页。

三条项目笔记：

- `projects/dual-arm-loading.html`
- `projects/pose-6d.html`
- `projects/isaac-nav2.html`

项目页上的循环画面是封面的缓慢推移（Bilibili 原片在这里下不到），并链回 Bilibili。封面同时提供 AVIF、WebP 和原来的 PNG。

## 技术笔记

正文源文件在 `content/notes/*.md`，生成的页面在 `notes/`。首页只链到生成结果，GitHub Pages 不需要再跑构建。

新开一篇：

1. 复制 `content/notes/6d-pose.md`，改文件名和 frontmatter（`slug`、`date`、`title_zh`、`title_en`、`summary_zh`、`summary_en`）。
2. `## zh` 下面写中文，`## en` 下面按同样的标题、段落、列表顺序写英文。代码块放在中文侧即可。
3. 运行 `node scripts/build-notes.mjs`。
4. 把 `content/notes/`、`notes/` 和首页 `index.html` 里的笔记卡片一起提交。首页卡片要手改，索引页 `notes/index.html` 会由脚本重写。

每篇生成页顶部都有「草稿」标记。不要在笔记里写视频没有公布的数字或个人成绩。
