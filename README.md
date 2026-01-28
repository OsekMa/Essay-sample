<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

## 本地运行

1. 安装依赖：
   - `npm install`
2. 启动开发服务器：
   - `npm run dev`

## 样本数据说明

- **数据来源目录**：仓库内的 `public/essay-sample/`
- **索引生成**：启动 / 构建时会运行 `scripts/sync-essay-sample.mjs`，根据该目录下的文件生成 `public/essay-sample/index.json`，前端通过 `fetch` 读取并展示
