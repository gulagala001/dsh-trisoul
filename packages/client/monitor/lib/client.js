window.__ModuleLoader__.load({
	id: "@trisoul/dsh-client-monitor",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		let _deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		let react_jsx_runtime = require("react/jsx-runtime");
		//#region \0dsh-css:/Users/mac/Projects/trisoul/packages/client/monitor/src/client/MonitorPanel.module.css.mjs
		const css$1 = ".FwBVWG_panel{background:var(--dsw-alias-bg-base);height:100%;min-height:0;color:var(--dsw-alias-label-primary);font:var(--dsw-font-xs-13);font-family:var(--dsw-font-family);--trisoul-accent:var(--dsw-alias-label-secondary);flex-direction:column;display:flex}.FwBVWG_header{border-bottom:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);flex-direction:column;gap:6px;padding:12px 16px 10px;display:flex}.FwBVWG_headingRow{align-items:center;gap:8px;display:flex}.FwBVWG_headingText{flex-direction:column;gap:2px;min-width:0;display:flex}.FwBVWG_title{font:var(--dsw-font-s-14);color:var(--dsw-alias-label-primary);margin:0;font-weight:600}.FwBVWG_subtitle{font:var(--dsw-font-xxs-12);color:var(--dsw-alias-label-tertiary)}.FwBVWG_spacer{flex:1}.FwBVWG_meta{font:var(--dsw-font-xxs-12);color:var(--dsw-alias-label-tertiary);gap:12px;display:flex}.FwBVWG_metaError{color:var(--dsw-alias-state-error-primary)}.FwBVWG_body{flex-direction:column;flex:1;gap:14px;min-height:0;padding:12px 16px 20px;display:flex;overflow-y:auto}.FwBVWG_placeholder{text-align:center;color:var(--dsw-alias-label-tertiary);padding:20px 12px}.FwBVWG_stateLabel{font:var(--dsw-font-xxs-12);color:var(--dsw-alias-label-tertiary);white-space:nowrap}.FwBVWG_idleDot{background:var(--dsw-alias-border-l3);border-radius:50%;flex:none;width:10px;height:10px}.FwBVWG_statRow{font:var(--dsw-font-xxs-12);justify-content:space-between;gap:8px;display:flex}.FwBVWG_statRow dt{color:var(--dsw-alias-label-tertiary)}.FwBVWG_statRow dd{color:var(--dsw-alias-label-primary);font-variant-numeric:tabular-nums;margin:0}.FwBVWG_inflight{color:var(--dsw-alias-state-business-primary)}.FwBVWG_errorValue{color:var(--dsw-alias-state-error-primary)}.FwBVWG_stages{flex-wrap:wrap;gap:4px;display:flex}.FwBVWG_stageChip{font:var(--dsw-font-xxxs-11);background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary);border:1px solid var(--dsw-alias-border-l1);border-radius:999px;padding:1px 6px}.FwBVWG_lastError{font:var(--dsw-font-xxs-12);color:var(--dsw-alias-state-error-primary);white-space:nowrap;text-overflow:ellipsis;overflow:hidden}.FwBVWG_recentTitle{font:var(--dsw-font-xs-13);color:var(--dsw-alias-label-primary);margin:0;font-weight:600}.FwBVWG_table{border-collapse:collapse;width:100%;font:var(--dsw-font-xxs-12)}.FwBVWG_table td{border-bottom:1px solid var(--dsw-alias-border-l1);vertical-align:top;color:var(--dsw-alias-label-secondary);padding:4px 8px 4px 0}.FwBVWG_tdTime{white-space:nowrap;color:var(--dsw-alias-label-tertiary);width:1%}.FwBVWG_tdWho{white-space:nowrap;color:var(--dsw-alias-label-primary);width:1%}.FwBVWG_tdStage{white-space:nowrap;width:1%}.FwBVWG_tdTokens,.FwBVWG_tdDur{white-space:nowrap;font-variant-numeric:tabular-nums;width:1%}.FwBVWG_tdErr{color:var(--dsw-alias-state-error-primary);text-overflow:ellipsis;max-width:0;overflow:hidden}.FwBVWG_rowError td{background:var(--dsw-alias-interactive-bg-hover-danger)}.FwBVWG_metricStats{grid-template-columns:1fr;gap:3px 12px;margin:0;display:grid}.FwBVWG_rounds{flex-direction:column;gap:6px;display:flex}.FwBVWG_roundsHint{font:var(--dsw-font-xxs-12);color:var(--dsw-alias-label-tertiary)}.FwBVWG_roundPrompt{text-overflow:ellipsis;white-space:nowrap;flex:1;min-width:0;overflow:hidden}.FwBVWG_roundMeta{color:var(--dsw-alias-label-tertiary);font-variant-numeric:tabular-nums;flex:none}.FwBVWG_roundBody{border-top:1px solid var(--dsw-alias-border-l1);flex-direction:column;gap:12px;padding:10px 12px 12px;display:flex}.FwBVWG_roundSection{flex-direction:column;gap:6px;display:flex}.FwBVWG_roundSectionTitle{font:var(--dsw-font-xxs-12);color:var(--dsw-alias-label-secondary);font-weight:600}.FwBVWG_pre{background:var(--dsw-alias-bg-layer-2);font:var(--dsw-font-xxs-12);font-family:var(--dsw-font-family);color:var(--dsw-alias-label-primary);white-space:pre-wrap;word-break:break-word;border-radius:6px;max-height:320px;margin:0;padding:8px 10px;overflow-y:auto}.FwBVWG_reasoningPre{color:var(--dsw-alias-label-secondary);border-left:2px solid var(--dsw-alias-border-l3)}.FwBVWG_emptyBlock{font:var(--dsw-font-xxs-12);color:var(--dsw-alias-label-dimmed);padding:2px 0}.FwBVWG_blockLabel{font:var(--dsw-font-xxxs-11);color:var(--dsw-alias-label-tertiary)}.FwBVWG_blockMeta{color:var(--dsw-alias-label-dimmed)}.FwBVWG_draftGrid{grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:10px;display:grid}.FwBVWG_draftCard{border:1px solid var(--dsw-alias-border-l1);border-left:3px solid var(--trisoul-accent);border-radius:6px;flex-direction:column;gap:6px;min-width:0;padding:8px 10px;display:flex}.FwBVWG_draftCard[data-tone=\"0\"]{--trisoul-accent:var(--dsw-alias-state-business-primary)}.FwBVWG_draftCard[data-tone=\"1\"]{--trisoul-accent:var(--dsw-alias-state-success-primary)}.FwBVWG_draftCard[data-tone=\"2\"]{--trisoul-accent:var(--dsw-alias-state-warn-primary)}.FwBVWG_draftCard[data-tone=\"3\"]{--trisoul-accent:var(--dsw-alias-state-error-primary)}.FwBVWG_draftHead{flex-wrap:wrap;align-items:baseline;gap:4px 10px;display:flex}.FwBVWG_draftSoul{font:var(--dsw-font-xxs-12);color:var(--dsw-alias-label-primary);font-weight:600}.FwBVWG_draftMeta{font:var(--dsw-font-xxxs-11);color:var(--dsw-alias-label-tertiary)}.FwBVWG_draftError{font:var(--dsw-font-xxs-12);color:var(--dsw-alias-state-error-primary)}.FwBVWG_voteBlock{flex-direction:column;gap:6px;display:flex}.FwBVWG_voteRow{border-left:3px solid var(--trisoul-accent);border-radius:3px;flex-wrap:wrap;align-items:baseline;gap:4px 10px;padding:4px 8px;display:flex}.FwBVWG_voteRow[data-tone=\"0\"]{--trisoul-accent:var(--dsw-alias-state-business-primary)}.FwBVWG_voteRow[data-tone=\"1\"]{--trisoul-accent:var(--dsw-alias-state-success-primary)}.FwBVWG_voteRow[data-tone=\"2\"]{--trisoul-accent:var(--dsw-alias-state-warn-primary)}.FwBVWG_voteRow[data-tone=\"3\"]{--trisoul-accent:var(--dsw-alias-state-error-primary)}.FwBVWG_voteSoul{font:var(--dsw-font-xxs-12);color:var(--dsw-alias-label-primary);font-weight:600}.FwBVWG_voteOk{font:var(--dsw-font-xxs-12);color:var(--dsw-alias-state-success-primary)}.FwBVWG_voteVeto{font:var(--dsw-font-xxs-12);color:var(--dsw-alias-state-error-primary)}.FwBVWG_voteReason{font:var(--dsw-font-xxs-12);color:var(--dsw-alias-label-secondary)}.FwBVWG_voteReasoning{flex-basis:100%}.FwBVWG_scopeSwitch{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);border-radius:6px;display:inline-flex;overflow:hidden}.FwBVWG_scopeBtn{appearance:none;font:var(--dsw-font-xxs-12);color:var(--dsw-alias-label-secondary);cursor:pointer;background:0 0;border:0;padding:3px 10px}.FwBVWG_scopeBtn+.FwBVWG_scopeBtn{border-left:1px solid var(--dsw-alias-border-l2)}.FwBVWG_scopeBtn:hover{background:var(--dsw-alias-interactive-bg-hover)}.FwBVWG_scopeBtn[data-active]{background:var(--dsw-alias-brand-primary);color:var(--dsw-alias-label-on-brand,#fff)}.FwBVWG_summaryStrip{font:var(--dsw-font-xxs-12);color:var(--dsw-alias-label-secondary);flex-wrap:wrap;align-items:center;gap:6px 10px;display:flex}.FwBVWG_sumItem{white-space:nowrap;font-variant-numeric:tabular-nums}.FwBVWG_sumItem b{color:var(--dsw-alias-label-primary);font-weight:600}.FwBVWG_sumSep{background:var(--dsw-alias-border-l2);width:1px;height:12px}.FwBVWG_foldTotals{font:var(--dsw-font-xxs-12);color:var(--dsw-alias-label-secondary);white-space:nowrap;font-variant-numeric:tabular-nums;font-weight:500}.FwBVWG_sectionHead{align-items:baseline;gap:10px;display:flex}.FwBVWG_trajectory{flex-direction:column;gap:6px;display:flex}.FwBVWG_tlWrap{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);border-radius:6px;flex-direction:column;gap:6px;padding:6px 6px 4px;display:flex}.FwBVWG_tlScroll{overflow:auto hidden}.FwBVWG_tlSvg{font-family:var(--dsw-font-family);display:block}.FwBVWG_tlGroupBg{fill:var(--dsw-alias-bg-layer-2,var(--dsw-alias-interactive-bg-hover))}.FwBVWG_tlGroupAlt{fill:var(--dsw-alias-interactive-bg-hover)}.FwBVWG_tlGroupText,.FwBVWG_tlLaneLabel{fill:var(--dsw-alias-label-secondary);font-size:11px}.FwBVWG_tlGrid{stroke:var(--dsw-alias-border-l1);stroke-width:1px}.FwBVWG_tlCol{cursor:pointer}.FwBVWG_tlColBg{fill:#0000}.FwBVWG_tlCol:hover .FwBVWG_tlColBg,.FwBVWG_tlCol[data-selected] .FwBVWG_tlColBg{fill:var(--dsw-alias-interactive-bg-hover)}.FwBVWG_tlSelected{fill:none;stroke:var(--dsw-alias-brand-primary);stroke-width:1.5px;rx:3;pointer-events:none}.FwBVWG_tlStepNo{fill:var(--dsw-alias-label-tertiary);font-variant-numeric:tabular-nums;font-size:10px}.FwBVWG_tlDur{fill:var(--dsw-alias-label-tertiary);font-variant-numeric:tabular-nums;font-size:9.5px}.FwBVWG_tlGlyph{font-size:12px;font-weight:700}.FwBVWG_tlBar,.FwBVWG_tlDot{stroke:none}.FwBVWG_tlDraft{fill:var(--dsw-alias-state-business-primary)}.FwBVWG_tlVote{fill:var(--dsw-alias-state-success-primary)}.FwBVWG_tlSolo{fill:var(--dsw-alias-state-warn-primary)}.FwBVWG_tlSurgery{fill:var(--dsw-alias-brand-primary)}.FwBVWG_tlCanvas{fill:var(--dsw-alias-label-secondary)}.FwBVWG_tlMemory{fill:var(--dsw-alias-label-primary-bluish);opacity:.8}.FwBVWG_tlOther{fill:var(--dsw-alias-label-tertiary)}.FwBVWG_tlError{fill:var(--dsw-alias-state-error-primary)}.FwBVWG_tlIdentical{fill:var(--dsw-alias-label-secondary)}.FwBVWG_tlRunning{fill:var(--dsw-alias-state-business-primary);animation:1.2s ease-in-out infinite FwBVWG_tlPulse}@keyframes FwBVWG_tlPulse{0%,to{opacity:1}50%{opacity:.35}}.FwBVWG_tlLegend{font:var(--dsw-font-xxs-12);color:var(--dsw-alias-label-tertiary);flex-wrap:wrap;gap:4px 12px;padding:0 4px;display:flex}.FwBVWG_tlLegendItem{align-items:center;gap:4px;display:inline-flex}.FwBVWG_tlSwatch{background:currentColor;border-radius:2px;width:10px;height:8px;display:inline-block}.FwBVWG_tlSwatch.FwBVWG_tlDraft{background:var(--dsw-alias-state-business-primary)}.FwBVWG_tlSwatch.FwBVWG_tlVote{background:var(--dsw-alias-state-success-primary)}.FwBVWG_tlSwatch.FwBVWG_tlSurgery{background:var(--dsw-alias-brand-primary)}.FwBVWG_tlSwatch.FwBVWG_tlCanvas{background:var(--dsw-alias-label-secondary)}.FwBVWG_tlSwatch.FwBVWG_tlMemory{background:var(--dsw-alias-label-primary-bluish);opacity:.8}.FwBVWG_tlSwatch.FwBVWG_tlError{background:var(--dsw-alias-state-error-primary)}.FwBVWG_stepDetail{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);border-radius:6px;overflow:hidden}.FwBVWG_stepDetailHead{font:var(--dsw-font-xxs-12);align-items:center;gap:8px;padding:8px 12px;display:flex}.FwBVWG_stepDetailTitle{color:var(--dsw-alias-label-primary);white-space:nowrap;font-weight:600}.FwBVWG_stepTable td{cursor:pointer}.FwBVWG_stepTable tr:hover td{background:var(--dsw-alias-interactive-bg-hover)}.FwBVWG_stepRowSel td{background:var(--dsw-alias-interactive-bg-hover);box-shadow:inset 2px 0 0 var(--dsw-alias-brand-primary)}.FwBVWG_tdVotes{color:var(--dsw-alias-label-primary);font-variant-numeric:tabular-nums}.FwBVWG_tdCounts{color:var(--dsw-alias-label-tertiary)}.FwBVWG_tlGlyphInline{font-weight:700}.FwBVWG_tlGlyphInline.FwBVWG_tlDraft,.FwBVWG_tlGlyphInline.FwBVWG_tlVote,.FwBVWG_tlGlyphInline.FwBVWG_tlSolo,.FwBVWG_tlGlyphInline.FwBVWG_tlError,.FwBVWG_tlGlyphInline.FwBVWG_tlIdentical,.FwBVWG_tlGlyphInline.FwBVWG_tlRunning,.FwBVWG_tlGlyphInline.FwBVWG_tlOther{fill:none}.FwBVWG_tlGlyphInline.FwBVWG_tlVote{color:var(--dsw-alias-state-success-primary)}.FwBVWG_tlGlyphInline.FwBVWG_tlSolo{color:var(--dsw-alias-state-warn-primary)}.FwBVWG_tlGlyphInline.FwBVWG_tlError{color:var(--dsw-alias-state-error-primary)}.FwBVWG_tlGlyphInline.FwBVWG_tlIdentical{color:var(--dsw-alias-label-secondary)}.FwBVWG_tlGlyphInline.FwBVWG_tlRunning{color:var(--dsw-alias-state-business-primary)}.FwBVWG_tlGlyphInline.FwBVWG_tlOther{color:var(--dsw-alias-label-tertiary)}.FwBVWG_tlPick{fill:var(--dsw-alias-label-secondary);font-size:9.5px;font-weight:600}.FwBVWG_tlWinner{font-size:10px;font-weight:600}.FwBVWG_trendTitle{color:var(--dsw-alias-label-primary);font-weight:600}.FwBVWG_trendChip{white-space:nowrap;align-items:center;gap:4px;display:inline-flex}.FwBVWG_trendChip b{color:var(--dsw-alias-label-primary)}.FwBVWG_trendPct{color:var(--dsw-alias-label-tertiary)}.FwBVWG_trendSwatch{background:var(--dsw-alias-label-tertiary);border-radius:2px;width:8px;height:8px;display:inline-block}.FwBVWG_trendChip[data-tone=\"0\"] .FwBVWG_trendSwatch,.FwBVWG_trendBar[data-tone=\"0\"]{background:var(--dsw-alias-state-business-primary);fill:var(--dsw-alias-state-business-primary)}.FwBVWG_trendChip[data-tone=\"1\"] .FwBVWG_trendSwatch,.FwBVWG_trendBar[data-tone=\"1\"]{background:var(--dsw-alias-state-success-primary);fill:var(--dsw-alias-state-success-primary)}.FwBVWG_trendChip[data-tone=\"2\"] .FwBVWG_trendSwatch,.FwBVWG_trendBar[data-tone=\"2\"]{background:var(--dsw-alias-state-warn-primary);fill:var(--dsw-alias-state-warn-primary)}.FwBVWG_trendChip[data-tone=\"3\"] .FwBVWG_trendSwatch,.FwBVWG_trendBar[data-tone=\"3\"]{background:var(--dsw-alias-state-error-primary);fill:var(--dsw-alias-state-error-primary)}.FwBVWG_trendScroll{flex:1;min-width:0;overflow-x:auto}.FwBVWG_trendSvg{display:block}.FwBVWG_trendBar{fill:var(--dsw-alias-label-tertiary);cursor:pointer}.FwBVWG_trendBar:hover{opacity:.75}.FwBVWG_trendBar[data-selected]{stroke:var(--dsw-alias-brand-primary);stroke-width:1.5px}.FwBVWG_compTable th{text-align:left;font:var(--dsw-font-xxs-12);color:var(--dsw-alias-label-tertiary);border-bottom:1px solid var(--dsw-alias-border-l2);white-space:nowrap;padding:4px 8px 6px 0;font-weight:500}.FwBVWG_compTable th.FwBVWG_thNum,.FwBVWG_compTable td.FwBVWG_tdNum{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}.FwBVWG_compTable td{vertical-align:middle}.FwBVWG_compTable .FwBVWG_tdWho{align-items:center;gap:6px;display:flex}.FwBVWG_compName{color:var(--dsw-alias-label-primary);font-weight:600}.FwBVWG_tdRoute{color:var(--dsw-alias-label-tertiary);white-space:nowrap;text-overflow:ellipsis;max-width:260px;overflow:hidden}.FwBVWG_compMain td{background:var(--dsw-alias-bg-layer-2,var(--dsw-alias-interactive-bg-hover))}.FwBVWG_compTotals td{background:var(--dsw-alias-bg-layer-2,var(--dsw-alias-interactive-bg-hover));border-bottom:1px solid var(--dsw-alias-border-l2)}.FwBVWG_compTotals .FwBVWG_compName{font-weight:600}.FwBVWG_compTable .FwBVWG_lastError{margin-top:2px}.FwBVWG_metricStats{grid-template-columns:repeat(auto-fill,minmax(132px,1fr));gap:6px;display:grid}.FwBVWG_metricStats .FwBVWG_statRow{background:var(--dsw-alias-bg-layer-2,var(--dsw-alias-interactive-bg-hover));border-radius:6px;flex-direction:column-reverse;justify-content:flex-end;align-items:flex-start;gap:1px;min-height:44px;padding:7px 9px}.FwBVWG_metricStats .FwBVWG_statRow dt{color:var(--dsw-alias-label-tertiary);font-size:11px;line-height:1.3}.FwBVWG_metricStats .FwBVWG_statRow dd{font:var(--dsw-font-s-14);color:var(--dsw-alias-label-primary);word-break:break-word;font-weight:600;line-height:1.3}.FwBVWG_metricStats .FwBVWG_statRow[data-wide]{grid-column:1/-1}.FwBVWG_metricStats .FwBVWG_statRow[data-wide] dd{font:var(--dsw-font-xxs-12);font-weight:500}.FwBVWG_metrics .FwBVWG_blockLabel{margin-top:4px}.FwBVWG_barChip{font:var(--dsw-font-xxs-12);color:var(--dsw-alias-label-primary);background:linear-gradient(90deg, color-mix(in srgb, var(--trisoul-accent) 22%, transparent) var(--pct,0%), var(--dsw-alias-bg-layer-2,var(--dsw-alias-interactive-bg-hover)) 0);border:1px solid var(--dsw-alias-border-l1);border-radius:4px;align-items:center;padding:2px 8px;display:inline-flex;position:relative}.FwBVWG_roundBody{background:var(--dsw-alias-bg-base);gap:14px;padding:12px 14px 14px}.FwBVWG_roundSection{gap:8px}.FwBVWG_roundSectionTitle{font:var(--dsw-font-xxs-12);color:var(--dsw-alias-label-secondary);align-items:center;gap:8px;font-weight:600;display:flex}.FwBVWG_roundSectionTitle:after{content:\"\";background:var(--dsw-alias-border-l1);flex:1;height:1px}.FwBVWG_pre{background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l1);max-height:260px;font:var(--dsw-font-xxs-12);font-family:var(--dsw-font-family-mono,ui-monospace, SFMono-Regular, Menlo, monospace);white-space:pre-wrap;word-break:break-word;color:var(--dsw-alias-label-primary);border-radius:6px;margin:0;padding:8px 10px;line-height:1.5;overflow:auto}.FwBVWG_reasoningPre{color:var(--dsw-alias-label-secondary);border-left:2px solid var(--trisoul-accent,var(--dsw-alias-border-l3));max-height:200px}.FwBVWG_draftGrid{grid-template-columns:repeat(auto-fit,minmax(300px,1fr));align-items:start;gap:10px}.FwBVWG_draftCard{border:1px solid var(--dsw-alias-border-l2);border-top:3px solid var(--trisoul-accent);background:var(--dsw-alias-bg-layer-1);border-radius:8px;flex-direction:column;gap:8px;padding:10px 12px;display:flex}.FwBVWG_draftHead{align-items:center;gap:8px;display:flex}.FwBVWG_draftSoul{font:var(--dsw-font-xxs-12);color:var(--trisoul-accent);background:color-mix(in srgb, var(--trisoul-accent) 12%, transparent);border-radius:999px;align-items:center;padding:1px 8px;font-weight:600;display:inline-flex}.FwBVWG_draftMeta{text-align:right;min-width:0;font:var(--dsw-font-xxxs-11);color:var(--dsw-alias-label-tertiary);white-space:nowrap;text-overflow:ellipsis;flex:1;overflow:hidden}.FwBVWG_blockLabel{font:var(--dsw-font-xxs-12);color:var(--dsw-alias-label-secondary);align-items:center;gap:4px;font-weight:600;display:flex}.FwBVWG_reasonFold{border-radius:6px}.FwBVWG_reasonHead{cursor:pointer;font:var(--dsw-font-xxs-12);color:var(--dsw-alias-label-secondary);align-items:center;gap:4px;padding:2px 0;font-weight:600;list-style:none;display:flex}.FwBVWG_reasonHead::-webkit-details-marker{display:none}.FwBVWG_reasonHead:before{content:\"▸\";color:var(--dsw-alias-label-tertiary);font-weight:400}.FwBVWG_reasonFold[open]>.FwBVWG_reasonHead:before{content:\"▾\"}.FwBVWG_reasonFold[open]>.FwBVWG_reasonHead{margin-bottom:4px}.FwBVWG_voteBlock{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);border-radius:8px;padding:8px 12px 10px}.FwBVWG_voteRow{border-left:3px solid var(--trisoul-accent);border-bottom:1px solid var(--dsw-alias-border-l1);flex-wrap:wrap;align-items:baseline;gap:4px 10px;padding:6px 0 6px 10px;display:flex}.FwBVWG_voteRow:last-child{border-bottom:0}.FwBVWG_voteSoul{min-width:96px}.FwBVWG_voteOk,.FwBVWG_voteVeto{font-weight:600}.FwBVWG_voteReason{color:var(--dsw-alias-label-secondary)}.FwBVWG_stepDetail{background:var(--dsw-alias-bg-base)}.FwBVWG_stepDetailHead{background:var(--dsw-alias-bg-layer-1);border-bottom:1px solid var(--dsw-alias-border-l1)}.FwBVWG_ctxSeries{--trisoul-accent:var(--dsw-alias-label-tertiary)}.FwBVWG_ctxSeries[data-tone=\"0\"]{--trisoul-accent:var(--dsw-alias-state-business-primary)}.FwBVWG_ctxSeries[data-tone=\"1\"]{--trisoul-accent:var(--dsw-alias-state-success-primary)}.FwBVWG_ctxSeries[data-tone=\"2\"]{--trisoul-accent:var(--dsw-alias-state-warn-primary)}.FwBVWG_ctxSeries[data-tone=\"3\"]{--trisoul-accent:var(--dsw-alias-state-error-primary)}.FwBVWG_ctxSeries[data-kind=main]{--trisoul-accent:var(--dsw-alias-label-primary)}.FwBVWG_ctxSeries[data-kind=canvas]{--trisoul-accent:var(--dsw-alias-label-secondary)}.FwBVWG_ctxSeries[data-kind=memory]{--trisoul-accent:var(--dsw-alias-label-primary-bluish)}.FwBVWG_ctxSeries[data-kind=surgeon]{--trisoul-accent:var(--dsw-alias-brand-primary)}.FwBVWG_ctxSeries .FwBVWG_trendSwatch{background:var(--trisoul-accent)}.FwBVWG_ctxLine{fill:none;stroke:var(--trisoul-accent);stroke-width:1.5px;stroke-linejoin:round;stroke-linecap:round}.FwBVWG_ctxDot{fill:var(--trisoul-accent)}.FwBVWG_ctxDot:hover{r:3.5}.FwBVWG_ctxGrid{stroke:var(--dsw-alias-border-l2);stroke-dasharray:2 3}.FwBVWG_ctxAxis{fill:var(--dsw-alias-label-tertiary);font-variant-numeric:tabular-nums;font-size:10px}.FwBVWG_recentWrap{flex-direction:column;gap:8px;display:flex}.FwBVWG_recentBar{flex-wrap:wrap;align-items:center;gap:6px;display:flex}.FwBVWG_recentTable th{text-align:left;font:var(--dsw-font-xxxs-11);color:var(--dsw-alias-label-tertiary);border-bottom:1px solid var(--dsw-alias-border-l2);white-space:nowrap;padding:2px 8px 6px 0;font-weight:600}.FwBVWG_recentTable th.FwBVWG_thNum,.FwBVWG_recentTable td.FwBVWG_tdNum{text-align:right}.FwBVWG_tdNote{color:var(--dsw-alias-label-tertiary);text-overflow:ellipsis;white-space:nowrap;max-width:0;overflow:hidden}.FwBVWG_dim{color:var(--dsw-alias-label-tertiary)}.FwBVWG_trendPanel{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);border-radius:6px;flex-direction:column;gap:6px;padding:8px 10px 6px;display:flex}.FwBVWG_trendHead{align-items:baseline;gap:10px;min-width:0;display:flex}.FwBVWG_trendLegendRow{font:var(--dsw-font-xxs-12);color:var(--dsw-alias-label-secondary);flex-wrap:wrap;align-items:center;gap:4px 12px;display:flex}.FwBVWG_trendLegendLabel{font:var(--dsw-font-xxxs-11);color:var(--dsw-alias-label-tertiary);min-width:40px}.FwBVWG_trendSwatchLine{border-radius:2px;height:3px}.FwBVWG_trendColBg{fill:#0000;cursor:pointer}.FwBVWG_trendColBg:hover,.FwBVWG_trendColSel{fill:var(--dsw-alias-interactive-bg-hover)}.FwBVWG_trendPanel .FwBVWG_trendScroll{overflow-x:auto}.FwBVWG_mGroups{flex-direction:column;gap:8px;display:flex}.FwBVWG_mGroup{--trisoul-accent:var(--dsw-alias-label-secondary);border:1px solid var(--dsw-alias-border-l1);border-left:3px solid var(--trisoul-accent);background:var(--dsw-alias-bg-layer-1);border-radius:6px;flex-direction:column;gap:6px;padding:8px 10px 9px;display:flex}.FwBVWG_mGroup[data-metric=consensus]{--trisoul-accent:var(--dsw-alias-state-business-primary)}.FwBVWG_mGroup[data-metric=compaction]{--trisoul-accent:var(--dsw-alias-brand-primary)}.FwBVWG_mGroup[data-metric=memory]{--trisoul-accent:var(--dsw-alias-label-primary-bluish)}.FwBVWG_mGroup[data-metric=reasoning]{--trisoul-accent:var(--dsw-alias-state-warn-primary)}.FwBVWG_mGroupHead{font:var(--dsw-font-xxs-12);color:var(--trisoul-accent);font-weight:600}.FwBVWG_mGroup .FwBVWG_metricStats{grid-template-columns:repeat(auto-fill,minmax(118px,1fr));gap:5px}.FwBVWG_mGroup .FwBVWG_metricStats .FwBVWG_statRow{min-height:40px;padding:5px 8px}.FwBVWG_mGroup .FwBVWG_metricStats .FwBVWG_statRow[data-wide]{grid-column:span 3}.FwBVWG_chipRow{flex-wrap:wrap;align-items:center;gap:4px 8px;display:flex}.FwBVWG_chipRow .FwBVWG_blockLabel{font:var(--dsw-font-xxxs-11);color:var(--dsw-alias-label-tertiary);margin:0;font-weight:500}.FwBVWG_trendBar.FwBVWG_tlRunning{fill:var(--dsw-alias-state-business-primary)}.FwBVWG_mGroup .FwBVWG_metricStats{grid-template-columns:repeat(auto-fill,minmax(140px,1fr))}.FwBVWG_ctxStrip{background:var(--dsw-alias-interactive-bg-hover);border-radius:4px;gap:1px;height:20px;display:flex;position:relative;overflow:hidden}.FwBVWG_ctxSeg{flex:1 1 0;min-width:3px}.FwBVWG_ctxSeg[data-kind=system],.FwBVWG_ctxChip[data-kind=system]{background:var(--dsw-alias-label-tertiary)}.FwBVWG_ctxSeg[data-kind=checkpoint],.FwBVWG_ctxChip[data-kind=checkpoint]{background:var(--dsw-alias-brand-primary)}.FwBVWG_ctxSeg[data-kind=user],.FwBVWG_ctxChip[data-kind=user]{background:var(--dsw-alias-state-business-primary)}.FwBVWG_ctxSeg[data-kind=assistant],.FwBVWG_ctxChip[data-kind=assistant]{background:var(--dsw-alias-state-success-primary)}.FwBVWG_ctxSeg[data-kind=tool],.FwBVWG_ctxChip[data-kind=tool]{background:var(--dsw-alias-state-warn-primary)}.FwBVWG_ctxSeg[data-kind=plugin],.FwBVWG_ctxChip[data-kind=plugin]{background:var(--dsw-alias-state-error-primary)}.FwBVWG_ctxSeg[data-kind=other],.FwBVWG_ctxChip[data-kind=other]{background:var(--dsw-alias-label-secondary)}.FwBVWG_ctxCacheMark{border-left:2px dashed var(--dsw-alias-label-primary);opacity:.9;pointer-events:auto;width:0;position:absolute;top:-2px;bottom:-2px}.FwBVWG_ctxLegend{font:var(--dsw-font-xxs-12);color:var(--dsw-alias-label-secondary);flex-wrap:wrap;gap:4px 12px;display:flex}.FwBVWG_ctxLegendItem{font-variant-numeric:tabular-nums;align-items:center;gap:4px;display:inline-flex}.FwBVWG_ctxChip{border-radius:2px;width:8px;height:8px;display:inline-block}.FwBVWG_ctxChipLine{border-left:2px dashed var(--dsw-alias-label-primary);width:0;height:10px;display:inline-block}.FwBVWG_tabs{align-items:center;gap:2px;margin-bottom:-10px;display:flex}.FwBVWG_tabBtn{appearance:none;cursor:pointer;font:var(--dsw-font-xs-13);font-family:var(--dsw-font-family);color:var(--dsw-alias-label-secondary);background:0 0;border:0;border-bottom:2px solid #0000;border-radius:6px 6px 0 0;padding:6px 12px}.FwBVWG_tabBtn:hover{background:var(--dsw-alias-interactive-bg-hover)}.FwBVWG_tabBtn[data-active]{color:var(--dsw-alias-label-primary);border-bottom-color:var(--dsw-alias-brand-primary);font-weight:600}.FwBVWG_liveStrip{border:1px solid var(--dsw-alias-border-l2);border-left:3px solid var(--dsw-alias-state-business-primary);background:var(--dsw-alias-bg-base);border-radius:6px;flex-direction:column;gap:4px;padding:7px 10px;display:flex}.FwBVWG_liveRow{font:var(--dsw-font-xxs-12);color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums;flex-wrap:wrap;align-items:center;gap:4px 10px;display:flex}.FwBVWG_liveTitle{color:var(--dsw-alias-label-primary);white-space:nowrap;font-weight:600}.FwBVWG_liveChip{white-space:nowrap;background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-border-l1);border-radius:999px;align-items:center;gap:5px;padding:1px 8px;display:inline-flex}.FwBVWG_liveDot{background:var(--dsw-alias-label-tertiary);border-radius:50%;flex:none;width:8px;height:8px}.FwBVWG_liveDot[data-tone=\"0\"]{background:var(--dsw-alias-state-business-primary)}.FwBVWG_liveDot[data-tone=\"1\"]{background:var(--dsw-alias-state-success-primary)}.FwBVWG_liveDot[data-tone=\"2\"]{background:var(--dsw-alias-state-warn-primary)}.FwBVWG_liveDot[data-tone=\"3\"]{background:var(--dsw-alias-state-error-primary)}.FwBVWG_liveDot[data-running]{animation:1.2s ease-in-out infinite FwBVWG_tlPulse}.FwBVWG_liveThink{cursor:pointer;min-width:0;font:var(--dsw-font-xxs-12);color:var(--dsw-alias-label-secondary);align-items:baseline;gap:8px;display:flex}.FwBVWG_liveThinkLabel{color:var(--dsw-alias-label-tertiary);white-space:nowrap;flex:none;font-weight:600}.FwBVWG_liveThinkText{text-overflow:ellipsis;white-space:nowrap;flex:1;min-width:0;overflow:hidden}.FwBVWG_liveThink:hover .FwBVWG_liveThinkText{color:var(--dsw-alias-label-primary)}.FwBVWG_liveCols{gap:8px;min-width:0;display:flex}.FwBVWG_liveCol{border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);border-radius:6px;flex-direction:column;flex:1;gap:4px;min-width:0;padding:6px 8px;display:flex}.FwBVWG_liveColHead{min-width:0;font:var(--dsw-font-xxs-12);color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums;align-items:center;gap:6px;display:flex}.FwBVWG_liveColName{color:var(--dsw-alias-label-primary);white-space:nowrap;font-weight:600}.FwBVWG_liveColAttempt{color:var(--dsw-alias-state-warn-primary);white-space:nowrap}.FwBVWG_liveColMeta{color:var(--dsw-alias-label-tertiary);white-space:nowrap}.FwBVWG_liveColThink{max-height:42px;font:var(--dsw-font-xxs-12);color:var(--dsw-alias-label-tertiary);word-break:break-all;white-space:pre-wrap;align-items:flex-end;line-height:1.35;display:flex;overflow:hidden}.FwBVWG_liveColText{max-height:84px;font-family:var(--dsw-family-mono,ui-monospace, monospace);color:var(--dsw-alias-label-secondary);word-break:break-all;white-space:pre-wrap;align-items:flex-end;font-size:11px;line-height:1.4;display:flex;overflow:hidden}.FwBVWG_pager{font:var(--dsw-font-xxs-12);color:var(--dsw-alias-label-tertiary);font-variant-numeric:tabular-nums;justify-content:flex-end;align-items:center;gap:10px;padding-top:4px;display:flex}.FwBVWG_sectionBlock,.FwBVWG_sectionBody{flex-direction:column;gap:10px;display:flex}.FwBVWG_ctxhWrap{flex-direction:column;gap:2px;display:flex;overflow-x:auto}.FwBVWG_ctxhRow{align-items:center;gap:8px;display:flex}.FwBVWG_ctxhMeta{width:118px;font:var(--dsw-font-xxxs-11);color:var(--dsw-alias-label-tertiary);text-align:right;font-variant-numeric:tabular-nums;flex:none}.FwBVWG_ctxhLane{flex:1;min-width:0}.FwBVWG_ctxhBar{background:var(--dsw-alias-interactive-bg-hover);border-radius:3px;gap:1px;min-width:6px;height:14px;display:flex;position:relative;overflow:hidden}.FwBVWG_ctxhHit{background:var(--dsw-alias-state-success-primary);opacity:.95;pointer-events:auto;height:3px;position:absolute;bottom:0;left:0}.FwBVWG_ctxhNewCp{outline:1.5px solid var(--dsw-alias-label-primary);outline-offset:-1.5px}.FwBVWG_ctxhTotal{font:var(--dsw-font-xxxs-11);color:var(--dsw-alias-label-tertiary);font-variant-numeric:tabular-nums;white-space:nowrap;flex:none}.FwBVWG_ctxhEvent{font:var(--dsw-font-xxxs-11);color:var(--dsw-alias-label-tertiary);margin-left:126px}.FwBVWG_ctxhEvent[data-stage=surgery-result],.FwBVWG_ctxhEvent[data-stage=knife]{color:var(--dsw-alias-state-warn-label)}";
		const tagId$1 = "@trisoul/dsh-client-monitor/MonitorPanel.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$1) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@trisoul/dsh-client-monitor";
			tag.dataset.pluginCss = tagId$1;
			tag.textContent = css$1;
			document.head.appendChild(tag);
		}
		var MonitorPanel_module_css_default = {
			"liveCols": "FwBVWG_liveCols",
			"trendPct": "FwBVWG_trendPct",
			"blockLabel": "FwBVWG_blockLabel",
			"tlPulse": "FwBVWG_tlPulse",
			"summaryStrip": "FwBVWG_summaryStrip",
			"recentWrap": "FwBVWG_recentWrap",
			"liveStrip": "FwBVWG_liveStrip",
			"liveDot": "FwBVWG_liveDot",
			"tlMemory": "FwBVWG_tlMemory",
			"ctxSeries": "FwBVWG_ctxSeries",
			"ctxhEvent": "FwBVWG_ctxhEvent",
			"scopeSwitch": "FwBVWG_scopeSwitch",
			"tlVote": "FwBVWG_tlVote",
			"compName": "FwBVWG_compName",
			"ctxLegendItem": "FwBVWG_ctxLegendItem",
			"ctxhLane": "FwBVWG_ctxhLane",
			"draftGrid": "FwBVWG_draftGrid",
			"roundMeta": "FwBVWG_roundMeta",
			"sumSep": "FwBVWG_sumSep",
			"stateLabel": "FwBVWG_stateLabel",
			"ctxDot": "FwBVWG_ctxDot",
			"voteOk": "FwBVWG_voteOk",
			"voteSoul": "FwBVWG_voteSoul",
			"draftHead": "FwBVWG_draftHead",
			"tlGroupAlt": "FwBVWG_tlGroupAlt",
			"statRow": "FwBVWG_statRow",
			"tlColBg": "FwBVWG_tlColBg",
			"stages": "FwBVWG_stages",
			"trendTitle": "FwBVWG_trendTitle",
			"tlCanvas": "FwBVWG_tlCanvas",
			"tlError": "FwBVWG_tlError",
			"idleDot": "FwBVWG_idleDot",
			"thNum": "FwBVWG_thNum",
			"trendSwatch": "FwBVWG_trendSwatch",
			"compTable": "FwBVWG_compTable",
			"table": "FwBVWG_table",
			"panel": "FwBVWG_panel",
			"metrics": "FwBVWG_metrics",
			"ctxLine": "FwBVWG_ctxLine",
			"metricStats": "FwBVWG_metricStats",
			"recentBar": "FwBVWG_recentBar",
			"barChip": "FwBVWG_barChip",
			"tlLegend": "FwBVWG_tlLegend",
			"tlSvg": "FwBVWG_tlSvg",
			"body": "FwBVWG_body",
			"tdDur": "FwBVWG_tdDur",
			"dim": "FwBVWG_dim",
			"mGroupHead": "FwBVWG_mGroupHead",
			"tlDot": "FwBVWG_tlDot",
			"voteReason": "FwBVWG_voteReason",
			"tlSwatch": "FwBVWG_tlSwatch",
			"lastError": "FwBVWG_lastError",
			"trajectory": "FwBVWG_trajectory",
			"tlDraft": "FwBVWG_tlDraft",
			"ctxGrid": "FwBVWG_ctxGrid",
			"roundPrompt": "FwBVWG_roundPrompt",
			"recentTable": "FwBVWG_recentTable",
			"ctxChipLine": "FwBVWG_ctxChipLine",
			"header": "FwBVWG_header",
			"roundSection": "FwBVWG_roundSection",
			"tlWrap": "FwBVWG_tlWrap",
			"errorValue": "FwBVWG_errorValue",
			"tabBtn": "FwBVWG_tabBtn",
			"ctxhBar": "FwBVWG_ctxhBar",
			"trendScroll": "FwBVWG_trendScroll",
			"ctxhMeta": "FwBVWG_ctxhMeta",
			"ctxhHit": "FwBVWG_ctxhHit",
			"roundsHint": "FwBVWG_roundsHint",
			"tlScroll": "FwBVWG_tlScroll",
			"liveColMeta": "FwBVWG_liveColMeta",
			"tdTime": "FwBVWG_tdTime",
			"tlGroupBg": "FwBVWG_tlGroupBg",
			"tlLegendItem": "FwBVWG_tlLegendItem",
			"tlGlyphInline": "FwBVWG_tlGlyphInline",
			"trendBar": "FwBVWG_trendBar",
			"trendColSel": "FwBVWG_trendColSel",
			"trendLegendRow": "FwBVWG_trendLegendRow",
			"rounds": "FwBVWG_rounds",
			"mGroups": "FwBVWG_mGroups",
			"sectionHead": "FwBVWG_sectionHead",
			"trendHead": "FwBVWG_trendHead",
			"liveColThink": "FwBVWG_liveColThink",
			"sectionBody": "FwBVWG_sectionBody",
			"tlOther": "FwBVWG_tlOther",
			"liveThinkLabel": "FwBVWG_liveThinkLabel",
			"stageChip": "FwBVWG_stageChip",
			"roundSectionTitle": "FwBVWG_roundSectionTitle",
			"tlGlyph": "FwBVWG_tlGlyph",
			"foldTotals": "FwBVWG_foldTotals",
			"pre": "FwBVWG_pre",
			"reasonHead": "FwBVWG_reasonHead",
			"tlRunning": "FwBVWG_tlRunning",
			"trendSwatchLine": "FwBVWG_trendSwatchLine",
			"scopeBtn": "FwBVWG_scopeBtn",
			"liveRow": "FwBVWG_liveRow",
			"ctxhTotal": "FwBVWG_ctxhTotal",
			"tlBar": "FwBVWG_tlBar",
			"voteRow": "FwBVWG_voteRow",
			"tlGroupText": "FwBVWG_tlGroupText",
			"liveChip": "FwBVWG_liveChip",
			"reasoningPre": "FwBVWG_reasoningPre",
			"voteBlock": "FwBVWG_voteBlock",
			"ctxCacheMark": "FwBVWG_ctxCacheMark",
			"roundBody": "FwBVWG_roundBody",
			"tlSelected": "FwBVWG_tlSelected",
			"liveColName": "FwBVWG_liveColName",
			"tdNum": "FwBVWG_tdNum",
			"meta": "FwBVWG_meta",
			"tlSurgery": "FwBVWG_tlSurgery",
			"ctxhWrap": "FwBVWG_ctxhWrap",
			"tabs": "FwBVWG_tabs",
			"emptyBlock": "FwBVWG_emptyBlock",
			"liveTitle": "FwBVWG_liveTitle",
			"tdStage": "FwBVWG_tdStage",
			"draftMeta": "FwBVWG_draftMeta",
			"tdVotes": "FwBVWG_tdVotes",
			"tlCol": "FwBVWG_tlCol",
			"ctxLegend": "FwBVWG_ctxLegend",
			"voteVeto": "FwBVWG_voteVeto",
			"headingRow": "FwBVWG_headingRow",
			"tdNote": "FwBVWG_tdNote",
			"tlSolo": "FwBVWG_tlSolo",
			"reasonFold": "FwBVWG_reasonFold",
			"tlGrid": "FwBVWG_tlGrid",
			"blockMeta": "FwBVWG_blockMeta",
			"placeholder": "FwBVWG_placeholder",
			"ctxStrip": "FwBVWG_ctxStrip",
			"liveThink": "FwBVWG_liveThink",
			"tdTokens": "FwBVWG_tdTokens",
			"compTotals": "FwBVWG_compTotals",
			"stepRowSel": "FwBVWG_stepRowSel",
			"tlDur": "FwBVWG_tlDur",
			"ctxChip": "FwBVWG_ctxChip",
			"headingText": "FwBVWG_headingText",
			"trendPanel": "FwBVWG_trendPanel",
			"liveColText": "FwBVWG_liveColText",
			"mGroup": "FwBVWG_mGroup",
			"tdRoute": "FwBVWG_tdRoute",
			"title": "FwBVWG_title",
			"metaError": "FwBVWG_metaError",
			"rowError": "FwBVWG_rowError",
			"stepDetailHead": "FwBVWG_stepDetailHead",
			"ctxhRow": "FwBVWG_ctxhRow",
			"pager": "FwBVWG_pager",
			"stepDetail": "FwBVWG_stepDetail",
			"ctxAxis": "FwBVWG_ctxAxis",
			"trendLegendLabel": "FwBVWG_trendLegendLabel",
			"recentTitle": "FwBVWG_recentTitle",
			"subtitle": "FwBVWG_subtitle",
			"spacer": "FwBVWG_spacer",
			"tlWinner": "FwBVWG_tlWinner",
			"compMain": "FwBVWG_compMain",
			"liveThinkText": "FwBVWG_liveThinkText",
			"liveColAttempt": "FwBVWG_liveColAttempt",
			"liveCol": "FwBVWG_liveCol",
			"ctxhNewCp": "FwBVWG_ctxhNewCp",
			"tlIdentical": "FwBVWG_tlIdentical",
			"stepTable": "FwBVWG_stepTable",
			"tlPick": "FwBVWG_tlPick",
			"chipRow": "FwBVWG_chipRow",
			"voteReasoning": "FwBVWG_voteReasoning",
			"tdWho": "FwBVWG_tdWho",
			"trendChip": "FwBVWG_trendChip",
			"sectionBlock": "FwBVWG_sectionBlock",
			"draftCard": "FwBVWG_draftCard",
			"sumItem": "FwBVWG_sumItem",
			"tdErr": "FwBVWG_tdErr",
			"inflight": "FwBVWG_inflight",
			"tlLaneLabel": "FwBVWG_tlLaneLabel",
			"tlStepNo": "FwBVWG_tlStepNo",
			"trendSvg": "FwBVWG_trendSvg",
			"liveColHead": "FwBVWG_liveColHead",
			"tdCounts": "FwBVWG_tdCounts",
			"draftSoul": "FwBVWG_draftSoul",
			"draftError": "FwBVWG_draftError",
			"ctxSeg": "FwBVWG_ctxSeg",
			"trendColBg": "FwBVWG_trendColBg",
			"stepDetailTitle": "FwBVWG_stepDetailTitle"
		};
		//#endregion
		//#region src/client/MonitorPanel.tsx
		const ENDPOINT$1 = "/trisoul/api/state";
		const FRAMES_ENDPOINT = "/trisoul/api/context-frames";
		const ROUNDS_ENDPOINT = "/trisoul/api/consensus";
		const REFRESH_MS$1 = 3e3;
		const ROUNDS_KEEP = 200;
		/** 步骤表分页大小（服务端环形缓冲同步扩到 200 轮） */
		const PAGE_SIZE = 20;
		/** 灵魂卡片之后的固定卡片（中枢作业 AI；主循环单独一行） */
		const HUB_CARD_IDS = [
			"surgeon",
			"memory",
			"canvas"
		];
		const TABS = [
			"steps",
			"context",
			"components",
			"metrics",
			"recent"
		];
		function fmtNum(n) {
			if (n === void 0 || n === null) return "—";
			if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
			if (n >= 1e4) return `${(n / 1e3).toFixed(1)}K`;
			return String(n);
		}
		function fmtDuration(ms) {
			if (ms === null || ms === void 0) return "—";
			return ms >= 1e3 ? `${(ms / 1e3).toFixed(1)}s` : `${ms}ms`;
		}
		/** 百分比：分母为 0 → '—'（无数据不猜） */
		function fmtPct(num, den) {
			if (!den) return "—";
			return `${Math.round(num / den * 100)}%`;
		}
		/** 后台 AI 监控面板：默认只看当前会话（conversation.view 是 session 作用域插槽，props 自带 sessionId），可切「全部会话」；
		*  主体是监控轨迹图（各组件随对话推进的调用泳道），点一步看该步全文；组件状态 / 评测指标 / 最近调用折叠在下方。 */
		function MonitorPanel({ t, sessionId }) {
			const [state, setState] = (0, react.useState)(null);
			const [error, setError] = (0, react.useState)(null);
			const [updatedAt, setUpdatedAt] = (0, react.useState)(null);
			const [now, setNow] = (0, react.useState)(() => Date.now());
			const [scope, setScope] = (0, react.useState)(sessionId ? "session" : "all");
			const [selected, setSelected] = (0, react.useState)(null);
			const [fullRounds, setFullRounds] = (0, react.useState)({});
			const [tab, setTab] = (0, react.useState)("steps");
			const [page, setPage] = (0, react.useState)(0);
			const sid = sessionId ? String(sessionId) : null;
			const fmtAgo = (0, react.useCallback)((ts) => {
				if (!ts) return t("never");
				const diff = Math.max(0, now - ts);
				if (diff < 5e3) return t("time.now");
				if (diff < 6e4) return t("time.seconds", { n: Math.floor(diff / 1e3) });
				if (diff < 36e5) return t("time.minutes", { n: Math.floor(diff / 6e4) });
				return t("time.hours", { n: Math.floor(diff / 36e5) });
			}, [t, now]);
			const load = (0, react.useCallback)(async () => {
				try {
					const url = scope === "session" && sid ? `${ENDPOINT$1}?sessionId=${encodeURIComponent(sid)}` : ENDPOINT$1;
					const response = await fetch(url, { cache: "no-store" });
					if (!response.ok) throw new Error(`HTTP ${response.status}`);
					setState(await response.json());
					setUpdatedAt(Date.now());
					setError(null);
				} catch (e) {
					setError(e instanceof Error ? e.message : String(e));
				}
			}, [scope, sid]);
			(0, react.useEffect)(() => {
				load();
				const timer = setInterval(() => {
					load();
					setNow(Date.now());
				}, REFRESH_MS$1);
				return () => clearInterval(timer);
			}, [load]);
			const [liveMap, setLiveMap] = (0, react.useState)(null);
			(0, react.useEffect)(() => {
				const url = scope === "session" && sid ? `${ROUNDS_ENDPOINT}/stream?sessionId=${encodeURIComponent(sid)}` : `${ROUNDS_ENDPOINT}/stream`;
				const es = new EventSource(url);
				es.onmessage = (ev) => {
					try {
						const f = JSON.parse(ev.data);
						if (f.phase === "draft-delta" && f.soul) {
							const soul = f.soul;
							setLiveMap((m) => ({
								...m ?? {},
								[soul]: {
									ts: f.ts,
									stage: f.stage ?? null,
									round: f.round ?? null,
									attempt: f.attempt ?? null,
									textChars: f.textChars ?? 0,
									reasoningChars: f.reasoningChars ?? 0,
									textTail: f.textTail ?? "",
									reasoningTail: f.reasoningTail ?? ""
								}
							}));
						} else if (f.phase === "start") setLiveMap({});
						else if (f.phase === "done") setLiveMap(null);
					} catch {}
				};
				return () => es.close();
			}, [scope, sid]);
			/** 拉一步全文（进行中的每次都重拉——还在增长；完成的命中缓存） */
			const fetchRound = (0, react.useCallback)((turnId, running) => {
				setFullRounds((prev) => {
					const cached = prev[turnId];
					if (cached !== void 0 && cached !== "missing" && !running) return prev;
					(async () => {
						try {
							const response = await fetch(`${ROUNDS_ENDPOINT}?turnId=${encodeURIComponent(turnId)}`, { cache: "no-store" });
							if (response.status === 404) {
								setFullRounds((m) => ({
									...m,
									[turnId]: "missing"
								}));
								return;
							}
							if (!response.ok) throw new Error(`HTTP ${response.status}`);
							const body = await response.json();
							setFullRounds((m) => ({
								...m,
								[turnId]: body.round
							}));
						} catch {
							setFullRounds((m) => m[turnId] === "loading" ? {
								...m,
								[turnId]: "missing"
							} : m);
						}
					})();
					return cached === void 0 || running ? {
						...prev,
						[turnId]: prev[turnId] && prev[turnId] !== "missing" ? prev[turnId] : "loading"
					} : prev;
				});
			}, []);
			const rounds = (0, react.useMemo)(() => state?.consensusRounds ?? [], [state]);
			const timeline = (0, react.useMemo)(() => state?.timeline ?? [], [state]);
			const souls = state?.souls ?? [];
			const latest = (0, react.useMemo)(() => rounds.reduce((a, r) => !a || r.ts > a.ts ? r : a, null), [rounds]);
			(0, react.useEffect)(() => {
				if (latest) fetchRound(String(latest.turnId), latest.inflight);
			}, [latest, fetchRound]);
			const sortedDesc = (0, react.useMemo)(() => [...rounds].sort((a, b) => b.ts - a.ts), [rounds]);
			const pageCount = Math.max(1, Math.ceil(sortedDesc.length / PAGE_SIZE));
			(0, react.useEffect)(() => {
				setPage((p) => Math.min(p, pageCount - 1));
			}, [pageCount]);
			const selectStep = (0, react.useCallback)((turnId) => {
				setSelected(turnId);
				if (turnId === null) return;
				const r = rounds.find((x) => String(x.turnId) === turnId);
				fetchRound(turnId, r?.inflight ?? false);
			}, [rounds, fetchRound]);
			(0, react.useEffect)(() => {
				if (!selected) return;
				if (rounds.find((x) => String(x.turnId) === selected)?.inflight) fetchRound(selected, true);
			}, [
				rounds,
				selected,
				fetchRound
			]);
			const stateOf = (s) => {
				if (!s) return "idle";
				if (s.inflight > 0) return "ongoing";
				if (s.lastError && s.lastCall && now - s.lastCall < 12e4) return "error";
				if (s.calls > 0) return "done";
				return "idle";
			};
			const stateLabel = (k) => k === "ongoing" ? t("state.running") : k === "error" ? t("state.error") : k === "done" ? "" : t("state.idle");
			/** id → 展示名：固定 AI 走本地字典；soul-<name> 组合「灵魂 <name> · <title>」（title 来自 state.ai 元数据） */
			const aiName = (id) => {
				if (id.startsWith("soul-")) {
					const name = id.slice(5);
					const title = state?.souls.find((s) => s.name === name)?.title ?? state?.ai[id]?.title;
					const label = t("ai.soul", { name });
					return title ? `${label} · ${title}` : label;
				}
				const r = t(`ai.${id}`);
				return r === `ai.${id}` ? id : r;
			};
			const soulName = (name) => name ? aiName(`soul-${name}`) : "—";
			const stageName = (stage) => {
				if (stage.includes("/")) {
					const r = t(`result.${stage}`);
					return r === `result.${stage}` ? stage : r;
				}
				const r = t(`stage.${stage}`);
				return r === `stage.${stage}` ? stage : r;
			};
			const resultName = (key) => {
				const r = t(`result.${key}`);
				return r === `result.${key}` ? key : r;
			};
			const modeLabel = state?.config.mode === "fine" ? t("mode.fine") : t("mode.unified");
			const cards = [...souls.map((s, i) => ({
				id: `soul-${s.name}`,
				tone: i % 4
			})), ...HUB_CARD_IDS.map((id) => ({ id }))];
			const summary = (0, react.useMemo)(() => {
				const durs = rounds.filter((r) => !r.inflight && r.result).map((r) => r.durationMs ?? 0).filter((d) => d > 0).sort((a, b) => a - b);
				const median = durs.length ? durs[Math.floor(durs.length / 2)] : null;
				const surgeries = timeline.filter((e) => e.id === "surgeon" && e.stage === "surgery-result");
				return {
					steps: rounds.length,
					inflight: rounds.filter((r) => r.inflight).length,
					median,
					identical: rounds.filter((r) => r.result === "identical").length,
					degraded: rounds.filter((r) => r.result === "all-dead" || r.result === "aborted" || r.mode === "fallback").length,
					surgeryOk: surgeries.filter((e) => e.ok).length,
					surgeryFailed: surgeries.filter((e) => !e.ok).length,
					digests: timeline.filter((e) => e.id === "memory" && e.stage === "digest-result" && e.ok).length,
					injects: timeline.filter((e) => e.id === "memory" && e.stage === "inject").length,
					recalls: timeline.filter((e) => e.id === "memory" && (e.stage === "recall-result" || e.stage === "recall-raw")).length
				};
			}, [rounds, timeline]);
			const selectedRound = selected ? rounds.find((x) => String(x.turnId) === selected) ?? null : null;
			const selectedFull = selected ? fullRounds[selected] : void 0;
			const stepIndexOf = (turnId) => {
				return [...rounds].sort((a, b) => a.ts - b.ts).findIndex((r) => String(r.turnId) === turnId) + 1;
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: MonitorPanel_module_css_default.panel,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("header", {
					className: MonitorPanel_module_css_default.header,
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: MonitorPanel_module_css_default.headingRow,
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: MonitorPanel_module_css_default.headingText,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", {
										className: MonitorPanel_module_css_default.title,
										children: t("title")
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: MonitorPanel_module_css_default.subtitle,
										children: scope === "session" ? t("scope.session.hint") : t("scope.all.hint", { n: state?.sessions?.length ?? 0 })
									})]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: MonitorPanel_module_css_default.spacer }),
								sid ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: MonitorPanel_module_css_default.scopeSwitch,
									role: "tablist",
									"aria-label": t("scope.label"),
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										role: "tab",
										"aria-selected": scope === "session",
										className: MonitorPanel_module_css_default.scopeBtn,
										"data-active": scope === "session" || void 0,
										onClick: () => {
											setScope("session");
											setSelected(null);
											setPage(0);
										},
										children: t("scope.session")
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										role: "tab",
										"aria-selected": scope === "all",
										className: MonitorPanel_module_css_default.scopeBtn,
										"data-active": scope === "all" || void 0,
										onClick: () => {
											setScope("all");
											setSelected(null);
											setPage(0);
										},
										children: t("scope.all")
									})]
								}) : null,
								souls.length ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Pill, { children: t("souls.count", { n: souls.length }) }) : null,
								state ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Pill, {
									active: true,
									children: modeLabel
								}) : null,
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
									variant: "ghost",
									size: "sm",
									onClick: () => {
										load();
									},
									children: t("refresh")
								})
							]
						}),
						state ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: MonitorPanel_module_css_default.summaryStrip,
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
									className: MonitorPanel_module_css_default.sumItem,
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("b", { children: summary.steps }),
										" ",
										t("summary.steps"),
										summary.inflight ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
											className: MonitorPanel_module_css_default.inflight,
											children: [" · ", t("summary.inflight", { n: summary.inflight })]
										}) : null
									]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: MonitorPanel_module_css_default.sumSep }),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
									className: MonitorPanel_module_css_default.sumItem,
									children: [
										t("summary.median"),
										" ",
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("b", { children: fmtDuration(summary.median) })
									]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: MonitorPanel_module_css_default.sumSep }),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
									className: MonitorPanel_module_css_default.sumItem,
									children: [
										t("summary.identical"),
										" ",
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("b", { children: summary.identical }),
										summary.degraded ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [" · ", /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
											className: MonitorPanel_module_css_default.errorValue,
											children: [
												t("summary.degraded"),
												" ",
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("b", { children: summary.degraded })
											]
										})] }) : null
									]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: MonitorPanel_module_css_default.sumSep }),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
									className: MonitorPanel_module_css_default.sumItem,
									children: [
										t("summary.surgeries"),
										" ",
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("b", { children: summary.surgeryOk }),
										summary.surgeryFailed ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
											className: MonitorPanel_module_css_default.errorValue,
											children: [" / ✗", summary.surgeryFailed]
										}) : null
									]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: MonitorPanel_module_css_default.sumSep }),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: MonitorPanel_module_css_default.sumItem,
									children: t("summary.memory", {
										d: summary.digests,
										i: summary.injects,
										r: summary.recalls
									})
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: MonitorPanel_module_css_default.spacer }),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
									className: MonitorPanel_module_css_default.meta,
									children: [updatedAt ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("updated", { when: fmtAgo(updatedAt) }) }) : null, error ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: MonitorPanel_module_css_default.metaError,
										children: t("error", { message: error })
									}) : null]
								})
							]
						}) : error ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: MonitorPanel_module_css_default.meta,
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: MonitorPanel_module_css_default.metaError,
								children: t("error", { message: error })
							})
						}) : null,
						state ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(LiveStrip, {
							latest,
							full: latest ? fullRounds[String(latest.turnId)] : void 0,
							stats: state.stats,
							souls,
							live: liveMap,
							t,
							fmtAgo,
							resultName,
							onOpen: () => {
								if (latest) {
									setTab("steps");
									selectStep(String(latest.turnId));
								}
							}
						}) : null,
						state ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: MonitorPanel_module_css_default.tabs,
							role: "tablist",
							"aria-label": t("tabs.label"),
							children: TABS.map((k) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								role: "tab",
								"aria-selected": tab === k,
								className: MonitorPanel_module_css_default.tabBtn,
								"data-active": tab === k || void 0,
								onClick: () => setTab(k),
								children: t(`tab.${k}`)
							}, k))
						}) : null
					]
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: MonitorPanel_module_css_default.body,
					children: [
						!state && !error ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: MonitorPanel_module_css_default.placeholder,
							children: t("loading")
						}) : null,
						state && tab === "steps" && selected && selectedRound ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
							className: MonitorPanel_module_css_default.stepDetail,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: MonitorPanel_module_css_default.stepDetailHead,
								children: [
									selectedRound.inflight ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.StateDot, { state: "ongoing" }) : selectedRound.error ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.StateDot, { state: "error" }) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.StateDot, { state: "done" }),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: MonitorPanel_module_css_default.stepDetailTitle,
										children: t("step.title", { n: stepIndexOf(selected) })
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: MonitorPanel_module_css_default.roundPrompt,
										children: selectedRound.prompt || t("souls.prompt.none")
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
										className: MonitorPanel_module_css_default.roundMeta,
										children: [
											selectedRound.inflight ? t("souls.running") : selectedRound.result ? resultName(`${selectedRound.mode}/${selectedRound.result}`) : "",
											selectedRound.winner ? ` · ${t("souls.winner", { name: selectedRound.winner })}` : "",
											selectedRound.rounds ? ` · ${t("souls.rounds", { n: selectedRound.rounds })}` : "",
											selectedRound.durationMs !== null ? ` · ${t("souls.duration", { d: fmtDuration(selectedRound.durationMs) })}` : "",
											` · ${fmtAgo(selectedRound.ts)}`
										]
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
										variant: "ghost",
										size: "sm",
										onClick: () => setSelected(null),
										children: t("step.close")
									})
								]
							}), selectedFull === "loading" || selectedFull === void 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: MonitorPanel_module_css_default.placeholder,
								children: t("souls.loading")
							}) : selectedFull === "missing" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: MonitorPanel_module_css_default.placeholder,
								children: t("souls.notfound", { n: ROUNDS_KEEP })
							}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(RoundDetail, {
								round: selectedFull,
								t,
								soulName,
								tone: (name) => {
									const i = souls.findIndex((s) => s.name === name);
									return (i >= 0 ? i : Math.max(0, selectedFull.souls.indexOf(name ?? ""))) % 4;
								}
							})]
						}) : null,
						state && tab === "steps" && rounds.length ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(TrendPanel, {
							rounds,
							timeline,
							souls,
							selected,
							onSelect: selectStep,
							t,
							resultName,
							aiName
						}) : null,
						state && tab === "steps" ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
							className: MonitorPanel_module_css_default.trajectory,
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: MonitorPanel_module_css_default.sectionHead,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h4", {
										className: MonitorPanel_module_css_default.recentTitle,
										children: t("trajectory.title")
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: MonitorPanel_module_css_default.roundsHint,
										children: t("trajectory.hint")
									})]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Trajectory, {
									rounds,
									timeline,
									souls,
									selected,
									onSelect: selectStep,
									t,
									aiName,
									stageName,
									resultName,
									now,
									showSession: scope === "all"
								}),
								rounds.length ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("table", {
									className: `${MonitorPanel_module_css_default.table} ${MonitorPanel_module_css_default.stepTable}`,
									children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("tbody", { children: sortedDesc.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE).map((r) => {
										const key = String(r.turnId);
										const idx = stepIndexOf(key);
										const g = resultGlyph(r);
										const b = r.ballot ?? null;
										const picksText = b?.picks?.length ? b.picks.map((p) => `${p.soul ?? "?"}→${p.reject ? t("souls.vote.reject.short") : p.pick ?? t("souls.vote.abstain.short")}${p.via === "text" ? "*" : ""}`).join(" · ") : "";
										const countsText = b?.counts?.length ? b.counts.filter((c) => c.votes > 0).map((c) => `${c.soul} ${c.votes}`).join(" · ") : "";
										const soloText = r.mode === "solo" ? t("step.solo", { n: r.solo?.tips ?? 0 }) : "";
										const finaleText = r.tips?.dest === "final" ? t("step.finale", { n: r.tips.claims.length }) : "";
										return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("tr", {
											className: selected === key ? MonitorPanel_module_css_default.stepRowSel : void 0,
											onClick: () => selectStep(selected === key ? null : key),
											children: [
												/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("td", {
													className: MonitorPanel_module_css_default.tdTime,
													children: ["#", idx]
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("td", {
													className: MonitorPanel_module_css_default.tdWho,
													children: [
														/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
															className: `${MonitorPanel_module_css_default.tlGlyphInline} ${g.cls}`,
															children: g.glyph
														}),
														" ",
														r.inflight ? t("souls.running") : r.result ? resultName(`${r.mode}/${r.result}`) : ""
													]
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("td", {
													className: MonitorPanel_module_css_default.tdStage,
													children: r.winner ? t("souls.winner", { name: r.winner }) : "—"
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("td", {
													className: MonitorPanel_module_css_default.tdVotes,
													title: picksText || void 0,
													children: [picksText ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [picksText, countsText ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
														className: MonitorPanel_module_css_default.tdCounts,
														children: [
															"（",
															countsText,
															"）"
														]
													}) : null] }) : r.result === "identical" ? t("step.noVote.identical") : soloText, finaleText ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
														className: MonitorPanel_module_css_default.tdCounts,
														children: [" · ", finaleText]
													}) : null]
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("td", {
													className: MonitorPanel_module_css_default.tdDur,
													children: fmtDuration(r.durationMs)
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("td", {
													className: MonitorPanel_module_css_default.tdTime,
													children: fmtAgo(r.ts)
												})
											]
										}, key);
									}) })
								}) : null,
								rounds.length > PAGE_SIZE ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: MonitorPanel_module_css_default.pager,
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
											variant: "ghost",
											size: "sm",
											disabled: page === 0,
											onClick: () => setPage((p) => Math.max(0, p - 1)),
											children: t("page.prev")
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("page.info", {
											p: page + 1,
											n: pageCount,
											c: sortedDesc.length
										}) }),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
											variant: "ghost",
											size: "sm",
											disabled: page >= pageCount - 1,
											onClick: () => setPage((p) => Math.min(pageCount - 1, p + 1)),
											children: t("page.next")
										})
									]
								}) : null
							]
						}) : null,
						state && tab === "context" ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [state.contextFrame?.frame ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ContextFramePanel, {
							cf: state.contextFrame,
							t,
							fmtAgo
						}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: MonitorPanel_module_css_default.placeholder,
							children: t("ctx.empty")
						}), state.scope?.sessionId ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ContextHistoryPanel, {
							sessionId: state.scope.sessionId,
							timeline,
							t,
							stageName
						}) : null] }) : null,
						state && tab === "components" ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
							className: MonitorPanel_module_css_default.sectionBlock,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: MonitorPanel_module_css_default.sectionHead,
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h4", {
										className: MonitorPanel_module_css_default.recentTitle,
										children: t("fold.components")
									}),
									state.totals && state.totals.calls > 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
										className: MonitorPanel_module_css_default.foldTotals,
										title: t("comp.totals.route"),
										children: [
											"Σ ",
											t("stat.input"),
											" ",
											fmtNum(state.totals.input + state.totals.cache),
											" · ",
											t("stat.output"),
											" ",
											fmtNum(state.totals.output),
											" · ",
											t("stat.cache"),
											" ",
											fmtPct(state.totals.cache, state.totals.input + state.totals.cache)
										]
									}) : null,
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: MonitorPanel_module_css_default.roundsHint,
										children: t("fold.components.hint")
									})
								]
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: MonitorPanel_module_css_default.sectionBody,
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("table", {
									className: `${MonitorPanel_module_css_default.table} ${MonitorPanel_module_css_default.compTable}`,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("tr", { children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("th", { children: t("comp.col.component") }),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("th", { children: t("comp.col.route") }),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("th", {
											className: MonitorPanel_module_css_default.thNum,
											children: t("stat.calls")
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("th", {
											className: MonitorPanel_module_css_default.thNum,
											children: t("stat.errors")
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("th", {
											className: MonitorPanel_module_css_default.thNum,
											children: t("stat.input")
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("th", {
											className: MonitorPanel_module_css_default.thNum,
											children: t("stat.output")
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("th", {
											className: MonitorPanel_module_css_default.thNum,
											children: t("stat.cache")
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("th", {
											className: MonitorPanel_module_css_default.thNum,
											children: t("stat.reasoning")
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("th", { children: t("stat.last") }),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("th", {
											className: MonitorPanel_module_css_default.thNum,
											children: t("stat.duration")
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("th", { children: t("comp.col.stages") })
									] }) }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("tbody", { children: [
										state.totals && state.totals.calls > 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("tr", {
											className: MonitorPanel_module_css_default.compTotals,
											children: [
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("td", {
													className: MonitorPanel_module_css_default.tdWho,
													children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
														className: MonitorPanel_module_css_default.compName,
														children: ["Σ ", t("comp.totals")]
													})
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("td", {
													className: MonitorPanel_module_css_default.tdRoute,
													children: t("comp.totals.route")
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("td", {
													className: MonitorPanel_module_css_default.tdNum,
													children: fmtNum(state.totals.calls)
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("td", {
													className: MonitorPanel_module_css_default.tdNum,
													children: state.totals.errors ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
														className: MonitorPanel_module_css_default.errorValue,
														children: state.totals.errors
													}) : "0"
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("td", {
													className: MonitorPanel_module_css_default.tdNum,
													children: fmtNum(state.totals.input)
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("td", {
													className: MonitorPanel_module_css_default.tdNum,
													children: fmtNum(state.totals.output)
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("td", {
													className: MonitorPanel_module_css_default.tdNum,
													title: t("comp.cacheRate"),
													children: [fmtNum(state.totals.cache), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
														className: MonitorPanel_module_css_default.tdCounts,
														children: [" ", fmtPct(state.totals.cache, state.totals.input + state.totals.cache)]
													})]
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("td", {
													className: MonitorPanel_module_css_default.tdNum,
													children: fmtNum(state.totals.reasoning)
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("td", {
													className: MonitorPanel_module_css_default.tdTime,
													children: "—"
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("td", {
													className: MonitorPanel_module_css_default.tdNum,
													children: "—"
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("td", {})
											]
										}) : null,
										/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("tr", {
											className: MonitorPanel_module_css_default.compMain,
											children: [
												/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("td", {
													className: MonitorPanel_module_css_default.tdWho,
													children: [
														/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.StateDot, { state: state.consensus?.inflight ? "ongoing" : "done" }),
														" ",
														aiName("main")
													]
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("td", {
													className: MonitorPanel_module_css_default.tdRoute,
													colSpan: 1,
													children: [
														t("main.turns"),
														" ",
														/* @__PURE__ */ (0, react_jsx_runtime.jsx)("b", { children: fmtNum(state.consensus?.turns ?? 0) }),
														state.consensus?.inflight ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
															className: MonitorPanel_module_css_default.inflight,
															children: [
																" +",
																state.consensus.inflight,
																" ",
																t("main.running")
															]
														}) : null
													]
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("td", {
													className: MonitorPanel_module_css_default.tdNum,
													colSpan: 6,
													children: state.consensus?.lastResult ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", { children: [
														t("main.last"),
														": ",
														resultName(`${state.consensus.lastMode}/${state.consensus.lastResult}`),
														state.consensus.lastWinner ? ` · ${t("result.winner.name", { name: state.consensus.lastWinner })}` : "",
														" · ",
														fmtDuration(state.consensus.lastDurationMs),
														" · ",
														fmtAgo(state.consensus.lastAt)
													] }) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("main.none") })
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("td", {
													colSpan: 3,
													children: state.consensus && Object.keys(state.consensus.results).length > 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
														className: MonitorPanel_module_css_default.stages,
														children: Object.entries(state.consensus.results).map(([k, n]) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
															className: MonitorPanel_module_css_default.stageChip,
															children: [
																resultName(k),
																" ",
																n
															]
														}, k))
													}) : null
												})
											]
										}),
										cards.map(({ id, tone }) => {
											const s = state.stats[id];
											const st = stateOf(s);
											const route = state.config.resolved[id];
											const soul = id.startsWith("soul-") ? souls.find((x) => `soul-${x.name}` === id) : void 0;
											const isCanvas = id === "canvas";
											return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("tr", {
												"data-ai": id,
												"data-tone": tone,
												className: st === "error" ? MonitorPanel_module_css_default.rowError : void 0,
												title: soul?.persona ?? void 0,
												children: [
													/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("td", {
														className: MonitorPanel_module_css_default.tdWho,
														children: [
															st === "idle" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
																className: MonitorPanel_module_css_default.idleDot,
																"aria-hidden": true
															}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.StateDot, { state: st === "done" ? "done" : st }),
															/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
																className: MonitorPanel_module_css_default.compName,
																children: aiName(id)
															}),
															stateLabel(st) ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
																className: MonitorPanel_module_css_default.stateLabel,
																children: [" · ", stateLabel(st)]
															}) : null
														]
													}),
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("td", {
														className: MonitorPanel_module_css_default.tdRoute,
														children: isCanvas ? t("comp.canvas.route") : `${s?.provider ?? route?.provider ?? soul?.provider ?? "—"} / ${s?.model ?? route?.model ?? soul?.model ?? "—"}${route?.temperature !== void 0 ? ` · T=${route.temperature}` : ""}${route?.reasoningEffort ? ` · ${route.reasoningEffort}` : ""}`
													}),
													/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("td", {
														className: MonitorPanel_module_css_default.tdNum,
														children: [fmtNum(s?.calls), s?.inflight ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
															className: MonitorPanel_module_css_default.inflight,
															children: [" +", s.inflight]
														}) : null]
													}),
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("td", {
														className: MonitorPanel_module_css_default.tdNum,
														children: s?.errors ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
															className: MonitorPanel_module_css_default.errorValue,
															children: s.errors
														}) : "0"
													}),
													isCanvas ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
														/* @__PURE__ */ (0, react_jsx_runtime.jsx)("td", {
															className: MonitorPanel_module_css_default.tdNum,
															title: t("stat.region"),
															children: fmtNum(s?.input)
														}),
														/* @__PURE__ */ (0, react_jsx_runtime.jsx)("td", {
															className: MonitorPanel_module_css_default.tdNum,
															children: "—"
														}),
														/* @__PURE__ */ (0, react_jsx_runtime.jsx)("td", {
															className: MonitorPanel_module_css_default.tdNum,
															title: t("stat.surface"),
															children: fmtNum(s?.context)
														}),
														/* @__PURE__ */ (0, react_jsx_runtime.jsx)("td", {
															className: MonitorPanel_module_css_default.tdNum,
															children: "—"
														})
													] }) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
														/* @__PURE__ */ (0, react_jsx_runtime.jsx)("td", {
															className: MonitorPanel_module_css_default.tdNum,
															children: fmtNum(s?.input)
														}),
														/* @__PURE__ */ (0, react_jsx_runtime.jsx)("td", {
															className: MonitorPanel_module_css_default.tdNum,
															children: fmtNum(s?.output)
														}),
														/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("td", {
															className: MonitorPanel_module_css_default.tdNum,
															title: t("comp.cacheRate"),
															children: [fmtNum(s?.cache), s && s.input + s.cache > 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
																className: MonitorPanel_module_css_default.tdCounts,
																children: [" ", fmtPct(s.cache, s.input + s.cache)]
															}) : null]
														}),
														/* @__PURE__ */ (0, react_jsx_runtime.jsx)("td", {
															className: MonitorPanel_module_css_default.tdNum,
															children: fmtNum(s?.reasoning)
														})
													] }),
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("td", {
														className: MonitorPanel_module_css_default.tdTime,
														children: fmtAgo(s?.lastCall ?? null)
													}),
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("td", {
														className: MonitorPanel_module_css_default.tdNum,
														children: fmtDuration(s?.lastDurationMs)
													}),
													/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("td", { children: [s?.stages && Object.keys(s.stages).length > 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
														className: MonitorPanel_module_css_default.stages,
														children: Object.entries(s.stages).map(([stage, n]) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
															className: MonitorPanel_module_css_default.stageChip,
															children: [
																stageName(stage),
																" ",
																n
															]
														}, stage))
													}) : null, s?.lastError ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
														className: MonitorPanel_module_css_default.lastError,
														title: s.lastError,
														children: s.lastError
													}) : null] })
												]
											}, id);
										})
									] })]
								})
							})]
						}) : null,
						state?.metrics && tab === "metrics" ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
							className: MonitorPanel_module_css_default.sectionBlock,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: MonitorPanel_module_css_default.sectionHead,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h4", {
									className: MonitorPanel_module_css_default.recentTitle,
									children: t("metrics.title")
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: MonitorPanel_module_css_default.roundsHint,
									children: t("metrics.subtitle")
								})]
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(MetricsSection, {
								metrics: state.metrics,
								memoryHealth: state.memoryHealth ?? null,
								fmtAgo,
								t,
								soulName
							})]
						}) : null,
						state && tab === "recent" ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
							className: MonitorPanel_module_css_default.sectionBlock,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: MonitorPanel_module_css_default.sectionHead,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h4", {
									className: MonitorPanel_module_css_default.recentTitle,
									children: t("recent.title")
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: MonitorPanel_module_css_default.roundsHint,
									children: scope === "session" ? t("recent.hint.session") : t("recent.hint.all")
								})]
							}), state.recent.length === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: MonitorPanel_module_css_default.placeholder,
								children: t("recent.empty")
							}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(RecentCalls, {
								recent: state.recent,
								t,
								aiName,
								stageName,
								souls,
								fmtAgo
							})]
						}) : null
					]
				})]
			});
		}
		const CTX_HUB_KINDS = [
			"main",
			"canvas",
			"memory",
			"surgeon"
		];
		/** 容器宽度（ResizeObserver），用于把步轴铺满可用宽度 */
		function useWidth() {
			const ref = (0, react.useRef)(null);
			const [w, setW] = (0, react.useState)(0);
			(0, react.useEffect)(() => {
				const el = ref.current;
				if (!el) return;
				const update = () => setW(el.clientWidth);
				update();
				if (typeof ResizeObserver === "undefined") return;
				const ro = new ResizeObserver(update);
				ro.observe(el);
				return () => ro.disconnect();
			}, []);
			return [ref, w];
		}
		const fmtK = (n) => n >= 1e3 ? `${(n / 1e3).toFixed(n >= 1e4 ? 0 : 1)}k` : String(n);
		const ctxEst = (c) => Math.ceil(c / 3.5);
		const CTX_PLUGIN_KEYS = {
			"trisoul-memory": "ctx.inj.memory",
			"trisoul-canvas": "ctx.inj.canvas",
			"trisoul-consensus": "ctx.inj.consensus",
			"tool-jobs": "ctx.inj.jobs"
		};
		function classifyCtxMsg(m, t) {
			if (m.checkpoint) return {
				kind: "checkpoint",
				label: t("ctx.checkpoint")
			};
			if (m.kind === "tool") return {
				kind: "tool",
				label: t("ctx.tool")
			};
			if (m.kind === "user") return {
				kind: "user",
				label: t("ctx.user")
			};
			if (m.role === "assistant") return {
				kind: "assistant",
				label: t("ctx.assistant")
			};
			if (m.plugin) {
				const k = CTX_PLUGIN_KEYS[m.plugin];
				return {
					kind: "plugin",
					label: k ? t(k) : m.plugin
				};
			}
			return {
				kind: "other",
				label: m.role
			};
		}
		/** 命中比按真 token 口径：每魂 cache/(cache+input)，取各魂最大（三魂 messages 相同只差 persona，比例代表前缀命中范围）。
		*  绝不拿真 token 除以字符估算（chars÷3.5 对中文严重低估总量、又漏工具面 → 比率虚超 100% 被夹死恒显 100%，09-01 真机病例）。 */
		function bestHitOf(souls) {
			let best = null;
			for (const sl of souls) {
				const cache = sl.cacheReadTokens ?? 0, input = sl.inputTokens ?? 0;
				if (cache + input <= 0) continue;
				const pct = cache / (cache + input) * 100;
				if (!best || pct > best.pct) best = {
					pct,
					cache,
					input
				};
			}
			return best;
		}
		function ContextFramePanel({ cf, t, fmtAgo }) {
			const frame = cf.frame;
			if (!frame) return null;
			const est = ctxEst;
			const cacheRead = Math.max(0, ...cf.souls.map((sl) => sl.cacheReadTokens ?? 0));
			const classify = (m) => classifyCtxMsg(m, t);
			const segs = [{
				kind: "system",
				label: t("ctx.system"),
				chars: frame.systemChars
			}, ...frame.messages.map((m) => ({
				...classify(m),
				chars: m.chars
			}))];
			const cachePct = bestHitOf(cf.souls)?.pct ?? null;
			const legend = [];
			for (const s of segs) {
				const g = legend.find((x) => x.kind === s.kind);
				if (g) {
					g.chars += s.chars;
					g.count += 1;
				} else legend.push({
					kind: s.kind,
					label: s.kind === "plugin" ? t("ctx.plugin") : s.label,
					chars: s.chars,
					count: 1
				});
			}
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
				className: MonitorPanel_module_css_default.trajectory,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: MonitorPanel_module_css_default.sectionHead,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h4", {
								className: MonitorPanel_module_css_default.recentTitle,
								children: t("ctx.title")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: MonitorPanel_module_css_default.roundsHint,
								children: t("ctx.hint")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: MonitorPanel_module_css_default.roundsHint,
								children: fmtAgo(cf.ts)
							})
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: MonitorPanel_module_css_default.ctxStrip,
						children: [segs.map((s, i) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: MonitorPanel_module_css_default.ctxSeg,
							"data-kind": s.kind,
							style: { flexGrow: Math.max(1, s.chars) },
							title: t("ctx.seg", {
								label: s.label,
								c: s.chars.toLocaleString(),
								n: est(s.chars).toLocaleString()
							})
						}, i)), cachePct !== null ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: MonitorPanel_module_css_default.ctxCacheMark,
							style: { left: `${cachePct}%` },
							title: t("ctx.cacheLine", { n: cacheRead.toLocaleString() })
						}) : null]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: MonitorPanel_module_css_default.ctxLegend,
						children: [legend.map((g) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
							className: MonitorPanel_module_css_default.ctxLegendItem,
							title: t("ctx.seg", {
								label: g.label,
								c: g.chars.toLocaleString(),
								n: est(g.chars).toLocaleString()
							}),
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: MonitorPanel_module_css_default.ctxChip,
									"data-kind": g.kind
								}),
								g.label,
								g.count > 1 ? ` ×${g.count}` : "",
								" · ≈",
								est(g.chars).toLocaleString()
							]
						}, g.kind)), cachePct !== null ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
							className: MonitorPanel_module_css_default.ctxLegendItem,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: MonitorPanel_module_css_default.ctxChipLine }), t("ctx.cacheShort", { n: cacheRead.toLocaleString() })]
						}) : null]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: MonitorPanel_module_css_default.roundsHint,
						children: [t("ctx.total", {
							n: frame.messages.length,
							c: frame.totalChars.toLocaleString(),
							tools: frame.tools
						}), cf.souls.length ? ` · ${t("ctx.souls", { s: cf.souls.map((sl) => `${sl.soul} ${sl.inputTokens ?? "?"}${sl.cacheReadTokens != null ? `/${sl.cacheReadTokens}` : ""}`).join(" · ") })}` : ""]
					})
				]
			});
		}
		/** 上下文演变（09-01 历史图）：每步一条组成横条（宽 ∝ 字符、颜色同上）+ 绿色下划线 = 该步实际前缀命中范围
		*（真 token 口径 cache/(cache+input) 取各魂最高，见 bestHitOf）；条间按时间插入手术/消化/状态牌/探针/遮蔽事件行，帧间 diff 出「吞了几条 → 新检查点」
		*  并给新检查点段描边。全量帧走 /trisoul/api/context-frames 按需拉（挂载/换会话/手动刷新），不随 3s 轮询。 */
		const CTXH_EVENT_STAGES = /* @__PURE__ */ new Set([
			"surgery-result",
			"digest-result",
			"probe-result",
			"state-result",
			"shadow"
		]);
		const CTXH_ZOOMS = [
			1,
			2,
			4,
			8
		];
		function ContextHistoryPanel({ sessionId, timeline, t, stageName }) {
			const [frames, setFrames] = (0, react.useState)(null);
			const [error, setError] = (0, react.useState)(null);
			const [zoom, setZoom] = (0, react.useState)(1);
			const load = (0, react.useCallback)(async () => {
				try {
					const r = await fetch(`${FRAMES_ENDPOINT}?sessionId=${encodeURIComponent(sessionId)}`, { cache: "no-store" });
					if (!r.ok) throw new Error(`HTTP ${r.status}`);
					const body = await r.json();
					setFrames(body.frames ?? []);
					setError(null);
				} catch (e) {
					setError(e instanceof Error ? e.message : String(e));
				}
			}, [sessionId]);
			(0, react.useEffect)(() => {
				setFrames(null);
				load();
			}, [load]);
			const rows = (0, react.useMemo)(() => {
				if (!frames?.length) return [];
				const totalOf = (f) => (f.frame?.totalChars ?? 0) + (f.frame?.systemChars ?? 0);
				const maxChars = Math.max(1, ...frames.map(totalOf));
				const evs = timeline.filter((e) => CTXH_EVENT_STAGES.has(e.stage));
				return frames.map((f, i) => {
					const prev = frames[i - 1];
					const evsBefore = evs.filter((e) => i === 0 ? e.ts <= f.ts : e.ts > prev.ts && e.ts <= f.ts);
					let knife = null;
					const newCpIds = /* @__PURE__ */ new Set();
					if (prev?.frame && f.frame) {
						const curIds = new Set(f.frame.messages.map((m) => m.id).filter(Boolean));
						const prevCps = new Set(prev.frame.messages.map((m) => m.compactionId).filter(Boolean));
						for (const m of f.frame.messages) if (m.compactionId && !prevCps.has(m.compactionId)) newCpIds.add(m.compactionId);
						const removed = prev.frame.messages.filter((m) => m.id && !curIds.has(m.id));
						if (newCpIds.size && removed.length) knife = {
							removed: removed.length,
							removedChars: removed.reduce((n, m) => n + m.chars, 0)
						};
					}
					const hit = bestHitOf(f.souls);
					const total = totalOf(f);
					return {
						f,
						i,
						evsBefore,
						knife,
						newCpIds,
						widthPct: total / maxChars * 100,
						hit,
						total
					};
				});
			}, [frames, timeline]);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
				className: MonitorPanel_module_css_default.trajectory,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: MonitorPanel_module_css_default.sectionHead,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h4", {
								className: MonitorPanel_module_css_default.recentTitle,
								children: t("ctxh.title")
							}),
							frames?.length ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: MonitorPanel_module_css_default.roundsHint,
								children: t("ctxh.count", { n: frames.length })
							}) : null,
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: MonitorPanel_module_css_default.roundsHint,
								children: t("ctxh.zoom")
							}),
							CTXH_ZOOMS.map((z) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(_deepseek_ai_dsh_client_ui_primitives.Pill, {
								active: zoom === z,
								onClick: () => setZoom(z),
								children: [z, "x"]
							}, z)),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
								variant: "ghost",
								size: "sm",
								onClick: () => {
									load();
								},
								children: t("ctxh.refresh")
							})
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: MonitorPanel_module_css_default.roundsHint,
						children: t("ctxh.hint")
					}),
					error ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: MonitorPanel_module_css_default.error,
						children: t("ctxh.error", { message: error })
					}) : null,
					frames === null && !error ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: MonitorPanel_module_css_default.placeholder,
						children: t("ctxh.loading")
					}) : null,
					frames !== null && frames.length === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: MonitorPanel_module_css_default.placeholder,
						children: t("ctxh.empty")
					}) : null,
					rows.length ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: MonitorPanel_module_css_default.ctxhWrap,
						children: rows.map((r) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [
							r.evsBefore.map((e, j) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: MonitorPanel_module_css_default.ctxhEvent,
								"data-stage": e.stage,
								children: [
									stageName(e.stage),
									e.note ? ` · ${e.note}` : "",
									e.ok === false ? " ✗" : ""
								]
							}, j)),
							r.knife ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: MonitorPanel_module_css_default.ctxhEvent,
								"data-stage": "knife",
								children: t("ctxh.knife", {
									n: r.knife.removed,
									c: r.knife.removedChars.toLocaleString()
								})
							}) : null,
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: MonitorPanel_module_css_default.ctxhRow,
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
										className: MonitorPanel_module_css_default.ctxhMeta,
										title: new Date(r.f.ts).toLocaleString(),
										children: [
											"#",
											r.i + 1,
											" · ",
											new Date(r.f.ts).toLocaleTimeString()
										]
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: MonitorPanel_module_css_default.ctxhLane,
										children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											className: MonitorPanel_module_css_default.ctxhBar,
											style: { width: `${Math.max(.5, r.widthPct * zoom)}%` },
											children: [
												r.f.frame?.systemChars ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
													className: MonitorPanel_module_css_default.ctxSeg,
													"data-kind": "system",
													style: { flexGrow: Math.max(1, r.f.frame.systemChars) },
													title: t("ctx.seg", {
														label: t("ctx.system"),
														c: r.f.frame.systemChars.toLocaleString(),
														n: ctxEst(r.f.frame.systemChars).toLocaleString()
													})
												}) : null,
												(r.f.frame?.messages ?? []).map((m, k) => {
													const c = classifyCtxMsg(m, t);
													return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
														className: `${MonitorPanel_module_css_default.ctxSeg} ${m.compactionId && r.newCpIds.has(m.compactionId) ? MonitorPanel_module_css_default.ctxhNewCp : ""}`,
														"data-kind": c.kind,
														style: { flexGrow: Math.max(1, m.chars) },
														title: t("ctx.seg", {
															label: c.label,
															c: m.chars.toLocaleString(),
															n: ctxEst(m.chars).toLocaleString()
														})
													}, k);
												}),
												r.hit ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
													className: MonitorPanel_module_css_default.ctxhHit,
													style: { width: `${r.hit.pct}%` },
													title: t("ctxh.hit", {
														n: r.hit.cache.toLocaleString(),
														m: (r.hit.cache + r.hit.input).toLocaleString(),
														p: r.hit.pct.toFixed(1)
													})
												}) : null
											]
										})
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
										className: MonitorPanel_module_css_default.ctxhTotal,
										children: [
											"≈",
											ctxEst(r.total).toLocaleString(),
											r.hit ? ` · ${t("ctxh.hitShort", { p: r.hit.pct.toFixed(1) })}` : ""
										]
									})
								]
							})
						] }, r.i))
					}) : null
				]
			});
		}
		/**
		* T4 心跳文案：进行中的一步若正卡在表决 / 补枪 / 收官这几段无输出的等待里，把「在干什么 + 等了多久」
		* 顶到 Live 条上——治「慢与死不可分辨」。没有心跳（快路径 / 心跳关闭 / 段已结束）返回 null，走原「进行中」。
		*/
		function liveStatusText(r, t) {
			const st = r.status;
			if (!st || !st.stage) return null;
			const secs = String(Math.max(0, Math.round((st.elapsedMs ?? 0) / 1e3)));
			const key = `live.status.${st.stage}`;
			const label = t(key, { secs });
			return label === key ? t("live.status", { secs }) : label;
		}
		/** 头部常显 Live 条：最新一步状态 + 每魂稿件进度 + 最新思考预览（点击直达该步全文，不用翻页找）。 */
		function LiveStrip({ latest, full, stats, souls, live, t, fmtAgo, resultName, onOpen }) {
			if (!latest) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: MonitorPanel_module_css_default.liveStrip,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: MonitorPanel_module_css_default.liveRow,
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: MonitorPanel_module_css_default.liveTitle,
						children: t("live.title")
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("live.none") })]
				})
			});
			const g = resultGlyph(latest);
			const fullRound = full && full !== "loading" && full !== "missing" ? full : null;
			const liveNow = latest.inflight ? live && Object.keys(live).length ? live : fullRound?.live ?? null : null;
			let think = null;
			let thinkSoul = null;
			if (fullRound) for (let i = fullRound.drafts.length - 1; i >= 0; i--) {
				const d = fullRound.drafts[i];
				const txt = d.thinking || d.reasoning;
				if (txt) {
					think = txt;
					thinkSoul = d.soul;
					break;
				}
			}
			const tail = think ? think.replace(/\s+/g, " ").trim().slice(-220) : null;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: MonitorPanel_module_css_default.liveStrip,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: MonitorPanel_module_css_default.liveRow,
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: MonitorPanel_module_css_default.liveTitle,
							children: t("live.title")
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: `${MonitorPanel_module_css_default.tlGlyphInline} ${g.cls}`,
							children: g.glyph
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: latest.inflight ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: MonitorPanel_module_css_default.inflight,
							children: liveStatusText(latest, t) ?? t("souls.running")
						}) : latest.result ? resultName(`${latest.mode}/${latest.result}`) : "—" }),
						latest.winner ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("souls.winner", { name: latest.winner }) }) : null,
						latest.durationMs !== null ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: fmtDuration(latest.durationMs) }) : null,
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: fmtAgo(latest.ts) }),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: MonitorPanel_module_css_default.spacer }),
						souls.map((s, i) => {
							const running = (stats[`soul-${s.name}`]?.inflight ?? 0) > 0;
							const ds = fullRound ? fullRound.drafts.filter((d) => d.soul === s.name) : [];
							const d = ds.length ? ds[ds.length - 1] : null;
							return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
								className: MonitorPanel_module_css_default.liveChip,
								title: s.title ?? void 0,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: MonitorPanel_module_css_default.liveDot,
									"data-tone": i % 4,
									"data-running": running || void 0
								}), running ? t("live.soul.running", { name: s.name }) : d ? t("live.soul.chip", {
									name: s.name,
									think: fmtNum(d.reasoningChars || (d.thinking?.length ?? 0)),
									tools: d.toolCalls
								}) + (d.error ? " ✗" : "") : t("live.soul.pending", { name: s.name })]
							}, s.name);
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
							variant: "ghost",
							size: "sm",
							onClick: onOpen,
							children: t("live.open")
						})
					]
				}), liveNow && Object.keys(liveNow).length ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: MonitorPanel_module_css_default.liveCols,
					children: souls.filter((s) => liveNow[s.name]).map((s, i) => {
						const v = liveNow[s.name];
						return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: MonitorPanel_module_css_default.liveCol,
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: MonitorPanel_module_css_default.liveColHead,
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: MonitorPanel_module_css_default.liveDot,
											"data-tone": i % 4,
											"data-running": true
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: MonitorPanel_module_css_default.liveColName,
											children: s.name
										}),
										v.attempt !== null && v.attempt > 1 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: MonitorPanel_module_css_default.liveColAttempt,
											children: t("live.col.attempt", { n: v.attempt })
										}) : null,
										v.round !== null && v.round > 1 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: MonitorPanel_module_css_default.liveColAttempt,
											children: t("live.col.round", { n: v.round })
										}) : null,
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: MonitorPanel_module_css_default.spacer }),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: MonitorPanel_module_css_default.liveColMeta,
											children: t("live.col.meta", {
												think: fmtNum(v.reasoningChars),
												text: fmtNum(v.textChars)
											})
										})
									]
								}),
								v.reasoningTail ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									className: MonitorPanel_module_css_default.liveColThink,
									children: v.reasoningTail
								}) : null,
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									className: MonitorPanel_module_css_default.liveColText,
									children: v.textTail || t("live.col.waiting")
								})
							]
						}, s.name);
					})
				}) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: MonitorPanel_module_css_default.liveThink,
					onClick: onOpen,
					role: "button",
					tabIndex: 0,
					onKeyDown: (ev) => {
						if (ev.key === "Enter" || ev.key === " ") {
							ev.preventDefault();
							onOpen();
						}
					},
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
						className: MonitorPanel_module_css_default.liveThinkLabel,
						children: [t("live.think"), thinkSoul ? ` · ${thinkSoul}` : ""]
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: MonitorPanel_module_css_default.liveThinkText,
						children: tail ?? t("live.think.none")
					})]
				})]
			});
		}
		function TrendPanel({ rounds, timeline, souls, selected, onSelect, t, resultName, aiName }) {
			const [wrapRef, wrapW] = useWidth();
			const asc = (0, react.useMemo)(() => [...rounds].sort((a, b) => a.ts - b.ts), [rounds]);
			const names = (0, react.useMemo)(() => {
				const list = souls.map((s) => s.name);
				for (const r of asc) if (r.winner && !list.includes(r.winner)) list.push(r.winner);
				return list;
			}, [souls, asc]);
			const toneOfSoul = (name) => {
				const i = name ? names.indexOf(name) : -1;
				return i >= 0 ? i % 4 : -1;
			};
			const wins = names.map((n) => ({
				name: n,
				wins: asc.filter((r) => r.winner === n && !r.inflight).length
			}));
			const decided = asc.filter((r) => r.winner && !r.inflight).length;
			const maxDur = Math.max(1, ...asc.map((r) => r.durationMs ?? 0));
			const ctx = (0, react.useMemo)(() => {
				const stepIdx = new Map(asc.map((r, i) => [String(r.turnId), i]));
				const ids = [];
				const series = /* @__PURE__ */ new Map();
				for (const e of timeline) {
					if (typeof e.tokens !== "number") continue;
					let i = -1;
					if (e.turnId !== null && e.turnId !== void 0 && stepIdx.has(String(e.turnId))) i = stepIdx.get(String(e.turnId));
					else for (let k = 0; k < asc.length; k++) if (asc[k].ts <= e.ts) i = k;
					else break;
					if (i < 0) continue;
					let arr = series.get(e.id);
					if (!arr) {
						arr = new Array(asc.length).fill(null);
						series.set(e.id, arr);
						ids.push(e.id);
					}
					arr[i] = Math.max(arr[i] ?? 0, e.tokens);
				}
				const order = (id) => {
					const si = names.indexOf(id.replace(/^soul-/, ""));
					if (id.startsWith("soul-") && si >= 0) return si;
					const hi = CTX_HUB_KINDS.indexOf(id);
					return hi >= 0 ? 100 + hi : 200;
				};
				ids.sort((a, b) => order(a) - order(b));
				let max = 1;
				for (const arr of series.values()) for (const v of arr) if (v !== null && v > max) max = v;
				return {
					ids,
					series,
					max
				};
			}, [
				asc,
				timeline,
				names
			]);
			const seriesTone = (id) => {
				if (id.startsWith("soul-")) {
					const i = names.indexOf(id.slice(5));
					if (i >= 0) return { tone: i % 4 };
				}
				return { kind: CTX_HUB_KINDS.includes(id) ? id : "other" };
			};
			const n = asc.length, PAD_L = 36, PAD_R = 8, H_W = 40, H_C = 64;
			const COL = Math.max(9, Math.min(36, Math.floor(Math.max(0, wrapW - PAD_L - PAD_R) / Math.max(1, n))));
			const width = 44 + n * COL;
			const height = 132;
			const xOf = (i) => PAD_L + i * COL + COL / 2;
			const yCtx = (v) => 118 - Math.round(v / ctx.max * H_C);
			const barW = Math.max(4, COL - 3);
			const hasCtx = ctx.ids.length > 0;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
				className: MonitorPanel_module_css_default.trendPanel,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: MonitorPanel_module_css_default.trendHead,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: MonitorPanel_module_css_default.trendTitle,
							children: t("trend.title")
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: MonitorPanel_module_css_default.roundsHint,
							children: t("trend.hint")
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: MonitorPanel_module_css_default.trendLegendRow,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: MonitorPanel_module_css_default.trendLegendLabel,
								children: t("trend.winner")
							}),
							wins.map((w) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
								className: MonitorPanel_module_css_default.trendChip,
								"data-tone": toneOfSoul(w.name),
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("i", { className: MonitorPanel_module_css_default.trendSwatch }),
									t("ai.soul", { name: w.name }),
									" ",
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("b", { children: w.wins }),
									decided ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
										className: MonitorPanel_module_css_default.trendPct,
										children: [" ", fmtPct(w.wins, decided)]
									}) : null
								]
							}, w.name)),
							decided < asc.length ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: MonitorPanel_module_css_default.trendPct,
								children: t("trend.undecided", { n: asc.length - decided })
							}) : null
						]
					}),
					hasCtx ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: MonitorPanel_module_css_default.trendLegendRow,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: MonitorPanel_module_css_default.trendLegendLabel,
							children: t("trend.context")
						}), ctx.ids.map((id) => {
							const vals = ctx.series.get(id).filter((v) => v !== null);
							const last = vals.length ? vals[vals.length - 1] : 0;
							const peak = vals.length ? Math.max(...vals) : 0;
							const tk = seriesTone(id);
							return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
								className: `${MonitorPanel_module_css_default.trendChip} ${MonitorPanel_module_css_default.ctxSeries}`,
								"data-tone": tk.tone,
								"data-kind": tk.kind,
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("i", { className: `${MonitorPanel_module_css_default.trendSwatch} ${MonitorPanel_module_css_default.trendSwatchLine}` }),
									aiName(id),
									" ",
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("b", { children: fmtK(last) }),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
										className: MonitorPanel_module_css_default.trendPct,
										children: [" ", t("ctx.peak", { n: fmtK(peak) })]
									})
								]
							}, id);
						})]
					}) : null,
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						ref: wrapRef,
						className: MonitorPanel_module_css_default.trendScroll,
						children: wrapW > 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
							className: MonitorPanel_module_css_default.trendSvg,
							width,
							height,
							viewBox: `0 0 ${width} ${height}`,
							role: "img",
							"aria-label": t("trend.title"),
							children: [
								asc.map((r, i) => {
									const key = String(r.turnId);
									return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("rect", {
										className: `${MonitorPanel_module_css_default.trendColBg} ${selected === key ? MonitorPanel_module_css_default.trendColSel : ""}`,
										x: PAD_L + i * COL,
										y: 0,
										width: COL,
										height: 120,
										onClick: () => onSelect(selected === key ? null : key)
									}, `c${key}`);
								}),
								asc.map((r, i) => {
									const key = String(r.turnId);
									const h = r.inflight ? H_W * .5 : Math.max(3, Math.round((r.durationMs ?? 0) / maxDur * H_W));
									const tone = toneOfSoul(r.winner);
									const cls = r.inflight ? MonitorPanel_module_css_default.tlRunning : tone < 0 ? MonitorPanel_module_css_default.tlError : "";
									const tip = `#${i + 1} · ${r.inflight ? t("souls.running") : r.result ? resultName(`${r.mode}/${r.result}`) : ""}${r.winner ? ` · ${t("souls.winner", { name: r.winner })}` : ""}${r.durationMs !== null ? ` · ${fmtDuration(r.durationMs)}` : ""}`;
									return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("rect", {
										x: xOf(i) - barW / 2,
										y: 44 - h,
										width: barW,
										height: h,
										rx: 1.5,
										className: `${MonitorPanel_module_css_default.trendBar} ${cls}`,
										"data-tone": tone >= 0 ? tone : void 0,
										"data-selected": selected === key || void 0,
										onClick: () => onSelect(selected === key ? null : key),
										children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("title", { children: tip })
									}, key);
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("line", {
									className: MonitorPanel_module_css_default.ctxGrid,
									x1: PAD_L,
									x2: width - PAD_R,
									y1: 44.5,
									y2: 44.5
								}),
								hasCtx ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
									[1, .5].map((f) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("g", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("line", {
										className: MonitorPanel_module_css_default.ctxGrid,
										x1: PAD_L,
										x2: width - PAD_R,
										y1: yCtx(ctx.max * f),
										y2: yCtx(ctx.max * f)
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("text", {
										className: MonitorPanel_module_css_default.ctxAxis,
										x: 32,
										y: yCtx(ctx.max * f) + 3,
										textAnchor: "end",
										children: fmtK(Math.round(ctx.max * f))
									})] }, f)),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("line", {
										className: MonitorPanel_module_css_default.ctxGrid,
										x1: PAD_L,
										x2: width - PAD_R,
										y1: yCtx(0),
										y2: yCtx(0)
									}),
									ctx.ids.map((id) => {
										const pts = ctx.series.get(id).map((v, i) => v === null ? null : {
											x: xOf(i),
											y: yCtx(v),
											v,
											i
										}).filter((p) => p !== null);
										if (!pts.length) return null;
										const tk = seriesTone(id);
										return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("g", {
											className: MonitorPanel_module_css_default.ctxSeries,
											"data-tone": tk.tone,
											"data-kind": tk.kind,
											children: [pts.length > 1 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("polyline", {
												className: MonitorPanel_module_css_default.ctxLine,
												points: pts.map((p) => `${p.x},${p.y}`).join(" ")
											}) : null, pts.map((p) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("circle", {
												className: MonitorPanel_module_css_default.ctxDot,
												cx: p.x,
												cy: p.y,
												r: COL >= 14 ? 2.2 : 1.6,
												children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("title", { children: `#${p.i + 1} · ${aiName(id)} · ${fmtNum(p.v)} tokens` })
											}, p.i))]
										}, id);
									})
								] }) : null,
								asc.map((r, i) => n <= 10 || i % 5 === 4 || i === n - 1 ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("text", {
									className: MonitorPanel_module_css_default.ctxAxis,
									x: xOf(i),
									y: 129,
									textAnchor: "middle",
									children: ["#", i + 1]
								}, `x${String(r.turnId)}`) : null)
							]
						}) : null
					})
				]
			});
		}
		function RecentCalls({ recent, t, aiName, stageName, souls, fmtAgo }) {
			const [who, setWho] = (0, react.useState)("all");
			const [errorsOnly, setErrorsOnly] = (0, react.useState)(false);
			const kinds = (0, react.useMemo)(() => {
				const ids = [...new Set(recent.map((r) => r.id))];
				const order = (id) => {
					const si = souls.findIndex((s) => `soul-${s.name}` === id);
					if (si >= 0) return si;
					if (id === "main") return 100;
					return 200 + id.charCodeAt(0);
				};
				return ids.sort((a, b) => order(a) - order(b));
			}, [recent, souls]);
			const errCount = recent.filter((r) => r.error).length;
			const rows = recent.filter((r) => (who === "all" || r.id === who) && (!errorsOnly || r.error)).slice(0, 60);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: MonitorPanel_module_css_default.recentWrap,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: MonitorPanel_module_css_default.recentBar,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Pill, {
								active: who === "all",
								onClick: () => setWho("all"),
								children: t("recent.filter.all", { n: recent.length })
							}),
							kinds.map((id) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Pill, {
								active: who === id,
								onClick: () => setWho(id),
								children: aiName(id)
							}, id)),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: MonitorPanel_module_css_default.spacer }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Pill, {
								active: errorsOnly,
								onClick: () => setErrorsOnly((v) => !v),
								disabled: errCount === 0,
								children: t("recent.filter.errors", { n: errCount })
							})
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("table", {
						className: `${MonitorPanel_module_css_default.table} ${MonitorPanel_module_css_default.recentTable}`,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("tr", { children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("th", { children: t("recent.col.time") }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("th", { children: t("recent.col.who") }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("th", { children: t("recent.col.stage") }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("th", {
								className: MonitorPanel_module_css_default.thNum,
								children: t("recent.col.io")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("th", {
								className: MonitorPanel_module_css_default.thNum,
								children: t("recent.col.duration")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("th", { children: t("recent.col.detail") })
						] }) }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("tbody", { children: rows.map((r, i) => {
							const io = r.unmetered ? t("recent.unmetered", { n: fmtNum(r.unmetered.reasoningChars + r.unmetered.textChars) }) : r.usage ? `${fmtNum(r.usage.inputTokens)} → ${fmtNum(r.usage.outputTokens)}` : r.region ? `${fmtNum(r.region.chars)} chars` : "—";
							const detail = r.error ? `${t("recent.error")}: ${r.error}` : r.note ?? "";
							const route = [r.provider, r.model].filter(Boolean).join(" · ");
							return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("tr", {
								className: r.error ? MonitorPanel_module_css_default.rowError : void 0,
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("td", {
										className: MonitorPanel_module_css_default.tdTime,
										title: new Date(r.ts).toLocaleString(),
										children: fmtAgo(r.ts)
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("td", {
										className: MonitorPanel_module_css_default.tdWho,
										children: aiName(r.id)
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("td", {
										className: MonitorPanel_module_css_default.tdStage,
										title: route || void 0,
										children: [stageName(r.stage), r.effort ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
											className: MonitorPanel_module_css_default.dim,
											children: [" · ", r.effort]
										}) : null]
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("td", {
										className: `${MonitorPanel_module_css_default.tdTokens} ${MonitorPanel_module_css_default.tdNum}`,
										title: r.usage?.cacheReadTokens ? t("recent.cache", { n: fmtNum(r.usage.cacheReadTokens) }) : void 0,
										children: io
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("td", {
										className: `${MonitorPanel_module_css_default.tdDur} ${MonitorPanel_module_css_default.tdNum}`,
										children: fmtDuration(r.durationMs)
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("td", {
										className: r.error ? MonitorPanel_module_css_default.tdErr : MonitorPanel_module_css_default.tdNote,
										title: detail || void 0,
										children: detail
									})
								]
							}, `${r.ts}-${i}`);
						}) })]
					}),
					rows.length === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: MonitorPanel_module_css_default.placeholder,
						children: t("recent.empty.filtered")
					}) : null
				]
			});
		}
		const LANE_H = 20;
		const COL_W = 60;
		const LABEL_W = 104;
		const HEAD_H = 56;
		const HUB_LANES = [
			"surgeon",
			"canvas",
			"memory"
		];
		/** 阶段 → 泳道条颜色类 */
		function stageTone(id, stage, ok) {
			if (!ok) return MonitorPanel_module_css_default.tlError;
			if (stage === "draft") return MonitorPanel_module_css_default.tlDraft;
			if (stage === "vote") return MonitorPanel_module_css_default.tlVote;
			if (id === "surgeon") return MonitorPanel_module_css_default.tlSurgery;
			if (id === "canvas") return MonitorPanel_module_css_default.tlCanvas;
			if (id === "memory") return MonitorPanel_module_css_default.tlMemory;
			return MonitorPanel_module_css_default.tlOther;
		}
		/** 步骤结果 → 裁决行符号 */
		function resultGlyph(r) {
			if (r.inflight) return {
				glyph: "●",
				cls: MonitorPanel_module_css_default.tlRunning
			};
			if (r.result === "identical") return {
				glyph: "=",
				cls: MonitorPanel_module_css_default.tlIdentical
			};
			if (r.mode === "solo") return {
				glyph: "◆",
				cls: MonitorPanel_module_css_default.tlSolo
			};
			if (r.result === "aborted" || r.result === "all-dead" || r.mode === "fallback") return {
				glyph: "✗",
				cls: MonitorPanel_module_css_default.tlError
			};
			if (r.result === "winner") return {
				glyph: "✓",
				cls: MonitorPanel_module_css_default.tlVote
			};
			if (r.mode === "single") return {
				glyph: "→",
				cls: MonitorPanel_module_css_default.tlVote
			};
			return {
				glyph: "·",
				cls: MonitorPanel_module_css_default.tlOther
			};
		}
		function Trajectory({ rounds, timeline, souls, selected, onSelect, t, aiName, stageName, resultName, now, showSession }) {
			const scrollRef = (0, react.useRef)(null);
			const lastCount = (0, react.useRef)(0);
			const model = (0, react.useMemo)(() => {
				const steps = [...rounds].sort((a, b) => a.ts - b.ts).map((r) => ({
					r,
					key: String(r.turnId),
					start: r.ts,
					end: r.inflight ? Math.max(now, r.ts + 1) : r.ts + Math.max(r.durationMs ?? 0, 1)
				}));
				const groups = [];
				steps.forEach((s, i) => {
					const gk = `${s.r.sessionId ?? ""}#${s.r.promptSeq ?? `p:${s.r.prompt ?? ""}`}`;
					const last = groups[groups.length - 1];
					if (last && last.key === gk) last.to = i;
					else groups.push({
						key: gk,
						from: i,
						to: i,
						label: s.r.prompt ?? "",
						sid: s.r.sessionId ?? null
					});
				});
				const perStep = steps.map(() => []);
				for (const e of timeline) {
					if (e.id === "main") continue;
					let idx = e.turnId !== void 0 && e.turnId !== null ? steps.findIndex((s) => s.key === String(e.turnId)) : -1;
					if (idx < 0) {
						idx = -1;
						for (let i = 0; i < steps.length; i++) if (steps[i].start <= e.ts) idx = i;
						else break;
					}
					if (idx < 0) idx = 0;
					if (steps.length) perStep[idx].push(e);
				}
				return {
					steps,
					groups,
					perStep,
					laneIds: [
						...souls.map((s) => `soul-${s.name}`),
						...Array.from(new Set(timeline.filter((e) => e.id.startsWith("soul-")).map((e) => e.id))).filter((id) => !souls.some((s) => `soul-${s.name}` === id)),
						...HUB_LANES
					]
				};
			}, [
				rounds,
				timeline,
				souls,
				now
			]);
			(0, react.useEffect)(() => {
				const el = scrollRef.current;
				if (!el) return;
				if (model.steps.length > lastCount.current) el.scrollLeft = el.scrollWidth;
				lastCount.current = model.steps.length;
			}, [model.steps.length]);
			const { steps, groups, perStep, laneIds } = model;
			if (steps.length === 0) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: MonitorPanel_module_css_default.placeholder,
				children: t("trajectory.empty")
			});
			const width = LABEL_W + steps.length * COL_W + 8;
			const height = HEAD_H + laneIds.length * LANE_H + 6;
			const laneY = (i) => HEAD_H + LANE_H * (i + 1);
			const colX = (i) => LABEL_W + i * COL_W;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: MonitorPanel_module_css_default.tlWrap,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: MonitorPanel_module_css_default.tlScroll,
					ref: scrollRef,
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
						className: MonitorPanel_module_css_default.tlSvg,
						width,
						height,
						viewBox: `0 0 ${width} ${height}`,
						role: "img",
						"aria-label": t("trajectory.title"),
						children: [
							groups.map((g, gi) => {
								const x = colX(g.from), w = COL_W * (g.to - g.from + 1);
								const maxChars = Math.max(2, Math.floor((w - 12) / 6.5));
								const label = (showSession && g.sid ? `[${g.sid.slice(0, 6)}] ` : "") + (g.label || t("souls.prompt.none"));
								const text = label.length > maxChars ? `${label.slice(0, maxChars - 1)}…` : label;
								return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("g", {
									className: MonitorPanel_module_css_default.tlGroup,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("rect", {
										x: x + 1,
										y: 2,
										width: w - 2,
										height: 16,
										rx: 3,
										className: gi % 2 ? MonitorPanel_module_css_default.tlGroupAlt : MonitorPanel_module_css_default.tlGroupBg
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("text", {
										x: x + 6,
										y: 14,
										className: MonitorPanel_module_css_default.tlGroupText,
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("title", { children: label }), text]
									})]
								}, `g-${gi}`);
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("text", {
								x: 4,
								y: laneY(-1) - 6,
								className: MonitorPanel_module_css_default.tlLaneLabel,
								children: t("trajectory.lane.verdict")
							}),
							laneIds.map((id, li) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("text", {
								x: 4,
								y: laneY(li) - 6,
								className: MonitorPanel_module_css_default.tlLaneLabel,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("title", { children: aiName(id) }), aiName(id).length > 14 ? `${aiName(id).slice(0, 13)}…` : aiName(id)]
							}, id)),
							[...Array(laneIds.length + 1)].map((_, i) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("line", {
								x1: LABEL_W,
								x2: width - 4,
								y1: laneY(i - 1),
								y2: laneY(i - 1),
								className: MonitorPanel_module_css_default.tlGrid
							}, `hl-${i}`)),
							steps.map((s, ci) => {
								const x0 = colX(ci);
								const span = Math.max(1, s.end - s.start);
								const inner = 54;
								const g = resultGlyph(s.r);
								const isSel = selected === s.key;
								const summaryText = `#${ci + 1} · ${s.r.inflight ? t("souls.running") : s.r.result ? resultName(`${s.r.mode}/${s.r.result}`) : ""}${s.r.winner ? ` · ${t("souls.winner", { name: s.r.winner })}` : ""}${s.r.durationMs !== null ? ` · ${fmtDuration(s.r.durationMs)}` : ""}`;
								return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("g", {
									className: MonitorPanel_module_css_default.tlCol,
									"data-selected": isSel || void 0,
									onClick: () => onSelect(isSel ? null : s.key),
									role: "button",
									tabIndex: 0,
									onKeyDown: (ev) => {
										if (ev.key === "Enter" || ev.key === " ") {
											ev.preventDefault();
											onSelect(isSel ? null : s.key);
										}
									},
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("rect", {
											x: x0,
											y: 20,
											width: COL_W,
											height: height - 24,
											className: MonitorPanel_module_css_default.tlColBg
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("title", { children: summaryText }),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("text", {
											x: x0 + 4,
											y: 32,
											className: MonitorPanel_module_css_default.tlStepNo,
											children: ci + 1
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("text", {
											x: x0 + COL_W / 2,
											y: laneY(-1) - 5,
											textAnchor: "middle",
											className: `${MonitorPanel_module_css_default.tlGlyph} ${g.cls}`,
											children: [g.glyph, s.r.winner && !s.r.inflight ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("tspan", {
												className: MonitorPanel_module_css_default.tlWinner,
												children: [" ", s.r.winner]
											}) : null]
										}),
										s.r.durationMs !== null && !s.r.inflight ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("text", {
											x: x0 + COL_W - 3,
											y: 32,
											textAnchor: "end",
											className: MonitorPanel_module_css_default.tlDur,
											children: fmtDuration(s.r.durationMs)
										}) : null,
										laneIds.map((id, li) => perStep[ci].filter((e) => e.id === id).map((e, ei) => {
											const rel = Math.min(1, Math.max(0, (e.ts - s.start) / span));
											let rx = x0 + 3 + rel * inner;
											const rawW = e.durationMs ? e.durationMs / span * inner : 0;
											let rw = rawW > 0 ? Math.max(3, rawW) : 0;
											if (rx + rw > x0 + 3 + inner) {
												rw = Math.max(rw > 0 ? 3 : 0, x0 + 3 + inner - rx);
												if (rw === 3) rx = Math.min(rx, x0 + inner);
											}
											const cls = stageTone(e.id, e.stage, e.ok);
											const tip = `${aiName(e.id)} · ${stageName(e.stage)}${e.durationMs !== null ? ` · ${fmtDuration(e.durationMs)}` : ""}${e.tokens ? ` · ${fmtNum(e.tokens)}→${fmtNum(e.out ?? 0)}` : ""}${e.note ? ` · ${e.note}` : ""}${e.error ? ` · ✗ ${e.error}` : ""}`;
											const pick = e.stage === "vote" ? s.r.ballot?.picks?.find((p) => `soul-${p.soul}` === id) : void 0;
											const pickLabel = pick ? (pick.reject ? "✗" : pick.pick === null || pick.pick === void 0 ? "∅" : `→${pick.pick}`) + (pick.via === "text" ? "*" : "") : null;
											return rw > 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("g", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("rect", {
												x: rx,
												y: laneY(li) - LANE_H + 5,
												width: rw,
												height: 11,
												rx: 2,
												className: `${MonitorPanel_module_css_default.tlBar} ${cls}`,
												children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("title", { children: [tip, pickLabel ? ` · ${pickLabel}` : ""] })
											}), pickLabel ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("text", {
												x: Math.min(rx + rw + 2, x0 + COL_W - 14),
												y: laneY(li) - 6,
												className: MonitorPanel_module_css_default.tlPick,
												children: pickLabel
											}) : null] }, `${id}-${ei}`) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("circle", {
												cx: rx + 1,
												cy: laneY(li) - LANE_H / 2,
												r: 3.2,
												className: `${MonitorPanel_module_css_default.tlDot} ${cls}`,
												children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("title", { children: tip })
											}, `${id}-${ei}`);
										})),
										isSel ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("rect", {
											x: x0 + .5,
											y: 20.5,
											width: 59,
											height: height - 25,
											className: MonitorPanel_module_css_default.tlSelected
										}) : null
									]
								}, s.key);
							})
						]
					})
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: MonitorPanel_module_css_default.tlLegend,
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
							className: MonitorPanel_module_css_default.tlLegendItem,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("i", { className: `${MonitorPanel_module_css_default.tlSwatch} ${MonitorPanel_module_css_default.tlDraft}` }), t("stage.draft")]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
							className: MonitorPanel_module_css_default.tlLegendItem,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("i", { className: `${MonitorPanel_module_css_default.tlSwatch} ${MonitorPanel_module_css_default.tlVote}` }), t("stage.vote")]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
							className: MonitorPanel_module_css_default.tlLegendItem,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("i", { className: `${MonitorPanel_module_css_default.tlSwatch} ${MonitorPanel_module_css_default.tlSurgery}` }), t("ai.surgeon")]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
							className: MonitorPanel_module_css_default.tlLegendItem,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("i", { className: `${MonitorPanel_module_css_default.tlSwatch} ${MonitorPanel_module_css_default.tlCanvas}` }), t("ai.canvas")]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
							className: MonitorPanel_module_css_default.tlLegendItem,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("i", { className: `${MonitorPanel_module_css_default.tlSwatch} ${MonitorPanel_module_css_default.tlMemory}` }), t("ai.memory")]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
							className: MonitorPanel_module_css_default.tlLegendItem,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("i", { className: `${MonitorPanel_module_css_default.tlSwatch} ${MonitorPanel_module_css_default.tlError}` }), t("trajectory.legend.error")]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: MonitorPanel_module_css_default.tlLegendItem,
							children: t("trajectory.legend.verdict")
						})
					]
				})]
			});
		}
		/** 评测指标区块：共识健康 / 压缩健康 / 思考用量三组卡片；每组无数据时给占位文案。 */
		function MetricsSection({ metrics, memoryHealth, fmtAgo, t, soulName }) {
			const mc = metrics.consensus;
			const mp = metrics.compaction;
			const mr = metrics.reasoning;
			const efforts = Object.entries(mr.efforts).sort(([a], [b]) => a.localeCompare(b));
			const voteTotal = efforts.filter(([k]) => k.startsWith("vote/")).reduce((n, [, b]) => n + b.count, 0);
			const voteOff = mr.efforts["vote/off"]?.count ?? 0;
			const hasConsensus = mc.started > 0 || mc.done > 0;
			const hasCompaction = mp.surgeries > 0 || mp.probes.total > 0;
			const mm = metrics.memory;
			const mh = memoryHealth;
			const hasMemory = !!mm && (mm.recalls.total > 0 || mm.rawRecalls.total > 0 || mm.digests.total > 0 || mm.injections.total > 0 || mm.curates.total > 0) || !!mh && mh.active > 0;
			const hasReasoning = efforts.length > 0 || mr.stageChars.draft.count > 0 || mr.stageChars.vote.count > 0;
			const avg = (slot) => slot.count > 0 ? Math.round(slot.sum / slot.count) : null;
			const wins = Object.entries(mc.winsBySoul);
			const winsTotal = wins.reduce((n, [, c]) => n + c, 0);
			const picks = Object.entries(mc.picksByLabel).sort(([a], [b]) => Number(a) - Number(b));
			const stageLabel = (stage) => {
				const r = t(`stage.${stage}`);
				return r === `stage.${stage}` ? stage : r;
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("section", {
				className: MonitorPanel_module_css_default.metrics,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: MonitorPanel_module_css_default.mGroups,
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
							className: MonitorPanel_module_css_default.mGroup,
							"data-metric": "consensus",
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: MonitorPanel_module_css_default.mGroupHead,
								children: t("metrics.group.consensus")
							}), !hasConsensus ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: MonitorPanel_module_css_default.emptyBlock,
								children: t("metrics.empty.consensus")
							}) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("dl", {
									className: MonitorPanel_module_css_default.metricStats,
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											className: MonitorPanel_module_css_default.statRow,
											children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dt", { children: t("metrics.turns") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("dd", { children: fmtNum(mc.completed) })]
										}),
										mc.aborted > 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											className: MonitorPanel_module_css_default.statRow,
											children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dt", { children: t("metrics.aborted") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("dd", { children: fmtNum(mc.aborted) })]
										}) : null,
										/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											className: MonitorPanel_module_css_default.statRow,
											children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dt", { children: t("metrics.identicalRate") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("dd", { children: fmtPct(mc.identical, mc.completed) })]
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											className: MonitorPanel_module_css_default.statRow,
											children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dt", { children: t("metrics.tieRate") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("dd", { children: fmtPct(mc.tieBreaks, mc.winner) })]
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											className: MonitorPanel_module_css_default.statRow,
											children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dt", { children: t("metrics.abstainRate") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("dd", { children: fmtPct(mc.abstentions, mc.ballots) })]
										}),
										mc.ballotVia && mc.ballotVia.tool + mc.ballotVia.text + mc.ballotVia.none > 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											className: MonitorPanel_module_css_default.statRow,
											"data-wide": true,
											children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dt", { children: t("metrics.ballotVia") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("dd", { children: t("metrics.ballotViaValue", {
												tool: fmtPct(mc.ballotVia.tool, mc.ballotVia.tool + mc.ballotVia.text + mc.ballotVia.none),
												text: mc.ballotVia.text,
												none: mc.ballotVia.none
											}) })]
										}) : null,
										/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											className: MonitorPanel_module_css_default.statRow,
											children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dt", { children: t("metrics.timeouts") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("dd", {
												className: mc.soulTimeouts ? MonitorPanel_module_css_default.errorValue : void 0,
												children: fmtNum(mc.soulTimeouts)
											})]
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											className: MonitorPanel_module_css_default.statRow,
											children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dt", { children: t("metrics.failures") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("dd", {
												className: mc.soulFailures ? MonitorPanel_module_css_default.errorValue : void 0,
												children: fmtNum(mc.soulFailures)
											})]
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											className: MonitorPanel_module_css_default.statRow,
											children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dt", { children: t("metrics.retries") }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("dd", { children: [fmtNum(mc.soulRetries ?? 0), (mc.soulRetries ?? 0) > 0 ? ` · ${t("metrics.retryRecovered", { n: mc.retryRecovered ?? 0 })}` : ""] })]
										}),
										(mc.truncated ?? 0) > 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											className: MonitorPanel_module_css_default.statRow,
											children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dt", { children: t("metrics.truncated") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("dd", {
												className: MonitorPanel_module_css_default.errorValue,
												children: fmtNum(mc.truncated ?? 0)
											})]
										}) : null,
										/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											className: MonitorPanel_module_css_default.statRow,
											"data-wide": true,
											children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dt", { children: t("metrics.inner") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("dd", { children: (mc.innerCalls ?? 0) > 0 ? t("metrics.innerValue", {
												calls: mc.innerCalls ?? 0,
												errors: mc.innerErrors ?? 0,
												chars: fmtNum(mc.innerChars ?? 0),
												drafts: mc.innerDrafts ?? 0
											}) : t("metrics.nodata") })]
										}),
										mc.divergence && mc.divergence.ballots > 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											className: MonitorPanel_module_css_default.statRow,
											"data-wide": true,
											children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dt", { children: t("metrics.divergence") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("dd", { children: t("metrics.divergenceValue", {
												pct: fmtPct(mc.divergence.withFork, mc.divergence.ballots),
												fork: mc.divergence.withFork,
												ballots: mc.divergence.ballots,
												solo: mc.tips?.solo ?? 0,
												final: mc.tips?.final ?? 0
											}) })]
										}) : null,
										mc.solo && mc.solo.runs > 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											className: MonitorPanel_module_css_default.statRow,
											children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dt", { children: t("metrics.solo") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("dd", {
												className: mc.solo.failed > 0 ? MonitorPanel_module_css_default.errorValue : void 0,
												children: t("metrics.soloValue", {
													runs: mc.solo.runs,
													failed: mc.solo.failed
												})
											})]
										}) : null,
										mc.innerByTool && Object.keys(mc.innerByTool).length > 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											className: MonitorPanel_module_css_default.statRow,
											"data-wide": true,
											children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dt", { children: t("metrics.innerByTool") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("dd", { children: Object.entries(mc.innerByTool).sort(([, a], [, b]) => b - a).map(([name, n]) => `${name}×${n}`).join(" · ") })]
										}) : null,
										mc.fallback > 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											className: MonitorPanel_module_css_default.statRow,
											children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dt", { children: t("metrics.fallbacks") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("dd", { children: fmtNum(mc.fallback) })]
										}) : null,
										/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											className: MonitorPanel_module_css_default.statRow,
											children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dt", { children: t("metrics.avgDuration") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("dd", { children: fmtDuration(avg(mc.duration)) })]
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											className: MonitorPanel_module_css_default.statRow,
											children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dt", { children: t("metrics.voteOffRate") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("dd", { children: fmtPct(voteOff, voteTotal) })]
										})
									]
								}),
								wins.length ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: MonitorPanel_module_css_default.chipRow,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: MonitorPanel_module_css_default.blockLabel,
										children: t("metrics.wins")
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: MonitorPanel_module_css_default.stages,
										children: wins.map(([name, n]) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: MonitorPanel_module_css_default.barChip,
											style: { ["--pct"]: winsTotal ? `${Math.round(n / winsTotal * 100)}%` : "0%" },
											children: t("metrics.winChip", {
												name: soulName(name),
												n,
												pct: fmtPct(n, winsTotal)
											})
										}, name))
									})]
								}) : null,
								picks.length ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: MonitorPanel_module_css_default.chipRow,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: MonitorPanel_module_css_default.blockLabel,
										children: t("metrics.positions")
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: MonitorPanel_module_css_default.stages,
										children: picks.map(([label, c]) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: MonitorPanel_module_css_default.barChip,
											style: { ["--pct"]: `${Math.round(c / Math.max(1, picks.reduce((x, [, y]) => x + y, 0)) * 100)}%` },
											children: t("metrics.positionChip", {
												n: label,
												c
											})
										}, label))
									})]
								}) : null
							] })]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
							className: MonitorPanel_module_css_default.mGroup,
							"data-metric": "compaction",
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: MonitorPanel_module_css_default.mGroupHead,
								children: t("metrics.group.compaction")
							}), !hasCompaction ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: MonitorPanel_module_css_default.emptyBlock,
								children: t("metrics.empty.compaction")
							}) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("dl", {
								className: MonitorPanel_module_css_default.metricStats,
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: MonitorPanel_module_css_default.statRow,
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dt", { children: t("metrics.surgeries") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("dd", { children: fmtNum(mp.surgeries) })]
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: MonitorPanel_module_css_default.statRow,
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dt", { children: t("metrics.surgeryOk") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("dd", { children: fmtNum(mp.surgeryOk) })]
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: MonitorPanel_module_css_default.statRow,
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dt", { children: t("metrics.surgeryFailed") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("dd", {
											className: mp.surgeryFailed ? MonitorPanel_module_css_default.errorValue : void 0,
											children: fmtNum(mp.surgeryFailed)
										})]
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: MonitorPanel_module_css_default.statRow,
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dt", { children: t("metrics.avgRegion") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("dd", { children: mp.regionChars.count ? t("metrics.charsValue", { n: fmtNum(avg(mp.regionChars)) }) : t("metrics.nodata") })]
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: MonitorPanel_module_css_default.statRow,
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dt", { children: t("metrics.ratio") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("dd", { children: mp.ratio.count ? t("metrics.ratioValue", {
											inChars: fmtNum(mp.ratio.inChars),
											out: fmtNum(mp.ratio.outChars),
											pct: fmtPct(mp.ratio.outChars, mp.ratio.inChars)
										}) : t("metrics.nodata") })]
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: MonitorPanel_module_css_default.statRow,
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dt", { children: t("metrics.probes") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("dd", { children: mp.probes.total ? t("metrics.probesValue", {
											passed: mp.probes.passed,
											total: mp.probes.total,
											pct: fmtPct(mp.probes.passed, mp.probes.total)
										}) + (mp.probePatched ? t("metrics.probePatched", { n: mp.probePatched }) : "") : t("metrics.nodata") })]
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: MonitorPanel_module_css_default.statRow,
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dt", { children: t("metrics.cooldowns") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("dd", {
											className: mp.cooldowns ? MonitorPanel_module_css_default.errorValue : void 0,
											children: fmtNum(mp.cooldowns)
										})]
									}),
									mp.shadows && mp.shadows.sweeps > 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: MonitorPanel_module_css_default.statRow,
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dt", { children: t("metrics.shadows") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("dd", { children: t("metrics.shadowsValue", {
											sweeps: mp.shadows.sweeps,
											versions: mp.shadows.versions
										}) })]
									}) : null
								]
							})]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
							className: MonitorPanel_module_css_default.mGroup,
							"data-metric": "memory",
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: MonitorPanel_module_css_default.mGroupHead,
								children: t("metrics.group.memory")
							}), !hasMemory || !mm ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: MonitorPanel_module_css_default.emptyBlock,
								children: t("metrics.empty.memory")
							}) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("dl", {
								className: MonitorPanel_module_css_default.metricStats,
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: MonitorPanel_module_css_default.statRow,
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dt", { children: t("metrics.recallHit") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("dd", { children: mm.recalls.total ? t("metrics.recallHitValue", {
											hit: mm.recalls.hit,
											total: mm.recalls.total,
											pct: fmtPct(mm.recalls.hit, mm.recalls.total),
											items: mm.recalls.items
										}) : t("metrics.nodata") })]
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: MonitorPanel_module_css_default.statRow,
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dt", { children: t("metrics.rawRecalls") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("dd", { children: mm.rawRecalls.total ? t("metrics.rawRecallsValue", {
											n: mm.rawRecalls.total,
											items: mm.rawRecalls.items
										}) : t("metrics.nodata") })]
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: MonitorPanel_module_css_default.statRow,
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dt", { children: t("metrics.recallAfterSurgery") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("dd", { children: mm.recallAfterSurgery.surgeries ? t("metrics.recallAfterSurgeryValue", {
											recalled: mm.recallAfterSurgery.recalled,
											total: mm.recallAfterSurgery.surgeries,
											pct: fmtPct(mm.recallAfterSurgery.recalled, mm.recallAfterSurgery.surgeries)
										}) : t("metrics.nodata") })]
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: MonitorPanel_module_css_default.statRow,
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dt", { children: t("metrics.digests") }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("dd", { children: [t("metrics.digestsValue", {
											ok: mm.digests.ok,
											total: mm.digests.total,
											added: mm.digests.added,
											updated: mm.digests.updated,
											retired: mm.digests.retired
										}), mm.digests.noJson || mm.digests.truncated ? ` · ${t("metrics.digestsBad", {
											noJson: mm.digests.noJson,
											truncated: mm.digests.truncated
										})}` : ""] })]
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: MonitorPanel_module_css_default.statRow,
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dt", { children: t("metrics.curates") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("dd", { children: mm.curates.total ? t("metrics.curatesValue", {
											ok: mm.curates.ok,
											total: mm.curates.total,
											updated: mm.curates.updated,
											retired: mm.curates.retired
										}) : t("metrics.nodata") })]
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: MonitorPanel_module_css_default.statRow,
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dt", { children: t("metrics.injections") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("dd", { children: mm.injections.total ? t("metrics.injectionsValue", {
											n: mm.injections.total,
											memories: mm.injections.memories
										}) : t("metrics.nodata") })]
									}),
									mh ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: MonitorPanel_module_css_default.statRow,
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dt", { children: t("metrics.neverUsed") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("dd", {
											className: mh.active > 0 && mh.usage.neverUsed / mh.active > .5 ? MonitorPanel_module_css_default.errorValue : void 0,
											children: mh.active ? t("metrics.neverUsedValue", {
												n: mh.usage.neverUsed,
												active: mh.active,
												pct: fmtPct(mh.usage.neverUsed, mh.active),
												injected: mh.usage.injectedTotal,
												recalled: mh.usage.recalledTotal
											}) : t("metrics.nodata")
										})]
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: MonitorPanel_module_css_default.statRow,
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dt", { children: t("metrics.lastCurate") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("dd", { children: mh.curate.lastAt ? t("metrics.lastCurateValue", {
											ago: fmtAgo(mh.curate.lastAt),
											shards: mh.curate.shards.length,
											dirty: mh.curate.shards.filter((s) => s.dirty).length
										}) : t("metrics.lastCurateNever", { shards: mh.curate.shards.length }) })]
									})] }) : null
								]
							})]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
							className: MonitorPanel_module_css_default.mGroup,
							"data-metric": "reasoning",
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: MonitorPanel_module_css_default.mGroupHead,
								children: t("metrics.group.reasoning")
							}), !hasReasoning ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: MonitorPanel_module_css_default.emptyBlock,
								children: t("metrics.empty.reasoning")
							}) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dl", {
								className: MonitorPanel_module_css_default.metricStats,
								children: ["draft", "vote"].map((stage) => {
									const slot = mr.stageChars[stage];
									return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: MonitorPanel_module_css_default.statRow,
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dt", { children: t(`metrics.stageChars.${stage}`) }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("dd", { children: slot.count ? t("metrics.stageCharsValue", {
											sum: fmtNum(slot.sum),
											avg: fmtNum(avg(slot))
										}) : t("metrics.nodata") })]
									}, stage);
								})
							}), efforts.length ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: MonitorPanel_module_css_default.chipRow,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: MonitorPanel_module_css_default.blockLabel,
									children: t("metrics.efforts")
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									className: MonitorPanel_module_css_default.stages,
									children: efforts.map(([key, b]) => {
										const slash = key.indexOf("/");
										const stage = slash < 0 ? key : key.slice(0, slash);
										const effort = slash < 0 ? "" : key.slice(slash + 1);
										return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: MonitorPanel_module_css_default.stageChip,
											children: t("metrics.effortChip", {
												stage: stageLabel(stage),
												effort: effort === "default" ? t("metrics.effort.default") : effort,
												n: b.count,
												d: fmtDuration(b.count ? Math.round(b.durationMs / b.count) : null)
											})
										}, key);
									})
								})]
							}) : null] })]
						})
					]
				})
			});
		}
		/** 展开的单轮全文：按灵魂分组的盲稿（思考/输出两段）+原生思考链、表决理由、最终定稿。 */
		function RoundDetail({ round, t, soulName, tone }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: MonitorPanel_module_css_default.roundBody,
				children: [
					round.prompt ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: MonitorPanel_module_css_default.roundSection,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: MonitorPanel_module_css_default.roundSectionTitle,
							children: t("souls.prompt")
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("pre", {
							className: MonitorPanel_module_css_default.pre,
							children: round.prompt
						})]
					}) : null,
					round.narration ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: MonitorPanel_module_css_default.roundSection,
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("details", {
							className: MonitorPanel_module_css_default.reasonFold,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("summary", {
								className: MonitorPanel_module_css_default.reasonHead,
								children: t("souls.narration")
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("pre", {
								className: `${MonitorPanel_module_css_default.pre} ${MonitorPanel_module_css_default.reasoningPre}`,
								children: round.narration
							})]
						})
					}) : null,
					round.drafts.length ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: MonitorPanel_module_css_default.roundSection,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: MonitorPanel_module_css_default.roundSectionTitle,
							children: t("souls.draft")
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: MonitorPanel_module_css_default.draftGrid,
							children: round.drafts.map((d, i) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: MonitorPanel_module_css_default.draftCard,
								"data-tone": tone(d.soul),
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: MonitorPanel_module_css_default.draftHead,
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: MonitorPanel_module_css_default.draftSoul,
											children: soulName(d.soul)
										}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
											className: MonitorPanel_module_css_default.draftMeta,
											children: [
												d.provider ? `${d.provider} / ${d.model ?? "—"}` : "",
												d.reasoningEffort ? ` · ${t("souls.effort", { effort: d.reasoningEffort })}` : "",
												d.durationMs !== null ? ` · ${fmtDuration(d.durationMs)}` : "",
												(d.attempts ?? 1) > 1 ? ` · ${t("souls.attempts", { n: d.attempts ?? 1 })}` : ""
											]
										})]
									}),
									d.error ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: MonitorPanel_module_css_default.draftError,
										children: [t("souls.error", { message: d.error }), (d.attempts ?? 1) > 1 ? `（${t("souls.retried", { n: (d.attempts ?? 1) - 1 })}）` : ""]
									}) : null,
									d.truncated ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: MonitorPanel_module_css_default.draftError,
										children: t("souls.truncated")
									}) : null,
									d.retries?.length ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: MonitorPanel_module_css_default.blockMeta,
										children: [
											t("souls.retryTrail"),
											"：",
											d.retries.map((r) => `#${r.attempt ?? "?"} ${r.error}`).join("；")
										]
									}) : null,
									d.inner?.length ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: MonitorPanel_module_css_default.blockMeta,
										children: [
											t("souls.inner", {
												n: d.inner.length,
												rounds: d.innerRounds ?? 0
											}),
											"：",
											d.inner.map((c) => `${c.name}(${c.args})${c.chars ? ` ${fmtNum(c.chars)}` : ""}${c.ok ? "" : " ✗"}`).join("；")
										]
									}) : null,
									d.inner?.filter((c) => c.reasoning).map((c, i) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("details", {
										className: MonitorPanel_module_css_default.reasonFold,
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("summary", {
											className: MonitorPanel_module_css_default.reasonHead,
											children: [t("souls.innerReasoning", {
												n: i + 1,
												tool: c.name ?? "?"
											}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
												className: MonitorPanel_module_css_default.blockMeta,
												children: [" · ", t("souls.reasoning.chars", { n: c.reasoning?.length ?? 0 })]
											})]
										}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("pre", {
											className: `${MonitorPanel_module_css_default.pre} ${MonitorPanel_module_css_default.reasoningPre}`,
											children: c.reasoning
										})]
									}, `ir-${i}`)),
									d.reasoning ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("details", {
										className: MonitorPanel_module_css_default.reasonFold,
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("summary", {
											className: MonitorPanel_module_css_default.reasonHead,
											children: [t("souls.reasoning"), d.reasoningChars ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
												className: MonitorPanel_module_css_default.blockMeta,
												children: [" · ", t("souls.reasoning.chars", { n: d.reasoningChars })]
											}) : null]
										}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("pre", {
											className: `${MonitorPanel_module_css_default.pre} ${MonitorPanel_module_css_default.reasoningPre}`,
											children: d.reasoning
										})]
									}) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: MonitorPanel_module_css_default.blockLabel,
										children: [
											t("souls.reasoning"),
											" · ",
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
												className: MonitorPanel_module_css_default.blockMeta,
												children: t("souls.reasoning.none")
											})
										]
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: MonitorPanel_module_css_default.blockLabel,
										children: [t("souls.draftOf", { name: d.soul ?? "—" }), d.toolCalls ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
											className: MonitorPanel_module_css_default.blockMeta,
											children: [
												" · ",
												t("souls.toolCalls", { n: d.toolCalls }),
												d.tools?.length ? `（${d.tools.join(" / ")}）` : ""
											]
										}) : null]
									}),
									d.output !== void 0 || d.thinking !== void 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
										d.thinking ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
											className: MonitorPanel_module_css_default.blockLabel,
											children: t("souls.draft.thinking")
										}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("pre", {
											className: MonitorPanel_module_css_default.pre,
											children: d.thinking
										})] }) : null,
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
											className: MonitorPanel_module_css_default.blockLabel,
											children: t("souls.draft.output")
										}),
										d.output ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("pre", {
											className: MonitorPanel_module_css_default.pre,
											children: d.output
										}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
											className: MonitorPanel_module_css_default.emptyBlock,
											children: t("souls.draft.empty")
										})
									] }) : d.text ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("pre", {
										className: MonitorPanel_module_css_default.pre,
										children: d.text
									}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: MonitorPanel_module_css_default.emptyBlock,
										children: t("souls.draft.empty")
									})
								]
							}, i))
						})]
					}) : null,
					round.votes.length ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: MonitorPanel_module_css_default.roundSection,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: MonitorPanel_module_css_default.roundSectionTitle,
							children: t("souls.vote")
						}), round.votes.map((v, i) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: MonitorPanel_module_css_default.voteBlock,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: MonitorPanel_module_css_default.blockLabel,
								children: [t("souls.vote.round", { n: v.round }), v.decision ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
									className: MonitorPanel_module_css_default.blockMeta,
									children: [
										" · ",
										t("souls.vote.ballots", { n: v.ballots ?? 1 }),
										v.counts?.length ? ` · ${v.counts.map((c) => `${soulName(c.soul)} ${c.votes}`).join(" / ")}` : "",
										" → ",
										v.decision === "abstain" ? t("souls.vote.decision.abstain", { name: soulName(v.winner ?? void 0) }) : t("souls.vote.decision.winner", { name: soulName(v.winner ?? void 0) }),
										v.tie ? ` · ${t("souls.vote.tie")}` : ""
									]
								}) : null]
							}), v.votes.map((e, j) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: MonitorPanel_module_css_default.voteRow,
								"data-tone": tone(e.soul),
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: MonitorPanel_module_css_default.voteSoul,
										children: soulName(e.soul)
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: e.reject ? MonitorPanel_module_css_default.voteVeto : MonitorPanel_module_css_default.voteOk,
										children: e.picks !== void 0 ? e.picks.length ? t("souls.vote.picks", { list: e.picks.map((p) => soulName(p)).join(" + ") }) : e.reject ? t("souls.vote.reject") : t("souls.vote.abstain") : t("souls.vote.none")
									}),
									(e.attempts ?? 1) > 1 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: MonitorPanel_module_css_default.voteReason,
										children: e.picks !== void 0 && e.picks.length === 0 || e.parsed === false ? t("souls.attemptsFailed", { n: (e.attempts ?? 1) - 1 }) : t("souls.attempts", { n: e.attempts ?? 1 })
									}) : null,
									e.via === "text" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: MonitorPanel_module_css_default.voteReason,
										children: t("souls.vote.viaText")
									}) : null,
									e.divergence ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: MonitorPanel_module_css_default.voteReason,
										children: t("souls.vote.divergence", { text: e.divergence })
									}) : null,
									e.reason ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: MonitorPanel_module_css_default.voteReason,
										children: e.reason
									}) : null,
									e.raw ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("details", {
										className: `${MonitorPanel_module_css_default.reasonFold} ${MonitorPanel_module_css_default.voteReasoning}`,
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("summary", {
											className: MonitorPanel_module_css_default.reasonHead,
											children: t("souls.vote.raw")
										}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("pre", {
											className: MonitorPanel_module_css_default.pre,
											children: e.raw
										})]
									}) : null,
									e.reasoning ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("details", {
										className: `${MonitorPanel_module_css_default.reasonFold} ${MonitorPanel_module_css_default.voteReasoning}`,
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("summary", {
											className: MonitorPanel_module_css_default.reasonHead,
											children: t("souls.reasoning")
										}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("pre", {
											className: `${MonitorPanel_module_css_default.pre} ${MonitorPanel_module_css_default.reasoningPre}`,
											children: e.reasoning
										})]
									}) : null
								]
							}, j))]
						}, i))]
					}) : null,
					round.retries?.length ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: MonitorPanel_module_css_default.roundSection,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: MonitorPanel_module_css_default.roundSectionTitle,
							children: t("souls.retries", { n: round.retries.length })
						}), round.retries.map((r, i) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: MonitorPanel_module_css_default.voteRow,
							"data-tone": tone(r.soul),
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: MonitorPanel_module_css_default.voteSoul,
									children: soulName(r.soul)
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: MonitorPanel_module_css_default.voteReason,
									children: t("souls.retry.line", {
										stage: t(`souls.retry.stage.${r.stage ?? "draft"}`),
										attempt: r.attempt ?? "?",
										next: r.next ?? "?",
										delay: fmtDuration(r.delayMs)
									})
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: MonitorPanel_module_css_default.voteReason,
									children: r.error
								})
							]
						}, i))]
					}) : null,
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: MonitorPanel_module_css_default.roundSection,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: MonitorPanel_module_css_default.roundSectionTitle,
							children: t("souls.final")
						}), round.finalText ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("pre", {
							className: MonitorPanel_module_css_default.pre,
							children: round.finalText
						}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: MonitorPanel_module_css_default.emptyBlock,
							children: t("souls.final.none")
						})]
					})
				]
			});
		}
		//#endregion
		//#region \0dsh-css:/Users/mac/Projects/trisoul/packages/client/monitor/src/client/TrisoulStatsLine.module.css.mjs
		const css = ".byLK8q_root{text-align:center;max-width:var(--dsh-chat-content-width);box-sizing:border-box;width:100%;padding:4px calc(var(--dsh-composer-side-clearance) + 16px) 0;color:var(--dsw-alias-label-tertiary);white-space:nowrap;text-overflow:ellipsis;font-variant-numeric:tabular-nums;margin:0 auto;font-size:12px;line-height:20px;display:block;overflow:hidden}.byLK8q_sep{color:var(--dsw-alias-separator-primary);margin:0 10px}";
		const tagId = "@trisoul/dsh-client-monitor/TrisoulStatsLine.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@trisoul/dsh-client-monitor";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		var TrisoulStatsLine_module_css_default = {
			"root": "byLK8q_root",
			"sep": "byLK8q_sep"
		};
		//#endregion
		//#region src/client/TrisoulStatsLine.tsx
		/**
		* TriSoul 专属指标栏：遮蔽官方 StatsLine（conversation.composer.dock 同 cell id='stats'，priority -1 低者胜），
		* 换成本架构的会话指标——共识轮数 / 手术刀数 / 整体输入输出（所有组件合计）/ 缓存命中率。
		* 数据同监控面板：GET /trisoul/api/state?sessionId=（totals + consensus + stats.canvas 都是会话作用域）。
		* 视觉对齐官方：居中一行 12px 三级色，超宽省略 + title 全文。
		*/
		const ENDPOINT = "/trisoul/api/state";
		const REFRESH_MS = 5e3;
		function fmtTokens(n) {
			if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
			if (n >= 1e4) return `${(n / 1e3).toFixed(1)}K`;
			return String(n);
		}
		function TrisoulStatsLine({ t, sessionId }) {
			const [snap, setSnap] = (0, react.useState)(null);
			const sid = String(sessionId);
			const load = (0, react.useCallback)(async () => {
				try {
					const response = await fetch(`${ENDPOINT}?sessionId=${encodeURIComponent(sid)}`, { cache: "no-store" });
					if (!response.ok) return;
					setSnap(await response.json());
				} catch {}
			}, [sid]);
			(0, react.useEffect)(() => {
				load();
				const timer = setInterval(() => {
					load();
				}, REFRESH_MS);
				return () => clearInterval(timer);
			}, [load]);
			if (!snap) return null;
			const groups = [];
			const turns = snap.consensus?.turns ?? 0;
			if (turns > 0) groups.push(t("statsline.consensus", { n: turns }) + (snap.consensus?.inflight ? ` · ${t("statsline.running")}` : ""));
			const surgeries = snap.stats?.surgeon?.calls ?? 0;
			if (surgeries > 0) groups.push(t("statsline.surgery", { n: surgeries }));
			const totals = snap.totals;
			if (totals && (totals.input + totals.cache > 0 || totals.output > 0)) {
				const inTotal = totals.input + totals.cache;
				groups.push(t("statsline.tokens", {
					input: fmtTokens(inTotal),
					output: fmtTokens(totals.output)
				}));
				if (inTotal > 0) groups.push(t("statsline.cache", { percent: Math.round(totals.cache / inTotal * 100) }));
			}
			if (snap.memoryScope === "project" || snap.memoryScope === "session") groups.push(t(`statsline.memscope.${snap.memoryScope}`));
			if (groups.length === 0) return null;
			const line = groups.join(" | ");
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: TrisoulStatsLine_module_css_default.root,
				title: line,
				children: groups.map((group, i) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", { children: [i > 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
					className: TrisoulStatsLine_module_css_default.sep,
					"aria-hidden": true,
					children: "|"
				}) : null, /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: group })] }, group))
			});
		}
		//#endregion
		//#region src/client/locales.ts
		/** 监控面板翻译字典：zh 是 key 的事实源。 */
		const NS = "trisoulMonitor";
		const zh = {
			"view.monitor": "监控",
			"title": "TriSoul 后台 AI 监控",
			"refresh": "刷新",
			"mode.unified": "统一模式",
			"mode.fine": "精细模式",
			"souls.count": "{n} 魂",
			"updated": "更新于 {when}",
			"loading": "加载中…",
			"error": "无法连接 TriSoul API：{message}",
			"stat.calls": "调用",
			"stat.cache": "缓存命中",
			"stat.input": "输入",
			"stat.output": "输出",
			"stat.reasoning": "推理",
			"stat.last": "最后调用",
			"stat.duration": "耗时",
			"stat.errors": "失败",
			"stat.region": "区间字符",
			"stat.surface": "表面总量",
			"state.idle": "空闲",
			"state.running": "运行中",
			"state.error": "最近失败",
			"never": "尚未调用",
			"recent.title": "最近调用",
			"ctx.peak": "峰值 {n}",
			"recent.filter.all": "全部 ({n})",
			"recent.filter.errors": "只看失败 ({n})",
			"recent.empty.filtered": "没有匹配的调用",
			"recent.col.time": "时间",
			"recent.col.who": "组件",
			"recent.col.stage": "阶段",
			"recent.col.io": "输入 → 输出",
			"recent.col.duration": "耗时",
			"recent.col.detail": "备注 / 错误",
			"recent.cache": "缓存命中 {n}",
			"recent.unmetered": "≈{n} 字 · 未计量",
			"recent.empty": "还没有调用记录——发一条消息触发共识试试",
			"recent.error": "失败",
			"time.now": "刚刚",
			"time.seconds": "{n} 秒前",
			"time.minutes": "{n} 分钟前",
			"time.hours": "{n} 小时前",
			"main.turns": "共识轮次",
			"main.running": "进行中",
			"main.last": "上次",
			"main.none": "尚无共识记录",
			"result.winner/winner": "选胜者",
			"result.winner/identical": "三稿一致 · 免表决",
			"result.solo/solo": "独走 · 胜者单发",
			"result.fallback/all-dead": "全员失联 · 单路降级",
			"result.fallback/all-cut": "全员截断 · 单路降级",
			"result.fallback/single": "仅一魂存活 · 直接放行",
			"result.single/single": "单魂 · 直接放行",
			"result.rounds": "{n} 轮",
			"result.winner.name": "胜者 {name}",
			"ai.surgeon": "手术刀",
			"ai.memory": "记忆中枢",
			"ai.canvas": "画布编排",
			"ai.soul": "灵魂 {name}",
			"ai.main": "主循环",
			"stage.draft": "盲写",
			"stage.vote": "表决",
			"stage.surgery": "手术",
			"stage.probe": "探针",
			"stage.state": "状态区",
			"stage.curate": "整理",
			"stage.digest": "消化",
			"stage.recall": "回忆",
			"stage.recall-raw": "回捞原文",
			"stage.inject-pick": "补注挑选",
			"stage.curate-result": "整理结果",
			"stage.turn": "对话",
			"stage.tips": "tips 闸门",
			"stage.solo": "独走",
			"stage.shadow": "遮蔽刀",
			"scope.label": "监控范围",
			"scope.session": "本会话",
			"scope.all": "全部会话",
			"scope.session.hint": "只看当前会话：组件状态 / 轨迹 / 步骤全文 / 最近调用按会话过滤（评测指标为全部会话累计）",
			"scope.all.hint": "全部会话合并（{n} 个会话有记录）：轨迹按会话分组标注",
			"summary.steps": "步",
			"summary.inflight": "{n} 步进行中",
			"summary.median": "中位耗时",
			"summary.identical": "免表决",
			"summary.degraded": "降级/回退",
			"summary.surgeries": "手术",
			"summary.memory": "记忆 消化 {d} · 注入 {i} · 回忆 {r}",
			"trajectory.title": "监控轨迹图",
			"trajectory.hint": "每列一步（一次共识），按用户消息分组；泳道条 = 各组件调用（长度按该步内耗时占比）；点一步看全文",
			"trajectory.empty": "还没有共识步骤——发一条消息后这里开始画",
			"trajectory.lane.verdict": "裁决",
			"trajectory.legend.error": "失败",
			"trajectory.legend.verdict": "裁决行：✓ 放行 · → 单魂放行 · = 免表决 · ◆ 独走 · ✗ 降级/中断 · ● 进行中",
			"step.title": "第 {n} 步",
			"step.close": "收起",
			"comp.col.component": "组件",
			"comp.col.route": "路由",
			"comp.col.stages": "阶段分布",
			"comp.canvas.route": "编排（不调 LLM）· 区间字符 / 表面总量",
			"comp.cacheRate": "缓存命中占输入比例",
			"comp.totals": "整体",
			"comp.totals.route": "所有组件 LLM 调用合计（纯 token 账；随上方范围）",
			"statsline.consensus": "共识 {n} 轮",
			"statsline.running": "进行中",
			"statsline.surgery": "手术 {n} 刀",
			"statsline.tokens": "Σ 输入 {input} · 输出 {output}",
			"statsline.cache": "缓存命中 {percent}%",
			"statsline.memscope.project": "记忆 项目级",
			"statsline.memscope.session": "记忆 会话级",
			"trend.title": "趋势",
			"trend.hint": "每步一列：柱 = 胜者（高 = 耗时）· 折线 = 各组件输入上下文峰值（input + cache read）；点列选步",
			"trend.winner": "胜者",
			"trend.context": "上下文",
			"trend.undecided": "未定 / 进行中 {n}",
			"step.noVote.identical": "各稿一致，未表决",
			"step.solo": "独走 · tips {n} 条",
			"step.finale": "收官补一轮 · tips {n} 条",
			"souls.vote.reject.short": "不放行",
			"souls.vote.abstain.short": "弃权",
			"fold.components": "组件状态",
			"fold.components.hint": "灵魂 / 手术刀 / 记忆中枢 / 画布编排的累计用量与最近状态（随上方范围：本会话 / 全部会话）",
			"recent.hint.session": "本会话最近的 LLM 调用与中枢动作",
			"recent.hint.all": "全部会话最近的 LLM 调用与中枢动作",
			"stage.start": "开始",
			"stage.surgery-result": "手术结果",
			"stage.state-result": "状态区结果",
			"stage.probe-result": "探针结果",
			"stage.digest-result": "消化结果",
			"stage.recall-result": "回忆结果",
			"stage.inject": "注入",
			"metrics.title": "评测指标",
			"metrics.subtitle": "共识 / 压缩 / 思考用量健康度——进程生命周期内累计，重启清零",
			"metrics.group.consensus": "共识健康",
			"metrics.group.compaction": "压缩健康",
			"metrics.group.reasoning": "思考用量",
			"metrics.empty.consensus": "还没有共识轮次——发一条消息后自动累计",
			"metrics.empty.compaction": "还没有手术 / 探针记录——上下文超阈值后画布会自动动刀",
			"metrics.empty.reasoning": "还没有思考用量记录——共识调用后自动累计",
			"metrics.nodata": "暂无数据",
			"metrics.turns": "完成轮次",
			"metrics.aborted": "中断轮次",
			"metrics.identicalRate": "免表决率",
			"metrics.tieRate": "平票率（选胜者）",
			"metrics.abstainRate": "弃权率",
			"metrics.ballotVia": "结构化选票",
			"metrics.ballotViaValue": "工具票 {tool} · 文本票 {text} · 弃权 {none}",
			"metrics.timeouts": "盲写超时",
			"metrics.failures": "盲写失联",
			"metrics.retries": "自动重试",
			"metrics.retryRecovered": "重试后恢复 {n}",
			"metrics.truncated": "被上限截断的稿",
			"metrics.inner": "内层取证",
			"metrics.innerValue": "{calls} 次调用（报错 {errors}）· 结果 {chars} 字 · 取证稿 {drafts}",
			"metrics.divergence": "知情票率",
			"metrics.divergenceValue": "陈述分叉 {fork}/{ballots} 票（{pct}）· 独走触发 {solo} · 收官补一轮 {final}",
			"metrics.solo": "独走步",
			"metrics.soloValue": "{runs} 次 · 失败 {failed}",
			"metrics.innerByTool": "取证工具分布",
			"metrics.fallbacks": "降级放行",
			"metrics.avgDuration": "平均耗时",
			"metrics.voteOffRate": "表决 off 采用率",
			"metrics.wins": "每魂胜率",
			"metrics.winChip": "{name} ×{n} · {pct}",
			"metrics.positions": "票选位置分布（明显不均 = 位置偏置回归）",
			"metrics.positionChip": "{n} 号位 ×{c}",
			"metrics.surgeries": "手术次数",
			"metrics.surgeryOk": "成功",
			"metrics.surgeryFailed": "失败",
			"metrics.avgRegion": "平均区间",
			"metrics.charsValue": "{n} 字",
			"metrics.ratio": "压缩比",
			"metrics.ratioValue": "{inChars} → {out} 字 · 压至 {pct}",
			"metrics.probes": "探针通过率",
			"metrics.probesValue": "{passed} / {total} · {pct}",
			"metrics.probePatched": " · 补记 {n}",
			"metrics.cooldowns": "失败冷却",
			"metrics.shadows": "换代遮蔽",
			"metrics.shadowsValue": "{sweeps} 次扫描 · 遮蔽旧版 {versions} 条",
			"metrics.group.memory": "记忆健康",
			"metrics.empty.memory": "还没有回忆 / 消化记录——对话推进后记忆中枢自动消化，模型调 trisoul_recall 时计回忆",
			"metrics.recallHit": "埋点回忆命中率",
			"metrics.recallHitValue": "{hit}/{total} 次命中 · {pct} · 共返回 {items} 条",
			"metrics.rawRecalls": "原文回捞",
			"metrics.rawRecallsValue": "{n} 次 · 回捞事件 {items} 条",
			"metrics.recallAfterSurgery": "压后回捞率",
			"metrics.recallAfterSurgeryValue": "{recalled}/{total} 刀被回捞过 · {pct}",
			"metrics.digests": "消化",
			"metrics.digestsValue": "{ok}/{total} 次成功 · 新增 {added} / 更新 {updated} / 退役 {retired}",
			"metrics.digestsBad": "无 JSON {noJson} · 截断 {truncated}",
			"metrics.curates": "整理",
			"metrics.curatesValue": "{ok}/{total} 次 · 更新 {updated} / 退役 {retired}",
			"metrics.injections": "注入",
			"metrics.injectionsValue": "{n} 次 · {memories} 条",
			"metrics.neverUsed": "从未被用过",
			"metrics.neverUsedValue": "{n} / {active} 条 · {pct}（累计注入 {injected} · 召回命中 {recalled}）",
			"metrics.lastCurate": "上次整理",
			"metrics.lastCurateValue": "{ago} · {shards} 个分片（{dirty} 个待整理）",
			"metrics.lastCurateNever": "尚未整理 · {shards} 个分片",
			"metrics.stageChars.draft": "盲写思考",
			"metrics.stageChars.vote": "表决思考",
			"metrics.stageCharsValue": "{sum} 字 · 均 {avg}",
			"metrics.efforts": "档位效率（off vs 思考档位）",
			"metrics.effortChip": "{stage} · {effort} ×{n} · 均 {d}",
			"metrics.effort.default": "默认档",
			"souls.running": "进行中",
			"souls.prompt": "提问",
			"souls.prompt.none": "（无提问文本）",
			"souls.narration": "共识旁白全文",
			"souls.reasoning": "思考链",
			"souls.reasoning.chars": "{n} 字",
			"souls.reasoning.none": "（该次调用没有返回思考链）",
			"souls.effort": "推理等级 {effort}",
			"souls.draft": "盲稿",
			"souls.draft.empty": "（空稿）",
			"souls.draft.thinking": "思考",
			"souls.draft.output": "输出",
			"souls.toolCalls": "{n} 次工具调用",
			"souls.vote": "表决",
			"souls.vote.round": "第 {n} 轮",
			"souls.vote.none": "（未投票）",
			"souls.vote.ballots": "每魂 {n} 票",
			"souls.vote.reject": "不放行",
			"souls.vote.picks": "投 {list}",
			"souls.vote.abstain": "弃权",
			"souls.vote.divergence": "分叉：{text}",
			"souls.vote.tie": "平票轮换",
			"souls.attempts": "第 {n} 次尝试成功",
			"souls.attemptsFailed": "重试 {n} 次仍不合格",
			"souls.vote.viaText": "文本票（未调用 cast_ballot 工具，按正文解析）",
			"souls.vote.raw": "原始输出",
			"souls.retried": "已自动重试 {n} 次",
			"souls.truncated": "输出被上限截断（finish max-tokens）：稿不完整，重试不解决——请提高该模型的 maxTokens",
			"souls.retryTrail": "重试轨迹",
			"souls.inner": "内层取证 {n} 次 / {rounds} 轮",
			"souls.innerReasoning": "取证第 {n} 轮思考链 · {tool}",
			"souls.retries": "自动重试（{n} 次）",
			"souls.retry.line": "{stage} 第 {attempt} 次失败 → {delay} 后第 {next} 次",
			"souls.retry.stage.draft": "盲写",
			"souls.retry.stage.vote": "表决",
			"souls.vote.decision.winner": "放行 {name}",
			"souls.vote.decision.abstain": "全员弃权 · 轮换取 {name}",
			"souls.final": "最终定稿",
			"souls.final.none": "（尚未定稿）",
			"souls.error": "失败：{message}",
			"souls.loading": "加载全文…",
			"souls.notfound": "该轮全文已不在内存中（只保留最近 {n} 轮）",
			"souls.winner": "胜者 {name}",
			"souls.rounds": "{n} 轮",
			"souls.duration": "耗时 {d}",
			"souls.draftOf": "{name} 的盲稿",
			"ctx.title": "上下文框架",
			"ctx.hint": "最近一步盲写主请求，从左到右按顺序铺块（宽 ∝ 字符，token ≈ 字符 ÷3.5）；竖虚线 = 前缀缓存命中分界",
			"ctx.system": "system",
			"ctx.user": "用户原话",
			"ctx.checkpoint": "检查点",
			"ctx.assistant": "助手",
			"ctx.tool": "工具结果",
			"ctx.plugin": "插件注入",
			"ctx.inj.memory": "记忆注入",
			"ctx.inj.canvas": "状态区",
			"ctx.inj.consensus": "共识注入",
			"ctx.inj.jobs": "后台作业",
			"ctx.seg": "{label} · {c} 字符 · ≈{n} tok",
			"ctx.cacheShort": "前缀命中 ≈{n} tok",
			"ctx.cacheLine": "≈ {n} tok 前缀命中（分界按 2048 块级粒度取整，线为近似位置）",
			"ctx.total": "{n} 条消息 · {c} 字符 · 工具 {tools} 个",
			"ctx.souls": "各魂 in/cache：{s}",
			"ctxh.title": "上下文演变",
			"ctxh.hint": "每步一条组成横条（宽 ∝ 字符），绿下划线 = 该步实际前缀命中范围（各魂最大 cacheReadTokens）；条间列出手术 / 消化 / 状态牌 / 探针事件，帧间对比出「吞了几条 → 新检查点」并给新检查点描边。手动刷新，不随 3 秒轮询。",
			"ctxh.count": "{n} 帧",
			"ctxh.zoom": "缩放",
			"ctxh.refresh": "刷新",
			"ctxh.loading": "加载中…",
			"ctxh.empty": "还没有帧——历史从本进程启动后开始积累，跑一步盲写就有了",
			"ctxh.error": "加载失败：{message}",
			"ctxh.knife": "✂ 帧间对比：吞 {n} 条消息 ≈{c} 字符 → 新检查点",
			"ctxh.hit": "前缀命中 {n} / 总输入 {m} tok（{p}%）",
			"ctxh.hitShort": "命中 {p}%",
			"ctx.empty": "暂无上下文帧——会话作用域下发一条消息后，这里显示最近一步盲写请求的结构",
			"tabs.label": "监控页签",
			"tab.steps": "步骤流",
			"tab.context": "上下文",
			"tab.components": "组件状态",
			"tab.metrics": "评测指标",
			"tab.recent": "最近调用",
			"live.title": "最新一步",
			"live.none": "还没有共识步——发一条消息触发试试",
			"live.think": "最新思考",
			"live.think.none": "思考尚未回帧",
			"live.open": "查看全文",
			"live.soul.running": "{name} 写稿中…",
			"live.soul.chip": "{name} 思考 {think} 字 · 工具 {tools}",
			"live.soul.pending": "{name} 等稿中",
			"live.status": "进行中 {secs}s",
			"live.status.vote": "表决中 {secs}s",
			"live.status.mend": "补枪中 {secs}s",
			"live.status.finale": "收官补一轮 {secs}s",
			"live.col.attempt": "第 {n} 次尝试",
			"live.col.round": "取证后第 {n} 稿",
			"live.col.meta": "思考 {think} 字 · 正文 {text} 字",
			"live.col.waiting": "等待正文首帧…",
			"page.prev": "上一页",
			"page.next": "下一页",
			"page.info": "第 {p} / {n} 页 · 共 {c} 步"
		};
		const en = {
			"view.monitor": "Monitor",
			"title": "TriSoul Background AI Monitor",
			"refresh": "Refresh",
			"mode.unified": "Unified mode",
			"mode.fine": "Fine-grained mode",
			"souls.count": "{n} souls",
			"updated": "Updated {when}",
			"loading": "Loading…",
			"error": "Cannot reach TriSoul API: {message}",
			"stat.calls": "Calls",
			"stat.cache": "Cache hits",
			"stat.input": "Input",
			"stat.output": "Output",
			"stat.reasoning": "Reasoning",
			"stat.last": "Last call",
			"stat.duration": "Duration",
			"stat.errors": "Errors",
			"stat.region": "Region chars",
			"stat.surface": "Surface total",
			"state.idle": "Idle",
			"state.running": "Running",
			"state.error": "Recent failure",
			"never": "Never called",
			"recent.title": "Recent calls",
			"ctx.peak": "peak {n}",
			"recent.filter.all": "All ({n})",
			"recent.filter.errors": "Errors only ({n})",
			"recent.empty.filtered": "No matching calls",
			"recent.col.time": "Time",
			"recent.col.who": "Component",
			"recent.col.stage": "Stage",
			"recent.col.io": "In → out",
			"recent.col.duration": "Duration",
			"recent.col.detail": "Note / error",
			"recent.cache": "cache read {n}",
			"recent.unmetered": "≈{n} chars · unmetered",
			"recent.empty": "No calls yet — send a message to trigger consensus",
			"recent.error": "failed",
			"time.now": "just now",
			"time.seconds": "{n}s ago",
			"time.minutes": "{n} min ago",
			"time.hours": "{n} h ago",
			"main.turns": "Consensus turns",
			"main.running": "running",
			"main.last": "Last",
			"main.none": "No consensus yet",
			"result.winner/winner": "winner pick",
			"result.winner/identical": "identical · no vote",
			"result.solo/solo": "solo · winner single-shot",
			"result.fallback/all-dead": "all souls down · single-route fallback",
			"result.fallback/all-cut": "all drafts truncated · single-route fallback",
			"result.fallback/single": "one soul alive · passthrough",
			"result.single/single": "single soul · direct release",
			"result.rounds": "{n} rounds",
			"result.winner.name": "winner {name}",
			"ai.surgeon": "Surgeon",
			"ai.memory": "Memory hub",
			"ai.canvas": "Canvas",
			"ai.soul": "Soul {name}",
			"ai.main": "Main loop",
			"stage.draft": "draft",
			"stage.vote": "vote",
			"stage.surgery": "surgery",
			"stage.probe": "probe",
			"stage.state": "state",
			"stage.curate": "curate",
			"stage.digest": "digest",
			"stage.recall": "recall",
			"stage.recall-raw": "raw recall",
			"stage.inject-pick": "inject pick",
			"stage.curate-result": "curate result",
			"stage.turn": "turn",
			"stage.tips": "tips gate",
			"stage.solo": "solo",
			"stage.shadow": "shadow sweep",
			"scope.label": "Scope",
			"scope.session": "This session",
			"scope.all": "All sessions",
			"scope.session.hint": "Current session only: component status / trajectory / step details / recent calls are filtered by session (metrics are cumulative across sessions)",
			"scope.all.hint": "All sessions merged ({n} sessions with records): trajectory groups are tagged by session",
			"summary.steps": "steps",
			"summary.inflight": "{n} running",
			"summary.median": "median",
			"summary.identical": "identical",
			"summary.degraded": "degraded/fallback",
			"summary.surgeries": "surgeries",
			"summary.memory": "memory: digest {d} · inject {i} · recall {r}",
			"trajectory.title": "Trajectory",
			"trajectory.hint": "One column per step (one consensus), grouped by user message; bars = component calls (length ∝ share of the step); click a step for details",
			"trajectory.empty": "No consensus steps yet — send a message and this chart starts drawing",
			"trajectory.lane.verdict": "Verdict",
			"trajectory.legend.error": "failed",
			"trajectory.legend.verdict": "Verdict row: ✓ released · → single soul · = identical · ◆ solo · ✗ degraded/aborted · ● running",
			"step.title": "Step {n}",
			"step.close": "Close",
			"comp.col.component": "Component",
			"comp.col.route": "Route",
			"comp.col.stages": "Stages",
			"comp.canvas.route": "orchestrator (no LLM) · region chars / surface total",
			"comp.cacheRate": "cache hits as share of input",
			"comp.totals": "Total",
			"comp.totals.route": "all components combined (token-only; follows the scope above)",
			"statsline.consensus": "{n} consensus turns",
			"statsline.running": "running",
			"statsline.surgery": "{n} surgeries",
			"statsline.tokens": "Σ in {input} · out {output}",
			"statsline.cache": "cache {percent}%",
			"statsline.memscope.project": "memory: project",
			"statsline.memscope.session": "memory: session",
			"trend.title": "Trends",
			"trend.hint": "One column per step: bar = winner (height = duration) · lines = peak input context per component (input + cache read); click a column to select the step",
			"trend.winner": "Winner",
			"trend.context": "Context",
			"trend.undecided": "undecided / running {n}",
			"step.noVote.identical": "identical drafts, no vote",
			"step.solo": "solo · {n} tips",
			"step.finale": "final supplement · {n} tips",
			"souls.vote.reject.short": "reject",
			"souls.vote.abstain.short": "abstain",
			"fold.components": "Components",
			"fold.components.hint": "Usage and latest state of souls / surgeon / memory hub / canvas (follows the scope above: this session / all sessions)",
			"recent.hint.session": "Recent LLM calls and hub actions in this session",
			"recent.hint.all": "Recent LLM calls and hub actions across all sessions",
			"stage.start": "start",
			"stage.surgery-result": "surgery result",
			"stage.state-result": "state-zone result",
			"stage.probe-result": "probe result",
			"stage.digest-result": "digest result",
			"stage.recall-result": "recall result",
			"stage.inject": "inject",
			"metrics.title": "Evaluation metrics",
			"metrics.subtitle": "Consensus / compaction / reasoning-usage health — accumulated over the process lifetime, reset on restart",
			"metrics.group.consensus": "Consensus health",
			"metrics.group.compaction": "Compaction health",
			"metrics.group.reasoning": "Reasoning usage",
			"metrics.empty.consensus": "No consensus turns yet — send a message and this fills in",
			"metrics.empty.compaction": "No surgery / probe records yet — the canvas operates once context exceeds the threshold",
			"metrics.empty.reasoning": "No reasoning usage yet — accumulated after consensus calls",
			"metrics.nodata": "no data yet",
			"metrics.turns": "Completed turns",
			"metrics.aborted": "Aborted turns",
			"metrics.identicalRate": "Vote-free rate",
			"metrics.tieRate": "Tie rate (winner mode)",
			"metrics.abstainRate": "Abstention rate",
			"metrics.ballotVia": "Structured ballots",
			"metrics.ballotViaValue": "tool {tool} · text {text} · abstain {none}",
			"metrics.timeouts": "Draft timeouts",
			"metrics.failures": "Draft failures",
			"metrics.retries": "Auto retries",
			"metrics.retryRecovered": "{n} recovered",
			"metrics.truncated": "Drafts cut by max tokens",
			"metrics.inner": "Inner evidence calls",
			"metrics.innerValue": "{calls} calls ({errors} errors) · {chars} chars · {drafts} drafts with evidence",
			"metrics.divergence": "Informed-ballot rate",
			"metrics.divergenceValue": "divergence stated on {fork}/{ballots} ballots ({pct}) · solo ×{solo} · final supplements ×{final}",
			"metrics.solo": "Solo steps",
			"metrics.soloValue": "{runs} runs · {failed} failed",
			"metrics.innerByTool": "Evidence tools",
			"metrics.fallbacks": "Fallback releases",
			"metrics.avgDuration": "Avg duration",
			"metrics.voteOffRate": "Vote off adoption",
			"metrics.wins": "Wins per soul",
			"metrics.winChip": "{name} ×{n} · {pct}",
			"metrics.positions": "Picked ballot positions (skew = position-bias regression)",
			"metrics.positionChip": "slot {n} ×{c}",
			"metrics.surgeries": "Surgeries",
			"metrics.surgeryOk": "Succeeded",
			"metrics.surgeryFailed": "Failed",
			"metrics.avgRegion": "Avg region",
			"metrics.charsValue": "{n} chars",
			"metrics.ratio": "Compression ratio",
			"metrics.ratioValue": "{inChars} → {out} chars · down to {pct}",
			"metrics.probes": "Probe pass rate",
			"metrics.probesValue": "{passed} / {total} · {pct}",
			"metrics.probePatched": " · patched {n}",
			"metrics.cooldowns": "Failure cooldowns",
			"metrics.shadows": "Stale shadowing",
			"metrics.shadowsValue": "{sweeps} sweeps · {versions} stale versions shadowed",
			"metrics.group.memory": "Memory health",
			"metrics.empty.memory": "No recall / digest records yet — the hub digests as the conversation grows; recalls count when the model calls trisoul_recall",
			"metrics.recallHit": "Recall hit rate",
			"metrics.recallHitValue": "{hit}/{total} hits · {pct} · {items} items returned",
			"metrics.rawRecalls": "Raw recalls",
			"metrics.rawRecallsValue": "{n} calls · {items} events fetched",
			"metrics.recallAfterSurgery": "Recall-after-surgery rate",
			"metrics.recallAfterSurgeryValue": "{recalled}/{total} surgeries recalled later · {pct}",
			"metrics.digests": "Digests",
			"metrics.digestsValue": "{ok}/{total} ok · +{added} / ~{updated} / -{retired}",
			"metrics.digestsBad": "no JSON {noJson} · truncated {truncated}",
			"metrics.curates": "Curations",
			"metrics.curatesValue": "{ok}/{total} · ~{updated} / -{retired}",
			"metrics.injections": "Injections",
			"metrics.injectionsValue": "{n} times · {memories} memories",
			"metrics.neverUsed": "Never used",
			"metrics.neverUsedValue": "{n} / {active} · {pct} (injected {injected} · recall hits {recalled})",
			"metrics.lastCurate": "Last curation",
			"metrics.lastCurateValue": "{ago} · {shards} shards ({dirty} pending)",
			"metrics.lastCurateNever": "never · {shards} shards",
			"metrics.stageChars.draft": "Draft reasoning",
			"metrics.stageChars.vote": "Vote reasoning",
			"metrics.stageCharsValue": "{sum} chars · avg {avg}",
			"metrics.efforts": "Effort efficiency (off vs reasoning tiers)",
			"metrics.effortChip": "{stage} · {effort} ×{n} · avg {d}",
			"metrics.effort.default": "default",
			"souls.running": "running",
			"souls.prompt": "Prompt",
			"souls.prompt.none": "(no prompt text)",
			"souls.narration": "Consensus narration",
			"souls.reasoning": "Reasoning",
			"souls.reasoning.chars": "{n} chars",
			"souls.reasoning.none": "(no reasoning returned for this call)",
			"souls.effort": "effort {effort}",
			"souls.draft": "Blind draft",
			"souls.draft.empty": "(empty draft)",
			"souls.draft.thinking": "Thinking",
			"souls.draft.output": "Output",
			"souls.toolCalls": "{n} tool calls",
			"souls.vote": "Vote",
			"souls.vote.round": "round {n}",
			"souls.vote.none": "(did not vote)",
			"souls.vote.ballots": "{n} ballot(s) each",
			"souls.vote.reject": "not releasable",
			"souls.vote.picks": "picks {list}",
			"souls.vote.abstain": "abstain",
			"souls.vote.divergence": "divergence: {text}",
			"souls.vote.tie": "tie → rotate",
			"souls.attempts": "succeeded on attempt {n}",
			"souls.attemptsFailed": "still invalid after {n} retries",
			"souls.vote.viaText": "text ballot (cast_ballot tool not called; parsed from prose)",
			"souls.vote.raw": "raw output",
			"souls.retried": "auto-retried {n}×",
			"souls.truncated": "Output cut by max tokens (finish max-tokens): draft incomplete; retries cannot fix this — raise the model maxTokens",
			"souls.retryTrail": "Retry trail",
			"souls.inner": "inner evidence {n} calls / {rounds} rounds",
			"souls.innerReasoning": "lookup round {n} reasoning · {tool}",
			"souls.retries": "Auto retries ({n})",
			"souls.retry.line": "{stage} attempt {attempt} failed → attempt {next} after {delay}",
			"souls.retry.stage.draft": "draft",
			"souls.retry.stage.vote": "vote",
			"souls.vote.decision.winner": "release {name}",
			"souls.vote.decision.abstain": "all abstained · rotate to {name}",
			"souls.final": "Final answer",
			"souls.final.none": "(not finalized yet)",
			"souls.error": "failed: {message}",
			"souls.loading": "Loading full text…",
			"souls.notfound": "This turn is no longer in memory (only the last {n} turns are kept)",
			"souls.winner": "winner {name}",
			"souls.rounds": "{n} rounds",
			"souls.duration": "took {d}",
			"souls.draftOf": "draft by {name}",
			"ctx.title": "Context frame",
			"ctx.hint": "Latest blind-write request, blocks laid left to right in order (width ∝ chars, tokens ≈ chars ÷ 3.5); dashed vertical line = prefix-cache hit boundary",
			"ctx.system": "system",
			"ctx.user": "user message",
			"ctx.checkpoint": "checkpoint",
			"ctx.assistant": "assistant",
			"ctx.tool": "tool result",
			"ctx.plugin": "plugin injection",
			"ctx.inj.memory": "memory injection",
			"ctx.inj.canvas": "state zone",
			"ctx.inj.consensus": "consensus injection",
			"ctx.inj.jobs": "background jobs",
			"ctx.seg": "{label} · {c} chars · ≈{n} tok",
			"ctx.cacheShort": "prefix cached ≈{n} tok",
			"ctx.cacheLine": "≈ {n} tok prefix cached (boundary rounds to 2048-token blocks; line is approximate)",
			"ctx.total": "{n} messages · {c} chars · {tools} tools",
			"ctx.souls": "per-soul in/cache: {s}",
			"ctxh.title": "Context evolution",
			"ctxh.hint": "One bar per step (width ∝ chars); green underline = actual prefix-cache hit range that step (max cacheReadTokens across souls). Surgery / digest / state-card / probe events listed between bars; frame diff yields \"swallowed N → new checkpoint\" with the new checkpoint outlined. Manual refresh, not on the 3s poll.",
			"ctxh.count": "{n} frames",
			"ctxh.zoom": "Zoom",
			"ctxh.refresh": "Refresh",
			"ctxh.loading": "Loading…",
			"ctxh.empty": "No frames yet — history accumulates since this process started; run one draft step and it appears",
			"ctxh.error": "Load failed: {message}",
			"ctxh.knife": "✂ Frame diff: swallowed {n} messages ≈{c} chars → new checkpoint",
			"ctxh.hit": "Prefix hit {n} of {m} input tok ({p}%)",
			"ctxh.hitShort": "hit {p}%",
			"ctx.empty": "No context frame yet — in session scope, send a message and the latest blind-draft request structure shows up here",
			"tabs.label": "Monitor tabs",
			"tab.steps": "Steps",
			"tab.context": "Context",
			"tab.components": "Components",
			"tab.metrics": "Metrics",
			"tab.recent": "Recent calls",
			"live.title": "Latest step",
			"live.none": "No consensus steps yet — send a message to trigger one",
			"live.think": "Latest thinking",
			"live.think.none": "No thinking captured yet",
			"live.open": "Open",
			"live.soul.running": "{name} drafting…",
			"live.soul.chip": "{name} think {think} chars · tools {tools}",
			"live.soul.pending": "{name} waiting",
			"live.status": "running {secs}s",
			"live.status.vote": "voting {secs}s",
			"live.status.mend": "resubmitting {secs}s",
			"live.status.finale": "final pass {secs}s",
			"live.col.attempt": "attempt {n}",
			"live.col.round": "draft {n} after evidence",
			"live.col.meta": "think {think} chars · text {text} chars",
			"live.col.waiting": "waiting for first frame…",
			"page.prev": "Prev",
			"page.next": "Next",
			"page.info": "Page {p} / {n} · {c} steps"
		};
		//#endregion
		//#region src/client/index.ts
		const inject = ["slots", "locale"];
		function apply(ctx) {
			ctx.effect(() => ctx.locale.register(NS, {
				zh,
				en
			}), "trisoul-monitor: dictionaries");
			const t = ctx.locale.bind(NS);
			ctx.slots.inject("conversation.view", () => ctx.slots.register({
				name: "conversation.view",
				id: "trisoul-monitor",
				order: 41,
				locale: NS,
				label: () => t("view.monitor")
			}, MonitorPanel));
			ctx.slots.inject("conversation.composer.dock", () => ctx.slots.register({
				name: "conversation.composer.dock",
				id: "stats",
				order: 0,
				priority: -1,
				locale: NS
			}, TrisoulStatsLine));
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map