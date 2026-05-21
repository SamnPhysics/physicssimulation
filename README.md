# 高中物理互動式模擬器 (Interactive Physics Simulator)

這是一個專為高中物理課程設計的互動式模擬器。透過視覺化的物理情境，學生可以更直觀地理解抽象的物理概念，並透過參數調整來探索物理定律的變化。

## 📚 適用單元

本模擬器涵蓋高中物理學科核心單元：

- **一、質點運動學 (Kinematics)**
  - 一維等加速度運動 (直線運動)
  - 二維拋體運動 (Projectile Motion)

- **二、牛頓運動定律 (Newton's Laws)**
  - 平面運動與摩擦力 (Motion on a Plane with Friction)
  - 斜面運動 (Inclined Plane)

- **三、功與能 (Work and Energy)**
  - 能量守恆 (Conservation of Energy)
  - 彈力位能 (Elastic Potential Energy)

- **四、動量與碰撞 (Momentum and Collisions)**
  - 動量守恆 (Conservation of Momentum)
  - 彈性與非彈性碰撞 (Elastic & Inelastic Collisions)

- **五、圓周運動與轉動 (Circular Motion & Rotation)**
  - 鐘擺 (Pendulum)
  - 圓周運動 (Uniform Circular Motion)

- **六、週期性運動 (Periodic Motion)**
  - 簡諧運動 (Simple Harmonic Motion)

- **七、流體靜力學 (Fluid Statics)**
  - 連通管 (Communicating Vessels)

## 🚀 主要功能

- **實時模擬 (Real-time Simulation)**: 拖曳物體或調整參數，即時觀看物理過程。
- **參數化控制 (Parametric Control)**: 自訂初速度、角度、質量、摩擦係數等變數。
- **多視角切換 (Multi-view Toggle)**: 在水平視角 (Side View) 和俯視角 (Top View) 之間切換。
- **軌跡追蹤 (Trajectory Tracing)**: 自動顯示物體移動軌跡，輔助分析路徑。
- **向量疊加 (Vector Overlay)**: 顯示速度、加速度、力的向量圖，解構受力情況。

## ⚙️ 如何使用

1. 點擊左側欄位切換不同的物理單元。
2. 調整右側面板的滑桿或輸入框來改變物理條件。
3. 點擊 "▶ 執行模擬 (Run Simulation)" 按鈕開始動畫。
4. 點擊 "⏸ 暫停/恢復 (Pause/Resume)" 控制時間流逝。
5. 點擊 "🔄 重置 (Reset)" 返回初始狀態。

## 📂 程式結構

- `index.html`: 應用程式主入口，負責頁面佈局。
- `src/`: 核心邏輯與元件目錄。
- `src/App.jsx`: 主應用程式，負責狀態管理和路由。
- `src/components/`: 可重用的 UI 元件。
- `src/scenes/`: 各個物理單元的獨立場景模組 (例如: `Kinematics1D`, `ProjectileMotion`, `NewtonsLaws`, 等)。
