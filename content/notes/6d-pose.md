---
slug: 6d-pose
date: 2026-11-10
title_zh: 6D 姿态估计笔记
title_en: Notes on 6D pose estimation
summary_zh: 相机坐标系、深度对齐，以及两条姿态视频里真正写了什么。
summary_en: Camera frames, depth alignment, and what the two pose videos actually name.
---

## zh

### 这条笔记对应哪几条视频

公开视频里和 6D 姿态直接相关的是同一天的两条：深度学习版用 RealSense D415，以及 FoundationPose 的 ROS 2 版本，CAD 用腾讯混元建模后再用建模工具微调。传统版用奥比中光 Gemini 335，方法是特征点匹配加深度法向量。之后还有一条标题为「6D姿态视觉定位+Moveit2规划」，简介只写了 Ubuntu 22.04 和 ROS 2 Humble。

下面是通用检查清单，不是那几条视频的测量结果。

### 先把相机模型写下来

- 彩色相机的内参（fx、fy、cx、cy）和畸变，不要拿别的分辨率的参数硬套。
- RealSense D415 和 Gemini 335 是两台不同的相机。各自的内参、深度尺度、外参都要分开保存。
- 如果后面要投影 CAD 或画坐标轴，确认用的是彩色内参还是深度内参，二者不要混。

### 深度和彩色要对齐

深度图和彩色图往往不在同一个像素网格上。没对齐就去做特征点或把姿态画回彩色图，框和物体会对不齐。

- 记录对齐是在相机 SDK 里做的，还是自己用外参做的。
- 对齐之后再检查：物体边缘的深度是不是还落在彩色轮廓里面。
- 空洞、飞点和反光会让法向量和特征深度一起漂。传统版写的是「特征点匹配 + 深度法向量」，法向量对深度噪声很敏感。

### 坐标系要说人话

6D 姿态是旋转加平移，但它相对谁，必须写清楚：相机坐标系、物体 CAD 坐标系，还是机器人基座。

- CAD 用混元建完再微调之后，原点不一定还在你以为的几何中心。
- FoundationPose 这类方法输出的通常是物体在相机下的位姿。要给机械臂用，还得再乘相机到基座的外参。
- 旋转是旋转矩阵、四元数还是欧拉角，以及乘法顺序，换一次库就核对一次。

### 接到规划之前

那条 MoveIt 2 视频的简介没有写标定结果或误差。在把姿态送进规划之前，至少核对：

```text
camera_frame -> object_frame -> base_frame
```

物体在相机里看起来对了，不代表在基座里也是对的。差一个轴的方向，抓取就会反。

## en

### Which videos this note follows

Two videos from the same day are about 6D pose. The deep-learning one uses a RealSense D415 and the ROS 2 build of FoundationPose. Its CAD model was made with Tencent Hunyuan and then adjusted in a modeling tool. The classical one uses an Orbbec Gemini 335, with feature matching plus depth normals. A later video is titled “6D姿态视觉定位+Moveit2规划”; its description only says Ubuntu 22.04 and ROS 2 Humble.

The checklist below is general practice. It is not a measurement from those videos.

### Write the camera model down

- Keep fx, fy, cx, cy and distortion for the color camera. Do not reuse intrinsics from another resolution.
- The D415 and the Gemini 335 are different cameras. Store intrinsics, depth scale, and extrinsics separately.
- If you project a CAD model or draw axes, decide whether you are using color intrinsics or depth intrinsics. Do not mix them.

### Align depth with color

The depth image and the color image often do not share a pixel grid. Feature matching or drawing a pose onto the color image will miss the object if you skip alignment.

- Record whether alignment happens inside the camera SDK or with your own extrinsics.
- After alignment, check that depth along the object edge still sits inside the color silhouette.
- Holes, flying pixels, and glare move both normals and feature depth. The classical video names “feature matching + depth normals”, and normals are sensitive to depth noise.

### Name the coordinate frame

A 6D pose is a rotation and a translation, but relative to which frame: camera, CAD, or robot base.

- After Hunyuan modeling and a manual tweak, the CAD origin may no longer be the geometric center you expect.
- Methods such as FoundationPose usually report the object in the camera frame. A robot arm still needs the camera-to-base extrinsic.
- Check whether rotation is a matrix, a quaternion, or Euler angles, and the multiply order, every time you change libraries.

### Before planning

The MoveIt 2 video does not publish a calibration result or an error. Before sending a pose to a planner, write the chain:

```text
camera_frame -> object_frame -> base_frame
```

A pose that looks right in the camera can still be wrong in the base. One flipped axis is enough to miss the grasp.
