window.__ModuleLoader__.load({
	id: "@trisoul/dsh-client-settings",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		let _deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		let react_jsx_runtime = require("react/jsx-runtime");
		//#region src/client/api.ts
		const TRACE_MODES = [
			"reasoning",
			"none",
			"text"
		];
		const STAGE_EFFORTS = ["off", "inherit"];
		const REPLAY_REASONS = ["off", "latest"];
		const MEMORY_SCOPES = [
			"full",
			"project",
			"session"
		];
		const EFFORT_OFFICERS = [
			"align",
			"erudite",
			"empiric"
		];
		const EFFORT_LEVELS = [
			"off",
			"light",
			"standard",
			"max"
		];
		/** 中枢 AI（手术刀 / 记忆中枢）：固定两个；灵魂是动态列表 */
		const HUB_AI_IDS = [
			"surgeon",
			"memory",
			"canvas"
		];
		const STATE = "/trisoul/api/state";
		const SETTINGS = "/trisoul/api/settings";
		async function fetchState() {
			const response = await fetch(STATE, { cache: "no-store" });
			if (!response.ok) throw new Error(`HTTP ${response.status}`);
			return await response.json();
		}
		async function fetchConfig() {
			const response = await fetch(SETTINGS, { cache: "no-store" });
			if (!response.ok) throw new Error(`HTTP ${response.status}`);
			return await response.json();
		}
		async function postSettings(patch) {
			const response = await fetch(SETTINGS, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(patch)
			});
			const body = await response.json().catch(() => ({}));
			if (!response.ok) throw new Error(body.error ?? `HTTP ${response.status}`);
			return body;
		}
		/** 灵魂列表的客户端预检（与服务端 validateSoulList 同规则），返回第一条错误或 null */
		function soulListProblem(souls) {
			const seen = /* @__PURE__ */ new Set();
			let enabled = 0;
			for (let i = 0; i < souls.length; i++) {
				const s = souls[i];
				const nm = s.name.trim();
				if (!nm) return {
					code: "empty",
					index: i,
					name: ""
				};
				if (nm.length > 12) return {
					code: "long",
					index: i,
					name: nm
				};
				if (nm.includes("/")) return {
					code: "slash",
					index: i,
					name: nm
				};
				if (seen.has(nm)) return {
					code: "dup",
					index: i,
					name: nm
				};
				seen.add(nm);
				if (s.enabled) enabled++;
			}
			if (enabled < 1) return {
				code: "min",
				index: -1,
				name: ""
			};
			return null;
		}
		//#endregion
		//#region \0dsh-css:packages/client/settings/src/client/Picker.module.css.mjs
		const css$2 = ".PMN_SG_trigger{justify-content:space-between;gap:6px;min-width:120px;max-width:260px}.PMN_SG_triggerEmpty{color:var(--dsw-alias-label-tertiary)}.PMN_SG_triggerLabel{text-overflow:ellipsis;white-space:nowrap;min-width:0;overflow:hidden}.PMN_SG_caret{color:var(--dsw-alias-label-tertiary);flex:none}";
		const tagId$2 = "@trisoul/dsh-client-settings/Picker.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$2) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@trisoul/dsh-client-settings";
			tag.dataset.pluginCss = tagId$2;
			tag.textContent = css$2;
			document.head.appendChild(tag);
		}
		var Picker_module_css_default = {
			"triggerEmpty": "PMN_SG_triggerEmpty",
			"caret": "PMN_SG_caret",
			"triggerLabel": "PMN_SG_triggerLabel",
			"trigger": "PMN_SG_trigger"
		};
		//#endregion
		//#region src/client/Picker.tsx
		/**
		* 下拉选择器：Button 锚点 + Menu 列表（dsh 模型选择器同款原语），支持「自定义…」手输与「清除」回默认。
		* 无 Select 原语可用，故用 Menu 拼装，视觉与官方下拉一致。
		*/
		function Picker({ value, options, placeholder, customLabel, customPrompt, clearLabel, allowCustom = true, disabled, className, onChange }) {
			const [open, setOpen] = (0, react.useState)(false);
			const items = (0, react.useMemo)(() => {
				const rows = options.map((o) => ({
					id: `opt:${o.id}`,
					label: o.label
				}));
				if (value && !options.some((o) => o.id === value)) rows.unshift({
					id: `opt:${value}`,
					label: value
				});
				if (clearLabel) rows.unshift({
					id: "clear",
					label: clearLabel
				});
				if (allowCustom) {
					if (rows.length) rows.push({
						type: "separator",
						id: "sep"
					});
					rows.push({
						id: "custom",
						label: customLabel
					});
				}
				return rows;
			}, [
				options,
				value,
				customLabel,
				clearLabel,
				allowCustom
			]);
			const shown = value ? options.find((o) => o.id === value)?.label ?? value : placeholder;
			const empty = items.length === 0;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Menu, {
				open: open && !disabled && !empty,
				portal: true,
				align: "start",
				selectedId: value ? `opt:${value}` : clearLabel ? "clear" : void 0,
				anchor: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(_deepseek_ai_dsh_client_ui_primitives.Button, {
					variant: "outline",
					size: "sm",
					className: `${Picker_module_css_default.trigger} ${value ? "" : Picker_module_css_default.triggerEmpty} ${className ?? ""}`,
					disabled: disabled || empty,
					onClick: () => setOpen((v) => !v),
					"aria-haspopup": "listbox",
					"aria-expanded": open,
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: Picker_module_css_default.triggerLabel,
						children: shown
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: Picker_module_css_default.caret,
						"aria-hidden": true,
						children: "▾"
					})]
				}),
				items,
				onSelect: (id) => {
					setOpen(false);
					if (id === "clear") {
						onChange(void 0);
						return;
					}
					if (id === "custom") {
						const typed = window.prompt(customPrompt, value ?? "");
						if (typed !== null) onChange(typed.trim() || void 0);
						return;
					}
					if (id.startsWith("opt:")) onChange(id.slice(4));
				},
				onClose: () => setOpen(false)
			});
		}
		//#endregion
		//#region \0dsh-css:packages/client/settings/src/client/TrisoulSection.module.css.mjs
		const css$1 = ".zFfKmq_section{color:var(--dsw-alias-label-primary);font:var(--dsw-font-s-14);font-family:var(--dsw-font-family);flex-direction:column;gap:20px;display:flex}.zFfKmq_header{justify-content:space-between;align-items:flex-start;gap:16px;display:flex}.zFfKmq_headerActions{flex:none;gap:8px;display:flex}.zFfKmq_title{font:var(--dsw-font-m-18);color:var(--dsw-alias-label-primary);margin:0 0 4px;font-weight:600}.zFfKmq_intro{font:var(--dsw-font-xs-13);color:var(--dsw-alias-label-secondary);margin:0}.zFfKmq_group{flex-direction:column;gap:10px;display:flex}.zFfKmq_groupDimmed{opacity:.55}.zFfKmq_groupLabel{font:var(--dsw-font-xs-13);color:var(--dsw-alias-label-secondary);text-transform:none;font-weight:600}.zFfKmq_hint{font:var(--dsw-font-xxs-12);color:var(--dsw-alias-label-tertiary)}.zFfKmq_warn{font:var(--dsw-font-xs-13);color:var(--dsw-alias-state-warn-label);background:var(--dsw-alias-state-warn-tertiary);border-radius:6px;padding:8px 12px}.zFfKmq_modeRow{grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px;display:grid}.zFfKmq_modeCard{text-align:left;cursor:pointer;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);color:inherit;font:inherit;border-radius:8px;flex-direction:column;align-items:flex-start;gap:4px;padding:12px 14px;font-family:inherit;transition:border-color .15s,background-color .15s;display:flex}.zFfKmq_modeCard:hover{background:var(--dsw-alias-interactive-bg-hover)}.zFfKmq_modeCard:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}.zFfKmq_modeCardActive{border-color:var(--dsw-alias-brand-primary);background:var(--dsw-alias-bg-layer-2)}.zFfKmq_modeName{font:var(--dsw-font-s-14);color:var(--dsw-alias-label-primary);font-weight:600}.zFfKmq_modeDesc{font:var(--dsw-font-xxs-12);color:var(--dsw-alias-label-tertiary)}.zFfKmq_fieldRow{flex-wrap:wrap;align-items:center;gap:8px 12px;display:flex}.zFfKmq_fieldLabel{font:var(--dsw-font-xs-13);color:var(--dsw-alias-label-secondary);min-width:56px}.zFfKmq_groupHead{align-items:center;gap:10px;display:flex}.zFfKmq_dirtyBadge,.zFfKmq_overrideBadge{font:var(--dsw-font-xxs-12);color:var(--dsw-alias-state-warn-primary)}.zFfKmq_spacer{flex:1}.zFfKmq_hintInline{font:var(--dsw-font-xxxs-11);color:var(--dsw-alias-label-tertiary)}.zFfKmq_soulList{flex-direction:column;gap:10px;display:flex}.zFfKmq_soulCard{border:1px solid var(--dsw-alias-border-l2);border-left:3px solid var(--trisoul-accent);background:var(--dsw-alias-bg-layer-1);--trisoul-accent:var(--dsw-alias-label-secondary);border-radius:8px;flex-direction:column;gap:10px;padding:12px 14px;display:flex}.zFfKmq_soulCard[data-tone=\"0\"]{--trisoul-accent:var(--dsw-alias-state-business-primary)}.zFfKmq_soulCard[data-tone=\"1\"]{--trisoul-accent:var(--dsw-alias-state-success-primary)}.zFfKmq_soulCard[data-tone=\"2\"]{--trisoul-accent:var(--dsw-alias-state-warn-primary)}.zFfKmq_soulCard[data-tone=\"3\"]{--trisoul-accent:var(--dsw-alias-state-error-primary)}.zFfKmq_soulCardOff{opacity:.6}.zFfKmq_soulCardOff:focus-within,.zFfKmq_soulCardOff:hover{opacity:.85}.zFfKmq_soulCardBad{border-color:var(--dsw-alias-state-error-primary)}.zFfKmq_soulHead{flex-wrap:wrap;align-items:center;gap:8px 12px;display:flex}.zFfKmq_soulDot{background:var(--trisoul-accent);border-radius:50%;flex:none;width:8px;height:8px}.zFfKmq_inlineField{align-items:center;gap:6px;min-width:0;display:inline-flex}.zFfKmq_inlineLabel{font:var(--dsw-font-xxs-12);color:var(--dsw-alias-label-secondary);white-space:nowrap;flex:none}.zFfKmq_grow{flex:1;min-width:180px}.zFfKmq_grow>:last-child{flex:1;min-width:0}.zFfKmq_nameInput{width:140px}.zFfKmq_titleInput{width:100%}.zFfKmq_remove{color:var(--dsw-alias-label-tertiary);margin-left:auto}.zFfKmq_remove:hover{color:var(--dsw-alias-state-error-primary)}.zFfKmq_personaField{flex-direction:column;gap:4px;display:flex}.zFfKmq_textarea{box-sizing:border-box;resize:vertical;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);width:100%;min-height:56px;color:var(--dsw-alias-label-primary);font:var(--dsw-font-xs-13);font-family:var(--dsw-font-family);border-radius:8px;outline:none;padding:6px 8px;line-height:20px}.zFfKmq_textarea::placeholder{color:var(--dsw-alias-label-dimmed)}.zFfKmq_textarea:focus{border-color:var(--dsw-alias-brand-primary)}.zFfKmq_soulRoute{flex-wrap:wrap;align-items:center;gap:8px 18px;display:flex}.zFfKmq_routePair{flex-wrap:wrap;align-items:center;gap:6px 8px;min-width:0;display:inline-flex}.zFfKmq_routePair>*{min-width:0;max-width:100%}.zFfKmq_routeDimmed{opacity:.55}.zFfKmq_soulActions{flex-wrap:wrap;align-items:center;gap:8px;display:flex}.zFfKmq_table{border:1px solid var(--dsw-alias-border-l2);border-radius:8px;flex-direction:column;display:flex;overflow:hidden}.zFfKmq_aiRow{border-bottom:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);--trisoul-accent:var(--dsw-alias-label-secondary);grid-template-columns:minmax(140px,.6fr) minmax(0,2fr);align-items:center;gap:8px 14px;padding:10px 12px;display:grid}.zFfKmq_aiRow:last-child{border-bottom:none}.zFfKmq_aiRow[data-ai=surgeon]{--trisoul-accent:var(--dsw-alias-brand-primary)}.zFfKmq_aiRow[data-ai=memory]{--trisoul-accent:var(--dsw-alias-label-primary-bluish)}.zFfKmq_aiName{font:var(--dsw-font-xs-13);color:var(--dsw-alias-label-primary);align-items:center;gap:8px;min-width:0;display:flex}.zFfKmq_aiDot{background:var(--trisoul-accent);border-radius:50%;flex:none;width:8px;height:8px}.zFfKmq_aiFieldsWrap{flex-wrap:wrap;align-items:center;gap:8px 14px;min-width:0;display:flex}.zFfKmq_aiFields{flex-wrap:wrap;gap:8px;min-width:0;display:flex}.zFfKmq_aiFields>*{min-width:0;max-width:100%}.zFfKmq_aiFieldsDimmed{opacity:.55}.zFfKmq_tempField{font:var(--dsw-font-xxs-12);color:var(--dsw-alias-label-secondary);align-items:center;gap:8px;min-width:0;display:flex}.zFfKmq_range{min-width:90px;max-width:160px;accent-color:var(--dsw-alias-brand-primary);flex:1}.zFfKmq_tempValue{font-variant-numeric:tabular-nums;text-align:right;min-width:2.2em;color:var(--dsw-alias-label-primary)}.zFfKmq_resolvedList{flex-direction:column;gap:6px;margin:0;padding:0;list-style:none;display:flex}.zFfKmq_resolvedRow{font:var(--dsw-font-xs-13);align-items:center;gap:10px;display:flex}.zFfKmq_resolvedAi{min-width:180px;color:var(--dsw-alias-label-secondary)}.zFfKmq_actions{gap:8px;display:flex}.zFfKmq_statusRow{min-height:20px;font:var(--dsw-font-xs-13)}.zFfKmq_muted{color:var(--dsw-alias-label-tertiary)}.zFfKmq_ok{color:var(--dsw-alias-state-success-primary)}.zFfKmq_error{color:var(--dsw-alias-state-error-primary)}@media (width<=720px){.zFfKmq_aiRow{grid-template-columns:1fr}}@media (prefers-reduced-motion:reduce){.zFfKmq_modeCard{transition:none}}.zFfKmq_roundsRow{align-items:center;gap:6px;display:inline-flex}";
		const tagId$1 = "@trisoul/dsh-client-settings/TrisoulSection.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$1) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@trisoul/dsh-client-settings";
			tag.dataset.pluginCss = tagId$1;
			tag.textContent = css$1;
			document.head.appendChild(tag);
		}
		var TrisoulSection_module_css_default = {
			"groupLabel": "zFfKmq_groupLabel",
			"modeRow": "zFfKmq_modeRow",
			"actions": "zFfKmq_actions",
			"error": "zFfKmq_error",
			"routeDimmed": "zFfKmq_routeDimmed",
			"soulHead": "zFfKmq_soulHead",
			"groupDimmed": "zFfKmq_groupDimmed",
			"aiName": "zFfKmq_aiName",
			"inlineLabel": "zFfKmq_inlineLabel",
			"modeCardActive": "zFfKmq_modeCardActive",
			"aiDot": "zFfKmq_aiDot",
			"soulCardBad": "zFfKmq_soulCardBad",
			"table": "zFfKmq_table",
			"hint": "zFfKmq_hint",
			"aiFieldsWrap": "zFfKmq_aiFieldsWrap",
			"nameInput": "zFfKmq_nameInput",
			"grow": "zFfKmq_grow",
			"resolvedRow": "zFfKmq_resolvedRow",
			"header": "zFfKmq_header",
			"resolvedList": "zFfKmq_resolvedList",
			"overrideBadge": "zFfKmq_overrideBadge",
			"title": "zFfKmq_title",
			"range": "zFfKmq_range",
			"titleInput": "zFfKmq_titleInput",
			"group": "zFfKmq_group",
			"routePair": "zFfKmq_routePair",
			"soulList": "zFfKmq_soulList",
			"remove": "zFfKmq_remove",
			"fieldLabel": "zFfKmq_fieldLabel",
			"hintInline": "zFfKmq_hintInline",
			"roundsRow": "zFfKmq_roundsRow",
			"textarea": "zFfKmq_textarea",
			"ok": "zFfKmq_ok",
			"intro": "zFfKmq_intro",
			"soulCard": "zFfKmq_soulCard",
			"soulRoute": "zFfKmq_soulRoute",
			"aiFieldsDimmed": "zFfKmq_aiFieldsDimmed",
			"modeName": "zFfKmq_modeName",
			"groupHead": "zFfKmq_groupHead",
			"inlineField": "zFfKmq_inlineField",
			"soulActions": "zFfKmq_soulActions",
			"resolvedAi": "zFfKmq_resolvedAi",
			"personaField": "zFfKmq_personaField",
			"statusRow": "zFfKmq_statusRow",
			"section": "zFfKmq_section",
			"tempValue": "zFfKmq_tempValue",
			"muted": "zFfKmq_muted",
			"spacer": "zFfKmq_spacer",
			"headerActions": "zFfKmq_headerActions",
			"tempField": "zFfKmq_tempField",
			"warn": "zFfKmq_warn",
			"soulDot": "zFfKmq_soulDot",
			"fieldRow": "zFfKmq_fieldRow",
			"modeDesc": "zFfKmq_modeDesc",
			"aiFields": "zFfKmq_aiFields",
			"aiRow": "zFfKmq_aiRow",
			"modeCard": "zFfKmq_modeCard",
			"dirtyBadge": "zFfKmq_dirtyBadge",
			"soulCardOff": "zFfKmq_soulCardOff"
		};
		//#endregion
		//#region src/client/TrisoulSection.tsx
		let keySeq = 0;
		const nextKey = () => `soul-draft-${Date.now().toString(36)}-${(keySeq++).toString(36)}`;
		const toDraft = (souls) => (souls ?? []).map((s) => ({
			key: nextKey(),
			soul: {
				...s,
				enabled: s.enabled !== false
			}
		}));
		/** 归一化再比较：只比较会落盘的字段（避免 undefined vs 缺键误判为脏） */
		const normalize = (souls) => JSON.stringify(souls.map((s) => ({
			name: s.name,
			title: s.title || void 0,
			persona: s.persona || void 0,
			provider: s.provider || void 0,
			model: s.model || void 0,
			temperature: s.temperature,
			reasoningEffort: s.reasoningEffort || void 0,
			enabled: s.enabled !== false
		})));
		/** 新灵魂默认名：A~Z 里第一个没用过的，用完就 灵魂N */
		function freshName(existing) {
			const used = new Set(existing.map((s) => s.name.trim()));
			for (let i = 0; i < 26; i++) {
				const c = String.fromCharCode(65 + i);
				if (!used.has(c)) return c;
			}
			let n = existing.length + 1;
			while (used.has(`S${n}`)) n++;
			return `S${n}`;
		}
		/** 即改即存的温度滑块：拖动只动本地值，松手/失焦才提交——range 拖一次能吐几十个 change 事件，逐个 POST 是保存风暴 */
		function TempSlider({ label, value, onCommit }) {
			const [local, setLocal] = (0, react.useState)(value);
			(0, react.useEffect)(() => {
				setLocal(value);
			}, [value]);
			const commit = () => {
				if (local !== value) onCommit(local);
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
				type: "range",
				min: 0,
				max: 2,
				step: .1,
				className: TrisoulSection_module_css_default.range,
				"aria-label": label,
				value: local,
				onChange: (e) => setLocal(Number(e.target.value)),
				onPointerUp: commit,
				onPointerCancel: commit,
				onKeyUp: commit,
				onBlur: commit
			}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
				className: TrisoulSection_module_css_default.tempValue,
				children: local.toFixed(1)
			})] });
		}
		/** 设置页「TriSoul」分区：统一/精细两模式 + 灵魂列表（草稿 + 整体保存）+ 中枢 AI（即改即存）+ 共识过程。 */
		function TrisoulSection({ t }) {
			const [config, setConfig] = (0, react.useState)(null);
			const [directory, setDirectory] = (0, react.useState)([]);
			const [loadError, setLoadError] = (0, react.useState)(null);
			const [status, setStatus] = (0, react.useState)({ kind: "idle" });
			/** 灵魂草稿：rows = 本地编辑中的列表，base = 草稿对应的服务端快照（归一化 JSON，用来判脏） */
			const [draftState, setDraftState] = (0, react.useState)(null);
			/** 服务端配置到位：草稿没被动过（或还没建）就同步；动过就保留本地草稿、只更新对照基线 */
			const syncDraft = (0, react.useCallback)((next) => {
				const serverNorm = normalize(next.souls ?? []);
				setDraftState((prev) => {
					if (prev === null) return {
						base: serverNorm,
						rows: toDraft(next.souls)
					};
					return normalize(prev.rows.map((r) => r.soul)) !== prev.base ? {
						base: serverNorm,
						rows: prev.rows
					} : {
						base: serverNorm,
						rows: toDraft(next.souls)
					};
				});
			}, []);
			const load = (0, react.useCallback)(async () => {
				try {
					const state = await fetchState();
					setConfig(state.config);
					setDirectory(state.directory);
					syncDraft(state.config);
					setLoadError(null);
				} catch (e) {
					setLoadError(e instanceof Error ? e.message : String(e));
				}
			}, [syncDraft]);
			(0, react.useEffect)(() => {
				load();
			}, [load]);
			const save = (0, react.useCallback)(async (patch, kind = "saved") => {
				setStatus({ kind: "saving" });
				try {
					const next = await postSettings(patch);
					setConfig(next);
					if (patch.souls !== void 0 || patch.reset) setDraftState({
						base: normalize(next.souls ?? []),
						rows: toDraft(next.souls)
					});
					setStatus({ kind });
				} catch (e) {
					setStatus({
						kind: "error",
						message: e instanceof Error ? e.message : String(e)
					});
				}
			}, []);
			const providers = (0, react.useMemo)(() => directory.map((p) => ({
				id: p.id,
				label: p.name && p.name !== p.id ? `${p.name} (${p.id})` : p.id
			})), [directory]);
			const modelsOf = (0, react.useCallback)((provider) => {
				return (directory.find((d) => d.id === provider)?.models ?? []).map((m) => ({
					id: m.id,
					label: m.name && m.name !== m.id ? `${m.name} (${m.id})` : m.id
				}));
			}, [directory]);
			/**
			* 目录里该模型的推理等级：
			* - 数组（可能为空）= 目录已声明（空 = 无推理能力，如 reasoning: null）→ 只能选声明的档位 / 禁用
			* - undefined = 目录没有这个模型或解析失败 → 退化为自定义输入
			*/
			const effortsOf = (0, react.useCallback)((provider, model) => {
				const m = directory.find((d) => d.id === provider)?.models.find((x) => x.id === model);
				if (!m) return void 0;
				if (m.reasoning === null) return [];
				if (m.reasoning) return m.reasoning.efforts.map((id) => m.efforts?.find((e) => e.id === id) ?? {
					id,
					name: id
				});
				return m.efforts;
			}, [directory]);
			if (loadError) return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: TrisoulSection_module_css_default.section,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", {
						className: TrisoulSection_module_css_default.title,
						children: t("title")
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: TrisoulSection_module_css_default.error,
						children: t("load.error", { message: loadError })
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: TrisoulSection_module_css_default.actions,
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
							variant: "outline",
							size: "sm",
							onClick: () => {
								load();
							},
							children: t("refresh")
						})
					})
				]
			});
			if (!config || draftState === null) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: TrisoulSection_module_css_default.section,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: TrisoulSection_module_css_default.muted,
					children: t("loading")
				})
			});
			const draft = draftState.rows;
			const unified = config.unified ?? {};
			const isUnified = config.mode !== "fine";
			const trace = config.consensus?.trace ?? "reasoning";
			const voteEffort = config.consensus?.voteEffort ?? "off";
			const voteMaxTokens = config.consensus?.voteMaxTokens ?? 0;
			const nearIdentical = config.consensus?.nearIdentical !== false;
			const nearIdenticalSimilarity = config.consensus?.nearIdenticalSimilarity ?? .7;
			const soulRetries = config.consensus?.soulRetries ?? 2;
			const soulTimeoutMs = config.consensus?.soulTimeoutMs ?? 9e5;
			const reasoningFuseChars = config.consensus?.reasoningFuseChars ?? 2e5;
			const soulIdleTimeoutMs = config.consensus?.soulIdleTimeoutMs ?? 6e4;
			const fmtDuration = (ms) => ms >= 6e4 && ms % 6e4 === 0 ? t("duration.m", { n: String(ms / 6e4) }) : t("duration.s", { n: String(ms / 1e3) });
			const innerEvidence = config.consensus?.innerEvidence !== false;
			const innerRounds = config.consensus?.innerRounds ?? 0;
			const replayReasoning = config.consensus?.replayReasoning ?? "off";
			const memoryScope = config.memoryScope ?? "full";
			const userRetirement = config.userRetirement === true;
			const setFine = (id, patch) => {
				const current = config.fine?.[id] ?? {};
				save({ fine: { [id]: {
					...current,
					...patch
				} } });
			};
			const draftSouls = draft.map((r) => r.soul);
			const dirty = normalize(draftSouls) !== draftState.base;
			const problem = soulListProblem(draftSouls);
			const problemText = problem === null ? null : problem.code === "empty" ? t("souls.err.empty", { n: problem.index + 1 }) : problem.code === "long" ? t("souls.err.long", {
				name: problem.name,
				max: 12
			}) : problem.code === "slash" ? t("souls.err.slash", { name: problem.name }) : problem.code === "dup" ? t("souls.err.dup", { name: problem.name }) : t("souls.err.min", { min: 1 });
			const enabledCount = draftSouls.filter((s) => s.enabled).length;
			const setRows = (fn) => setDraftState((prev) => prev === null ? prev : {
				base: prev.base,
				rows: fn(prev.rows)
			});
			const updateSoul = (key, patch) => setRows((rows) => rows.map((r) => r.key === key ? {
				key: r.key,
				soul: {
					...r.soul,
					...patch
				}
			} : r));
			const removeSoul = (key) => setRows((rows) => rows.filter((r) => r.key !== key));
			const addSoul = () => setRows((rows) => [...rows, {
				key: nextKey(),
				soul: {
					name: freshName(rows.map((r) => r.soul)),
					enabled: true,
					temperature: .7
				}
			}]);
			const saveSouls = () => {
				if (!problem) save({ souls: draftSouls.map((s) => ({
					...s,
					name: s.name.trim()
				})) }, "souls-saved");
			};
			const discardSouls = () => setDraftState({
				base: normalize(config.souls ?? []),
				rows: toDraft(config.souls)
			});
			/** 灵魂当前会生效的 provider/model（决定推理等级选项） */
			const effectiveRoute = (s) => isUnified ? {
				provider: unified.provider,
				model: unified.model
			} : {
				provider: s.provider || unified.provider,
				model: s.model || unified.model
			};
			const soulLabel = (s) => s.title ? `${t("souls.default.label", { name: s.name })} · ${s.title}` : t("souls.default.label", { name: s.name });
			const savedLib = config.souls?.length ? config.souls : config.base?.souls ?? [];
			const effort = {
				align: config.effort?.align ?? "off",
				erudite: config.effort?.erudite ?? "off",
				empiric: config.effort?.empiric ?? "off"
			};
			const effortSoulNames = savedLib.filter((s) => s.enabled !== false).map((s) => s.name);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: TrisoulSection_module_css_default.section,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("header", {
						className: TrisoulSection_module_css_default.header,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", {
							className: TrisoulSection_module_css_default.title,
							children: t("title")
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
							className: TrisoulSection_module_css_default.intro,
							children: t("intro")
						})] }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: TrisoulSection_module_css_default.headerActions,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
								variant: "ghost",
								size: "sm",
								onClick: () => {
									load();
								},
								children: t("refresh")
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
								variant: "outline",
								size: "sm",
								onClick: () => {
									if (window.confirm(t("reset.confirm"))) save({ reset: true });
								},
								children: t("reset")
							})]
						})]
					}),
					!config.persisted ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: TrisoulSection_module_css_default.warn,
						children: t("unpersisted")
					}) : null,
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: TrisoulSection_module_css_default.group,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: TrisoulSection_module_css_default.groupLabel,
							children: t("mode.label")
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: TrisoulSection_module_css_default.modeRow,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
								type: "button",
								className: `${TrisoulSection_module_css_default.modeCard} ${isUnified ? TrisoulSection_module_css_default.modeCardActive : ""}`,
								onClick: () => {
									if (!isUnified) save({ mode: "unified" });
								},
								"aria-pressed": isUnified,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: TrisoulSection_module_css_default.modeName,
									children: t("mode.unified")
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: TrisoulSection_module_css_default.modeDesc,
									children: t("mode.unified.desc")
								})]
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
								type: "button",
								className: `${TrisoulSection_module_css_default.modeCard} ${!isUnified ? TrisoulSection_module_css_default.modeCardActive : ""}`,
								onClick: () => {
									if (isUnified) save({ mode: "fine" });
								},
								"aria-pressed": !isUnified,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: TrisoulSection_module_css_default.modeName,
									children: t("mode.fine")
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: TrisoulSection_module_css_default.modeDesc,
									children: t("mode.fine.desc")
								})]
							})]
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: `${TrisoulSection_module_css_default.group} ${isUnified ? "" : TrisoulSection_module_css_default.groupDimmed}`,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: TrisoulSection_module_css_default.groupLabel,
							children: t("unified.title")
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: TrisoulSection_module_css_default.fieldRow,
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
									className: TrisoulSection_module_css_default.fieldLabel,
									children: t("field.provider")
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Picker, {
									value: unified.provider,
									options: providers,
									placeholder: t("pick.placeholder"),
									customLabel: t("pick.custom"),
									customPrompt: t("pick.custom.prompt", { field: t("field.provider") }),
									onChange: (v) => {
										save({ unified: {
											provider: v ?? "",
											model: unified.model ?? ""
										} });
									}
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
									className: TrisoulSection_module_css_default.fieldLabel,
									children: t("field.model")
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Picker, {
									value: unified.model,
									options: modelsOf(unified.provider),
									placeholder: t("pick.placeholder"),
									customLabel: t("pick.custom"),
									customPrompt: t("pick.custom.prompt", { field: t("field.model") }),
									onChange: (v) => {
										save({ unified: {
											provider: unified.provider ?? "",
											model: v ?? ""
										} });
									}
								})
							]
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: TrisoulSection_module_css_default.group,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: TrisoulSection_module_css_default.groupLabel,
								children: t("effort3.title")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: TrisoulSection_module_css_default.hint,
								children: t("effort3.hint")
							}),
							EFFORT_OFFICERS.map((o, i) => {
								const soul = effortSoulNames[i];
								return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: TrisoulSection_module_css_default.fieldRow,
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
											className: TrisoulSection_module_css_default.fieldLabel,
											children: [t(`effort3.${o}`), soul ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
												className: TrisoulSection_module_css_default.hintInline,
												children: [" ", t("effort3.mapped", { soul })]
											}) : null]
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
											className: TrisoulSection_module_css_default.roundsRow,
											role: "radiogroup",
											"aria-label": t(`effort3.${o}`),
											children: EFFORT_LEVELS.map((lv) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Pill, {
												active: effort[o] === lv,
												"aria-disabled": !soul || void 0,
												onClick: () => {
													if (soul && effort[o] !== lv && status.kind !== "saving") save({ effort: {
														...effort,
														[o]: lv
													} });
												},
												children: t(`effort3.level.${lv}`)
											}, lv))
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: TrisoulSection_module_css_default.hint,
											children: soul ? t(`effort3.${o}.hint`) : t("effort3.unmapped")
										})
									]
								}, o);
							})
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: TrisoulSection_module_css_default.group,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: TrisoulSection_module_css_default.groupHead,
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: TrisoulSection_module_css_default.groupLabel,
										children: t("souls.title")
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Pill, { children: t("souls.count", {
										enabled: enabledCount,
										total: draftSouls.length
									}) }),
									dirty ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: TrisoulSection_module_css_default.dirtyBadge,
										children: t("souls.dirty")
									}) : null
								]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: TrisoulSection_module_css_default.hint,
								children: t("souls.hint")
							}),
							isUnified ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: TrisoulSection_module_css_default.hint,
								children: t("souls.hint.unified")
							}) : null,
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: TrisoulSection_module_css_default.soulList,
								children: draft.map((row, index) => {
									const s = row.soul;
									const route = effectiveRoute(s);
									const lane = effortSoulNames.indexOf(s.name);
									const officer = lane >= 0 && lane < 3 ? EFFORT_OFFICERS[lane] : void 0;
									const overriddenBy = officer !== void 0 && effort[officer] !== "off" ? officer : void 0;
									const efforts = effortsOf(route.provider, route.model);
									const effortOptions = (efforts ?? []).map((e) => ({
										id: e.id,
										label: e.name && e.name !== e.id ? `${e.name} (${e.id})` : e.id
									}));
									const effortKnownUnsupported = efforts !== void 0 && efforts.length === 0;
									const rowProblem = problem !== null && problem.index === index;
									return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
										className: `${TrisoulSection_module_css_default.soulCard} ${s.enabled ? "" : TrisoulSection_module_css_default.soulCardOff} ${rowProblem ? TrisoulSection_module_css_default.soulCardBad : ""}`,
										"data-tone": index % 4,
										children: [
											/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
												className: TrisoulSection_module_css_default.soulHead,
												children: [
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
														className: TrisoulSection_module_css_default.soulDot,
														"aria-hidden": true
													}),
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Pill, {
														active: s.enabled,
														onClick: () => updateSoul(row.key, { enabled: !s.enabled }),
														"aria-pressed": s.enabled,
														title: s.enabled ? t("souls.enabled") : t("souls.disabled"),
														children: s.enabled ? t("souls.enabled") : t("souls.disabled")
													}),
													/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
														className: TrisoulSection_module_css_default.inlineField,
														children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
															className: TrisoulSection_module_css_default.inlineLabel,
															children: t("souls.name")
														}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Input, {
															className: TrisoulSection_module_css_default.nameInput,
															value: s.name,
															maxLength: 12,
															placeholder: t("souls.name.placeholder"),
															onChange: (e) => updateSoul(row.key, { name: e.target.value }),
															"aria-invalid": rowProblem || void 0
														})]
													}),
													/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
														className: `${TrisoulSection_module_css_default.inlineField} ${TrisoulSection_module_css_default.grow}`,
														children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
															className: TrisoulSection_module_css_default.inlineLabel,
															children: t("souls.title.field")
														}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Input, {
															className: TrisoulSection_module_css_default.titleInput,
															value: s.title ?? "",
															placeholder: t("souls.title.placeholder"),
															onChange: (e) => updateSoul(row.key, { title: e.target.value })
														})]
													}),
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
														variant: "ghost",
														size: "sm",
														className: TrisoulSection_module_css_default.remove,
														onClick: () => removeSoul(row.key),
														"aria-label": `${t("souls.remove")} ${s.name}`,
														children: t("souls.remove")
													})
												]
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
												className: TrisoulSection_module_css_default.personaField,
												children: [
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
														className: TrisoulSection_module_css_default.inlineLabel,
														children: t("souls.persona")
													}),
													overriddenBy ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
														className: TrisoulSection_module_css_default.overrideBadge,
														children: t("souls.overridden", {
															officer: t(`effort3.${overriddenBy}`),
															level: t(`effort3.level.${effort[overriddenBy]}`)
														})
													}) : null,
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("textarea", {
														className: TrisoulSection_module_css_default.textarea,
														rows: 2,
														value: s.persona ?? "",
														placeholder: t("souls.persona.placeholder"),
														onChange: (e) => updateSoul(row.key, { persona: e.target.value })
													})
												]
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
												className: TrisoulSection_module_css_default.soulRoute,
												children: [
													/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
														className: `${TrisoulSection_module_css_default.routePair} ${isUnified ? TrisoulSection_module_css_default.routeDimmed : ""}`,
														children: [
															/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
																className: TrisoulSection_module_css_default.inlineLabel,
																children: t("field.provider")
															}),
															/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Picker, {
																value: s.provider,
																options: providers,
																placeholder: isUnified ? unified.provider ?? t("pick.placeholder") : t("field.inherit"),
																customLabel: t("pick.custom"),
																customPrompt: t("pick.custom.prompt", { field: t("field.provider") }),
																clearLabel: t("field.inherit"),
																disabled: isUnified,
																onChange: (v) => updateSoul(row.key, {
																	provider: v,
																	...v === void 0 ? { model: void 0 } : {}
																})
															}),
															/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
																className: TrisoulSection_module_css_default.inlineLabel,
																children: t("field.model")
															}),
															/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Picker, {
																value: s.model,
																options: modelsOf(s.provider || unified.provider),
																placeholder: isUnified ? unified.model ?? t("pick.placeholder") : t("field.inherit"),
																customLabel: t("pick.custom"),
																customPrompt: t("pick.custom.prompt", { field: t("field.model") }),
																clearLabel: t("field.inherit"),
																disabled: isUnified,
																onChange: (v) => updateSoul(row.key, { model: v })
															})
														]
													}),
													/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
														className: TrisoulSection_module_css_default.routePair,
														children: [
															/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
																className: TrisoulSection_module_css_default.inlineLabel,
																children: t("field.effort")
															}),
															/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Picker, {
																value: s.reasoningEffort,
																options: effortOptions,
																placeholder: effortKnownUnsupported ? t("effort.unsupported") : t("effort.inherit"),
																customLabel: t("pick.custom"),
																customPrompt: t("pick.custom.prompt", { field: t("field.effort") }),
																clearLabel: t("effort.inherit"),
																allowCustom: efforts === void 0,
																disabled: effortKnownUnsupported && !s.reasoningEffort,
																onChange: (v) => updateSoul(row.key, { reasoningEffort: v })
															}),
															effortKnownUnsupported ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
																className: TrisoulSection_module_css_default.hintInline,
																children: t("effort.unsupported.hint")
															}) : null,
															efforts === void 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
																className: TrisoulSection_module_css_default.hintInline,
																children: t("effort.unknown")
															}) : null
														]
													}),
													/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
														className: TrisoulSection_module_css_default.tempField,
														children: [
															/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
																className: TrisoulSection_module_css_default.inlineLabel,
																children: t("field.temperature")
															}),
															/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
																type: "range",
																min: 0,
																max: 2,
																step: .1,
																className: TrisoulSection_module_css_default.range,
																value: s.temperature ?? .7,
																onChange: (e) => updateSoul(row.key, { temperature: Number(e.target.value) })
															}),
															/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
																className: TrisoulSection_module_css_default.tempValue,
																children: (s.temperature ?? .7).toFixed(1)
															})
														]
													})
												]
											})
										]
									}, row.key);
								})
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: TrisoulSection_module_css_default.soulActions,
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
										variant: "outline",
										size: "sm",
										onClick: addSoul,
										children: t("souls.add")
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: TrisoulSection_module_css_default.spacer }),
									problemText ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: TrisoulSection_module_css_default.error,
										children: problemText
									}) : null,
									dirty ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
										variant: "ghost",
										size: "sm",
										onClick: discardSouls,
										children: t("souls.discard")
									}) : null,
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
										variant: "primary",
										size: "sm",
										disabled: !dirty || problem !== null || status.kind === "saving",
										onClick: saveSouls,
										children: t("souls.save")
									})
								]
							})
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: TrisoulSection_module_css_default.group,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: TrisoulSection_module_css_default.groupLabel,
								children: t("hub.title")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: TrisoulSection_module_css_default.hint,
								children: isUnified ? t("hub.hint.unified") : t("hub.hint")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: TrisoulSection_module_css_default.table,
								children: HUB_AI_IDS.map((id) => {
									const fine = config.fine?.[id] ?? {};
									const resolved = config.resolved?.[id] ?? {};
									return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: TrisoulSection_module_css_default.aiRow,
										"data-ai": id,
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											className: TrisoulSection_module_css_default.aiName,
											children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
												className: TrisoulSection_module_css_default.aiDot,
												"aria-hidden": true
											}), t(`ai.${id}`)]
										}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											className: TrisoulSection_module_css_default.aiFieldsWrap,
											children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
												className: `${TrisoulSection_module_css_default.aiFields} ${isUnified ? TrisoulSection_module_css_default.aiFieldsDimmed : ""}`,
												children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Picker, {
													value: fine.provider,
													options: providers,
													placeholder: isUnified ? resolved.provider ?? t("pick.placeholder") : t("field.inherit"),
													customLabel: t("pick.custom"),
													customPrompt: t("pick.custom.prompt", { field: t("field.provider") }),
													disabled: isUnified,
													onChange: (v) => setFine(id, { provider: v ?? "" })
												}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Picker, {
													value: fine.model,
													options: modelsOf(fine.provider ?? unified.provider),
													placeholder: isUnified ? resolved.model ?? t("pick.placeholder") : t("field.inherit"),
													customLabel: t("pick.custom"),
													customPrompt: t("pick.custom.prompt", { field: t("field.model") }),
													disabled: isUnified,
													onChange: (v) => setFine(id, { model: v ?? "" })
												})]
											}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
												className: TrisoulSection_module_css_default.tempField,
												children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
													className: TrisoulSection_module_css_default.inlineLabel,
													children: t("field.temperature")
												}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(TempSlider, {
													label: `${t(`ai.${id}`)} ${t("field.temperature")}`,
													value: fine.temperature ?? resolved.temperature ?? .7,
													onCommit: (v) => setFine(id, { temperature: v })
												})]
											})]
										})]
									}, id);
								})
							})
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: TrisoulSection_module_css_default.group,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: TrisoulSection_module_css_default.groupLabel,
								children: t("consensus.title")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: TrisoulSection_module_css_default.hint,
								children: t("consensus.hint")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: TrisoulSection_module_css_default.modeRow,
								children: TRACE_MODES.map((mode) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
									type: "button",
									className: `${TrisoulSection_module_css_default.modeCard} ${trace === mode ? TrisoulSection_module_css_default.modeCardActive : ""}`,
									onClick: () => {
										if (trace !== mode) save({ consensus: { trace: mode } });
									},
									"aria-pressed": trace === mode,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: TrisoulSection_module_css_default.modeName,
										children: t(`trace.${mode}`)
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: TrisoulSection_module_css_default.modeDesc,
										children: t(`trace.${mode}.desc`)
									})]
								}, mode))
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: TrisoulSection_module_css_default.fieldRow,
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
										className: TrisoulSection_module_css_default.fieldLabel,
										children: t("consensus.voteEffort")
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: TrisoulSection_module_css_default.roundsRow,
										role: "radiogroup",
										"aria-label": t("consensus.voteEffort"),
										children: STAGE_EFFORTS.map((e) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Pill, {
											active: voteEffort === e,
											onClick: () => {
												if (voteEffort !== e) save({ consensus: { voteEffort: e } });
											},
											children: t(`stageEffort.${e}`)
										}, e))
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: TrisoulSection_module_css_default.hint,
										children: t("consensus.voteEffort.hint")
									})
								]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: TrisoulSection_module_css_default.fieldRow,
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
										className: TrisoulSection_module_css_default.fieldLabel,
										children: t("consensus.voteMax")
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: TrisoulSection_module_css_default.roundsRow,
										role: "radiogroup",
										"aria-label": t("consensus.voteMax"),
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Pill, {
											active: voteMaxTokens === 0,
											onClick: () => {
												if (voteMaxTokens !== 0) save({ consensus: { voteMaxTokens: 0 } });
											},
											children: t("consensus.voteMax.unlimited")
										}), [
											2e3,
											4e3,
											8e3
										].map((n) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Pill, {
											active: voteMaxTokens === n,
											onClick: () => {
												if (voteMaxTokens !== n) save({ consensus: { voteMaxTokens: n } });
											},
											children: n
										}, n))]
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: TrisoulSection_module_css_default.hint,
										children: t("consensus.voteMax.hint")
									})
								]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: TrisoulSection_module_css_default.fieldRow,
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
										className: TrisoulSection_module_css_default.fieldLabel,
										children: t("consensus.retries")
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: TrisoulSection_module_css_default.roundsRow,
										role: "radiogroup",
										"aria-label": t("consensus.retries"),
										children: [
											0,
											1,
											2,
											3,
											4,
											5
										].map((n) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Pill, {
											active: soulRetries === n,
											onClick: () => {
												if (soulRetries !== n) save({ consensus: { soulRetries: n } });
											},
											children: n
										}, n))
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: TrisoulSection_module_css_default.hint,
										children: t("consensus.retries.hint")
									})
								]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: TrisoulSection_module_css_default.fieldRow,
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
										className: TrisoulSection_module_css_default.fieldLabel,
										children: t("consensus.timeout")
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: TrisoulSection_module_css_default.roundsRow,
										role: "radiogroup",
										"aria-label": t("consensus.timeout"),
										children: [[
											3e5,
											9e5,
											18e5,
											36e5
										].map((ms) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Pill, {
											active: soulTimeoutMs === ms,
											onClick: () => {
												if (soulTimeoutMs !== ms) save({ consensus: { soulTimeoutMs: ms } });
											},
											children: fmtDuration(ms)
										}, ms)), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Pill, {
											active: soulTimeoutMs === 0,
											onClick: () => {
												if (soulTimeoutMs !== 0) save({ consensus: { soulTimeoutMs: 0 } });
											},
											children: t("consensus.timeout.unlimited")
										})]
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: TrisoulSection_module_css_default.hint,
										children: t("consensus.timeout.hint")
									})
								]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: TrisoulSection_module_css_default.fieldRow,
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
										className: TrisoulSection_module_css_default.fieldLabel,
										children: t("consensus.idle")
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: TrisoulSection_module_css_default.roundsRow,
										role: "radiogroup",
										"aria-label": t("consensus.idle"),
										children: [
											3e4,
											6e4,
											12e4,
											3e5
										].map((ms) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Pill, {
											active: soulIdleTimeoutMs === ms,
											onClick: () => {
												if (soulIdleTimeoutMs !== ms) save({ consensus: { soulIdleTimeoutMs: ms } });
											},
											children: fmtDuration(ms)
										}, ms))
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: TrisoulSection_module_css_default.hint,
										children: t("consensus.idle.hint")
									})
								]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: TrisoulSection_module_css_default.fieldRow,
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
										className: TrisoulSection_module_css_default.fieldLabel,
										children: t("consensus.fuse")
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: TrisoulSection_module_css_default.roundsRow,
										role: "radiogroup",
										"aria-label": t("consensus.fuse"),
										children: [[
											1e5,
											2e5,
											5e5
										].map((n) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Pill, {
											active: reasoningFuseChars === n,
											onClick: () => {
												if (reasoningFuseChars !== n) save({ consensus: { reasoningFuseChars: n } });
											},
											children: t("consensus.fuse.wan", { n: n / 1e4 })
										}, n)), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Pill, {
											active: reasoningFuseChars === 0,
											onClick: () => {
												if (reasoningFuseChars !== 0) save({ consensus: { reasoningFuseChars: 0 } });
											},
											children: t("consensus.fuse.off")
										})]
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: TrisoulSection_module_css_default.hint,
										children: t("consensus.fuse.hint")
									})
								]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: TrisoulSection_module_css_default.fieldRow,
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
										className: TrisoulSection_module_css_default.fieldLabel,
										children: t("consensus.inner")
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: TrisoulSection_module_css_default.roundsRow,
										role: "radiogroup",
										"aria-label": t("consensus.inner"),
										children: [
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Pill, {
												active: !innerEvidence,
												onClick: () => {
													if (innerEvidence) save({ consensus: { innerEvidence: false } });
												},
												children: t("consensus.inner.off")
											}),
											[
												1,
												2,
												3,
												5
											].map((n) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Pill, {
												active: innerEvidence && innerRounds === n,
												onClick: () => {
													if (!innerEvidence || innerRounds !== n) save({ consensus: {
														innerEvidence: true,
														innerRounds: n
													} });
												},
												children: n
											}, n)),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Pill, {
												active: innerEvidence && innerRounds === 0,
												onClick: () => {
													if (!innerEvidence || innerRounds !== 0) save({ consensus: {
														innerEvidence: true,
														innerRounds: 0
													} });
												},
												children: t("consensus.inner.unlimited")
											})
										]
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: TrisoulSection_module_css_default.hint,
										children: t("consensus.inner.hint")
									})
								]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: TrisoulSection_module_css_default.fieldRow,
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
										className: TrisoulSection_module_css_default.fieldLabel,
										children: t("consensus.near")
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: TrisoulSection_module_css_default.roundsRow,
										role: "radiogroup",
										"aria-label": t("consensus.near"),
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Pill, {
											active: !nearIdentical,
											onClick: () => {
												if (nearIdentical) save({ consensus: { nearIdentical: false } });
											},
											children: t("consensus.near.off")
										}), [
											.5,
											.6,
											.7,
											.8,
											.9
										].map((n) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Pill, {
											active: nearIdentical && nearIdenticalSimilarity === n,
											onClick: () => {
												if (!nearIdentical || nearIdenticalSimilarity !== n) save({ consensus: {
													nearIdentical: true,
													nearIdenticalSimilarity: n
												} });
											},
											children: n.toFixed(1)
										}, n))]
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: TrisoulSection_module_css_default.hint,
										children: t("consensus.near.hint")
									})
								]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: TrisoulSection_module_css_default.fieldRow,
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
										className: TrisoulSection_module_css_default.fieldLabel,
										children: t("consensus.replay")
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Picker, {
										value: replayReasoning,
										options: REPLAY_REASONS.map((v) => ({
											id: v,
											label: t(`consensus.replay.${v}`)
										})),
										placeholder: t("pick.placeholder"),
										customLabel: t("pick.custom"),
										customPrompt: t("pick.custom.prompt", { field: t("consensus.replay") }),
										allowCustom: false,
										onChange: (v) => {
											const next = REPLAY_REASONS.find((r) => r === v);
											if (next && replayReasoning !== next) save({ consensus: { replayReasoning: next } });
										}
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: TrisoulSection_module_css_default.hint,
										children: t("consensus.replay.hint")
									})
								]
							})
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: TrisoulSection_module_css_default.group,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: TrisoulSection_module_css_default.groupLabel,
								children: t("memscope.title")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: TrisoulSection_module_css_default.hint,
								children: t("memscope.hint")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: TrisoulSection_module_css_default.modeRow,
								children: MEMORY_SCOPES.map((sc) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
									type: "button",
									className: `${TrisoulSection_module_css_default.modeCard} ${memoryScope === sc ? TrisoulSection_module_css_default.modeCardActive : ""}`,
									onClick: () => {
										if (memoryScope !== sc) save({ memoryScope: sc });
									},
									"aria-pressed": memoryScope === sc,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: TrisoulSection_module_css_default.modeName,
										children: t(`memscope.${sc}`)
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: TrisoulSection_module_css_default.modeDesc,
										children: t(`memscope.${sc}.desc`)
									})]
								}, sc))
							})
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: TrisoulSection_module_css_default.group,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: TrisoulSection_module_css_default.groupLabel,
								children: t("retire.title")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: TrisoulSection_module_css_default.hint,
								children: t("retire.hint")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: TrisoulSection_module_css_default.roundsRow,
								role: "radiogroup",
								"aria-label": t("retire.title"),
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Pill, {
									active: !userRetirement,
									onClick: () => {
										if (userRetirement) save({ userRetirement: false });
									},
									children: t("retire.off")
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Pill, {
									active: userRetirement,
									onClick: () => {
										if (!userRetirement) save({ userRetirement: true });
									},
									children: t("retire.on")
								})]
							})
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: TrisoulSection_module_css_default.group,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: TrisoulSection_module_css_default.groupLabel,
							children: t("resolved.title")
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("ul", {
							className: TrisoulSection_module_css_default.resolvedList,
							children: [(config.souls ?? []).filter((s) => s.enabled !== false).map((s) => {
								const r = config.resolved?.[`soul-${s.name}`] ?? {};
								return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("li", {
									className: TrisoulSection_module_css_default.resolvedRow,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: TrisoulSection_module_css_default.resolvedAi,
										children: soulLabel(s)
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(_deepseek_ai_dsh_client_ui_primitives.Pill, { children: [
										r.provider ?? "—",
										" / ",
										r.model ?? "—",
										r.temperature !== void 0 ? ` · T=${r.temperature}` : "",
										r.reasoningEffort ? ` · ${r.reasoningEffort}` : ""
									] })]
								}, `soul-${s.name}`);
							}), HUB_AI_IDS.map((id) => {
								const r = config.resolved?.[id] ?? {};
								return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("li", {
									className: TrisoulSection_module_css_default.resolvedRow,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: TrisoulSection_module_css_default.resolvedAi,
										children: t(`ai.${id}`)
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(_deepseek_ai_dsh_client_ui_primitives.Pill, { children: [
										r.provider ?? "—",
										" / ",
										r.model ?? "—",
										r.temperature !== void 0 ? ` · T=${r.temperature}` : ""
									] })]
								}, id);
							})]
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: TrisoulSection_module_css_default.statusRow,
						"aria-live": "polite",
						children: [
							status.kind === "saving" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: TrisoulSection_module_css_default.muted,
								children: t("saving")
							}) : null,
							status.kind === "saved" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: TrisoulSection_module_css_default.ok,
								children: t("saved")
							}) : null,
							status.kind === "souls-saved" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: TrisoulSection_module_css_default.ok,
								children: t("souls.saved")
							}) : null,
							status.kind === "error" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: TrisoulSection_module_css_default.error,
								children: t("save.error", { message: status.message ?? "" })
							}) : null
						]
					})
				]
			});
		}
		//#endregion
		//#region \0dsh-css:packages/client/settings/src/client/ModeSwitch.module.css.mjs
		const css = ".Rljr8q_anchor{align-items:center;display:inline-flex}.Rljr8q_pill{white-space:nowrap;gap:6px}.Rljr8q_brand{font-weight:600}.Rljr8q_sep{color:var(--dsw-alias-label-tertiary)}.Rljr8q_model{color:var(--dsw-alias-label-tertiary);font:var(--dsw-font-xxs-12);text-overflow:ellipsis;max-width:160px;overflow:hidden}.Rljr8q_souls{font-variant-numeric:tabular-nums}";
		const tagId = "@trisoul/dsh-client-settings/ModeSwitch.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@trisoul/dsh-client-settings";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		var ModeSwitch_module_css_default = {
			"brand": "Rljr8q_brand",
			"sep": "Rljr8q_sep",
			"model": "Rljr8q_model",
			"souls": "Rljr8q_souls",
			"pill": "Rljr8q_pill",
			"anchor": "Rljr8q_anchor"
		};
		//#endregion
		//#region src/client/ModeSwitch.tsx
		const POLL_MS = 1e4;
		/** 会话头部的 TriSoul 开关：Pill 显示「N 魂 · 模式」，点开菜单切换统一/精细。 */
		function ModeSwitch({ t, openSettings }) {
			const [config, setConfig] = (0, react.useState)(null);
			const [open, setOpen] = (0, react.useState)(false);
			const [busy, setBusy] = (0, react.useState)(false);
			const load = (0, react.useCallback)(async () => {
				try {
					setConfig(await fetchConfig());
				} catch {
					setConfig(null);
				}
			}, []);
			(0, react.useEffect)(() => {
				load();
				const timer = setInterval(() => {
					load();
				}, POLL_MS);
				return () => clearInterval(timer);
			}, [load]);
			if (!config) return null;
			const mode = config.mode === "fine" ? "fine" : "unified";
			const soulCount = (config.souls ?? []).filter((s) => s.enabled !== false).length;
			config.unified;
			const label = mode === "fine" ? t("header.mode.fine") : t("header.mode.unified");
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Menu, {
				open,
				portal: true,
				align: "end",
				selectedId: `mode:${mode}`,
				anchor: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Tooltip, {
					label: t("header.tooltip", {
						souls: soulCount,
						mode: label
					}),
					side: "bottom",
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: ModeSwitch_module_css_default.anchor,
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(_deepseek_ai_dsh_client_ui_primitives.Pill, {
							active: true,
							className: ModeSwitch_module_css_default.pill,
							onClick: () => setOpen((v) => !v),
							disabled: busy,
							"aria-haspopup": "menu",
							"aria-expanded": open,
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: ModeSwitch_module_css_default.brand,
									children: "TriSoul"
								}),
								soulCount > 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: ModeSwitch_module_css_default.sep,
									"aria-hidden": true,
									children: "·"
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: ModeSwitch_module_css_default.souls,
									children: t("header.souls", { n: soulCount })
								})] }) : null,
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: ModeSwitch_module_css_default.sep,
									"aria-hidden": true,
									children: "·"
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: label }),
								mode === "unified" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: ModeSwitch_module_css_default.model,
									children: t("header.followMain")
								}) : null
							]
						})
					})
				}),
				items: [
					{
						id: "mode:unified",
						label: t("header.menu.unified")
					},
					{
						id: "mode:fine",
						label: t("header.menu.fine")
					},
					...openSettings ? [{
						type: "separator",
						id: "sep"
					}, {
						id: "open",
						label: t("header.menu.open")
					}] : []
				],
				onSelect: (id) => {
					setOpen(false);
					if (id === "open") {
						openSettings?.();
						return;
					}
					if (id.startsWith("mode:")) {
						const next = id.slice(5);
						if (next === mode) return;
						setBusy(true);
						postSettings({ mode: next }).then(setConfig).catch(() => {
							load();
						}).finally(() => setBusy(false));
					}
				},
				onClose: () => setOpen(false)
			});
		}
		//#endregion
		//#region src/client/locales.ts
		/** TriSoul 模型配置的翻译字典：zh 是 key 的事实源。 */
		const NS = "trisoulSettings";
		const zh = {
			"nav": "TriSoul",
			"title": "TriSoul 配置",
			"intro": "灵魂列表（增删 / 人设 / 路由 / 温度 / 推理等级）与中枢 AI（手术刀 / 记忆中枢）的模型选择。改动保存到 settings.yaml，下一轮即生效，无需重启。",
			"mode.label": "配置模式",
			"mode.unified": "统一模式",
			"mode.unified.desc": "灵魂跟随对话框选的模型（改对话框即刻生效）；下方统一模型给手术刀 / 记忆等中枢 AI 用",
			"mode.fine": "精细模式",
			"mode.fine.desc": "每个灵魂 / 中枢 AI 单独指定 provider / model（缺省沿用统一）",
			"unified.title": "统一模型（中枢 AI 路由 · 对话框未选模型时的兜底）",
			"field.provider": "Provider",
			"field.model": "Model",
			"field.temperature": "温度",
			"field.effort": "推理等级",
			"field.inherit": "（沿用统一）",
			"pick.placeholder": "选择…",
			"pick.custom": "自定义…",
			"pick.custom.prompt": "输入 {field}",
			"effort.inherit": "继承",
			"effort.unsupported": "未声明档位",
			"effort.unsupported.hint": "该模型在 LLM 目录里没有声明推理档位（reasoningEfforts），不能选",
			"effort.unknown": "目录无等级信息，可手输",
			"souls.title": "灵魂",
			"souls.count": "{enabled} / {total} 启用",
			"souls.hint": "每个灵魂独立盲写、参与表决。名称是身份（1~12 字符、唯一），人设会附加到 system 提示词；至少 1 个启用——只启用 1 个 = 单魂模式：无表决，一次盲写即定稿（该魂吃三魂 effort 第一栏档位），记忆/手术等中枢照常。列表整体保存，顺序决定平票轮换与三魂 effort 的按位映射。三魂 effort 非 off 时，前三个启用灵魂的人设/头衔被补偿人设覆盖（卡片有标注），此处人设是 off 档的回落位。",
			"souls.hint.unified": "统一模式：灵魂的 provider / model 不生效——全部跟随对话框当前选的模型与推理档位；例外：两项都显式填了 = 钉定路由（异系魂），不跟随。温度与灵魂自带的推理等级仍按灵魂生效。",
			"souls.enabled": "启用",
			"souls.disabled": "停用",
			"souls.name": "名称",
			"souls.name.placeholder": "如 A / 甲 / Reviewer",
			"souls.title.field": "头衔",
			"souls.title.placeholder": "如 谨慎审查者",
			"souls.persona": "人设",
			"souls.persona.placeholder": "附加到该灵魂 system 提示词的人设描述，如：你是一名谨慎的正确性审查者，优先保证严格正确。",
			"souls.remove": "删除",
			"souls.add": "添加灵魂",
			"souls.save": "保存灵魂",
			"souls.discard": "放弃更改",
			"souls.dirty": "有未保存的改动",
			"souls.saved": "灵魂已保存 · 下一轮共识生效",
			"souls.err.empty": "第 {n} 个灵魂缺少名称",
			"souls.err.long": "灵魂名「{name}」超过 {max} 字符",
			"souls.err.slash": "灵魂名「{name}」不能含 \"/\"",
			"souls.err.dup": "灵魂名重复：{name}",
			"souls.err.min": "至少需要 {min} 个启用的灵魂",
			"souls.default.label": "灵魂 {name}",
			"souls.overridden": "人设已被三魂 effort 覆盖（{officer} · {level}）——此处编辑仅在该栏调回 off 后生效",
			"hub.title": "中枢 AI",
			"hub.hint": "手术刀（上下文区域手术）、记忆中枢（消化 / 回忆）与画布编排小作业（状态区提炼 / 探针）。统一模式下沿用统一模型。",
			"hub.hint.unified": "当前为统一模式：下方 provider / model 不生效。",
			"resolved.title": "当前生效路由",
			"reset": "恢复默认",
			"reset.confirm": "清空 TriSoul 的用户设置（含灵魂列表）并恢复组合默认？",
			"refresh": "刷新",
			"saving": "保存中…",
			"saved": "已保存 · 下一次调用生效",
			"save.error": "保存失败：{message}",
			"load.error": "无法读取 TriSoul 配置：{message}",
			"loading": "加载中…",
			"unpersisted": "settings 服务不可用：改动只在内存中，重启后丢失。",
			"ai.surgeon": "手术刀",
			"ai.memory": "记忆中枢",
			"ai.canvas": "画布编排（状态区 / 探针小作业）",
			"header.mode.unified": "统一",
			"header.followMain": "跟随对话框模型",
			"header.mode.fine": "精细",
			"header.souls": "{n} 魂",
			"header.tooltip": "TriSoul：{souls} 个灵魂启用 · {mode}模式（点击切换）",
			"header.menu.unified": "统一模式 — 所有 AI 同一模型",
			"header.menu.fine": "精细模式 — 每个 AI 单独配置",
			"header.menu.open": "打开 TriSoul 配置…",
			"consensus.title": "共识过程",
			"consensus.hint": "灵魂盲写 / 表决 / 独走吸收的过程去向。正文永远只有定稿。",
			"trace.reasoning": "折叠为思维链",
			"trace.reasoning.desc": "过程写进 reasoning 块，像模型思考一样折叠显示，可展开查看灵魂对抗",
			"trace.none": "完全隐藏",
			"trace.none.desc": "对话里只见定稿；过程仅在监控面板与日志",
			"trace.text": "明文显示",
			"trace.text.desc": "过程作为正文明文输出（调试用）",
			"consensus.voteEffort": "表决思考档位",
			"consensus.voteEffort.hint": "表决调用的推理档位：off=不思考（省钱提速），inherit=沿用主请求",
			"consensus.voteMax": "表决选票上限",
			"consensus.voteMax.unlimited": "不限",
			"consensus.voteMax.hint": "表决调用的 maxTokens。选票被上限截断时自动放大重试；不限 = 不设上限（默认）",
			"consensus.retries": "失败自动重试",
			"consensus.retries.hint": "灵魂调用失败（断流 / 5xx / 限流 / 无输出超时 / 空响应 / 选票不合格）后再试几次，退避 1s×次数；总时长仍受总上限约束；配置类错误不重试（默认 2，0=关）",
			"consensus.timeout": "单魂调用总上限",
			"consensus.timeout.unlimited": "不限",
			"consensus.timeout.hint": "每魂单次盲写 / 表决调用的总时长硬上限，超过即硬切判失联——该魂本轮作废且不重试（重试与总上限共享同一时间预算，切时预算已归零），其余灵魂照常表决。写大单文件这类长产出容易顶满默认 15 分钟，可调大或选不限；不限时仍有「无输出判失联」兜底，不会真挂死",
			"consensus.idle": "无输出判失联",
			"consensus.idle.hint": "连续这么久没有任何流式输出（含思考增量）就判该魂失联并触发自动重试；每来一块即重置——长输出只要还在吐字就不会被杀（默认 60 秒）",
			"consensus.fuse": "思考熔断",
			"consensus.fuse.wan": "{n} 万字",
			"consensus.fuse.off": "关",
			"consensus.fuse.hint": "单魂一次调用的思考流超过该字数即掐断判失联、不重试（失控思维链大概率原样复发），其余灵魂照常表决。失控链一直在吐字所以「无输出判失联」拦不住它，总上限又要等满几十分钟——真机病例：24 分钟吐了 100 万字才被人肉掐断。默认 20 万字，正常深思考远碰不到",
			"duration.s": "{n} 秒",
			"duration.m": "{n} 分钟",
			"consensus.inner": "辩论期取证档位",
			"consensus.inner.off": "关",
			"consensus.inner.unlimited": "不限",
			"consensus.inner.hint": "盲写时官位灵魂可私下调用各自专属工具取证再作答（对齐官 task_original / 博识官联网检索透传 / 实证官 run_verify）：插件当场执行、结果一字不截喂回该灵魂自己，其它灵魂看不到、不进正文。数字档 = 每个灵魂每步的取证轮数上限（到顶按交稿收口）；关 = 任何灵魂都不给内层取证；不限 = 模型自己决定何时收口",
			"consensus.near": "近似免表决",
			"consensus.near.off": "关",
			"consensus.near.hint": "各魂草稿工具调用相同、正文相似度全部超过阈值时跳过表决直接放行（省一轮表决调用）。数字 = 相似度阈值（默认 0.7，越高越难命中）；关 = 永远走表决。三魂 effort 开档后三稿分化，命中是少数情况",
			"consensus.replay": "胜者思考回灌",
			"consensus.replay.off": "关闭（默认）",
			"consensus.replay.latest": "胜者思考回灌一轮",
			"consensus.replay.hint": "latest=定稿放行时把胜者的 raw 思考折进历史，只活一轮（下下轮剥掉，原消息不改）；会打破前缀缓存，token 开销增大。off=恒不回灌（现行为，默认）",
			"stageEffort.off": "off · 不思考",
			"stageEffort.inherit": "inherit · 沿用主请求",
			"effort3.title": "三魂 effort（全局默认档）",
			"effort3.hint": "三栏按位对应启用列表的前三个灵魂：off = 该魂库内人设（老表），轻 / 标准 / 猛 = 对应补偿人设全文覆盖该魂 persona（名字 / 路由 / 温度不动，仍走表决制）。即改即存、下一共识轮生效；单个会话可在输入框的「灵魂effort」chip 单独绑定（优先于此处全局档）。",
			"effort3.align": "对齐",
			"effort3.align.hint": "做什么——逐字对照用户要求与产出，抓被「差不多」带过去的缩水与偷换",
			"effort3.erudite": "博识",
			"effort3.erudite.hint": "凭什么做——查证现状与参照，把「我记得」逼成有出处的事实",
			"effort3.empiric": "实证",
			"effort3.empiric.hint": "做对没有——让现实验证结论，推理踩现实锚点",
			"effort3.mapped": "→ 魂 {soul}",
			"effort3.unmapped": "启用灵魂不足三个，此栏暂无对应魂（档位无效）",
			"effort3.level.off": "off · 老表",
			"effort3.level.light": "轻",
			"effort3.level.standard": "标准",
			"effort3.level.max": "猛",
			"memscope.title": "记忆范围",
			"memscope.hint": "记忆中枢的可见半径（读写同径）。只影响之后新开的会话：会话第一次触达中枢时绑定当时的档位，之后不可中途切换。",
			"memscope.full": "完全版",
			"memscope.full.desc": "底层 + 跨项目 + 本项目全部读写（现状）",
			"memscope.project": "项目级",
			"memscope.project.desc": "只读写本项目分区，不碰底层与跨项目",
			"memscope.session": "会话级",
			"memscope.session.desc": "该会话记忆完全独立：外界不进来，里面不出去；短程任务不污染工作区记忆",
			"retire.title": "用户原话退役",
			"retire.hint": "开启后，非最新一条的用户消息可随手术区间被浓缩进检查点（最新一条永不动）。约束由状态区恒真区逐字引用接住，原文随时可按 seq 回捞。默认关闭。",
			"retire.off": "关（默认）",
			"retire.on": "开"
		};
		const en = {
			"nav": "TriSoul",
			"title": "TriSoul configuration",
			"intro": "The soul roster (add / remove, persona, route, temperature, reasoning effort) and the hub AIs (surgeon / memory hub). Changes save to settings.yaml and apply from the next turn — no restart.",
			"mode.label": "Mode",
			"mode.unified": "Unified",
			"mode.unified.desc": "Souls follow the model picked in the composer (takes effect immediately); the unified model below routes the hub AIs (surgeon / memory)",
			"mode.fine": "Fine-grained",
			"mode.fine.desc": "Each soul / hub AI picks its own provider / model (blank inherits unified)",
			"unified.title": "Unified model (hub AI route · fallback when the composer has none)",
			"field.provider": "Provider",
			"field.model": "Model",
			"field.temperature": "Temperature",
			"field.effort": "Reasoning effort",
			"field.inherit": "(inherit unified)",
			"pick.placeholder": "Select…",
			"pick.custom": "Custom…",
			"pick.custom.prompt": "Enter {field}",
			"effort.inherit": "Inherit",
			"effort.unsupported": "No efforts declared",
			"effort.unsupported.hint": "This model declares no reasoning efforts (reasoningEfforts) in the LLM catalog; nothing to pick",
			"effort.unknown": "No effort catalog for this model; type a value",
			"souls.title": "Souls",
			"souls.count": "{enabled} / {total} enabled",
			"souls.hint": "Each soul drafts blind, then joins the vote. The name is its identity (1–12 chars, unique); the persona is appended to its system prompt; at least 1 must be enabled — exactly 1 enabled = single-soul mode: no vote, one draft is the answer (that soul takes the first effort lane), while memory/surgery hubs keep working. The list saves as a whole; its order drives tie-break rotation and the effort lane mapping. When soul effort lanes are on, the personas/titles of the first three enabled souls are overridden by compensation personas (badged on the card); personas here are the off-level fallback.",
			"souls.hint.unified": "Unified mode: soul provider / model are ignored — all follow the model picked in the composer; exception: a soul with both set explicitly is pinned (cross-family soul). Temperature and per-soul effort still apply.",
			"souls.enabled": "On",
			"souls.disabled": "Off",
			"souls.name": "Name",
			"souls.name.placeholder": "e.g. A / Reviewer",
			"souls.title.field": "Title",
			"souls.title.placeholder": "e.g. Careful reviewer",
			"souls.persona": "Persona",
			"souls.persona.placeholder": "Persona text appended to this soul's system prompt, e.g. \"You are a careful correctness reviewer; strict correctness first.\"",
			"souls.remove": "Remove",
			"souls.add": "Add soul",
			"souls.save": "Save souls",
			"souls.discard": "Discard changes",
			"souls.dirty": "Unsaved changes",
			"souls.saved": "Souls saved · applies from the next consensus turn",
			"souls.err.empty": "Soul #{n} has no name",
			"souls.err.long": "Soul name \"{name}\" exceeds {max} characters",
			"souls.err.slash": "Soul name \"{name}\" must not contain \"/\"",
			"souls.err.dup": "Duplicate soul name: {name}",
			"souls.err.min": "At least {min} souls must be enabled",
			"souls.default.label": "Soul {name}",
			"souls.overridden": "Persona overridden by soul effort ({officer} · {level}) — edits here only apply once that lane is back to off",
			"hub.title": "Hub AIs",
			"hub.hint": "Surgeon (context region surgery), memory hub (digest / recall) and canvas small jobs (state zone / probes). Inherit the unified model in unified mode.",
			"hub.hint.unified": "Unified mode is active: provider / model below are ignored.",
			"resolved.title": "Effective routes",
			"reset": "Reset to defaults",
			"reset.confirm": "Clear TriSoul user settings (including the soul roster) and restore composition defaults?",
			"refresh": "Refresh",
			"saving": "Saving…",
			"saved": "Saved · applies on next call",
			"save.error": "Save failed: {message}",
			"load.error": "Cannot read TriSoul configuration: {message}",
			"loading": "Loading…",
			"unpersisted": "Settings service unavailable: changes live in memory only and are lost on restart.",
			"ai.surgeon": "Surgeon",
			"ai.memory": "Memory hub",
			"ai.canvas": "Canvas (state zone / probe jobs)",
			"header.mode.unified": "Unified",
			"header.followMain": "follows composer model",
			"header.mode.fine": "Fine",
			"header.souls": "{n} souls",
			"header.tooltip": "TriSoul: {souls} souls enabled · {mode} mode (click to switch)",
			"header.menu.unified": "Unified — one model for every AI",
			"header.menu.fine": "Fine-grained — configure each AI",
			"header.menu.open": "Open TriSoul settings…",
			"consensus.title": "Consensus process",
			"consensus.hint": "Where the blind-draft / vote / solo narration goes. The answer body only ever contains the final draft.",
			"trace.reasoning": "Fold into thinking",
			"trace.reasoning.desc": "Narration goes into a reasoning block, collapsed like model thinking; expand to see the souls argue",
			"trace.none": "Hide completely",
			"trace.none.desc": "Only the final draft in chat; process visible only in the monitor and logs",
			"trace.text": "Plain text",
			"trace.text.desc": "Narration emitted as visible text (debugging)",
			"consensus.voteEffort": "Vote reasoning",
			"consensus.voteEffort.hint": "Reasoning effort for vote calls: off = no thinking (cheaper, faster), inherit = same as the main request",
			"consensus.voteMax": "Ballot token cap",
			"consensus.voteMax.unlimited": "unlimited",
			"consensus.voteMax.hint": "maxTokens for vote calls. A ballot truncated by the cap is automatically retried with a larger one; unlimited = no cap (default)",
			"consensus.retries": "Auto retry on failure",
			"consensus.retries.hint": "How many times a failed soul call (stream error / 5xx / rate limit / idle timeout / empty reply / unparseable ballot) is retried, backoff 1s×attempt, within the same overall cap; config errors are not retried (default 2, 0 = off)",
			"consensus.timeout": "Per-soul hard time limit",
			"consensus.timeout.unlimited": "unlimited",
			"consensus.timeout.hint": "Hard cap on the total duration of one soul call (draft / vote); hitting it kills the call — that soul forfeits the round with no retry (retries share the same time budget, which is already spent), while the other souls vote as usual. Long outputs like big single-file demos can max out the 15-minute default; raise it or pick unlimited — the no-output disconnect below still guards against a hung stream",
			"consensus.idle": "No-output disconnect",
			"consensus.idle.hint": "If a soul streams nothing (not even a reasoning delta) for this long it is considered disconnected and auto-retried; every chunk resets the clock — long outputs are safe as long as they keep streaming (default 60s)",
			"consensus.fuse": "Reasoning fuse",
			"consensus.fuse.wan": "{n}0k chars",
			"consensus.fuse.off": "Off",
			"consensus.fuse.hint": "If one soul call streams more reasoning than this, the call is cut and the soul forfeits the round with no retry (a runaway chain would just run away again); the other souls vote as usual. A runaway keeps streaming so the no-output disconnect never fires, and the hard time limit takes tens of minutes — real case: 24 minutes and 1M chars before a human pulled the plug. Default 200k chars; genuine deep thinking never gets close",
			"duration.s": "{n}s",
			"duration.m": "{n} min",
			"consensus.inner": "Inner evidence rounds",
			"consensus.inner.off": "off",
			"consensus.inner.unlimited": "unlimited",
			"consensus.inner.hint": "While drafting, an officer soul may privately call its dedicated tool to gather evidence before answering (align: task_original / erudite: web passthrough / empiric: run_verify): the plugin executes it and feeds the full result back to that soul only — other souls never see it and nothing enters the body. A number = per-soul per-step cap on evidence rounds (hitting the cap submits the draft); off = no inner evidence for any soul; unlimited = the model decides when to stop",
			"consensus.near": "Near-identical skip",
			"consensus.near.off": "Off",
			"consensus.near.hint": "When every draft makes the same tool calls and all pairwise text similarities exceed the threshold, the vote is skipped and the draft released directly (saves a vote round). Number = similarity threshold (default 0.7; higher = rarer); off = always vote. With soul effort lanes on, drafts diverge and hits become rare",
			"consensus.replay": "Winner thinking replay",
			"consensus.replay.off": "Off (default)",
			"consensus.replay.latest": "Replay winner thinking for one round",
			"consensus.replay.hint": "latest = fold the winner's raw thinking into history on release, alive for one round only (stripped the round after; original messages untouched); breaks prefix caching and increases token cost. off = never replay (status quo, default)",
			"stageEffort.off": "off · no thinking",
			"stageEffort.inherit": "inherit · main request",
			"effort3.title": "Soul effort (global defaults)",
			"effort3.hint": "The three lanes map positionally to the first three enabled souls: off = the soul's own persona; light / standard / max overwrite its persona with the matching compensation persona (name / route / temperature untouched, voting flow unchanged). Saves immediately, applies from the next consensus round; a session can bind its own levels via the composer \"soul effort\" chip (which overrides these).",
			"effort3.align": "Align",
			"effort3.align.hint": "What to do — check the output against the user's request word by word; catch shrinkage and substitution",
			"effort3.erudite": "Erudite",
			"effort3.erudite.hint": "On what grounds — verify current state and references; turn \"I recall\" into sourced facts",
			"effort3.empiric": "Empiric",
			"effort3.empiric.hint": "Done right? — let reality validate conclusions; anchor reasoning in real checks",
			"effort3.mapped": "→ soul {soul}",
			"effort3.unmapped": "Fewer than three souls enabled; this lane has no mapped soul (levels have no effect)",
			"effort3.level.off": "off · default",
			"effort3.level.light": "light",
			"effort3.level.standard": "standard",
			"effort3.level.max": "max",
			"memscope.title": "Memory scope",
			"memscope.hint": "Visibility radius of the memory hub (reads and writes share the same radius). Only affects sessions opened afterwards: a session binds the current setting on first touch and cannot switch mid-session.",
			"memscope.full": "Full",
			"memscope.full.desc": "Reads & writes global + cross-project + project layers (status quo)",
			"memscope.project": "Project",
			"memscope.project.desc": "Only this project’s partition; global and cross-project stay untouched",
			"memscope.session": "Session",
			"memscope.session.desc": "Fully isolated per-session memory: nothing comes in, nothing leaks out — short-lived tasks won’t pollute the workspace memory",
			"retire.title": "User-message retirement",
			"retire.hint": "When on, user messages other than the latest may be condensed into checkpoints along with a surgical region (the latest one is never touched). Constraints are held as verbatim quotes in the pinned-truths zone, and originals remain retrievable by seq. Off by default.",
			"retire.off": "Off (default)",
			"retire.on": "On"
		};
		//#endregion
		//#region src/client/index.ts
		const inject = ["slots", "locale"];
		function apply(ctx) {
			ctx.effect(() => ctx.locale.register(NS, {
				zh,
				en
			}), "trisoul-settings: dictionaries");
			const t = ctx.locale.bind(NS);
			ctx.slots.inject("settings.section", () => ctx.slots.register({
				name: "settings.section",
				id: "trisoul",
				order: 60,
				locale: NS,
				label: () => t("nav")
			}, TrisoulSection));
			ctx.slots.inject("conversation.session.header.actions", () => ctx.slots.register({
				name: "conversation.session.header.actions",
				id: "trisoul-mode",
				order: 30,
				locale: NS
			}, ModeSwitch));
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map