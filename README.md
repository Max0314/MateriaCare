# MateriaCare

MateriaCare 是一个 C 端中药材识别与可信知识查询网页 MVP。第一版聚焦响应式网页体验、静态权威来源摘要、药材库、药膳建议、药材柜和短期提醒。

## 本地开发

```bash
pnpm install
pnpm dev
```

## 质量检查

```bash
pnpm lint
pnpm build
```

## Docker 单域名部署

```bash
docker compose up --build
```

容器内由 Nginx 托管构建后的静态文件，并支持 SPA fallback。默认绑定宿主机 `127.0.0.1:39066`，生产环境通过唯一域名的 `/materia-care/` 路径反向代理到该端口。后续如增加后端 API，应统一挂载在同域名 `/materia-care/api/*` 路径下。

## 数据边界

- 第一版数据位于 `src/data/herbs.ts`，不依赖远程 API。
- 权威来源作为引用与摘要依据，不批量复制受版权限制正文。
- 内容仅供科普参考，不提供诊断、处方或治疗建议。
