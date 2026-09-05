# 自定义模型规范（GLB）

给特殊大型仪器做低模，放进产品里的流程和要求。基础家具（柜、架、台、通风柜、冰箱、安全柜、水槽）已经是代码参数化的，不需要建模。

## 一句话

**按真实尺寸、以米为单位、Y 轴向上、原点在底面中心、正面朝 +Z、一个 .glb 文件、面数 ≤ 5k。**

## 流程

1. 在 Blender / Rhino / SketchUp 里按下面的规范建低模
2. 导出为 `xxx.glb`（二进制 glTF 2.0），放到 `public/models/xxx.glb`
3. 在 `src/features/space/components/registry.ts` 的 `CUSTOM` 数组里加一个条目（照着 `sample-rotavap` 抄），填 id、ID 前缀（通常 `EQP`）、真实尺寸 dims、图标名
4. 在 `src/i18n/zh.json` 和 `en.json` 的 `component` 下加一行名称
5. 保存，页面自动刷新；打开"模型库"标签检查外观、朝向、落地

## 坐标与单位

| 项目 | 要求 |
| --- | --- |
| 单位 | 米（Blender 场景单位设 Metric，Unit Scale 1.0；导出时勾 +Y Up） |
| 朝上 | +Y |
| 正面 | +Z（面板、门、操作面朝 +Z；放到场景里 rot 0 时正面朝平面图的 y 正方向） |
| 原点 | 底面（脚/底座）的中心。导出前 Apply All Transforms |
| 尺寸 | 真实尺寸。程序会按 registry 里的 dims 做**等比**缩放使模型恰好装进 W×D×H 的盒子——模型按真实尺寸建、dims 填真实尺寸，缩放比就是 1 |

原点不在底面中心也能用（程序会自动居中、贴地），但朝向不会自动纠正，所以 +Z 正面务必对。

## 面数与材质

| 项目 | 要求 |
| --- | --- |
| 三角面 | 单个模型 ≤ 5,000；复杂仪器 ≤ 10,000。网页里几十台设备同屏，靠这个保证帧率 |
| 材质 | Principled BSDF（导出成 glTF PBR）；每个模型 ≤ 4 个材质；只用 Base Color + Roughness + Metallic，不要贴图（贴图会让文件从几十 KB 变成几 MB） |
| 颜色 | 用材质的 Base Color 直接上色。玻璃：Base Color 浅蓝 + Alpha 0.4 + Blend Mode Alpha Blend |
| 命名 | 文件名小写、连字符：`rotary-evaporator.glb`、`glovebox-2port.glb` |
| 文件大小 | 目标 < 200 KB，上限 1 MB |
| 不要 | 动画、骨骼、灯光、相机、多个场景、Draco 压缩（后面需要再开） |

## 细节层级

这个产品的 3D 是"空间索引"不是效果图。够认出来是什么、尺寸对、正面对，就够了。

- 保留：整体轮廓、主要体块（底座 / 主箱体 / 立柱 / 玻璃罩）、有辨识度的特征（手套箱的手套口、旋蒸的烧瓶和冷凝管、离心机的圆盖）
- 去掉：螺丝、线缆、铭牌、圆角倒角、内部结构

## 在 Blender 里导出

File → Export → glTF 2.0：Format **glTF Binary (.glb)**；Include 只勾 Selected Objects；Transform 勾 **+Y Up**；Geometry 勾 Apply Modifiers、UVs 可不勾、Normals 勾；Compression 不勾。

## 检查清单

- [ ] 模型库标签里能看到，不是线框盒子（线框盒子 = 文件没找到或加载失败，看浏览器控制台）
- [ ] 贴地，不悬空不下陷
- [ ] 正面朝向观察者（模型库默认视角从 +Z 看过去）
- [ ] 尺寸标签与实物一致
- [ ] 选中时整体泛紫色高光（说明材质正常）

## 示例

`public/models/sample-rotavap.glb` 是一个用脚本生成的旋转蒸发仪占位模型（底座 + 加热锅 + 立柱 + 冷凝管 + 烧瓶），只用来验证加载通道，可以直接替换。
