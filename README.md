# mwaiting002.github.io

muxintian（Bilibili 昵称 Mwaitwait）的个人介绍页。研三研究生，研究具身智能与计算机视觉。

静态 HTML / CSS / JS，放在仓库根目录，由 GitHub Pages 从默认分支发布：<https://mwaiting002.github.io>

本地预览：

```bash
python3 -m http.server 8000
```

然后打开 <http://localhost:8000>。页面不依赖构建步骤，也不加载第三方统计。图片、样式和脚本都使用相对路径。视频 1–8 使用 `assets/covers-styled/` 里的封面；视频 9–12 没有本地封面，用页面里的插画占位卡。

三条项目笔记：

- `projects/dual-arm-loading.html`
- `projects/pose-6d.html`
- `projects/isaac-nav2.html`

项目页上的循环画面是封面的缓慢推移（Bilibili 原片在这里下不到），并链回 Bilibili。
