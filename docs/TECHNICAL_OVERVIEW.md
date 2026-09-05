# LabTwin — Technical Overview for 3D/WebGL Review

*基于仓库 HEAD `9535d81`（2026-09-05）的实际代码整理。只描述现状，不描述计划。所有路径相对仓库根目录。*

---

# 1. Project Overview

LabTwin 是一个"数据优先"的实验室空间孪生原型：数据库（目前是硬编码的内存数据）只存房间多边形、构件的位置/尺寸/参数，3D 在浏览器里由这些记录实时派生，仓库里没有任何网格文件作为数据源（唯一的 .glb 是一个测试用的示例皮肤）。

当前 prototype 已实现：

- 两个硬编码示例场景（L 形房间、走廊型房间），房间由多边形挤出墙体，支持墙上开门
- 9 种参数化构件（柜、开放架、实验台、通风柜、冰箱、安全柜、水槽、通用设备、手套箱）+ 1 条 GLB 自定义模型加载通道
- 俯视正交 / 透视两种相机；俯视下点选、拖动、放置构件；R 旋转、Delete 删除、Ctrl+Z/Y 撤销重做（命令模式）
- 右侧属性面板（改显示名、尺寸、参数），左侧构件面板，"模型库"展厅页
- 中英文 i18n；32 个 vitest 单测（几何纯函数、命令、注册表）+ 4 条 Playwright e2e

**未实现**（后文多处涉及，先说明）：数据库连接、库存/物品数据、搜索、图片、真正的子位置实体、Plan Studio（2D 描图）。

---

# 2. Tech Stack

| 层 | 实际使用 | 版本（`package.json`，全部精确锁定） |
| --- | --- | --- |
| Frontend | React + TypeScript + Vite | react 19.2.8 · typescript 5.9.3 · vite 7.3.6 · @vitejs/plugin-react 5.2.0 |
| 3D | three.js + @react-three/fiber (R3F) + @react-three/drei | three 0.185.1 · @react-three/fiber 9.7.0 · @react-three/drei 10.7.8 · @types/three 0.185.4 |
| WebGL | R3F 默认 `WebGLRenderer`，**未做任何显式配置**（见 §4） | — |
| UI | 无 UI 框架；手写 inline-style 组件（`src/ui/primitives.tsx`）+ lucide 图标 | lucide-react 1.41.0 |
| 状态 | zustand（4 个 store）+ 少量 React local state | zustand 5.0.15 |
| 几何 | 自写纯函数（多边形→墙体盒子、实体→盒子描述）+ R3F 声明式 `boxGeometry` / `cylinderGeometry` / `shapeGeometry` / `planeGeometry`；GLB 走 drei `useGLTF` | — |
| 数据存储 | **无**。`@supabase/supabase-js` 已装、`src/api/` 层已写但未接线；场景数据来自 `src/features/space/demo.ts` | @supabase/supabase-js 2.115.0 |
| i18n | i18next + react-i18next | 26.4.2 / 17.0.13 |
| Build / Deploy | Vite build；无 CI、无部署配置（README 提到 Vercel，仓库里没有配置文件） | — |
| 测试 | vitest（jsdom）· @playwright/test | 4.1.11 · 1.63.0 |
| 其他已装未用 | pdfjs-dist 6.3.289（Plan Studio 预留） | — |

`three-stdlib` 作为 drei 的传递依赖被直接 import 了一次（`LibraryView.tsx` 里的 `OrbitControls` 类型），没有写进 `package.json`。

---

# 3. Project Structure

```
src/
  main.tsx                     入口；注入全局 CSS（深色滚动条、range 颜色）
  App.tsx                      顶栏 + 视图切换（空间 / 模型库）+ 示例场景下拉；把 demo 数据 load 进 store
  api/
    types.ts                   领域类型：Space（polygon, doors, height）、Entity（code, type, transform, dims, params）、Item
    client.ts / workspaces.ts  Supabase 客户端与 workspaces 访问（未被 UI 调用）
  store/
    editor.ts                  UI 状态：view、sceneId、cameraMode、selectedCode、hoveredCode、placingPresetId、floorPoint、draggingId
    entities.ts                场景数据：space、entities[]、Location ID 计数器；_insert/_remove/_patch/_nextCode
    auth.ts / workspace.ts     空壳
  features/space/
    demo.ts                    两个硬编码场景（Space + Entity[]）
    geometry/
      coords.ts                平面(x,y)↔世界(x,elev,z) 映射、网格吸附、角度吸附
      polygon.ts               点在多边形内、面积、包围盒
      walls.ts                 多边形 + 门 → 墙体盒子描述（BoxDesc[]）
      entityBox.ts             transform + dims → 盒子描述（中心、尺寸、rotationY）
    components/
      registry.ts              构件注册表 PRESETS：默认尺寸/范围、参数、颜色 token、图标、来源（parametric | glb）
      meshes/style.ts          MeshStyleContext（base 色 + 选中/悬停 accent）、shade()
      meshes/Part.tsx          Part（盒子）/ Rod（圆柱）—— 所有参数化构件的原子 mesh + material
      meshes/basic.tsx         9 个参数化构件的组装函数（Cabinet, OpenShelf, Bench, FumeHood, Fridge, SafetyCabinet, Sink, Equipment, Glovebox）
      meshes/index.tsx         ParametricComponent：按 registry 的 mesh 名分发
      CustomModel.tsx          useGLTF 加载 .glb、按 dims 等比缩放贴地、克隆材质、错误边界
    commands/
      history.ts               useHistory：past/future 栈，run/undo/redo
      entityCommands.ts        placeEntity / deleteEntity / moveEntity / rotateEntity / setDims / setParam / setLabel
    scene/
      SpaceScene.tsx           Canvas、灯光、drei Grid、键盘快捷键；挂 Floor / Room / EntityMesh
      Cameras.tsx              正交（俯视）/ 透视两套相机 + OrbitControls
      Room.tsx                 地板 ShapeGeometry + 墙体盒子；每帧 dollhouse 剔除（改材质 opacity）
      EntityMesh.tsx           单个实体：group 定位/旋转、选中/悬停样式、指针事件、选中脚印、Html 标签
      Floor.tsx                不可见 400×400 交互平面：放置幽灵、拖动、点空白取消选择
    Palette.tsx                左侧构件面板：点击进入放置模式
    InspectorPanel.tsx         右侧面板：选中实体的记录 + 实体列表；所有编辑走 commands
  features/library/
    LibraryView.tsx            第二个独立 Canvas：所有 preset 排成展厅，点选飞相机
  theme/tokens.ts              颜色/间距/字体 token（含构件颜色）
  theme/icons.ts / Icon.tsx    lucide 图标映射
  ui/primitives.tsx            Button / SectionTitle / Field / inputStyle / rowStyle
public/models/sample-rotavap.glb  脚本生成的测试 GLB
e2e/smoke.spec.ts              4 条 Playwright 用例（含截图）
```

按关注点索引：

| 关注点 | 文件 |
| --- | --- |
| 3D Scene / Renderer / Lighting / Render loop | `scene/SpaceScene.tsx`（Canvas + 灯光）、`library/LibraryView.tsx`（第二个 Canvas） |
| Camera / Controls | `scene/Cameras.tsx`；`LibraryView.tsx` 里的 `FocusOn` |
| Geometry（纯数学） | `geometry/walls.ts`、`geometry/entityBox.ts`、`geometry/coords.ts` |
| Geometry（three 对象） | `meshes/Part.tsx`、`meshes/basic.tsx`、`scene/Room.tsx`、`CustomModel.tsx` |
| Materials | `meshes/Part.tsx`（唯一的材质工厂，`meshStandardMaterial`）、`Room.tsx`（墙）、`EntityMesh.tsx` / `Floor.tsx`（脚印 `meshBasicMaterial`） |
| Object creation / delete | `commands/entityCommands.ts` → `store/entities.ts` → `SpaceScene.tsx` 的 `entities.map` |
| Transform / move / rotate | `Floor.tsx`（拖动）、`entityCommands.ts`（moveEntity / rotateEntity）、`geometry/entityBox.ts` |
| Selection / Raycasting | `EntityMesh.tsx`（onPointerDown / Over / Out）、`Floor.tsx`（onClick 取消）；raycast 由 R3F 事件系统完成，项目里没有手写 Raycaster |
| Highlight | `meshes/style.ts` + `Part.tsx`（emissive）、`EntityMesh.tsx`（脚印平面 + 标签变色） |
| Inventory / Metadata / Search | **无实现**。类型在 `api/types.ts`（`Item`），元数据只有 `Entity.label` / `Entity.params` |
| UI ↔ 3D | `store/editor.ts`（唯一桥梁：selectedCode 等）、`InspectorPanel.tsx`、`Palette.tsx`、`App.tsx` |
| State | `store/*.ts`、`commands/history.ts` |

---

# 4. 3D Rendering Architecture

### 启动流程（实际调用链）

1. `main.tsx` → `createRoot(...).render(<App/>)`，`StrictMode` 开启。
2. `App.tsx` `useEffect([sceneId])`：从 `DEMO_SCENES` 取场景 → `useEntitiesStore.load(space, entities)` → `useHistory.clear()`。
3. `App` 渲染 `<SpaceScene/>`（view === 'space'）。`SpaceScene` 读 `space`，为 null 时返回 null；否则挂 `<Canvas>`。
4. `<Canvas shadows dpr={[1,2]}>`（`scene/SpaceScene.tsx`）——**scene / renderer / 默认相机 / resize / render loop 全部由 R3F 创建**，项目没有任何 `new THREE.Scene()`、`new WebGLRenderer()`、`requestAnimationFrame`。
5. `<Cameras/>` 用 drei `OrthographicCamera` 或 `PerspectiveCamera` 的 `makeDefault` 替换 R3F 默认相机，并挂 drei `OrbitControls`。
6. 灯光：`<ambientLight intensity={1.0}/>` + `<directionalLight position={[6,30,10]} intensity={0.9} castShadow={cameraMode !== 'top'} shadow-mapSize=[2048,2048] shadow-camera ±15/>`。灯的 target 是默认 (0,0,0)。
7. drei `<Grid infiniteGrid position-y=-0.001 fadeDistance=80/>`。
8. `<Floor/>`：不可见 `planeGeometry 400×400` at y=−0.002，只接事件。
9. `<Room space/>`：地板 `shapeGeometry`（多边形）at y=0 + 墙体若干 `boxGeometry`。
10. `entities.map(e => <EntityMesh key={e.id} entity={e}/>)`：每个实体一个 group。
11. R3F 每帧 `gl.render(scene, camera)`。

### 各项参数（均为代码里的实际值或 R3F/three 默认值）

| 项 | 值 | 位置 |
| --- | --- | --- |
| Scene | R3F 创建，背景透明；画布 CSS `background: tokens.color.bg`（#2D3133） | `SpaceScene.tsx` Canvas `style` |
| Renderer | R3F 默认 `WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })`；**未传 `gl` 参数** | — |
| Pixel ratio | `dpr={[1, 2]}` → clamp(devicePixelRatio, 1, 2) | `SpaceScene.tsx`、`LibraryView.tsx` |
| Antialiasing | 默认 MSAA（antialias: true） | R3F 默认 |
| Tone mapping | **R3F 默认 `ACESFilmicToneMapping`**，`outputColorSpace = SRGB`。未覆盖。注意：这意味着 `tokens.ts` 里的品牌色在 3D 里不会精确还原 | R3F 默认 |
| Post-processing | 无 | — |
| Shadows | `<Canvas shadows>` → `PCFSoftShadowMap`；只有一盏 directional 投影，2048²，正交范围 ±15 m；**未设 `shadow-bias` / `shadow-normalBias`**；俯视模式下 `castShadow=false` | `SpaceScene.tsx` |
| Depth | 默认 24-bit depth buffer；无 `logarithmicDepthBuffer`；无 `polygonOffset` | — |
| 透视相机 | fov 45，near 0.1，far 200，初始位置 `(cx + 0.9·span, 0.9·span, cz + 0.9·span)` | `Cameras.tsx` |
| 正交相机 | position `(cx, 50, cz)`，`up=[0,0,-1]`，near 0.1，far 200，`zoom = min(viewW/spanX, viewH/spanY)·0.8`（每次 resize 重算） | `Cameras.tsx` |
| Controls | drei `OrbitControls`。俯视：`enableRotate=false`，左键禁用（`mouseButtons.LEFT=undefined`），中键 DOLLY、右键 PAN，无阻尼。透视：阻尼 0.1，`maxPolarAngle = π/2 − 0.05`，距离 2–60。拖动实体时 `enabled=false` | `Cameras.tsx` |
| Render loop | R3F 默认 `frameloop="always"`——**即使无交互也每帧渲染**（Room 的 `useFrame` 依赖这一点） | — |
| Resize | R3F 内置 ResizeObserver；`Cameras` 读 `useThree(s => s.size)` 重算正交 zoom | `Cameras.tsx` |
| 相机切换 | 切模式时**卸载一套相机+controls、挂载另一套**；相机位置不保留 | `Cameras.tsx` |

**模型库页**（`LibraryView.tsx`）是另一个独立 `<Canvas>`，同样 `shadows dpr=[1,2]`，透视相机 fov 40 near 0.1 far 100，独立灯光和 Grid。两个 Canvas 不会同时挂载（tab 切换卸载）。

---

# 5. 3D Object System

### 5.1 参数化构件（Cabinet / Bench / Shelf / Equipment / …）

**Geometry 来源**：不是模型文件。`meshes/basic.tsx` 里每个构件是一个 React 函数，输入 `dims {w,d,h}` 与 `params`，输出若干 `<Part>` / `<Rod>`。`Part` = `<mesh><boxGeometry args=[size]/><meshStandardMaterial/></mesh>`，`Rod` = `cylinderGeometry(r, r, len, 12)`。构件的"造型"就是这些盒子的排布，例如 `Cabinet` = 柜体 + 踢脚 + N 扇门 + 把手，`Glovebox` 约 30 个 Part/Rod。

**局部坐标**：原点在底面中心，x 宽、y 上、+z 正面。

**Dimensions**：`entity.dims` 直接驱动，没有中间缓存；改尺寸 → store 更新 → 组件重渲染 → R3F 用新 `args` **重建 `BufferGeometry`**（boxGeometry 的 args 变化即 dispose+new）。范围由 `registry.ts` 的 `minDims/maxDims` 通过 `clampDims` 约束（只在 `setDimsCommand` 里 clamp，demo 数据不经过 clamp）。

**Position / rotation 存储**：`Entity.transform = { x, y, z, rot }`——`x,y` 是平面米制坐标（y 向下），`z` 是离地高度，`rot` 是平面上的顺时针角度（90° 步进，`snapRotation`）。`geometry/entityBox.ts` 把它换成世界坐标：`center = [x, z + h/2, y]`，`rotationY = −rot·π/180`。`EntityMesh` 把 group 放在 `[center.x, transform.z, center.z]`（注意：group 的 y 用的是离地高度，不是 box.center[1]，因为参数化构件自己从 y=0 往上画）。

**Material**：`Part.tsx` 里每个 Part 各自一个 `meshStandardMaterial`：`color`（Part 自带 color 或 `MeshStyleContext.base`）、`emissive = accent 或 黑`、`emissiveIntensity = 0.12·accentStrength`（选中 1 / 悬停 0.6）、`roughness` 默认 0.85、`metalness` 0.05；透明 Part（玻璃）`transparent + opacity`。**没有材质共享**，也没有 `useMemo` 材质——但 R3F 只在 props 变化时更新属性，不会每帧新建。

**Object ID**：两套。`Entity.id` 是 `crypto.randomUUID()`（放置时，`entityCommands.ts` `uid()`）或 demo 里的 `${space.id}-${code}`；`Entity.code` 是 Location ID `<TYPE>-NN`，由 `store/entities.ts` `_nextCode()` 在前端按类型计数分配（`load()` 时从已有数据扫出最大值；删除后不复用）。three.js 侧：实体 group 的 `name = entity.code`；没有 `userData`。

**加入 / 删除场景**：完全声明式。`placeEntityCommand.do()` → `_insert` → `entities` 数组新引用 → `SpaceScene` 重渲染 → React 挂载新的 `<EntityMesh>`；删除 = `_remove` → 卸载 → R3F 自动 dispose 声明式创建的 geometry/material。没有对象池，没有手动 `scene.add/remove`。

**是否会重新生成**：会。任何导致 `EntityMesh` 重渲染且 `dims`/`params` 变化的操作都会重建对应 geometry。`entities` 数组任何一项被 `_patch`，整个数组换引用 → `SpaceScene` 重渲染 → **所有** `EntityMesh` 函数体重新执行（React 层面），但 R3F diff 后只有变了 props 的 mesh 会动 GPU 资源。拖动一个实体时，每次 pointermove 都会触发这一轮。

**Duplicate / coplanar 表面——存在，且不止一处**（详见 §10）。构件是由重叠盒子拼的，多个盒子的外表面落在同一平面上：

- `Glovebox`：前窗两侧的 `frame` 盒子（`[frame, winH, T]`）与侧板（`[T, chamberH, chamberD]`）体积重叠，前表面同在 `z = chamberZ + chamberD/2`；上下两条前带（`[w, …, T]`）同样与侧板/顶板/底板前表面共面
- `FumeHood`：背板 `[w, chamberH, T]` 与两块侧板 `[0.06, chamberH, d]` 在后角体积重叠，外侧 x 面共面（一条 2 cm 宽的竖条）
- `OpenShelf`：顶板 `[w, T, d]` 横跨两块侧板，顶部 T 高的一圈外表面共面
- `Fridge`：顶部通风条 `[w−0.1, 0.03, 0.06]` 的顶面与柜体顶面同在 `y = h`
- `Equipment`：顶盖 `[w−0.02, 0.016, d−0.02]` 的顶面与主体顶面同在 `y = h`
- `Room`：每段墙盒子总长加 `t`（每端各伸出 `t/2`，`walls.ts` `push(..., pad)`），相邻墙在转角处体积重叠，一面墙的端面恰好落在另一面墙的外表面上；且墙是透明材质 + `depthWrite=false`

### 5.2 Custom Object（GLB）

`CustomModel.tsx`：`useGLTF(url)` → `gltf.scene.clone(true)` → `Box3` 求包围盒 → 取 `min(w/sx, h/sy, d/sz)` 作等比缩放 → 平移使 x/z 居中、最低点贴地 → 遍历 mesh 设 `castShadow/receiveShadow` 并 **clone 每个材质**（避免污染 useGLTF 缓存）→ `<primitive object scale position/>`。选中/悬停用 `useEffect` 直接写克隆材质的 `emissive`。`Suspense` 期间和加载失败（`ModelBoundary` error boundary）都渲染线框盒子。目前只有一个测试 GLB（`sample-rotavap`）。`<primitive>` 卸载时 R3F **不会**自动 dispose 克隆出来的 geometry/material。

### 5.3 Room

`Room.tsx`：地板 = `THREE.Shape` 由多边形生成 `shapeGeometry`，绕 X 转 −90°，`meshStandardMaterial`。墙 = `wallBoxes(polygon, {height, doors})` 输出的 `BoxDesc[]`，每个一个 `boxGeometry` + `meshStandardMaterial({ transparent, opacity 0.85, depthWrite: false })`。有门的边拆成 左段 + 上梁 + 右段。`useFrame` 每帧按相机位置判断墙的外侧是否朝向相机，把材质 `opacity` 向目标值 lerp（0.85 / 0.08 / 上梁俯视 0.25）——**每帧直接改材质属性**。

---

# 6. Interaction System

### 点击 → 选中 → 高亮 → 面板

1. R3F 的事件系统在每次 pointer 事件时对**所有带事件处理器的对象子树**做 raycast（项目没有自己的 `Raycaster`）。
2. `EntityMesh.tsx`：内层 `<group onPointerDown onPointerOver onPointerOut>` 包住构件的全部 Part。`onPointerDown` → `ev.stopPropagation()` → `useEditorStore.select(entity.code)`；若俯视且左键，`setDragging(entity.id)`。`onPointerOver` → `hover(code)` + 改 `document.body.style.cursor`。
3. 选中状态只存在 `editor.selectedCode`（字符串 = Location ID）。每个 `EntityMesh` 用 selector `s => s.selectedCode === entity.code` 订阅，所以选中变化只重渲染新旧两个实体。
4. 高亮 = 三件事同时发生：`MeshStyleContext` 的 `accent` 变为橙色 → 该实体所有 Part 的 `emissive/emissiveIntensity` 更新；`EntityMesh` 在 y=0.003 加一块半透明橙色 `planeGeometry` 脚印；drei `<Html>` 标签背景变橙。没有 outline pass / 后期。
5. `InspectorPanel.tsx` 订阅 `entities` 和 `selectedCode`，`find(e => e.code === selectedCode)` 后渲染字段；面板里的编辑（label、dims、params、旋转、删除）全部构造 Command → `useHistory.run`。列表点击 → `select(code)`，与 3D 点击走同一条状态。

**取消选择**：点到 `Floor.tsx` 的不可见平面 `onClick`（非放置模式时 `select(null)`）；Esc 键。

**拖动**（仅俯视）：`EntityMesh.onPointerDown` 设 `draggingId` → `Cameras` 把 `OrbitControls.enabled=false` → `Floor.onPointerMove` 每次把吸附后的点 `_patch` 进 store（**绕过命令，直接改数据**）→ `Floor.onPointerUp` 先把位置 `_patch` 回起点，再 `run(moveEntityCommand)`，这样撤销栈里只有一条记录。`onPointerLeave` 取消并复位。

**放置**：`Palette` 点击 → `startPlacing(presetId)` → `Floor.onPointerMove` 写 `floorPoint` → `Floor` 渲染一个幽灵（完整的参数化构件 + 脚印，房间外变红）→ `onClick` → `placeEntityCommand`（在多边形外返回 null 不放置）。

### Camera orbit

全部由 drei `OrbitControls` 实现（`Cameras.tsx`），没有自定义控制器。透视模式左键 orbit、右键 pan、滚轮 dolly、`enableDamping`；俯视模式关闭旋转、左键不绑定（留给选择/拖动）。`LibraryView.tsx` 的 `FocusOn` 在选中 preset 时直接写 `controls.target` 和 `camera.position` 然后 `controls.update()`。

---

# 7. Data Architecture

现状只有 **Entity** 一种应用数据，没有 inventory item、image、search index。

| 概念 | 现状 |
| --- | --- |
| Object ID | `Entity.id`（UUID / demo 拼串）。命令（放置、移动、删除、改尺寸）按 `id` 找实体 |
| Cabinet ID / Location ID | `Entity.code`（`CAB-01`）。选中、悬停、three group `name`、UI 列表 testid 都用 `code`。**同一个实体被两个键索引，`selectedCode` 用 code、`draggingId` 用 id** |
| Name | `Entity.label`（可编辑显示名） |
| Location | `Entity.transform` + `Entity.spaceId`；子位置（`CAB-01-S1…`）**只是 InspectorPanel 里按 `params.shelves` 拼出来的字符串**，不是实体，`parentId` 永远为 null |
| Inventory Item | `api/types.ts` 有 `Item { entityId, name, qty, unit }` 类型，**无任何数据、store、UI** |
| Image | 无 |
| Metadata | `Entity.params`（JSON 标量：shelves/doors/sashOpen/ports/preset）；`params.preset` 指向 `registry.ts` 的 preset id，决定外观 |

3D 对象与数据的关联方式：**没有从 three.js 对象反查数据的通道**。`EntityMesh` 通过闭包持有 `entity`，事件回调直接用 `entity.code / entity.id` 写 store；three 侧只有 `group.name = code`，无 `userData`。反向（数据→3D）完全靠 React 重渲染。

---

# 8. Search → Locate → Highlight Flow

**当前代码没有搜索功能**：没有搜索输入框、没有查询函数、没有"相机飞到实体"的实现（`SpaceScene` 场景里没有任何改相机 target 的代码；只有 `LibraryView.FocusOn` 在展厅里会飞相机，且它操作的是 preset 不是实体）。

现有可复用的两段：`editor.select(code)` 会让对应实体高亮并在面板显示（列表点击已经在用）；`LibraryView.FocusOn` 展示了用 `OrbitControls` ref 设置 target/position 的写法。除此之外，从"搜索一个物品"到"定位柜子"之间的每一环（物品数据、物品→entityId、相机定位）都不存在。

---

# 9. State Management

| 状态 | 位置 | 说明 |
| --- | --- | --- |
| 场景数据（space、entities、ID 计数器） | zustand `store/entities.ts` | 全局；`_insert/_remove/_patch` 以 `_` 前缀表示只应由命令调用 |
| 编辑 UI 状态（视图、场景 id、相机模式、选中/悬停 code、放置中 preset、幽灵位置、拖动 id） | zustand `store/editor.ts` | 全局 |
| 撤销栈 | zustand `commands/history.ts` | 全局；命令闭包里直接捕获实体对象 |
| auth / workspace | zustand，空壳 | 未使用 |
| React local state | `LibraryView`（selectedId、每个 ShowroomItem 的 hover） | 局部 |
| React refs | `Floor.dragStart`（拖动起点）、`Room.mats`（墙材质引用）、`LibraryView.controls` | 非响应式 |
| three.js 对象自持状态 | `Room.useFrame` 每帧改 `material.opacity`；`CustomModel.useEffect` 改克隆材质 `emissive`；`FocusOn` 改 `camera.position` / `controls.target`；`OrbitControls` 自身的相机状态 | 不在任何 store 里 |
| DOM | `document.body.style.cursor` 在 `EntityMesh` 里直接写 | 全局副作用 |

问题点：

- **Duplicated / bypassed state**：拖动期间 `Floor.tsx` 直接 `_patch` 实体位置（绕过命令），松手后复位再以命令重放——同一次拖动写了三次 store。`floorPoint` 在放置时每个 pointermove 都写 store。
- **Unnecessary re-render**：`SpaceScene` 订阅整个 `entities` 数组；任何一个实体的 `_patch`（包括拖动的每次 pointermove）都让 `SpaceScene` 重渲染并重新执行全部 `EntityMesh`（`EntityMesh` 没有 `React.memo`）。`InspectorPanel` 同样订阅整个数组。当前 10 个实体不明显。
- **Scene 与 React 状态不同步的点**：相机位置/目标只存在 `OrbitControls` 内部，切换 `cameraMode` 时卸载重建，位置丢失；墙体 opacity 是每帧 lerp 出来的瞬时值；`hoveredCode` 依赖 `onPointerOut` 触发，若实体在悬停中被删除或场景切换，`hoveredCode` 可能残留（`setScene` 有清理，删除没有）。
- **Direct mutation**：`Room.useFrame` 与 `CustomModel.useEffect` 直接改材质；`EntityMesh` 改 `document.body.style.cursor`。这些是有意为之，但不受 store 管理。
- **Race / 边界**：`Floor.onPointerUp` 和 `onPointerLeave`（`onPointerUpCancel`）都可能结束同一次拖动，靠 `dragStart.current = null` 互斥；`onClick` 在拖动结束后是否会触发 `select(null)` 取决于 R3F 对 click 的位移过滤，代码里没有显式防护，需要实测。`App.useEffect([sceneId])` 在 StrictMode 下开发时会执行两次 `load`（幂等，无害）。
- 命令闭包捕获的是调用时的 `entity` 快照；`load()` 切换场景后 `history.clear()`，但若将来有异步落库，闭包里的对象与 store 会分叉。

---

# 10. Current Rendering Issue（旋转时表面闪烁/抖动）

按可能性排序，每条给出检查位置。**不修改代码，只定位。**

1. **构件内部的共面表面（z-fighting）**——最可能。§5.1 列出的重叠盒子在旋转时随视角变化交替胜出，表现为面上的闪烁条纹/斑块，静止时可能稳定在一种状态。检查 `src/features/space/components/meshes/basic.tsx`：`Glovebox` 的 `frame` 与侧板、上下前带与侧板/顶板/底板（约第 300–330 行）；`FumeHood` 背板与侧板；`OpenShelf` 顶板与侧板；`Fridge` 顶部通风条；`Equipment` 顶盖。验证方法：在对应 Part 上临时加 `polygonOffset` 或把重叠改成相接，看闪烁是否消失。

2. **墙体转角的重叠 + 透明排序**。`geometry/walls.ts` 每段墙总长加 `pad`（无门时 `pad = t`，即每端伸出 `t/2`；有门时靠角的一段 `pad = t/2`），相邻墙在转角体积重叠；`Room.tsx` 墙材质 `transparent: true, depthWrite: false`。透明物体按到相机的距离逐帧排序，旋转时两块重叠墙的顺序反复交换 → 转角处亮度跳变；`depthWrite=false` 还使墙后的实体在墙内也能被看到。检查 `Room.tsx` 第 74–86 行、`walls.ts` 的 `push(..., pad)`。

3. **drei `<Grid infiniteGrid>` 的走样/摩尔纹**。网格线是 shader 画的细线，`cellThickness 0.5`，在斜视角远处会随视角闪烁，视觉上像"地面在抖"。检查 `SpaceScene.tsx` 第 48–60 行与 `LibraryView.tsx` 第 62 行；把 Grid 暂时移除对比。

4. **悬停高亮在旋转时被触发**。透视模式左键 orbit 时指针仍在画布上移动，R3F 持续对实体做 raycast，`onPointerOver/Out` 交替触发 → `MeshStyleContext.accent` 在 null / 青色间切换 → 整个实体的 `emissive` 闪。这会表现为"某个模型整体明暗跳"而非表面纹理。检查 `EntityMesh.tsx` 第 45–58 行；验证方法：在旋转时把鼠标移出画布或临时禁用 `onPointerOver`。

5. **墙体 opacity 每帧 lerp**。`Room.tsx` `useFrame` 里 `m.opacity += (target − m.opacity)·0.25`，旋转时目标值在 0.85/0.08 间切换，墙渐变过程中透过墙看到的实体亮度随之变化，可能被感知为闪烁。检查 `Room.tsx` 第 33–50 行。

6. **阴影**。单盏 directional，2048² 覆盖 30×30 m（约 1.5 cm/texel），**未设 `shadow.bias` / `normalBias`**，`PCFSoftShadowMap`。阴影痤疮通常与相机无关，但 R3F 每帧重绘 shadow map，若有任何浮点抖动会在受光面出现细条纹。检查 `SpaceScene.tsx` 第 36–46 行；验证：`castShadow=false` 对比（俯视模式已经是关的，可用来对照）。

7. **透明玻璃 Part 与其后表面**。`FumeHood` 的 sash 玻璃（`opacity 0.45`）、`Glovebox` 窗玻璃（`opacity 0.45`）、选中脚印（`meshBasicMaterial transparent`）、幽灵脚印——这些透明面默认 `depthWrite=true`，与其它透明物（墙）排序时会互相遮挡跳变。检查 `meshes/basic.tsx` 第 150–160 行、约 320 行；`EntityMesh.tsx` 第 72–78 行。

8. **地板 / Grid / 交互平面的 1 mm 叠放**。`Grid` y=−0.001，交互平面 y=−0.002（不可见，不参与渲染），地板 y=0，脚印 y=0.003，幽灵脚印 0.004。透视 near 0.1 / far 200 在 20 m 处深度分辨率约 0.2 mm，理论够用，但 far/near = 2000 偏大；若把 near 调小或场景变大会先在这里出问题。检查 `Cameras.tsx` near/far；`SpaceScene.tsx` Grid position；`Floor.tsx`。

9. **renderOrder** 未设置任何值——所有透明物靠默认距离排序。若要控制墙/玻璃/脚印的层次，需要在 `Room.tsx`、`Part.tsx` 显式给 `renderOrder`。

10. **重复创建对象 / 渲染循环**：不太可能是原因。对象创建是声明式且按 key 稳定的；`frameloop` 是 always 但没有每帧改几何。可排除 StrictMode 双挂载（只影响 effect，不产生重复 mesh）。

11. **浮点精度**：坐标都在 0–10 m 量级，可排除。

12. **像素比**：`dpr=[1,2]`，在 dpr 3 的屏上会被降到 2，产生轻微重采样模糊而非闪烁。可排除。

---

# 11. Performance / Scalability Review

以当前架构估算（每个实体 = 一个 group，Part 数量：柜 ~6、开放架 ~9、通风柜 ~10、手套箱 ~30；平均按 10 算）。

| 维度 | 100 objects | 500 | 1,000+ | 风险来源 |
| --- | --- | --- | --- | --- |
| Draw calls | ~1,000 | ~5,000 | ~10,000+ | 每个 Part 一个 mesh，无 instancing、无合并；开阴影时再乘 2（shadow pass） |
| Geometry 数 | ~1,000 | ~5,000 | ~10,000 | 每个 `boxGeometry args` 组合都是独立 `BufferGeometry`；相同尺寸也不共享 |
| Material 数 | ~1,000 | ~5,000 | ~10,000 | `Part.tsx` 每个 Part 一个 `MeshStandardMaterial`；shader program 会被 three 复用，但 uniform 上传和状态切换随 material 数线性增长 |
| Raycasting | 每次 pointermove 对所有 Part 求交 | 明显卡顿 | 不可用 | R3F 对每个带事件的子树做 raycast；实体用 group 级事件，其下所有 Part 都是候选；无 BVH、无包围盒粗筛 |
| React re-render | 可接受 | 拖动时每 pointermove 重渲染 500 个 `EntityMesh` | 不可用 | `SpaceScene` 订阅整个数组、`EntityMesh` 无 memo |
| Render loop | 固定每帧 | 同 | 同 | `frameloop="always"`，空闲时也满帧；`Room.useFrame` 每帧遍历所有墙 |
| Memory | 小 | 中 | 大 | 几何/材质不复用；GLB 克隆的材质/几何在卸载时不被 R3F dispose |
| Textures | 无 | 无 | 无 | 目前零贴图；GLB 若带贴图则每实例共享缓存的贴图（clone 不复制 texture） |
| Shadows | 1 张 2048² | 同；但 1.5 cm/texel 在大房间会明显锯齿 | 同 | 单一正交阴影相机 ±15 m 固定，房间超出 15 m 会没有阴影 |
| DOM labels | 100 个 `<Html>` | 500 个——drei `Html` 每帧对每个标签做投影和 CSS transform 更新 | 1,000 个 DOM 节点每帧更新，主线程瓶颈 | `EntityMesh` 每个实体一个 `Html`，无距离剔除、无 occlusion |
| Inventory 数据 | 不存在 | — | — | — |
| Search | 不存在 | — | — | — |

额外：`LibraryView` 把所有 preset 各画一份（当前 10 个，无问题）；`Floor` 的放置幽灵是完整构件（手套箱 30 个 Part）每次 pointermove 重渲染。

---

# 12. Technical Debt / Risks

### A. 现在最好解决

- 参数化构件的共面重叠（§5.1 / §10-1）——每加一个构件都会复制这个模式，越晚改越多。
- 墙体转角重叠 + 透明 + `depthWrite=false`（§10-2）——影响所有场景的视觉稳定性。
- `EntityMesh` 无 `React.memo`、`SpaceScene` 订阅整个 `entities` 数组——拖动性能随实体数线性恶化，改法简单。
- `three-stdlib` 直接 import 但未声明为依赖（`LibraryView.tsx` 第 4 行）。
- Tone mapping 使用 R3F 默认 ACES——设计侧刚定的品牌色在 3D 里不准；这是产品决策，需要现在定（`NoToneMapping` 还是接受偏色）。

### B. Prototype 阶段可以接受

- 无 instancing / 几何共享 / 材质共享。
- 每个实体一个 DOM 标签。
- 单盏灯、固定阴影范围、无 bias 调优。
- 相机切换丢失位置；两套相机/controls 卸载重建。
- 拖动绕过命令直接 `_patch`（有复位再重放，撤销栈是对的）。
- `frameloop="always"`。
- `document.body.style.cursor` 副作用。
- Location ID 在前端计数（设计上要移到数据库，`store/entities.ts` 注释已说明）。
- `Backspace` 删除实体（在非输入框时）——容易误删，但原型可接受。
- 演示 GLB 是脚本生成的占位。

### C. 产品化之前必须解决

- 数据层：`api/` 与 store 完全没接；`Item`/inventory/search/image 全部不存在；子位置不是实体。
- 大场景性能：instancing 或 merge（同类构件同尺寸共享几何）、BVH 或粗筛 raycast、标签 LOD/剔除、`frameloop="demand"`。
- 资源释放：`CustomModel` 克隆的几何/材质需要显式 dispose；`useGLTF.preload`/缓存策略。
- 透明渲染策略：墙、玻璃、脚印需要明确的 `renderOrder` / `depthWrite` 规则，或改用非透明的 dollhouse 剔除方式（直接隐藏而不是透明）。
- 阴影：bias/normalBias、阴影相机跟随房间包围盒、或改用烘焙/AO。
- 事件系统：目前所有 Part 参与 raycast；需要每实体一个代理包围盒做拾取。
- 相机状态入 store（保存视角、搜索定位飞行需要）。
- 无 CI、无部署配置、e2e 依赖本地 Chromium。
- StrictMode + 异步落库时命令闭包与 store 分叉（§9）。

---

# 13. Questions for the WebGL Engineer

1. 用重叠盒子拼参数化构件（`meshes/basic.tsx`）这条路线，在你看来应该继续（并修共面问题），还是应该改为每个构件一个合并的 `BufferGeometry` / 用 CSG？考虑到构件尺寸和参数是运行时可改的。
2. 墙体的 dollhouse 剔除现在是"透明 + 每帧 lerp opacity + depthWrite=false"（`Room.tsx`）。你会怎么做——按相机朝向直接 `visible=false`、用 `clippingPlanes`、还是保留透明但设 `renderOrder`？
3. 对 500–1,000 个实体、每个 6–30 个 Part 的规模，你认为合适的批处理边界是什么：按构件类型 `InstancedMesh`、按实体合并几何、还是维持现状只加 BVH 拾取？各自对"改一个实体尺寸就重建"的编辑流程影响如何？
4. R3F 的事件系统对整个场景 raycast（`EntityMesh.tsx` 的 group 级事件）。你会保留 R3F 事件，加一个不可见的包围盒代理，还是自己维护 `Raycaster` + 空间索引？
5. `frameloop="always"` 加 `Room.useFrame` 每帧改材质：在编辑器类应用里你倾向 `demand` 模式 + 显式 `invalidate()` 吗？成本在哪？
6. 阴影配置（`SpaceScene.tsx`：单盏 directional，2048²，±15 m，无 bias）对这种室内、俯视为主的应用是否值得保留？你会换成什么（烘焙 AO、`ContactShadows`、或干脆不投影）？
7. Tone mapping：R3F 默认 ACESFilmic 会改变品牌色。对一个"颜色即语义"（构件类型靠颜色区分）的应用，你建议 `NoToneMapping` + sRGB，还是保留并让设计侧在 token 里做补偿？
8. 正交俯视 + 透视两套相机分别挂载/卸载（`Cameras.tsx`）。你会改成一台相机切投影、还是两台常驻只切 `makeDefault`？相机状态应该进 zustand 吗？
9. drei `<Html>` 标签每实体一个：到几百个时你认为应该改成什么（`Sprite`/SDF 文字、Canvas 叠加层、或只显示视锥内且距离阈值内的标签）？
10. GLB 通道（`CustomModel.tsx`）：`clone(true)` + 克隆材质 + `<primitive>`，卸载不 dispose。你会怎么组织自定义模型的加载、实例化和释放？Draco/meshopt 压缩在这个规模值得引入吗？

---

# 14. Key Files for Review（30 分钟顺序）

1. `src/features/space/scene/SpaceScene.tsx`
   → Canvas、灯光、Grid、快捷键；场景装配点
   → 渲染器/阴影/像素比的全部实际配置都在这 116 行里（其余是 R3F 默认）

2. `src/features/space/scene/Cameras.tsx`
   → 两套相机 + OrbitControls，near/far、zoom 自适应
   → 相机切换的卸载重建、正交 zoom 计算、鼠标键位

3. `src/features/space/scene/Room.tsx`
   → 地板 ShapeGeometry、墙体盒子、每帧 dollhouse 透明剔除
   → 透明 + depthWrite=false + 每帧改材质，是 §10 第 2、5 号嫌疑

4. `src/features/space/geometry/walls.ts`
   → 多边形/门 → 墙盒子描述，含转角延长 `pad`
   → 转角重叠的来源；纯函数有单测，改起来安全

5. `src/features/space/components/meshes/Part.tsx`
   → 所有参数化构件的原子 mesh + 唯一的材质工厂
   → 材质数量、emissive 高亮、透明处理都从这里出

6. `src/features/space/components/meshes/basic.tsx`
   → 9 个构件的盒子排布（362 行）
   → §10 第 1 号嫌疑（共面重叠）全部在这里；也是"要不要换建模方式"的决策依据

7. `src/features/space/scene/EntityMesh.tsx`
   → 实体 group、事件、选中样式、脚印、Html 标签
   → raycast 范围、hover 副作用、DOM 标签数量、无 memo

8. `src/features/space/scene/Floor.tsx`
   → 交互平面：放置幽灵、拖动、取消选择
   → 拖动绕过命令直接改 store 的逻辑；pointerup/leave 竞态

9. `src/features/space/components/CustomModel.tsx`
   → GLB 加载、缩放贴地、材质克隆、错误边界
   → dispose 缺失；`<primitive>` 用法

10. `src/features/space/components/registry.ts`
    → 构件注册表：尺寸范围、参数、来源、颜色
    → 理解"数据驱动外观"的契约；将来 instancing 的分组依据

11. `src/store/entities.ts` + `src/store/editor.ts`
    → 场景数据与 UI 状态
    → 两个键（id / code）并存；订阅粒度

12. `src/features/space/commands/entityCommands.ts`
    → 所有编辑操作的 do/undo
    → 数据变更的唯一入口（除拖动预览）；将来接数据库在此加持久化

13. `src/features/space/geometry/entityBox.ts` + `coords.ts`
    → 平面↔世界坐标、旋转约定
    → 坐标系约定（plan y → world +z，rot 顺时针）是全项目基础，有单测

14. `src/features/library/LibraryView.tsx`
    → 第二个 Canvas、相机飞行 `FocusOn`
    → 唯一一处程序化控制相机的代码，搜索定位会复用这个模式

15. `src/theme/tokens.ts`
    → 颜色 token（含 3D 构件色、地板/墙/网格色）
    → 与 tone mapping 问题直接相关；改视觉不必碰 3D 代码

---

*附：运行方式 `npm install && npm run dev`；`npm test`（单测）、`npm run e2e`（Playwright，首次 `npx playwright install chromium`）。截图在 `e2e/__screenshots__/`。*
