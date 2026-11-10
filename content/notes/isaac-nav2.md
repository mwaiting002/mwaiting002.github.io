---
slug: isaac-nav2
date: 2026-11-10
title_zh: 在 Isaac Sim 里部署 Nav2
title_en: Notes on Nav2 inside Isaac Sim
summary_zh: TF、代价地图，以及仿真到真机的差距。那条视频的简介只有一句。
summary_en: TF, costmaps, and the sim-to-real gap. The video itself is one sentence.
---

## zh

### 这条笔记对应哪条视频

「Isaac sim部署nav2实现自主导航」的简介是：在英伟达的 Isaac Sim 里面部署 Nav2 导航算法。没有写机器人型号、地图、代价地图参数或成功率。

下面是把 Nav2 放进仿真时常用的检查清单，不是这条视频的配置记录。

### 先画 TF 树

导航至少要分清这些坐标系：仿真世界、地图、里程计、机器人基座、激光或深度。名字可以不同，但父子关系要唯一。

```text
map -> odom -> base_link -> sensors
```

- `map` 到 `odom` 通常由定位给出，会跳。
- `odom` 到 `base_link` 应该连续，不要再被别的节点覆盖。
- 传感器帧如果装反，代价地图里的障碍会转到车体另一侧。

在 Isaac Sim 里，USD 舞台的上轴和 ROS 的坐标系不一定一致。导出或桥接时核对一次，不要靠“看起来朝前”。

### 代价地图只写你改过的项

Nav2 的代价地图参数很多。仿真里先确认这几件和场景匹配，而不是照抄一份别人的 yaml：

- 机器人足迹或半径，能不能穿过你摆的窄门。
- 膨胀层会不会把可行走区域吃光。
- 障碍来自哪种仿真传感器，更新频率和最大距离是不是合理。
- 全局地图和局部地图是不是在看同一个坐标系。

视频没有公布这些数值。真要复现，得自己对着场景填，不能从标题反推。

### 仿真到真机

仿真里能走通，只说明这条管线在仿真时钟和仿真传感器下能跑。换到真机时通常还会差：

- 延迟和丢帧，规划用的是过时的扫描。
- 轮子打滑，里程计比仿真乐观。
- 地面摩擦、碰撞体和真实机器人不一致。
- 仿真里忽略的线缆、货架腿，在真机代价地图里会出现。

所以这条视频适合当作“Nav2 已经接到 Isaac Sim”的演示，不要把它读成真机导航指标。

## en

### Which video this note follows

The video “Isaac sim部署nav2实现自主导航” says that Nav2 is deployed inside NVIDIA Isaac Sim. It does not name the robot, the map, costmap parameters, or a success rate.

The checklist below is general practice for putting Nav2 in simulation. It is not a dump of that video’s configuration.

### Draw the TF tree first

Navigation needs a world or map frame, odometry, the robot base, and the lidar or depth frame. Names vary. The parent-child links should not.

```text
map -> odom -> base_link -> sensors
```

- `map` to `odom` usually comes from localization and is allowed to jump.
- `odom` to `base_link` should be continuous. Do not let another node publish over it.
- A flipped sensor frame puts obstacles on the wrong side of the robot in the costmap.

In Isaac Sim the USD stage up-axis and the ROS frame are not automatically the same. Check the bridge instead of trusting “it looks forward”.

### Write down only the costmap fields you changed

Nav2 has many costmap fields. In simulation, match these to the scene instead of pasting someone else’s yaml:

- Footprint or robot radius, and whether it fits the gaps you built.
- Whether inflation eats the free space.
- Which simulated sensor feeds obstacles, and whether its rate and range make sense.
- Whether the global and local maps share one frame.

The video does not publish those numbers. A reproduction has to be filled in against the scene. The title does not imply them.

### Sim to real

A path that works in simulation only shows that the pipeline runs on the simulator clock and the simulated sensors. On a real robot you still usually meet:

- Latency and dropped scans, so the planner sees a stale cloud.
- Wheel slip, so odometry is more optimistic than in sim.
- Friction and collision meshes that do not match the robot.
- Cables and shelf legs that the simulation never had, and that show up in the real costmap.

Treat the video as a demo that Nav2 is connected to Isaac Sim, not as a real-robot navigation score.
