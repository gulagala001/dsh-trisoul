window.__ModuleLoader__.load({
	id: "@trisoul/dsh-client-memory-ui",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		let _deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		let react_jsx_runtime = require("react/jsx-runtime");
		//#region src/client/api.ts
		const SCOPES$1 = [
			"project",
			"cross",
			"global"
		];
		const ENDPOINT$1 = "/trisoul/api/memory";
		async function fetchMemories(sessionId) {
			const q = sessionId ? `&sessionId=${encodeURIComponent(sessionId)}` : "";
			const response = await fetch(`${ENDPOINT$1}?includeSuperseded=1${q}`, { cache: "no-store" });
			if (!response.ok) throw new Error(`HTTP ${response.status}`);
			return await response.json();
		}
		async function call(method, path, body) {
			const response = await fetch(`${ENDPOINT$1}${path}`, {
				method,
				cache: "no-store",
				...body === void 0 ? {} : {
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(body)
				}
			});
			const data = await response.json().catch(() => ({}));
			if (!response.ok) throw new Error(data.error ?? `HTTP ${response.status}`);
			return data;
		}
		const idPath = (id) => `/${encodeURIComponent(id)}`;
		/** 去掉空串字段（服务端把 undefined 当缺省，空串 key/project 没有意义）。 */
		function compact(draft) {
			const out = {};
			if (draft.text !== void 0) out.text = draft.text;
			if (draft.scope !== void 0) out.scope = draft.scope;
			if (draft.key !== void 0 && draft.key.trim()) out.key = draft.key.trim();
			if (draft.project !== void 0 && draft.project.trim()) out.project = draft.project.trim();
			return out;
		}
		const createMemory = (draft) => call("POST", "", compact(draft));
		const updateMemory = (id, patch) => call("PATCH", idPath(id), compact(patch));
		const retireMemory = (id) => call("DELETE", idPath(id));
		const hardDeleteMemory = (id) => call("DELETE", `${idPath(id)}?hard=1`);
		const restoreMemory = (id) => call("POST", `${idPath(id)}/restore`);
		async function callBatch(body) {
			const response = await fetch(`${ENDPOINT$1}/batch`, {
				method: "POST",
				cache: "no-store",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(body)
			});
			const data = await response.json().catch(() => ({}));
			if (!response.ok) throw new Error(data.error ?? `HTTP ${response.status}`);
			return data;
		}
		const batchRetire = (ids) => callBatch({
			action: "retire",
			ids
		});
		const batchRestore = (ids) => callBatch({
			action: "restore",
			ids
		});
		const batchHardDelete = (ids) => callBatch({
			action: "delete",
			ids
		});
		/** 改层到 project 需要项目绑定：服务端只认请求级 project（离开 project 层时条目绑定已被剥掉），没绑定的条目会被跳过。 */
		const batchScope = (ids, scope, project) => callBatch({
			action: "scope",
			ids,
			scope,
			...project ? { project } : {}
		});
		//#endregion
		//#region \0dsh-css:/Users/mac/Projects/trisoul/packages/client/memory-ui/src/client/MemoryPanel.module.css.mjs
		const css$1 = ".LxiJIa_panel{background:var(--dsw-alias-bg-base);height:100%;min-height:0;color:var(--dsw-alias-label-primary);font:var(--dsw-font-xs-13);font-family:var(--dsw-font-family);flex-direction:column;display:flex}.LxiJIa_header{border-bottom:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);flex-direction:column;gap:8px;padding:12px 16px 10px;display:flex}.LxiJIa_headingRow{align-items:center;gap:8px;display:flex}.LxiJIa_title{font:var(--dsw-font-s-14);color:var(--dsw-alias-label-primary);margin:0;font-weight:600}.LxiJIa_spacer{flex:1}.LxiJIa_meta{font:var(--dsw-font-xxs-12);color:var(--dsw-alias-label-tertiary);flex-wrap:wrap;gap:4px 12px;display:flex}.LxiJIa_metaItem{text-overflow:ellipsis;white-space:nowrap;max-width:100%;overflow:hidden}.LxiJIa_list{flex-direction:column;flex:1;gap:8px;min-height:0;padding:10px 12px 16px;display:flex;overflow-y:auto}.LxiJIa_placeholder,.LxiJIa_placeholderError{text-align:center;font:var(--dsw-font-xs-13);color:var(--dsw-alias-label-tertiary);padding:24px 12px}.LxiJIa_placeholderError{color:var(--dsw-alias-state-error-primary)}.LxiJIa_item{background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l2);border-radius:6px;padding:10px 12px;transition:border-color .15s,background-color .15s}.LxiJIa_itemHeader{font:var(--dsw-font-xxs-12);justify-content:space-between;align-items:center;margin-bottom:6px;display:flex}.LxiJIa_itemTime{color:var(--dsw-alias-label-tertiary)}.LxiJIa_itemText{font:var(--dsw-font-xs-13);color:var(--dsw-alias-label-secondary);white-space:pre-wrap;word-break:break-word}@media (prefers-reduced-motion:reduce){.LxiJIa_item{transition:none}}.LxiJIa_filters{flex-wrap:wrap;align-items:center;gap:6px;display:flex}.LxiJIa_tag{height:18px;font:var(--dsw-font-xxxs-11);white-space:nowrap;border:1px solid var(--dsw-alias-border-l2);color:var(--dsw-alias-label-secondary);background:var(--dsw-alias-bg-layer-2);border-radius:4px;align-items:center;padding:0 6px;font-weight:600;line-height:18px;display:inline-flex}.LxiJIa_tagProject{color:var(--dsw-alias-state-business-primary);border-color:var(--dsw-alias-state-business-primary)}.LxiJIa_tagCross{color:var(--dsw-alias-brand-primary);border-color:var(--dsw-alias-brand-primary)}.LxiJIa_tagGlobal{color:var(--dsw-alias-state-warn-primary);border-color:var(--dsw-alias-state-warn-primary)}.LxiJIa_tagSession{color:var(--dsw-alias-label-secondary);border-color:var(--dsw-alias-label-secondary)}.LxiJIa_itemKey{font:var(--dsw-font-xxs-12);color:var(--dsw-alias-label-tertiary);text-overflow:ellipsis;white-space:nowrap;max-width:40%;overflow:hidden}.LxiJIa_stateLabel{font:var(--dsw-font-xxxs-11);color:var(--dsw-alias-label-tertiary);border:1px dashed var(--dsw-alias-border-l3);white-space:nowrap;border-radius:4px;height:18px;padding:0 6px;line-height:18px}.LxiJIa_itemSuperseded{opacity:.55}.LxiJIa_itemSuperseded .LxiJIa_itemText{text-decoration:line-through;text-decoration-color:var(--dsw-alias-border-l3)}.LxiJIa_itemSuperseded:hover{opacity:.85}.LxiJIa_itemFooter{font:var(--dsw-font-xxs-12);color:var(--dsw-alias-label-tertiary);align-items:center;gap:8px;min-width:0;margin-top:6px;display:flex}.LxiJIa_itemProject,.LxiJIa_itemCreated{text-overflow:ellipsis;white-space:nowrap;min-width:0;overflow:hidden}.LxiJIa_history{border-top:1px dashed var(--dsw-alias-border-l2);border-left:2px solid var(--dsw-alias-border-l2);flex-direction:column;gap:6px;margin:8px 0 0;padding:8px 0 0 12px;list-style:none;display:flex}.LxiJIa_historyItem{flex-direction:column;gap:2px;display:flex}.LxiJIa_historyMeta{font:var(--dsw-font-xxxs-11);color:var(--dsw-alias-label-tertiary)}.LxiJIa_historyText{font:var(--dsw-font-xxs-12);color:var(--dsw-alias-label-secondary);white-space:pre-wrap;word-break:break-word}.LxiJIa_actionError{font:var(--dsw-font-xxs-12);color:var(--dsw-alias-state-error-primary);white-space:pre-wrap;word-break:break-word}.LxiJIa_itemEditing{border-color:var(--dsw-alias-brand-primary)}.LxiJIa_itemEditing:hover{background:var(--dsw-alias-bg-layer-1)}.LxiJIa_form{flex-direction:column;gap:8px;min-width:0;display:flex}.LxiJIa_formHead{flex-wrap:wrap;align-items:center;gap:6px;display:flex}.LxiJIa_formTitle{font:var(--dsw-font-xs-13);color:var(--dsw-alias-label-primary);font-weight:600}.LxiJIa_formLabel{font:var(--dsw-font-xxs-12);color:var(--dsw-alias-label-secondary);white-space:nowrap;flex:none}.LxiJIa_textarea{box-sizing:border-box;resize:vertical;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);width:100%;min-height:64px;color:var(--dsw-alias-label-primary);font:var(--dsw-font-xs-13);font-family:var(--dsw-font-family);border-radius:8px;outline:none;padding:6px 8px;line-height:20px}.LxiJIa_textarea::placeholder{color:var(--dsw-alias-label-dimmed)}.LxiJIa_textarea:focus{border-color:var(--dsw-alias-brand-primary)}.LxiJIa_textarea:disabled{opacity:.6}.LxiJIa_formRow{flex-wrap:wrap;gap:8px 12px;display:flex}.LxiJIa_formField{flex:1;align-items:center;gap:6px;min-width:200px;display:flex}.LxiJIa_formField>:last-child{flex:1;min-width:0}.LxiJIa_formActions{align-items:center;gap:8px;min-width:0;display:flex}.LxiJIa_formHint{font:var(--dsw-font-xxs-12);color:var(--dsw-alias-state-warn-primary);min-width:0}.LxiJIa_actions{flex:none;align-items:center;gap:10px;display:inline-flex}.LxiJIa_linkButton{appearance:none;cursor:pointer;font:var(--dsw-font-xxs-12);color:var(--dsw-alias-brand-primary);white-space:nowrap;background:0 0;border:none;padding:0}.LxiJIa_linkButton:hover{text-decoration:underline}.LxiJIa_linkButton:disabled{cursor:default;opacity:.5;text-decoration:none}.LxiJIa_linkDanger{color:var(--dsw-alias-state-error-primary)}.LxiJIa_projectTrigger{justify-content:space-between;gap:6px;min-width:96px;max-width:220px}.LxiJIa_projectTriggerEmpty{color:var(--dsw-alias-label-tertiary)}.LxiJIa_projectTriggerLabel{text-overflow:ellipsis;white-space:nowrap;min-width:0;overflow:hidden}.LxiJIa_caret{color:var(--dsw-alias-label-tertiary);flex:none}.LxiJIa_header{gap:8px;padding:10px 14px 8px}.LxiJIa_viewSwitch{border:1px solid var(--dsw-alias-border-l2);border-radius:6px;display:inline-flex;overflow:hidden}.LxiJIa_viewBtn{appearance:none;cursor:pointer;font:var(--dsw-font-xxs-12);color:var(--dsw-alias-label-secondary);white-space:nowrap;background:0 0;border:0;padding:2px 10px}.LxiJIa_viewBtn+.LxiJIa_viewBtn{border-left:1px solid var(--dsw-alias-border-l2)}.LxiJIa_viewBtn:hover{background:var(--dsw-alias-interactive-bg-hover)}.LxiJIa_viewBtn[aria-selected=true]{background:var(--dsw-alias-brand-primary);color:var(--dsw-alias-label-on-brand,#fff);font-weight:600}.LxiJIa_viewBtn:disabled{cursor:default;opacity:.5}.LxiJIa_search{flex:200px;min-width:160px}.LxiJIa_search>*{width:100%}.LxiJIa_sessionStrip{background:var(--dsw-alias-bg-layer-2,var(--dsw-alias-interactive-bg-hover));font:var(--dsw-font-xxs-12);color:var(--dsw-alias-label-primary);font-variant-numeric:tabular-nums;border-radius:6px;flex-wrap:wrap;align-items:center;gap:4px 8px;padding:5px 10px;display:flex}.LxiJIa_sessionItem{white-space:nowrap;text-overflow:ellipsis;max-width:100%;overflow:hidden}.LxiJIa_sessionLabel{color:var(--dsw-alias-label-tertiary)}.LxiJIa_sessionSep{background:var(--dsw-alias-border-l2);width:1px;height:12px}.LxiJIa_meta{font:var(--dsw-font-xxxs-11);gap:2px 10px}.LxiJIa_list{gap:8px;padding:10px 14px 16px}.LxiJIa_item{border-left:3px solid var(--dsw-alias-border-l3);padding:9px 12px 8px;position:relative}.LxiJIa_item[data-scope=project]{border-left-color:var(--dsw-alias-state-business-primary)}.LxiJIa_item[data-scope=cross]{border-left-color:var(--dsw-alias-brand-primary)}.LxiJIa_item[data-scope=global]{border-left-color:var(--dsw-alias-state-warn-primary)}.LxiJIa_itemKey{color:var(--dsw-alias-label-primary);max-width:50%;font-weight:600}.LxiJIa_itemFooter{font:var(--dsw-font-xxxs-11);margin-top:6px}.LxiJIa_touchedBadge{height:18px;font:var(--dsw-font-xxxs-11);color:var(--dsw-alias-brand-primary);background:color-mix(in srgb, var(--dsw-alias-brand-primary) 12%, transparent);white-space:nowrap;border-radius:4px;align-items:center;padding:0 6px;font-weight:600;display:inline-flex}.LxiJIa_actions{opacity:0;transition:opacity .12s}.LxiJIa_item:hover .LxiJIa_actions,.LxiJIa_item:focus-within .LxiJIa_actions{opacity:1}@media (hover:none){.LxiJIa_actions{opacity:1}}.LxiJIa_history{border-left-color:var(--dsw-alias-border-l3)}.LxiJIa_search{flex:220px;min-width:0;max-width:340px;display:flex}.LxiJIa_search>*{flex:1;width:auto;min-width:0}.LxiJIa_infoRow{flex-wrap:wrap;align-items:center;gap:4px 12px;min-width:0;display:flex}.LxiJIa_sessionStrip{background:0 0;gap:4px 6px;padding:3px 0}.LxiJIa_sessionItem{background:var(--dsw-alias-bg-layer-2,var(--dsw-alias-interactive-bg-hover));font:var(--dsw-font-xxxs-11);color:var(--dsw-alias-label-primary);border-radius:999px;align-items:center;gap:4px;padding:1px 8px;display:inline-flex}.LxiJIa_sessionSep{display:none}.LxiJIa_meta{flex-wrap:nowrap;overflow:hidden}.LxiJIa_item{border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);border-left-width:3px;border-radius:8px;padding:10px 14px 9px}.LxiJIa_item:hover{border-color:var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1)}.LxiJIa_item[data-scope=project]:hover,.LxiJIa_item[data-scope=cross]:hover,.LxiJIa_item[data-scope=global]:hover{border-left-color:inherit}.LxiJIa_itemHeader{gap:8px;margin-bottom:5px}.LxiJIa_tag{border:0;border-radius:4px;height:17px;padding:0 6px;font-weight:600;line-height:17px}.LxiJIa_tagProject{color:var(--dsw-alias-state-business-primary);background:color-mix(in srgb, var(--dsw-alias-state-business-primary) 12%, transparent)}.LxiJIa_tagCross{color:var(--dsw-alias-brand-primary);background:color-mix(in srgb, var(--dsw-alias-brand-primary) 12%, transparent)}.LxiJIa_tagGlobal{color:var(--dsw-alias-state-warn-primary);background:color-mix(in srgb, var(--dsw-alias-state-warn-primary) 14%, transparent)}.LxiJIa_tagSession{color:var(--dsw-alias-label-secondary);background:color-mix(in srgb, var(--dsw-alias-label-secondary) 12%, transparent)}.LxiJIa_itemKey{font:var(--dsw-font-xs-13);color:var(--dsw-alias-label-primary);max-width:55%;font-weight:600}.LxiJIa_itemTime{font:var(--dsw-font-xxxs-11)}.LxiJIa_itemText{color:var(--dsw-alias-label-secondary);line-height:1.6}.LxiJIa_itemFooter{gap:10px;margin-top:7px}.LxiJIa_itemFooter .LxiJIa_linkButton{font:var(--dsw-font-xxxs-11)}.LxiJIa_touchedBadge{height:17px}.LxiJIa_checkbox{appearance:auto;accent-color:var(--dsw-alias-brand-primary);cursor:pointer;flex:none;width:14px;height:14px;margin:0}.LxiJIa_checkbox:disabled{cursor:default;opacity:.5}.LxiJIa_itemSelected{border-color:var(--dsw-alias-brand-primary);background:color-mix(in srgb, var(--dsw-alias-brand-primary) 5%, var(--dsw-alias-bg-layer-1))}.LxiJIa_itemSelected:hover{border-color:var(--dsw-alias-brand-primary)}.LxiJIa_batchBar{border-top:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);bottom:var(--dsh-composer-height,0px);z-index:1;border:1px solid var(--dsw-alias-border-l2);border-bottom:none;border-radius:10px 10px 0 0;flex-wrap:wrap;flex:none;align-items:center;gap:6px 10px;padding:8px 14px;display:flex;position:sticky}.LxiJIa_batchCount{font:var(--dsw-font-xxs-12);color:var(--dsw-alias-label-primary);white-space:nowrap;font-variant-numeric:tabular-nums;font-weight:600}.LxiJIa_batchLabel{font:var(--dsw-font-xxs-12);color:var(--dsw-alias-label-tertiary);white-space:nowrap}.LxiJIa_batchNotice{font:var(--dsw-font-xxs-12);color:var(--dsw-alias-label-tertiary);text-overflow:ellipsis;white-space:nowrap;min-width:0;overflow:hidden}.LxiJIa_batchSep{background:var(--dsw-alias-border-l2);flex:none;width:1px;height:14px}.LxiJIa_batchDanger{color:var(--dsw-alias-state-error-primary)}";
		const tagId$1 = "@trisoul/dsh-client-memory-ui/MemoryPanel.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$1) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@trisoul/dsh-client-memory-ui";
			tag.dataset.pluginCss = tagId$1;
			tag.textContent = css$1;
			document.head.appendChild(tag);
		}
		var MemoryPanel_module_css_default = {
			"formField": "LxiJIa_formField",
			"formHint": "LxiJIa_formHint",
			"formActions": "LxiJIa_formActions",
			"formRow": "LxiJIa_formRow",
			"linkDanger": "LxiJIa_linkDanger",
			"sessionStrip": "LxiJIa_sessionStrip",
			"itemKey": "LxiJIa_itemKey",
			"viewSwitch": "LxiJIa_viewSwitch",
			"tag": "LxiJIa_tag",
			"panel": "LxiJIa_panel",
			"actions": "LxiJIa_actions",
			"textarea": "LxiJIa_textarea",
			"itemTime": "LxiJIa_itemTime",
			"history": "LxiJIa_history",
			"infoRow": "LxiJIa_infoRow",
			"batchCount": "LxiJIa_batchCount",
			"tagSession": "LxiJIa_tagSession",
			"spacer": "LxiJIa_spacer",
			"placeholderError": "LxiJIa_placeholderError",
			"form": "LxiJIa_form",
			"tagProject": "LxiJIa_tagProject",
			"linkButton": "LxiJIa_linkButton",
			"batchBar": "LxiJIa_batchBar",
			"projectTrigger": "LxiJIa_projectTrigger",
			"touchedBadge": "LxiJIa_touchedBadge",
			"actionError": "LxiJIa_actionError",
			"list": "LxiJIa_list",
			"projectTriggerLabel": "LxiJIa_projectTriggerLabel",
			"title": "LxiJIa_title",
			"historyMeta": "LxiJIa_historyMeta",
			"formLabel": "LxiJIa_formLabel",
			"sessionLabel": "LxiJIa_sessionLabel",
			"caret": "LxiJIa_caret",
			"batchNotice": "LxiJIa_batchNotice",
			"header": "LxiJIa_header",
			"tagGlobal": "LxiJIa_tagGlobal",
			"itemSelected": "LxiJIa_itemSelected",
			"itemFooter": "LxiJIa_itemFooter",
			"meta": "LxiJIa_meta",
			"viewBtn": "LxiJIa_viewBtn",
			"formHead": "LxiJIa_formHead",
			"batchDanger": "LxiJIa_batchDanger",
			"batchSep": "LxiJIa_batchSep",
			"batchLabel": "LxiJIa_batchLabel",
			"historyText": "LxiJIa_historyText",
			"formTitle": "LxiJIa_formTitle",
			"itemText": "LxiJIa_itemText",
			"headingRow": "LxiJIa_headingRow",
			"metaItem": "LxiJIa_metaItem",
			"filters": "LxiJIa_filters",
			"itemProject": "LxiJIa_itemProject",
			"historyItem": "LxiJIa_historyItem",
			"itemHeader": "LxiJIa_itemHeader",
			"item": "LxiJIa_item",
			"search": "LxiJIa_search",
			"placeholder": "LxiJIa_placeholder",
			"tagCross": "LxiJIa_tagCross",
			"projectTriggerEmpty": "LxiJIa_projectTriggerEmpty",
			"itemSuperseded": "LxiJIa_itemSuperseded",
			"checkbox": "LxiJIa_checkbox",
			"sessionItem": "LxiJIa_sessionItem",
			"sessionSep": "LxiJIa_sessionSep",
			"itemCreated": "LxiJIa_itemCreated",
			"itemEditing": "LxiJIa_itemEditing",
			"stateLabel": "LxiJIa_stateLabel"
		};
		//#endregion
		//#region src/client/MemoryPanel.tsx
		const REFRESH_MS = 15e3;
		const SCOPE_FILTERS = [
			"all",
			"project",
			"cross",
			"global"
		];
		const SCOPE_CLASS = {
			project: MemoryPanel_module_css_default.tagProject,
			cross: MemoryPanel_module_css_default.tagCross,
			global: MemoryPanel_module_css_default.tagGlobal,
			session: MemoryPanel_module_css_default.tagSession
		};
		const PROJECT_LIST_ID = "trisoul-memory-projects";
		/** 项目路径显示：末两级目录（完整路径放 title） */
		const shortPath = (p) => {
			const segs = p.split(/[\\/]+/).filter(Boolean);
			return segs.length > 2 ? `…/${segs.slice(-2).join("/")}` : p;
		};
		const emptyDraft = (project = "") => ({
			text: "",
			scope: "project",
			key: "",
			project
		});
		const draftOf = (m) => ({
			text: m.text,
			scope: m.scope,
			key: m.key,
			project: m.project ?? ""
		});
		const draftReady = (d) => d.text.trim().length > 0 && (d.scope !== "project" || d.project.trim().length > 0);
		const toPayload = (d) => ({
			text: d.text.trim(),
			...d.scope !== "session" ? { scope: d.scope } : {},
			key: d.key,
			project: d.scope === "project" ? d.project : void 0
		});
		const draftChanged = (d, m) => d.text.trim() !== m.text || d.scope !== m.scope || d.key.trim() !== m.key || d.scope === "project" && d.project.trim() !== (m.project ?? "");
		/** 记忆中枢面板：展示 + 直接编辑 @trisoul/dsh-memory 的分层长期记忆库（底层/跨项目/本项目 + 覆盖链）。 */
		function MemoryPanel({ t, sessionId }) {
			const [memories, setMemories] = (0, react.useState)([]);
			const [meta, setMeta] = (0, react.useState)({});
			const [session, setSession] = (0, react.useState)(null);
			const [view, setView] = (0, react.useState)("session");
			const [touchedOnly, setTouchedOnly] = (0, react.useState)(false);
			const [projects, setProjects] = (0, react.useState)([]);
			const [phase, setPhase] = (0, react.useState)("loading");
			const [error, setError] = (0, react.useState)(null);
			const [query, setQuery] = (0, react.useState)("");
			const [scope, setScope] = (0, react.useState)("all");
			const [projectFilter, setProjectFilter] = (0, react.useState)(null);
			const [showSuperseded, setShowSuperseded] = (0, react.useState)(false);
			const [expanded, setExpanded] = (0, react.useState)({});
			const [updatedAt, setUpdatedAt] = (0, react.useState)(null);
			const [adding, setAdding] = (0, react.useState)(false);
			const [addDraft, setAddDraft] = (0, react.useState)(emptyDraft());
			const [editingId, setEditingId] = (0, react.useState)(null);
			const [editDraft, setEditDraft] = (0, react.useState)(emptyDraft());
			const [busy, setBusy] = (0, react.useState)(null);
			const [actionError, setActionError] = (0, react.useState)(null);
			const [selectMode, setSelectMode] = (0, react.useState)(false);
			const [selected, setSelected] = (0, react.useState)(/* @__PURE__ */ new Set());
			const [batchNotice, setBatchNotice] = (0, react.useState)(null);
			const formatTime = (0, react.useCallback)((ts) => {
				const diff = Date.now() - ts;
				if (diff < 6e4) return t("time.now");
				if (diff < 36e5) return t("time.minutes", { n: Math.floor(diff / 6e4) });
				if (diff < 864e5) return t("time.hours", { n: Math.floor(diff / 36e5) });
				return new Date(ts).toLocaleString(void 0, {
					month: "2-digit",
					day: "2-digit",
					hour: "2-digit",
					minute: "2-digit"
				});
			}, [t]);
			const load = (0, react.useCallback)(async () => {
				try {
					const data = await fetchMemories(sessionId);
					const list = Array.isArray(data.memories) ? data.memories : [];
					setMemories(list.map((m, i) => ({
						...m,
						id: m.id ?? `legacy-${i}`,
						key: m.key ?? "",
						scope: m.scope ?? "cross",
						ts: m.ts ?? m.timestamp ?? 0,
						updatedAt: m.updatedAt ?? m.ts ?? m.timestamp ?? 0,
						superseded: Boolean(m.superseded)
					})));
					setMeta({
						storePath: data.storePath,
						digestsCount: data.digestsCount,
						cursorBySession: data.cursorBySession
					});
					setSession(data.session ?? null);
					setProjects(Array.isArray(data.projects) ? data.projects : []);
					setUpdatedAt(Date.now());
					setError(null);
					setPhase("ready");
				} catch (e) {
					setError(e instanceof Error ? e.message : String(e));
					setPhase("error");
				}
			}, [sessionId]);
			(0, react.useEffect)(() => {
				load();
				const timer = setInterval(() => {
					load();
				}, REFRESH_MS);
				return () => clearInterval(timer);
			}, [load]);
			const activeCount = (0, react.useMemo)(() => memories.filter((m) => !m.superseded).length, [memories]);
			const supersededCount = memories.length - activeCount;
			const sessionKnown = Boolean(session?.known && session.project);
			const effectiveView = view === "session" && sessionKnown ? "session" : "all";
			const sessionCounts = (0, react.useMemo)(() => ({
				visible: memories.filter((m) => m.visible && !m.superseded).length,
				touched: memories.filter((m) => m.touched).length
			}), [memories]);
			const visible = (0, react.useMemo)(() => {
				const q = query.trim().toLowerCase();
				return memories.filter((m) => showSuperseded || !m.superseded).filter((m) => effectiveView !== "session" || m.visible).filter((m) => !touchedOnly || m.touched).filter((m) => scope === "all" || m.scope === scope).filter((m) => effectiveView === "session" || !projectFilter || m.scope !== "project" || m.project === projectFilter).filter((m) => !q || m.text.toLowerCase().includes(q) || m.key.toLowerCase().includes(q) || (m.project ?? "").toLowerCase().includes(q)).sort((a, b) => b.updatedAt - a.updatedAt);
			}, [
				memories,
				query,
				scope,
				projectFilter,
				showSuperseded,
				effectiveView,
				touchedOnly
			]);
			const toggleHistory = (0, react.useCallback)((id) => {
				setExpanded((prev) => ({
					...prev,
					[id]: !prev[id]
				}));
			}, []);
			/** 写操作公共壳：标记 busy、清错、成功后刷新列表，失败进错误条。 */
			const run = (0, react.useCallback)(async (id, action) => {
				setBusy(id);
				setActionError(null);
				try {
					await action();
					await load();
					return true;
				} catch (e) {
					setActionError(e instanceof Error ? e.message : String(e));
					return false;
				} finally {
					setBusy(null);
				}
			}, [load]);
			const openAdd = () => {
				setAddDraft(emptyDraft((effectiveView === "session" ? session?.project : projectFilter) ?? ""));
				setEditingId(null);
				setAdding(true);
				setActionError(null);
			};
			const submitAdd = async (e) => {
				e.preventDefault();
				if (!draftReady(addDraft)) return;
				if (await run("new", () => createMemory(toPayload(addDraft)))) {
					setAdding(false);
					setAddDraft(emptyDraft());
				}
			};
			const openEdit = (m) => {
				setEditDraft(draftOf(m));
				setEditingId(m.id);
				setAdding(false);
				setActionError(null);
			};
			const submitEdit = async (e, m) => {
				e.preventDefault();
				if (!draftReady(editDraft)) return;
				if (!draftChanged(editDraft, m)) {
					setEditingId(null);
					return;
				}
				if (await run(m.id, () => updateMemory(m.id, toPayload(editDraft)))) setEditingId(null);
			};
			const retire = (m) => {
				if (!window.confirm(t("confirm.retire"))) return;
				run(m.id, () => retireMemory(m.id));
			};
			const hardDelete = (m) => {
				if (!window.confirm(t("confirm.delete"))) return;
				run(m.id, () => hardDeleteMemory(m.id));
			};
			const restore = (m) => {
				run(m.id, () => restoreMemory(m.id));
			};
			(0, react.useEffect)(() => {
				setSelected((prev) => {
					const alive = new Set(memories.map((m) => m.id));
					const next = new Set([...prev].filter((id) => alive.has(id)));
					return next.size === prev.size ? prev : next;
				});
			}, [memories]);
			const toggleSelectMode = () => {
				setSelectMode((v) => !v);
				setSelected(/* @__PURE__ */ new Set());
				setBatchNotice(null);
				setAdding(false);
				setEditingId(null);
				setActionError(null);
			};
			const toggleSelected = (id) => {
				setSelected((prev) => {
					const next = new Set(prev);
					if (next.has(id)) next.delete(id);
					else next.add(id);
					return next;
				});
			};
			/** 批量操作公共壳：一次请求 → 结果摘要（成功/跳过）进提示条；成功后清选中但留在选择态，便于连续操作。 */
			const runBatch = async (action) => {
				setBatchNotice(null);
				if (await run("batch", async () => {
					const r = await action();
					const done = r.action === "deleted" ? r.deleted?.length ?? 0 : r.memories?.length ?? 0;
					const skipped = r.skipped?.length ?? 0;
					setBatchNotice(t("batch.done", { ok: done }) + (skipped ? t("batch.skipped", { n: skipped }) : ""));
				})) setSelected(/* @__PURE__ */ new Set());
			};
			const batchBusy = busy === "batch";
			const batchRetireSel = () => {
				if (!selected.size || !window.confirm(t("confirm.batch.retire", { n: selected.size }))) return;
				runBatch(() => batchRetire([...selected]));
			};
			const batchRestoreSel = () => {
				if (selected.size) runBatch(() => batchRestore([...selected]));
			};
			const batchDeleteSel = () => {
				if (!selected.size || !window.confirm(t("confirm.batch.delete", { n: selected.size }))) return;
				runBatch(() => batchHardDelete([...selected]));
			};
			const batchScopeSel = (s) => {
				if (!selected.size) return;
				const bind = s === "project" ? (effectiveView === "session" ? session?.project : projectFilter) ?? void 0 : void 0;
				runBatch(() => batchScope([...selected], s, bind));
			};
			const sessionCount = meta.cursorBySession ? Object.keys(meta.cursorBySession).length : 0;
			const renderForm = (draft, setDraft, id, onSubmit, onCancel, title) => {
				const saving = busy === id;
				const projectMissing = draft.scope === "project" && !draft.project.trim();
				return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("form", {
					className: MemoryPanel_module_css_default.form,
					onSubmit,
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: MemoryPanel_module_css_default.formHead,
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: MemoryPanel_module_css_default.formTitle,
									children: title
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: MemoryPanel_module_css_default.spacer }),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: MemoryPanel_module_css_default.formLabel,
									children: t("form.scope")
								}),
								draft.scope === "session" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Pill, {
									active: true,
									disabled: true,
									title: t("tag.session.hint"),
									children: t("tag.session")
								}) : null,
								SCOPES$1.map((s) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Pill, {
									active: draft.scope === s,
									onClick: () => setDraft({
										...draft,
										scope: s
									}),
									disabled: saving,
									children: t(`scope.${s}`)
								}, s))
							]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("textarea", {
							className: MemoryPanel_module_css_default.textarea,
							rows: 3,
							value: draft.text,
							placeholder: t("form.text.placeholder"),
							autoFocus: true,
							disabled: saving,
							onChange: (e) => setDraft({
								...draft,
								text: e.target.value
							}),
							onKeyDown: (e) => {
								if (e.key === "Escape") onCancel();
							}
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: MemoryPanel_module_css_default.formRow,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
								className: MemoryPanel_module_css_default.formField,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: MemoryPanel_module_css_default.formLabel,
									children: t("form.key")
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Input, {
									value: draft.key,
									placeholder: t("form.key.placeholder"),
									maxLength: 80,
									disabled: saving,
									onChange: (e) => setDraft({
										...draft,
										key: e.target.value
									})
								})]
							}), draft.scope === "project" ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
								className: MemoryPanel_module_css_default.formField,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: MemoryPanel_module_css_default.formLabel,
									children: t("form.project")
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Input, {
									value: draft.project,
									placeholder: t("form.project.placeholder"),
									list: PROJECT_LIST_ID,
									disabled: saving,
									"aria-invalid": projectMissing || void 0,
									onChange: (e) => setDraft({
										...draft,
										project: e.target.value
									})
								})]
							}) : null]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: MemoryPanel_module_css_default.formActions,
							children: [
								projectMissing ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: MemoryPanel_module_css_default.formHint,
									children: t("form.project.hint")
								}) : null,
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: MemoryPanel_module_css_default.spacer }),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
									variant: "ghost",
									size: "sm",
									type: "button",
									onClick: onCancel,
									disabled: saving,
									children: t("form.cancel")
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
									variant: "primary",
									size: "sm",
									type: "submit",
									disabled: saving || !draftReady(draft),
									children: saving ? t("form.saving") : t("form.save")
								})
							]
						})
					]
				});
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: MemoryPanel_module_css_default.panel,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("header", {
						className: MemoryPanel_module_css_default.header,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: MemoryPanel_module_css_default.headingRow,
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", {
										className: MemoryPanel_module_css_default.title,
										children: t("title")
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Pill, { children: t("count", { count: effectiveView === "session" ? sessionCounts.visible : activeCount }) }),
									sessionId ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
										className: MemoryPanel_module_css_default.viewSwitch,
										role: "tablist",
										"aria-label": t("view.label"),
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
											type: "button",
											role: "tab",
											"aria-selected": effectiveView === "session",
											className: MemoryPanel_module_css_default.viewBtn,
											disabled: !sessionKnown,
											title: sessionKnown ? t("view.session.hint") : t("view.session.unknown"),
											onClick: () => setView("session"),
											children: t("view.session")
										}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
											type: "button",
											role: "tab",
											"aria-selected": effectiveView === "all",
											className: MemoryPanel_module_css_default.viewBtn,
											title: t("view.all.hint"),
											onClick: () => setView("all"),
											children: t("view.all", { n: activeCount })
										})]
									}) : null,
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: MemoryPanel_module_css_default.spacer }),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
										variant: "outline",
										size: "sm",
										onClick: toggleSelectMode,
										disabled: phase === "error",
										children: selectMode ? t("batch.exit") : t("batch.enter")
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
										variant: "outline",
										size: "sm",
										onClick: openAdd,
										disabled: adding || selectMode || phase === "error",
										children: t("add")
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
										variant: "ghost",
										size: "sm",
										onClick: () => {
											load();
										},
										disabled: phase === "loading",
										children: t("refresh")
									})
								]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: MemoryPanel_module_css_default.filters,
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: MemoryPanel_module_css_default.search,
										children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Input, {
											value: query,
											placeholder: t("search.placeholder"),
											onChange: (e) => setQuery(e.target.value)
										})
									}),
									SCOPE_FILTERS.map((s) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Pill, {
										active: scope === s,
										onClick: () => setScope(s),
										children: t(`scope.${s}`)
									}, s)),
									effectiveView === "all" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ProjectPicker, {
										value: projectFilter,
										projects,
										allLabel: t("project.all"),
										title: t("project.filter"),
										onChange: setProjectFilter
									}) : null,
									effectiveView === "session" && sessionCounts.touched > 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Pill, {
										active: touchedOnly,
										onClick: () => setTouchedOnly((v) => !v),
										title: t("touched.hint"),
										children: t("touched.toggle", { n: sessionCounts.touched })
									}) : null,
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: MemoryPanel_module_css_default.spacer }),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Pill, {
										active: showSuperseded,
										onClick: () => setShowSuperseded((v) => !v),
										children: t("superseded.toggle", { n: supersededCount })
									})
								]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: MemoryPanel_module_css_default.infoRow,
								children: [
									effectiveView === "session" && session?.project ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: MemoryPanel_module_css_default.sessionStrip,
										children: [
											/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
												className: MemoryPanel_module_css_default.sessionItem,
												title: session.project,
												children: [
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
														className: MemoryPanel_module_css_default.sessionLabel,
														children: t("session.project")
													}),
													" ",
													shortPath(session.project)
												]
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: MemoryPanel_module_css_default.sessionSep }),
											/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
												className: MemoryPanel_module_css_default.sessionItem,
												title: session.injected ? new Date(session.injected.ts).toLocaleString() : void 0,
												children: [
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
														className: MemoryPanel_module_css_default.sessionLabel,
														children: t("session.injected")
													}),
													" ",
													session.injected ? t("session.injected.value", {
														n: session.injected.count,
														when: formatTime(session.injected.ts)
													}) : t("session.none")
												]
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: MemoryPanel_module_css_default.sessionSep }),
											/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
												className: MemoryPanel_module_css_default.sessionItem,
												title: session.recalls.length ? session.recalls.slice(-5).map((r) => `${r.query || "—"} → ${r.hits}${r.mode ? ` (${r.mode})` : ""}`).join("\n") : void 0,
												children: [
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
														className: MemoryPanel_module_css_default.sessionLabel,
														children: t("session.recalls")
													}),
													" ",
													session.recalls.length,
													session.rawRecalls ? t("session.recalls.raw", { n: session.rawRecalls }) : ""
												]
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: MemoryPanel_module_css_default.sessionSep }),
											/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
												className: MemoryPanel_module_css_default.sessionItem,
												title: session.digests.ts ? new Date(session.digests.ts).toLocaleString() : void 0,
												children: [
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
														className: MemoryPanel_module_css_default.sessionLabel,
														children: t("session.digests")
													}),
													" ",
													session.digests.ok,
													session.digests.fail ? t("session.digests.fail", { n: session.digests.fail }) : ""
												]
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: MemoryPanel_module_css_default.sessionSep }),
											/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
												className: MemoryPanel_module_css_default.sessionItem,
												children: [
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
														className: MemoryPanel_module_css_default.sessionLabel,
														children: t("session.touched")
													}),
													" ",
													sessionCounts.touched
												]
											})
										]
									}) : null,
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: MemoryPanel_module_css_default.spacer }),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: MemoryPanel_module_css_default.meta,
										children: [
											meta.storePath ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
												className: MemoryPanel_module_css_default.metaItem,
												title: meta.storePath,
												children: t("meta.store", { path: shortPath(meta.storePath) })
											}) : null,
											typeof meta.digestsCount === "number" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
												className: MemoryPanel_module_css_default.metaItem,
												children: t("meta.digests", { n: meta.digestsCount })
											}) : null,
											sessionCount > 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
												className: MemoryPanel_module_css_default.metaItem,
												children: t("meta.sessions", { n: sessionCount })
											}) : null,
											updatedAt ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
												className: MemoryPanel_module_css_default.metaItem,
												children: t("meta.updated", { when: formatTime(updatedAt) })
											}) : null
										]
									})
								]
							}),
							actionError ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: MemoryPanel_module_css_default.actionError,
								role: "alert",
								children: t("error.action", { message: actionError })
							}) : null
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("datalist", {
						id: PROJECT_LIST_ID,
						children: projects.map((p) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", { value: p }, p))
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: MemoryPanel_module_css_default.list,
						children: [adding ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("article", {
							className: `${MemoryPanel_module_css_default.item} ${MemoryPanel_module_css_default.itemEditing}`,
							children: renderForm(addDraft, setAddDraft, "new", (e) => {
								submitAdd(e);
							}, () => setAdding(false), t("add.title"))
						}) : null, phase === "loading" && memories.length === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: MemoryPanel_module_css_default.placeholder,
							children: t("loading")
						}) : phase === "error" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: MemoryPanel_module_css_default.placeholderError,
							children: t("error", { message: error ?? "" })
						}) : visible.length === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: MemoryPanel_module_css_default.placeholder,
							children: query || scope !== "all" || projectFilter || touchedOnly ? t("empty.filtered") : effectiveView === "session" ? t("empty.session") : t("empty")
						}) : visible.map((m) => {
							const history = m.history ?? [];
							const open = Boolean(expanded[m.id]);
							const editing = editingId === m.id;
							const rowBusy = busy === m.id;
							const checked = selected.has(m.id);
							const itemClass = [
								MemoryPanel_module_css_default.item,
								m.superseded ? MemoryPanel_module_css_default.itemSuperseded : "",
								editing ? MemoryPanel_module_css_default.itemEditing : "",
								selectMode && checked ? MemoryPanel_module_css_default.itemSelected : ""
							].filter(Boolean).join(" ");
							return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("article", {
								className: itemClass,
								"data-scope": m.scope,
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: MemoryPanel_module_css_default.itemHeader,
										children: [
											selectMode ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
												type: "checkbox",
												className: MemoryPanel_module_css_default.checkbox,
												checked,
												disabled: batchBusy,
												"aria-label": t("batch.select.item"),
												onChange: () => toggleSelected(m.id)
											}) : null,
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
												className: `${MemoryPanel_module_css_default.tag} ${SCOPE_CLASS[m.scope] ?? MemoryPanel_module_css_default.tagCross}`,
												children: t(`tag.${m.scope}`)
											}),
											m.key ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
												className: MemoryPanel_module_css_default.itemKey,
												title: m.key,
												children: m.key
											}) : null,
											m.touched ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
												className: MemoryPanel_module_css_default.touchedBadge,
												title: t("touched.hint"),
												children: t("touched.badge")
											}) : null,
											m.superseded ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
												className: MemoryPanel_module_css_default.stateLabel,
												children: m.retired ? t("retired.label") : t("superseded.label")
											}) : null,
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: MemoryPanel_module_css_default.spacer }),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
												className: MemoryPanel_module_css_default.itemTime,
												title: new Date(m.updatedAt).toLocaleString(),
												children: t("item.updated", { when: formatTime(m.updatedAt) })
											})
										]
									}),
									editing ? renderForm(editDraft, setEditDraft, m.id, (e) => {
										submitEdit(e, m);
									}, () => setEditingId(null), t("edit.title")) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: MemoryPanel_module_css_default.itemText,
										children: m.text
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: MemoryPanel_module_css_default.itemFooter,
										children: [
											m.project ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
												className: MemoryPanel_module_css_default.itemProject,
												title: m.project,
												children: t("item.project", { path: shortPath(m.project) })
											}) : null,
											m.ts !== m.updatedAt ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
												className: MemoryPanel_module_css_default.itemCreated,
												children: t("item.created", { when: formatTime(m.ts) })
											}) : null,
											m.source ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
												className: MemoryPanel_module_css_default.itemCreated,
												children: t("item.source", { source: m.source })
											}) : null,
											m.usage && (m.usage.injected > 0 || m.usage.recalled > 0) ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
												className: MemoryPanel_module_css_default.itemCreated,
												title: t("item.usage.hint"),
												children: t("item.usage", {
													injected: m.usage.injected,
													recalled: m.usage.recalled
												})
											}) : null,
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: MemoryPanel_module_css_default.spacer }),
											history.length > 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
												type: "button",
												className: MemoryPanel_module_css_default.linkButton,
												"aria-expanded": open,
												onClick: () => toggleHistory(m.id),
												children: open ? t("history.hide") : t("history.show", { n: history.length })
											}) : null,
											!editing && !selectMode ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
												className: MemoryPanel_module_css_default.actions,
												children: !m.superseded ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
													type: "button",
													className: MemoryPanel_module_css_default.linkButton,
													disabled: rowBusy,
													onClick: () => openEdit(m),
													children: t("action.edit")
												}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
													type: "button",
													className: `${MemoryPanel_module_css_default.linkButton} ${MemoryPanel_module_css_default.linkDanger}`,
													disabled: rowBusy,
													onClick: () => retire(m),
													children: t("action.retire")
												})] }) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [m.retired ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
													type: "button",
													className: MemoryPanel_module_css_default.linkButton,
													disabled: rowBusy,
													onClick: () => restore(m),
													children: t("action.restore")
												}) : null, /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
													type: "button",
													className: `${MemoryPanel_module_css_default.linkButton} ${MemoryPanel_module_css_default.linkDanger}`,
													disabled: rowBusy,
													onClick: () => hardDelete(m),
													children: t("action.delete")
												})] })
											}) : null
										]
									}),
									open && history.length > 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("ol", {
										className: MemoryPanel_module_css_default.history,
										children: [...history].reverse().map((h, i) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("li", {
											className: MemoryPanel_module_css_default.historyItem,
											children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
												className: MemoryPanel_module_css_default.historyMeta,
												children: t("history.version", { when: formatTime(h.ts) })
											}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
												className: MemoryPanel_module_css_default.historyText,
												children: h.text
											})]
										}, `${m.id}-h${i}`))
									}) : null
								]
							}, m.id);
						})]
					}),
					selectMode ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("footer", {
						className: MemoryPanel_module_css_default.batchBar,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: MemoryPanel_module_css_default.batchCount,
								children: t("batch.selected", { n: selected.size })
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: MemoryPanel_module_css_default.linkButton,
								disabled: batchBusy || visible.length === 0,
								onClick: () => setSelected(new Set(visible.map((m) => m.id))),
								children: t("batch.selectAll")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: MemoryPanel_module_css_default.linkButton,
								disabled: batchBusy || selected.size === 0,
								onClick: () => setSelected(/* @__PURE__ */ new Set()),
								children: t("batch.clear")
							}),
							batchNotice ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: MemoryPanel_module_css_default.batchNotice,
								children: batchNotice
							}) : null,
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: MemoryPanel_module_css_default.spacer }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: MemoryPanel_module_css_default.batchLabel,
								title: t("batch.scope.hint"),
								children: t("batch.scope")
							}),
							SCOPES$1.map((s) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Pill, {
								onClick: () => batchScopeSel(s),
								disabled: batchBusy || selected.size === 0,
								children: t(`scope.${s}`)
							}, s)),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: MemoryPanel_module_css_default.batchSep }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
								variant: "outline",
								size: "sm",
								onClick: batchRestoreSel,
								disabled: batchBusy || selected.size === 0,
								children: t("action.restore")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
								variant: "outline",
								size: "sm",
								onClick: batchRetireSel,
								disabled: batchBusy || selected.size === 0,
								children: t("action.retire")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
								variant: "outline",
								size: "sm",
								className: MemoryPanel_module_css_default.batchDanger,
								onClick: batchDeleteSel,
								disabled: batchBusy || selected.size === 0,
								children: t("action.delete")
							})
						]
					}) : null
				]
			});
		}
		/** 项目过滤：Button 锚点 + Menu 列表（无 Select 原语，与设置页 Picker 同款拼装）。 */
		function ProjectPicker({ value, projects, allLabel, title, onChange }) {
			const [open, setOpen] = (0, react.useState)(false);
			const items = (0, react.useMemo)(() => [
				{
					id: "all",
					label: allLabel
				},
				...projects.length ? [{
					type: "separator",
					id: "sep"
				}] : [],
				...projects.map((p) => ({
					id: `p:${p}`,
					label: p
				}))
			], [projects, allLabel]);
			if (projects.length === 0 && !value) return null;
			const shown = value ?? allLabel;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Menu, {
				open,
				portal: true,
				align: "start",
				selectedId: value ? `p:${value}` : "all",
				anchor: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(_deepseek_ai_dsh_client_ui_primitives.Button, {
					variant: "outline",
					size: "sm",
					className: `${MemoryPanel_module_css_default.projectTrigger} ${value ? "" : MemoryPanel_module_css_default.projectTriggerEmpty}`,
					title: `${title}: ${shown}`,
					onClick: () => setOpen((v) => !v),
					"aria-haspopup": "listbox",
					"aria-expanded": open,
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: MemoryPanel_module_css_default.projectTriggerLabel,
						children: shown
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: MemoryPanel_module_css_default.caret,
						"aria-hidden": true,
						children: "▾"
					})]
				}),
				items,
				onSelect: (id) => {
					setOpen(false);
					if (id === "all") onChange(null);
					else if (id.startsWith("p:")) onChange(id.slice(2));
				},
				onClose: () => setOpen(false)
			});
		}
		//#endregion
		//#region \0dsh-css:/Users/mac/Projects/trisoul/packages/client/memory-ui/src/client/MemoryScopeChip.module.css.mjs
		const css = ".u4RsKW_chip{color:var(--dsw-alias-label-secondary);cursor:pointer;white-space:nowrap;background:0 0;border:none;border-radius:8px;align-items:center;gap:4px;padding:4px 8px;font-family:inherit;font-size:12px;line-height:20px;display:inline-flex}.u4RsKW_chip:hover{background:var(--dsw-alias-interactive-bg-hover)}.u4RsKW_locked{cursor:default;color:var(--dsw-alias-label-tertiary)}.u4RsKW_locked:hover{background:0 0}.u4RsKW_label{color:var(--dsw-alias-label-tertiary)}.u4RsKW_value{color:inherit}.u4RsKW_caret{color:var(--dsw-alias-label-tertiary);font-size:9px}.u4RsKW_item{flex-direction:column;align-items:flex-start;gap:1px;display:flex}.u4RsKW_itemDesc{color:var(--dsw-alias-label-tertiary);white-space:normal;max-width:240px;font-size:11px}";
		const tagId = "@trisoul/dsh-client-memory-ui/MemoryScopeChip.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@trisoul/dsh-client-memory-ui";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		var MemoryScopeChip_module_css_default = {
			"value": "u4RsKW_value",
			"item": "u4RsKW_item",
			"itemDesc": "u4RsKW_itemDesc",
			"locked": "u4RsKW_locked",
			"label": "u4RsKW_label",
			"chip": "u4RsKW_chip",
			"caret": "u4RsKW_caret"
		};
		//#endregion
		//#region src/client/MemoryScopeChip.tsx
		/**
		* 记忆范围 chip：composer 工具行（conversation.input.left）的小控件——三档开关必须在新会话页就能选。
		* dsh 打开「新会话」页时 agent 已 start（默认档已绑、开场注入已发生），所以真正的可选窗口是**对话开始前**：
		* 服务端 POST /trisoul/api/memory/session-scope 会改绑并把开场注入原地改写为新半径（blank 会话没有
		* LLM 调用、没有前缀缓存可砸，replace 零成本）；发过第一条消息后 409 → 锁定显示（创建时定死）。
		* API 缺席（headless / 插件缺席）不渲染。
		*/
		const SCOPES = [
			"full",
			"project",
			"session"
		];
		const ENDPOINT = "/trisoul/api/memory/session-scope";
		function MemoryScopeChip({ t, sessionId }) {
			const [state, setState] = (0, react.useState)(null);
			const [open, setOpen] = (0, react.useState)(false);
			const sid = String(sessionId ?? "");
			const load = (0, react.useCallback)(async () => {
				if (!sid) return;
				try {
					const response = await fetch(`${ENDPOINT}?sessionId=${encodeURIComponent(sid)}`, { cache: "no-store" });
					if (!response.ok) return;
					const body = await response.json();
					setState({
						scope: body.scope && SCOPES.includes(body.scope) ? body.scope : null,
						locked: body.locked === true,
						default: SCOPES.includes(body.default) ? body.default : "full"
					});
				} catch {}
			}, [sid]);
			(0, react.useEffect)(() => {
				load();
			}, [load]);
			const pick = async (scope) => {
				setOpen(false);
				if (!state || scope === (state.scope ?? state.default)) return;
				try {
					const response = await fetch(ENDPOINT, {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							sessionId: sid,
							scope
						})
					});
					if (response.ok) setState({
						...state,
						scope
					});
					else if (response.status === 409) setState({
						...state,
						locked: true
					});
				} catch {}
				load();
			};
			if (!state) return null;
			const active = state.scope ?? state.default;
			const { locked } = state;
			const chip = /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
				type: "button",
				className: `${MemoryScopeChip_module_css_default.chip} ${locked ? MemoryScopeChip_module_css_default.locked : ""}`,
				title: locked ? t("chip.locked", { scope: t(`chip.scope.${active}`) }) : t("chip.hint"),
				"aria-haspopup": locked ? void 0 : "menu",
				"aria-expanded": locked ? void 0 : open,
				onClick: () => {
					if (locked) return;
					if (!open) load();
					setOpen(!open);
				},
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: MemoryScopeChip_module_css_default.label,
						children: t("chip.label")
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: MemoryScopeChip_module_css_default.value,
						children: t(`chip.scope.${active}`)
					}),
					locked ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: MemoryScopeChip_module_css_default.caret,
						"aria-hidden": true,
						children: "▾"
					})
				]
			});
			if (locked) return chip;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Menu, {
				open,
				anchor: chip,
				compact: true,
				portal: true,
				side: "top",
				items: [{
					type: "label",
					id: "head",
					text: t("chip.menu.title")
				}, ...SCOPES.map((scope) => ({
					id: scope,
					label: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
						className: MemoryScopeChip_module_css_default.item,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t(`chip.scope.${scope}`) }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: MemoryScopeChip_module_css_default.itemDesc,
							children: t(`chip.desc.${scope}`)
						})]
					})
				}))],
				selectedId: active,
				onSelect: (id) => {
					pick(id);
				},
				onClose: () => setOpen(false)
			});
		}
		//#endregion
		//#region src/client/locales.ts
		/** 记忆中枢面板的翻译字典：zh 是 key 的事实源，en 必须覆盖同一组 key。 */
		const NS = "trisoulMemory";
		const zh = {
			"view.memory": "记忆",
			"view.label": "取景",
			"view.session": "本会话",
			"view.all": "全部 ({n})",
			"view.session.hint": "只看对本会话项目可见的记忆（本项目 + 跨项目 + 底层）与本会话的注入/召回/消化",
			"view.session.unknown": "服务端不认得这个会话的项目（会话尚未开始或已结束），暂只能看全部",
			"view.all.hint": "整个记忆库，可按项目过滤",
			"session.project": "项目",
			"session.injected": "注入",
			"session.injected.value": "{n} 条 · {when}",
			"session.none": "无",
			"session.recalls": "召回",
			"session.recalls.raw": " · 回捞 {n}",
			"session.digests": "消化",
			"session.digests.fail": " · 失败 {n}",
			"session.touched": "本会话产出",
			"touched.toggle": "只看本会话产出 ({n})",
			"touched.badge": "本会话",
			"touched.hint": "本会话消化新增/更新的记忆",
			"empty.session": "本会话项目还没有可见的记忆——对话中的稳定事实会被记忆中枢自动消化到这里",
			"title": "记忆中枢",
			"count": "{count} 条",
			"refresh": "刷新",
			"search.placeholder": "搜索记忆…",
			"meta.store": "库：{path}",
			"meta.updated": "更新于 {when}",
			"meta.digests": "预压缩稿 {n}",
			"meta.sessions": "游标会话 {n}",
			"loading": "加载记忆中…",
			"error": "无法读取记忆库：{message}",
			"empty": "暂无记忆——对话中的稳定事实会被记忆中枢自动消化到这里",
			"empty.filtered": "没有匹配的记忆",
			"time.now": "刚刚",
			"time.minutes": "{n} 分钟前",
			"time.hours": "{n} 小时前",
			"scope.all": "全部",
			"scope.project": "本项目",
			"scope.cross": "跨项目",
			"scope.global": "底层",
			"tag.project": "本项目",
			"tag.cross": "跨项目",
			"tag.global": "底层",
			"tag.session": "本会话",
			"tag.session.hint": "会话私有记忆：保持本会话归属；点公共层级即升入公共库",
			"superseded.toggle": "含已覆盖 ({n})",
			"superseded.label": "已被覆盖",
			"retired.label": "已退役",
			"history.show": "历史 ({n})",
			"history.hide": "收起历史",
			"history.version": "旧版本 · {when}",
			"item.project": "项目：{path}",
			"item.updated": "更新 {when}",
			"item.created": "首记 {when}",
			"item.source": "来源 {source}",
			"item.usage": "注入 {injected} · 召回 {recalled}",
			"item.usage.hint": "被记忆中枢注入进会话 / 被 recall 命中的次数",
			"project.all": "所有项目",
			"project.filter": "项目",
			"add": "新增记忆",
			"add.title": "新增一条记忆",
			"edit.title": "编辑记忆",
			"form.text.placeholder": "一条只讲一个稳定事实，简洁完整可独立理解",
			"form.scope": "层级",
			"form.key": "key",
			"form.key.placeholder": "可选短标识（英文点分，如 env.python），留空自动派生",
			"form.project": "项目",
			"form.project.placeholder": "项目路径（git 根目录；无 git 的用会话 cwd）",
			"form.project.hint": "「本项目」层需要绑定项目路径，否则任何项目都看不到它",
			"form.save": "保存",
			"form.saving": "保存中…",
			"form.cancel": "取消",
			"action.edit": "编辑",
			"action.retire": "退役",
			"action.restore": "恢复",
			"action.delete": "彻底删除",
			"confirm.retire": "退役这条记忆？（软删除，勾选「含已覆盖」仍可见并可恢复）",
			"confirm.delete": "彻底删除这条记忆及其历史版本？此操作不可恢复。",
			"error.action": "操作失败：{message}",
			"batch.enter": "批量管理",
			"batch.exit": "退出批量",
			"batch.selected": "已选 {n} 条",
			"batch.selectAll": "全选",
			"batch.clear": "清空",
			"batch.select.item": "选择这条记忆",
			"batch.scope": "改层级",
			"batch.scope.hint": "把选中记忆改到该层级；改到「本项目」会绑定当前取景的项目，没有可绑项目的条目会被跳过",
			"batch.done": "批量完成：{ok} 条成功",
			"batch.skipped": "，跳过 {n} 条",
			"confirm.batch.retire": "退役选中的 {n} 条记忆？（软删除，勾选「含已覆盖」仍可见并可恢复）",
			"confirm.batch.delete": "彻底删除选中的 {n} 条记忆及其历史版本？此操作不可恢复。",
			"chip.label": "记忆",
			"chip.scope.full": "完全版",
			"chip.scope.project": "项目级",
			"chip.scope.session": "会话级",
			"chip.hint": "记忆范围：影响即将开始的新会话（发第一条消息时绑定，之后不可切换）",
			"chip.locked": "本会话已绑定「{scope}」——记忆范围在会话创建时定死，不可中途切换",
			"chip.menu.title": "新会话的记忆范围",
			"chip.desc.full": "底层 + 跨项目 + 本项目全部读写（现状）",
			"chip.desc.project": "只读写本项目分区，不碰底层与跨项目",
			"chip.desc.session": "本会话记忆完全独立：不进也不读公共库"
		};
		const en = {
			"view.memory": "Memory",
			"view.label": "View",
			"view.session": "This session",
			"view.all": "All ({n})",
			"view.session.hint": "Only memories visible to this session's project (project + cross + global) and this session's inject/recall/digest activity",
			"view.session.unknown": "The server does not know this session's project (not started or already gone) — only \"All\" is available",
			"view.all.hint": "The whole store, filterable by project",
			"session.project": "Project",
			"session.injected": "Injected",
			"session.injected.value": "{n} · {when}",
			"session.none": "none",
			"session.recalls": "Recalls",
			"session.recalls.raw": " · raw {n}",
			"session.digests": "Digests",
			"session.digests.fail": " · failed {n}",
			"session.touched": "Produced here",
			"touched.toggle": "Produced in this session ({n})",
			"touched.badge": "this session",
			"touched.hint": "Memories added/updated by this session's digestion",
			"empty.session": "No memories visible to this session's project yet — stable facts from the conversation are digested here automatically",
			"title": "Memory Hub",
			"count": "{count} items",
			"refresh": "Refresh",
			"search.placeholder": "Search memories…",
			"meta.store": "Store: {path}",
			"meta.updated": "Updated {when}",
			"meta.digests": "Pre-digests {n}",
			"meta.sessions": "Cursor sessions {n}",
			"loading": "Loading memories…",
			"error": "Cannot read memory store: {message}",
			"empty": "No memories yet — stable facts from conversations are digested here automatically",
			"empty.filtered": "No matching memories",
			"time.now": "just now",
			"time.minutes": "{n} min ago",
			"time.hours": "{n} h ago",
			"scope.all": "All",
			"scope.project": "Project",
			"scope.cross": "Cross-project",
			"scope.global": "Global",
			"tag.project": "project",
			"tag.cross": "cross",
			"tag.global": "global",
			"tag.session": "session",
			"tag.session.hint": "Session-private memory: keeps its session ownership; pick a public layer to promote it into the shared store",
			"superseded.toggle": "Show superseded ({n})",
			"superseded.label": "superseded",
			"retired.label": "retired",
			"history.show": "History ({n})",
			"history.hide": "Hide history",
			"history.version": "Previous · {when}",
			"item.project": "Project: {path}",
			"item.updated": "updated {when}",
			"item.created": "first seen {when}",
			"item.source": "source {source}",
			"item.usage": "injected {injected} · recalled {recalled}",
			"item.usage.hint": "times injected into sessions / hit by recall",
			"project.all": "All projects",
			"project.filter": "Project",
			"add": "Add memory",
			"add.title": "Add a memory",
			"edit.title": "Edit memory",
			"form.text.placeholder": "One stable fact per entry — concise, complete, self-contained",
			"form.scope": "Scope",
			"form.key": "key",
			"form.key.placeholder": "Optional short id (dotted, e.g. env.python); derived when empty",
			"form.project": "Project",
			"form.project.placeholder": "Project path (git root; session cwd when not a git repo)",
			"form.project.hint": "Project-scoped memories need a project path, otherwise no project can see them",
			"form.save": "Save",
			"form.saving": "Saving…",
			"form.cancel": "Cancel",
			"action.edit": "Edit",
			"action.retire": "Retire",
			"action.restore": "Restore",
			"action.delete": "Delete permanently",
			"confirm.retire": "Retire this memory? (soft delete — still visible under \"Show superseded\" and restorable)",
			"confirm.delete": "Permanently delete this memory and its history versions? This cannot be undone.",
			"error.action": "Action failed: {message}",
			"batch.enter": "Batch manage",
			"batch.exit": "Exit batch",
			"batch.selected": "{n} selected",
			"batch.selectAll": "Select all",
			"batch.clear": "Clear",
			"batch.select.item": "Select this memory",
			"batch.scope": "Scope",
			"batch.scope.hint": "Move selected memories to this scope; moving to \"Project\" binds the current view's project — entries with no project to bind are skipped",
			"batch.done": "Batch done: {ok} succeeded",
			"batch.skipped": ", {n} skipped",
			"confirm.batch.retire": "Retire the {n} selected memories? (soft delete — still visible under \"Show superseded\" and restorable)",
			"confirm.batch.delete": "Permanently delete the {n} selected memories and their history versions? This cannot be undone.",
			"chip.label": "Memory",
			"chip.scope.full": "Full",
			"chip.scope.project": "Project",
			"chip.scope.session": "Session",
			"chip.hint": "Memory scope: applies to the session about to start (bound on the first message, immutable afterwards)",
			"chip.locked": "This session is bound to “{scope}” — memory scope is fixed at session creation and cannot change mid-session",
			"chip.menu.title": "Memory scope for the new session",
			"chip.desc.full": "Reads & writes global + cross-project + project layers (status quo)",
			"chip.desc.project": "Only this project’s partition; global and cross-project untouched",
			"chip.desc.session": "Fully isolated per-session memory: nothing in, nothing out"
		};
		//#endregion
		//#region src/client/index.ts
		const inject = ["slots", "locale"];
		function apply(ctx) {
			ctx.effect(() => ctx.locale.register(NS, {
				zh,
				en
			}), "trisoul-memory-ui: dictionaries");
			const t = ctx.locale.bind(NS);
			ctx.slots.inject("conversation.view", () => ctx.slots.register({
				name: "conversation.view",
				id: "trisoul-memory",
				order: 40,
				locale: NS,
				label: () => t("view.memory")
			}, MemoryPanel));
			ctx.slots.inject("conversation.input.left", () => ctx.slots.register({
				name: "conversation.input.left",
				id: "trisoul-memory-scope",
				order: 50,
				locale: NS
			}, MemoryScopeChip));
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map