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
		const SOUL_COUNTS = [
			1,
			2,
			3
		];
		const MEMORY_SCOPES = [
			"full",
			"project",
			"session"
		];
		/** 压缩频率档位（09-01 用户圈定）：档位只是客户端语法糖，落盘就是三个数；高亮靠对实效三值反查 */
		const COMPACTION_PRESETS = {
			always: {
				surgeryCooldownSteps: 3,
				minRegionTokens: 1e4,
				stateEvery: 6
			},
			medium: {
				surgeryCooldownSteps: 6,
				minRegionTokens: 2e4,
				stateEvery: 10
			},
			slow: {
				surgeryCooldownSteps: 10,
				minRegionTokens: 4e4,
				stateEvery: 15
			}
		};
		const COMPACTION_PRESET_IDS = Object.keys(COMPACTION_PRESETS);
		/** 中枢 AI（手术刀 / 记忆中枢 / 画布小作业）：固定三个；灵魂是写死名册 */
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
		//#endregion
		//#region \0dsh-css:/Users/mac/Projects/trisoul/packages/client/settings/src/client/Picker.module.css.mjs
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
			"trigger": "PMN_SG_trigger",
			"caret": "PMN_SG_caret",
			"triggerLabel": "PMN_SG_triggerLabel",
			"triggerEmpty": "PMN_SG_triggerEmpty"
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
		//#region \0dsh-css:/Users/mac/Projects/trisoul/packages/client/settings/src/client/TrisoulSection.module.css.mjs
		const css$1 = ".zFfKmq_section{color:var(--dsw-alias-label-primary);font:var(--dsw-font-s-14);font-family:var(--dsw-font-family);flex-direction:column;gap:20px;display:flex}.zFfKmq_header{justify-content:space-between;align-items:flex-start;gap:16px;display:flex}.zFfKmq_headerActions{flex:none;gap:8px;display:flex}.zFfKmq_title{font:var(--dsw-font-m-18);color:var(--dsw-alias-label-primary);margin:0 0 4px;font-weight:600}.zFfKmq_intro{font:var(--dsw-font-xs-13);color:var(--dsw-alias-label-secondary);margin:0}.zFfKmq_group{flex-direction:column;gap:10px;display:flex}.zFfKmq_groupDimmed{opacity:.55}.zFfKmq_groupLabel{font:var(--dsw-font-xs-13);color:var(--dsw-alias-label-secondary);text-transform:none;font-weight:600}.zFfKmq_hint{font:var(--dsw-font-xxs-12);color:var(--dsw-alias-label-tertiary)}.zFfKmq_warn{font:var(--dsw-font-xs-13);color:var(--dsw-alias-state-warn-label);background:var(--dsw-alias-state-warn-tertiary);border-radius:6px;padding:8px 12px}.zFfKmq_modeRow{grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px;display:grid}.zFfKmq_modeCard{text-align:left;cursor:pointer;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);color:inherit;font:inherit;border-radius:8px;flex-direction:column;align-items:flex-start;gap:4px;padding:12px 14px;font-family:inherit;transition:border-color .15s,background-color .15s;display:flex}.zFfKmq_modeCard:hover{background:var(--dsw-alias-interactive-bg-hover)}.zFfKmq_modeCard:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}.zFfKmq_modeCardActive{border-color:var(--dsw-alias-brand-primary);background:var(--dsw-alias-bg-layer-2)}.zFfKmq_modeName{font:var(--dsw-font-s-14);color:var(--dsw-alias-label-primary);font-weight:600}.zFfKmq_modeDesc{font:var(--dsw-font-xxs-12);color:var(--dsw-alias-label-tertiary)}.zFfKmq_fieldRow{flex-wrap:wrap;align-items:center;gap:8px 12px;display:flex}.zFfKmq_fieldLabel{font:var(--dsw-font-xs-13);color:var(--dsw-alias-label-secondary);min-width:56px}.zFfKmq_hintInline{font:var(--dsw-font-xxxs-11);color:var(--dsw-alias-label-tertiary)}.zFfKmq_inlineLabel{font:var(--dsw-font-xxs-12);color:var(--dsw-alias-label-secondary);white-space:nowrap;flex:none}.zFfKmq_table{border:1px solid var(--dsw-alias-border-l2);border-radius:8px;flex-direction:column;display:flex;overflow:hidden}.zFfKmq_aiRow{border-bottom:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);--trisoul-accent:var(--dsw-alias-label-secondary);grid-template-columns:minmax(140px,.6fr) minmax(0,2fr);align-items:center;gap:8px 14px;padding:10px 12px;display:grid}.zFfKmq_aiRow:last-child{border-bottom:none}.zFfKmq_aiRow[data-ai=surgeon]{--trisoul-accent:var(--dsw-alias-brand-primary)}.zFfKmq_aiRow[data-ai=memory]{--trisoul-accent:var(--dsw-alias-label-primary-bluish)}.zFfKmq_aiName{font:var(--dsw-font-xs-13);color:var(--dsw-alias-label-primary);align-items:center;gap:8px;min-width:0;display:flex}.zFfKmq_aiDot{background:var(--trisoul-accent);border-radius:50%;flex:none;width:8px;height:8px}.zFfKmq_aiFieldsWrap{flex-wrap:wrap;align-items:center;gap:8px 14px;min-width:0;display:flex}.zFfKmq_aiFields{flex-wrap:wrap;gap:8px;min-width:0;display:flex}.zFfKmq_aiFields>*{min-width:0;max-width:100%}.zFfKmq_aiFieldsDimmed{opacity:.55}.zFfKmq_tempField{font:var(--dsw-font-xxs-12);color:var(--dsw-alias-label-secondary);align-items:center;gap:8px;min-width:0;display:flex}.zFfKmq_range{min-width:90px;max-width:160px;accent-color:var(--dsw-alias-brand-primary);flex:1}.zFfKmq_tempValue{font-variant-numeric:tabular-nums;text-align:right;min-width:2.2em;color:var(--dsw-alias-label-primary)}.zFfKmq_resolvedList{flex-direction:column;gap:6px;margin:0;padding:0;list-style:none;display:flex}.zFfKmq_resolvedRow{font:var(--dsw-font-xs-13);align-items:center;gap:10px;display:flex}.zFfKmq_resolvedAi{min-width:180px;color:var(--dsw-alias-label-secondary)}.zFfKmq_actions{gap:8px;display:flex}.zFfKmq_statusRow{min-height:20px;font:var(--dsw-font-xs-13)}.zFfKmq_muted{color:var(--dsw-alias-label-tertiary)}.zFfKmq_ok{color:var(--dsw-alias-state-success-primary)}.zFfKmq_error{color:var(--dsw-alias-state-error-primary)}@media (width<=720px){.zFfKmq_aiRow{grid-template-columns:1fr}}@media (prefers-reduced-motion:reduce){.zFfKmq_modeCard{transition:none}}.zFfKmq_roundsRow{align-items:center;gap:6px;display:inline-flex}.zFfKmq_numInput{width:96px;font:var(--dsw-font-xs-13);font-family:var(--dsw-font-family);font-variant-numeric:tabular-nums;color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l2);border-radius:6px;padding:4px 8px}.zFfKmq_numInput:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}";
		const tagId$1 = "@trisoul/dsh-client-settings/TrisoulSection.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$1) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@trisoul/dsh-client-settings";
			tag.dataset.pluginCss = tagId$1;
			tag.textContent = css$1;
			document.head.appendChild(tag);
		}
		var TrisoulSection_module_css_default = {
			"range": "zFfKmq_range",
			"header": "zFfKmq_header",
			"headerActions": "zFfKmq_headerActions",
			"aiFieldsWrap": "zFfKmq_aiFieldsWrap",
			"tempField": "zFfKmq_tempField",
			"section": "zFfKmq_section",
			"inlineLabel": "zFfKmq_inlineLabel",
			"resolvedRow": "zFfKmq_resolvedRow",
			"aiName": "zFfKmq_aiName",
			"modeName": "zFfKmq_modeName",
			"actions": "zFfKmq_actions",
			"statusRow": "zFfKmq_statusRow",
			"modeCardActive": "zFfKmq_modeCardActive",
			"hint": "zFfKmq_hint",
			"groupLabel": "zFfKmq_groupLabel",
			"muted": "zFfKmq_muted",
			"error": "zFfKmq_error",
			"numInput": "zFfKmq_numInput",
			"group": "zFfKmq_group",
			"fieldRow": "zFfKmq_fieldRow",
			"title": "zFfKmq_title",
			"hintInline": "zFfKmq_hintInline",
			"groupDimmed": "zFfKmq_groupDimmed",
			"aiFieldsDimmed": "zFfKmq_aiFieldsDimmed",
			"aiFields": "zFfKmq_aiFields",
			"table": "zFfKmq_table",
			"fieldLabel": "zFfKmq_fieldLabel",
			"modeRow": "zFfKmq_modeRow",
			"modeCard": "zFfKmq_modeCard",
			"resolvedAi": "zFfKmq_resolvedAi",
			"warn": "zFfKmq_warn",
			"aiDot": "zFfKmq_aiDot",
			"intro": "zFfKmq_intro",
			"aiRow": "zFfKmq_aiRow",
			"ok": "zFfKmq_ok",
			"tempValue": "zFfKmq_tempValue",
			"resolvedList": "zFfKmq_resolvedList",
			"roundsRow": "zFfKmq_roundsRow",
			"modeDesc": "zFfKmq_modeDesc"
		};
		//#endregion
		//#region src/client/TrisoulSection.tsx
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
		/** 即改即存的整数框（缓存与压缩自定义三值）：失焦/回车才提交；非法输入（非整数/越界）回弹当前值不提交 */
		function NumField({ label, value, min, onCommit }) {
			const [local, setLocal] = (0, react.useState)(String(value));
			(0, react.useEffect)(() => {
				setLocal(String(value));
			}, [value]);
			const commit = () => {
				const n = Number(local);
				if (!Number.isInteger(n) || n < min) {
					setLocal(String(value));
					return;
				}
				if (n !== value) onCommit(n);
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
				className: TrisoulSection_module_css_default.tempField,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
					className: TrisoulSection_module_css_default.inlineLabel,
					children: label
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
					type: "number",
					min,
					step: 1,
					className: TrisoulSection_module_css_default.numInput,
					"aria-label": label,
					value: local,
					onChange: (e) => setLocal(e.target.value),
					onBlur: commit,
					onKeyDown: (e) => {
						if (e.key === "Enter") e.currentTarget.blur();
					}
				})]
			});
		}
		/** 设置页「TriSoul」分区：统一/精细两模式 + 灵魂数量（1/2/3）+ 中枢 AI（即改即存）+ 共识过程 + 记忆范围 + 缓存与压缩（压缩频率档位）。 */
		/** 「全部」档：与插件 DEFAULT_VOTE_TAIL_WINDOW 同值——tailWindow 在 messages.length <= n 时原样返回全量历史 */
		const VOTE_TAIL_ALL = 999999;
		function TrisoulSection({ t }) {
			const [config, setConfig] = (0, react.useState)(null);
			const [directory, setDirectory] = (0, react.useState)([]);
			const [loadError, setLoadError] = (0, react.useState)(null);
			const [status, setStatus] = (0, react.useState)({ kind: "idle" });
			const [metricsLite, setMetricsLite] = (0, react.useState)(null);
			const [customTuning, setCustomTuning] = (0, react.useState)(false);
			const load = (0, react.useCallback)(async () => {
				try {
					const state = await fetchState();
					setConfig(state.config);
					setDirectory(state.directory);
					setMetricsLite(state.metrics ?? null);
					setLoadError(null);
				} catch (e) {
					setLoadError(e instanceof Error ? e.message : String(e));
				}
			}, []);
			(0, react.useEffect)(() => {
				load();
			}, [load]);
			const save = (0, react.useCallback)(async (patch) => {
				setStatus({ kind: "saving" });
				try {
					setConfig(await postSettings(patch));
					setStatus({ kind: "saved" });
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
			if (!config) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: TrisoulSection_module_css_default.section,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: TrisoulSection_module_css_default.muted,
					children: t("loading")
				})
			});
			const unified = config.unified ?? {};
			const isUnified = config.mode !== "fine";
			const soulCount = config.soulCount ?? 3;
			const enabledSouls = (config.souls ?? []).filter((s) => s.enabled);
			const trace = config.consensus?.trace ?? "reasoning";
			const voteEffort = config.consensus?.voteEffort ?? "off";
			const voteMaxTokens = config.consensus?.voteMaxTokens ?? 0;
			const voteTailWindow = config.consensus?.voteTailWindow ?? VOTE_TAIL_ALL;
			const schemaPromptProviders = config.consensus?.schemaPromptProviders ?? [];
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
			const tuning = config.canvas ?? COMPACTION_PRESETS.always;
			const activePreset = COMPACTION_PRESET_IDS.find((id) => {
				const preset = COMPACTION_PRESETS[id];
				return preset.surgeryCooldownSteps === tuning.surgeryCooldownSteps && preset.minRegionTokens === tuning.minRegionTokens && preset.stateEvery === tuning.stateEvery;
			}) ?? null;
			const cacheReadout = (() => {
				let cache = 0, input = 0;
				for (const [key, v] of Object.entries(metricsLite?.reasoning?.efforts ?? {})) {
					if (!key.startsWith("draft")) continue;
					cache += v.cacheReadTokens ?? 0;
					input += v.inputTokens ?? 0;
				}
				const hit = cache + input > 0 ? `${(cache / (cache + input) * 100).toFixed(1)}%` : t("cache.readout.nodata");
				const surgeries = metricsLite?.compaction?.surgeries ?? 0;
				const completed = metricsLite?.consensus?.completed ?? 0;
				return t("cache.readout", {
					hit,
					knife: surgeries > 0 && completed > 0 ? t("cache.readout.knife", { n: (completed / surgeries).toFixed(1) }) : t("cache.readout.noknife")
				});
			})();
			/** 提交前重取最新配置（09-01 审计 #13）：页面只在 mount/save 后取值，期间 settings.yaml 可能被手改——
			*  拿陈旧 config 展开整组回写会把手改静默退回；以提交时刻的最新值为基，只覆盖本次点击改动的字段 */
			const freshConfig = async () => {
				try {
					const state = await fetchState();
					setConfig(state.config);
					setDirectory(state.directory);
					return state.config;
				} catch {
					return config;
				}
			};
			const setFine = (id, patch) => {
				(async () => {
					const current = (await freshConfig()).fine?.[id] ?? {};
					await save({ fine: { [id]: {
						...current,
						...patch
					} } });
				})();
			};
			const setUnified = (patch) => {
				(async () => {
					const cur = (await freshConfig()).unified ?? {};
					await save({ unified: {
						provider: cur.provider ?? "",
						model: cur.model ?? "",
						...patch
					} });
				})();
			};
			const soulLabel = (s) => s.title ? `${t("souls.default.label", { name: s.name })} · ${s.title}` : t("souls.default.label", { name: s.name });
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
										setUnified({ provider: v ?? "" });
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
										setUnified({ model: v ?? "" });
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
								children: t("souls.title")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: TrisoulSection_module_css_default.hint,
								children: t("souls.count.hint")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: TrisoulSection_module_css_default.fieldRow,
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
										className: TrisoulSection_module_css_default.fieldLabel,
										children: t("souls.count.label")
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: TrisoulSection_module_css_default.roundsRow,
										role: "radiogroup",
										"aria-label": t("souls.count.label"),
										children: SOUL_COUNTS.map((n) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Pill, {
											active: soulCount === n,
											onClick: () => {
												if (soulCount !== n && status.kind !== "saving") save({ soulCount: n });
											},
											children: t("souls.count.n", { n })
										}, n))
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: TrisoulSection_module_css_default.hintInline,
										children: t("souls.count.current", { list: enabledSouls.map((s) => `${s.name} ${s.title ?? ""}`.trim()).join(" · ") })
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
										children: t("consensus.voteTail")
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: TrisoulSection_module_css_default.roundsRow,
										role: "radiogroup",
										"aria-label": t("consensus.voteTail"),
										children: [
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Pill, {
												active: voteTailWindow === 0,
												onClick: () => {
													if (voteTailWindow !== 0) save({ consensus: { voteTailWindow: 0 } });
												},
												children: t("consensus.voteTail.none")
											}),
											[
												1,
												2,
												4,
												8
											].map((n) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Pill, {
												active: voteTailWindow === n,
												onClick: () => {
													if (voteTailWindow !== n) save({ consensus: { voteTailWindow: n } });
												},
												children: n
											}, n)),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Pill, {
												active: voteTailWindow >= VOTE_TAIL_ALL,
												onClick: () => {
													if (voteTailWindow < VOTE_TAIL_ALL) save({ consensus: { voteTailWindow: VOTE_TAIL_ALL } });
												},
												children: t("consensus.voteTail.all")
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)(NumField, {
												label: t("pick.custom"),
												value: voteTailWindow,
												min: 0,
												onCommit: (n) => {
													save({ consensus: { voteTailWindow: n } });
												}
											})
										]
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: TrisoulSection_module_css_default.hint,
										children: t("consensus.voteTail.hint")
									})
								]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: TrisoulSection_module_css_default.fieldRow,
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
										className: TrisoulSection_module_css_default.fieldLabel,
										children: t("consensus.schemaPrompt")
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: TrisoulSection_module_css_default.roundsRow,
										role: "group",
										"aria-label": t("consensus.schemaPrompt"),
										children: directory.length === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: TrisoulSection_module_css_default.muted,
											children: t("consensus.schemaPrompt.none")
										}) : directory.map((p) => {
											const on = schemaPromptProviders.includes(p.id);
											return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Pill, {
												active: on,
												onClick: () => {
													save({ consensus: { schemaPromptProviders: on ? schemaPromptProviders.filter((x) => x !== p.id) : [...schemaPromptProviders, p.id] } });
												},
												children: p.name || p.id
											}, p.id);
										})
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: TrisoulSection_module_css_default.hint,
										children: t("consensus.schemaPrompt.hint")
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
											children: t("consensus.fuse.wan", { n: String(n / 1e4) })
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
											children: n
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
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: TrisoulSection_module_css_default.groupLabel,
								children: t("cache.title")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: TrisoulSection_module_css_default.hint,
								children: t("cache.hint")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: TrisoulSection_module_css_default.fieldRow,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
									className: TrisoulSection_module_css_default.fieldLabel,
									children: t("cache.freq")
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: TrisoulSection_module_css_default.roundsRow,
									role: "radiogroup",
									"aria-label": t("cache.freq"),
									children: [COMPACTION_PRESET_IDS.map((id) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Pill, {
										active: activePreset === id && !customTuning,
										onClick: () => {
											setCustomTuning(false);
											if (activePreset !== id) save({ canvas: { ...COMPACTION_PRESETS[id] } });
										},
										children: id
									}, id)), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Pill, {
										active: activePreset === null || customTuning,
										onClick: () => setCustomTuning(true),
										children: t("cache.custom")
									})]
								})]
							}),
							activePreset === null || customTuning ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: TrisoulSection_module_css_default.fieldRow,
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)(NumField, {
										label: t("cache.cooldown"),
										value: tuning.surgeryCooldownSteps,
										min: 0,
										onCommit: (v) => {
											save({ canvas: { surgeryCooldownSteps: v } });
										}
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)(NumField, {
										label: t("cache.minRegion"),
										value: tuning.minRegionTokens,
										min: 1,
										onCommit: (v) => {
											save({ canvas: { minRegionTokens: v } });
										}
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)(NumField, {
										label: t("cache.stateEvery"),
										value: tuning.stateEvery,
										min: 1,
										onCommit: (v) => {
											save({ canvas: { stateEvery: v } });
										}
									})
								]
							}) : null,
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: TrisoulSection_module_css_default.hint,
								children: cacheReadout
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
							children: [enabledSouls.map((s) => {
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
		//#region \0dsh-css:/Users/mac/Projects/trisoul/packages/client/settings/src/client/ModeSwitch.module.css.mjs
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
			"model": "Rljr8q_model",
			"souls": "Rljr8q_souls",
			"anchor": "Rljr8q_anchor",
			"pill": "Rljr8q_pill",
			"brand": "Rljr8q_brand",
			"sep": "Rljr8q_sep"
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
			"intro": "灵魂数量与中枢 AI（手术刀 / 记忆中枢 / 画布）的模型选择。改动保存到 settings.yaml，下一轮即生效，无需重启。",
			"mode.label": "配置模式",
			"mode.unified": "统一模式",
			"mode.unified.desc": "灵魂跟随对话框选的模型（改对话框即刻生效）；下方统一模型给手术刀 / 记忆等中枢 AI 用",
			"mode.fine": "精细模式",
			"mode.fine.desc": "中枢 AI 各自指定 provider / model（缺省沿用统一）；灵魂路由可在 settings.yaml 的 fine.soul-A/B/C 手改",
			"unified.title": "统一模型（中枢 AI 路由 · 对话框未选模型时的兜底）",
			"field.provider": "Provider",
			"field.model": "Model",
			"field.temperature": "温度",
			"field.inherit": "（沿用统一）",
			"pick.placeholder": "选择…",
			"pick.custom": "自定义…",
			"pick.custom.prompt": "输入 {field}",
			"souls.title": "灵魂",
			"souls.default.label": "灵魂 {name}",
			"souls.count.hint": "三魂 A / B / C 固定（温度 0.3 / 0.6 / 0.9，路由随上方统一 / 精细分区）。1 魂 = 博识官单独作答，不表决；2 魂 = 对齐官 + 实证官互投；3 魂 = 对齐 / 博识 / 实证三官表决。官位人设固定为「猛」档。即改即存，下一轮生效。",
			"souls.count.current": "当前：{list}",
			"souls.count.n": "{n} 魂",
			"souls.count.label": "灵魂数量",
			"hub.title": "中枢 AI",
			"hub.hint": "手术刀（上下文区域手术）、记忆中枢（消化 / 回忆）与画布编排小作业（状态区提炼 / 探针）。统一模式下沿用统一模型。",
			"hub.hint.unified": "当前为统一模式：下方 provider / model 不生效。",
			"resolved.title": "当前生效路由",
			"reset": "恢复默认",
			"reset.confirm": "清空 TriSoul 的用户设置并恢复组合默认？",
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
			"consensus.voteTail": "表决尾窗",
			"consensus.voteTail.none": "不带历史",
			"consensus.voteTail.all": "全部",
			"consensus.voteTail.hint": "评委表决时附带看的对话末尾条数。默认全部 = 评委看到的和写稿的三魂一模一样（也让表决蹭上盲写刚写热的缓存）；调小省输入，但评委看不到用户原话、只能比文风；不带历史 = 只看候选卡与指令",
			"consensus.schemaPrompt": "格式锁说明进提示词",
			"consensus.schemaPrompt.none": "暂无渠道目录",
			"consensus.schemaPrompt.hint": "点亮的渠道在 json_schema 锁之外，把整份 schema（四格含义与工具说明）写进系统提示词。百炼这类渠道的 json_schema 只管形状、不把说明给模型看，不点亮模型会盲填、工具参数名靠猜",
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
			"consensus.inner.hint": "盲写时官位灵魂可私下调用各自专属工具取证再作答（对齐官 task_map / 博识官联网检索透传 / 实证官 verify_link）：插件当场执行、结果一字不截喂回该灵魂自己，其它灵魂看不到、不进正文。数字档 = 每个灵魂每步的取证轮数上限（到顶按交稿收口）；关 = 任何灵魂都不给内层取证；不限 = 模型自己决定何时收口",
			"consensus.near": "近似免表决",
			"consensus.near.off": "关",
			"consensus.near.hint": "各魂草稿工具调用相同、正文相似度全部超过阈值时跳过表决直接放行（省一轮表决调用）。数字 = 相似度阈值（默认 0.7，越高越难命中）；关 = 永远走表决。三魂 effort 开档后三稿分化，命中是少数情况",
			"consensus.replay": "胜者思考回灌",
			"consensus.replay.off": "关闭（默认）",
			"consensus.replay.latest": "胜者思考回灌一轮",
			"consensus.replay.hint": "latest=定稿放行时把胜者的 raw 思考折进历史，只活一轮（下下轮剥掉，原消息不改）；会打破前缀缓存，token 开销增大。off=恒不回灌（现行为，默认）",
			"stageEffort.off": "off · 不思考",
			"stageEffort.inherit": "inherit · 沿用主请求",
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
			"retire.on": "开",
			"cache.title": "缓存与压缩",
			"cache.hint": "上下文压缩的频率：压得勤，上下文更短；压得慢，缓存命中更高。即改即存。",
			"cache.freq": "压缩频率",
			"cache.custom": "自定义",
			"cache.cooldown": "冷却步数",
			"cache.minRegion": "单刀最小材料(token)",
			"cache.stateEvery": "状态牌刷新间隔(事件数)",
			"cache.readout": "盲写缓存命中 {hit} · {knife}",
			"cache.readout.knife": "平均每 {n} 轮一刀",
			"cache.readout.noknife": "尚未动刀",
			"cache.readout.nodata": "—"
		};
		const en = {
			"nav": "TriSoul",
			"title": "TriSoul configuration",
			"intro": "Soul count and the hub AIs (surgeon / memory hub / canvas) model routes. Changes save to settings.yaml and apply from the next turn — no restart.",
			"mode.label": "Mode",
			"mode.unified": "Unified",
			"mode.unified.desc": "Souls follow the model picked in the composer (takes effect immediately); the unified model below routes the hub AIs (surgeon / memory)",
			"mode.fine": "Fine-grained",
			"mode.fine.desc": "Each hub AI picks its own provider / model (blank inherits unified); soul routes can be hand-set under fine.soul-A/B/C in settings.yaml",
			"unified.title": "Unified model (hub AI route · fallback when the composer has none)",
			"field.provider": "Provider",
			"field.model": "Model",
			"field.temperature": "Temperature",
			"field.inherit": "(inherit unified)",
			"pick.placeholder": "Select…",
			"pick.custom": "Custom…",
			"pick.custom.prompt": "Enter {field}",
			"souls.title": "Souls",
			"souls.default.label": "Soul {name}",
			"souls.count.hint": "Three fixed souls A / B / C (temperature 0.3 / 0.6 / 0.9; routes follow the unified / fine-grained sections above). 1 = the erudite officer answers alone, no vote; 2 = align + empiric vote on each other; 3 = align / erudite / empiric all vote. Officer personas are fixed at the max level. Saves immediately, applies from the next turn.",
			"souls.count.current": "Now: {list}",
			"souls.count.n": "{n}",
			"souls.count.label": "Soul count",
			"hub.title": "Hub AIs",
			"hub.hint": "Surgeon (context region surgery), memory hub (digest / recall) and canvas small jobs (state zone / probes). Inherit the unified model in unified mode.",
			"hub.hint.unified": "Unified mode is active: provider / model below are ignored.",
			"resolved.title": "Effective routes",
			"reset": "Reset to defaults",
			"reset.confirm": "Clear TriSoul user settings and restore composition defaults?",
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
			"consensus.voteTail": "Vote tail window",
			"consensus.voteTail.none": "no history",
			"consensus.voteTail.all": "all",
			"consensus.voteTail.hint": "Trailing conversation messages judges see when voting. Default all — judges see exactly what the drafters saw (and the vote rides the prefix cache the drafts just warmed); smaller saves input but judges lose the user's own words and can only compare style; no history = candidates and instructions only",
			"consensus.schemaPrompt": "Schema text in prompt",
			"consensus.schemaPrompt.none": "no provider directory yet",
			"consensus.schemaPrompt.hint": "For the highlighted providers the full draft schema (field meanings and tool manual) is also written into the system prompt alongside the json_schema lock. Providers like Bailian enforce json_schema shape only and never show the schema to the model; without this the model fills blindly and guesses tool argument names",
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
			"consensus.inner.hint": "While drafting, an officer soul may privately call its dedicated tool to gather evidence before answering (align: task_map / erudite: web passthrough / empiric: verify_link): the plugin executes it and feeds the full result back to that soul only — other souls never see it and nothing enters the body. A number = per-soul per-step cap on evidence rounds (hitting the cap submits the draft); off = no inner evidence for any soul; unlimited = the model decides when to stop",
			"consensus.near": "Near-identical skip",
			"consensus.near.off": "Off",
			"consensus.near.hint": "When every draft makes the same tool calls and all pairwise text similarities exceed the threshold, the vote is skipped and the draft released directly (saves a vote round). Number = similarity threshold (default 0.7; higher = rarer); off = always vote. With soul effort lanes on, drafts diverge and hits become rare",
			"consensus.replay": "Winner thinking replay",
			"consensus.replay.off": "Off (default)",
			"consensus.replay.latest": "Replay winner thinking for one round",
			"consensus.replay.hint": "latest = fold the winner's raw thinking into history on release, alive for one round only (stripped the round after; original messages untouched); breaks prefix caching and increases token cost. off = never replay (status quo, default)",
			"stageEffort.off": "off · no thinking",
			"stageEffort.inherit": "inherit · main request",
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
			"retire.on": "On",
			"cache.title": "Cache & compaction",
			"cache.hint": "How often the context gets compacted: more often keeps it shorter, less often keeps cache hits higher. Saves immediately.",
			"cache.freq": "Compaction frequency",
			"cache.custom": "Custom",
			"cache.cooldown": "Cooldown steps",
			"cache.minRegion": "Min material per cut (tokens)",
			"cache.stateEvery": "State-card refresh interval (events)",
			"cache.readout": "Draft cache hit {hit} · {knife}",
			"cache.readout.knife": "one cut every {n} turns on average",
			"cache.readout.noknife": "no surgery yet",
			"cache.readout.nodata": "—"
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