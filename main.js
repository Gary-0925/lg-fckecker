// ==UserScript==
// @name            洛谷取关提醒器
// @namespace       http://tampermonkey.net/
// @version         5.0
// @description     可以快速检测近期粉丝变化
// @author          Gary0
// @license         GNU GPLv3
// @run-at          document-end
// @match           https://www.luogu.com.cn/*
// @icon            https://cdn.luogu.com.cn/upload/usericon/3.png
// @grant           none
// ==/UserScript==

function esc_html(s)
{
	let str = String(s);
	return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
function get_el(id) { return document.getElementById(id); }
function new_el(id) { return document.createElement(id); }
function insert_el(base, label, content, id, class_list)
{
	const el = new_el(label);
	el.innerHTML = content, el.id = id, el.classList = class_list;
	return base.appendChild(el);
}
function insert_css(content) { insert_el(get_el("fchecker"), "style", content, "", ""); }
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
function string_to_map(data_json)
{
	const data_ob = JSON.parse(data_json);
	const data_arr = Object.entries(data_ob);
	const data_map = new Map(data_arr);
	return data_map;
}
function map_to_string(data_map)
{
	const data_ob = Object.fromEntries(data_map);
	const data_json = JSON.stringify(data_ob);
	return data_json;
}

const version = "5.0", devs = [1202669], fchecker = insert_el(document.body, "div", "", "fchecker", "");
fchecker.style = "position: fixed; top: 0; left: 0; bottom: 0; right: 0; z-index: 1000; pointer-events: none;";

function get_settings_map()
{
	const saved = localStorage.getItem("fchecker-setting");
	if (saved) {
		try { return string_to_map(saved); } catch(e) { }
	}
	const default_map = new Map();
	default_map.set("show-btn", "true");
	return default_map;
}
async function update_relation(uid, action)
{
	const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
	if (!token) return false;
	try
	{
		const res = await fetch("https://www.luogu.com.cn/api/user/updateRelationShip", {
			method: "POST",
			headers: { "content-type": "application/json", "x-csrf-token": token, "x-requested-with": "XMLHttpRequest" },
			body: JSON.stringify({ uid: Number(uid), relationship: Number(action) })
		});
		return res.ok;
	} catch (e) { return false; }
}
function get_uid()
{
	const m = document.getElementById("lentille-context");
	if (!m) return null;
	const json = JSON.parse(m.innerHTML);
	if (!json?.user?.uid) return null;
	return json.user.uid;
}
async function show_message(msg, time)
{
	main.style.display = "none";

	const mask = insert_el(fchecker, "div", "", "", "fchecker-modal-mask");
	const dialog = insert_el(mask, "div", "", "", "fchecker-modal-dialog");
	const header = insert_el(dialog, "div", "&nbsp;", "", "fchecker-modal-header");
	const quit_btn = insert_el(header, "button", "×", "", "fchecker-modal-close");
	mask.style.opacity = 0, mask.style.transition = "opacity 0.3s ease-in-out", dialog.style.height = "auto", dialog.style.width = "300px";

	let cls = false;
	async function destroy_modal()
	{
		if (cls) return;
		cls = true;
		mask.style.opacity = 0;
		await sleep(300);
		mask.remove();
	};
	quit_btn.addEventListener("click", destroy_modal);
	setTimeout(destroy_modal, time);

	insert_el(dialog, "div", msg, "", "fchecker-modal-body");
    await sleep(10);
    mask.style.opacity = 1;
}

const UID = get_uid();
if (!UID) return;

insert_css(`
	.fchecker-card {
		background-color: #fff;
		box-shadow: 0 1px 3px #1a1a1a1a;
		border-radius: 4px;
		padding: 10px;
		margin: 10px;
		text-align: center;
		overflow-y: auto;
	}
	.fchecker-btn {
		background-color: #3498db;
		color: #fff;
		border: none;
		border-radius: 4px;
		padding: 10px;
		margin: 10px;
		text-align: center;
	}
	.fchecker-btn:hover {
		cursor: pointer;
	}
	.fchecker-user {
		text-align: left;
		height: 42px;
		padding: 10px;
		overflow: hidden;
		white-space: nowrap;
		border-bottom: 1px solid #e8e8e8;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	.fchecker-user-info {
		display: flex;
		align-items: center;
		overflow: hidden;
		white-space: nowrap;
		width: calc(100% - 90px);
		height: 100%;
	}
	.fchecker-user .left {
		border-radius: 50%;
		height: 42px;
        width: 42px;
		vertical-align: middle;
	}
	.fchecker-user .right {
		padding-left: 10px;
		display: inline-block;
		height: 100%;
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
		vertical-align: middle;
		width: calc(100% - 42px);
	}
	.fchecker-user .user-title {
		display: flex;
		align-items: center;
		gap: 4px;
		height: 22px;
	}
	.fchecker-user svg {
		display: inline-block;
		height: 1.1em;
		width: 1.125em;
		vertical-align: middle;
	}
	.fchecker-user .am-badge {
		display: inline-block;
		padding: .25em .625em;
		font-size: 75%;
		font-weight: 700;
		line-height: 1;
		color: #fff;
		text-align: center;
		white-space: nowrap;
		vertical-align: baseline;
	}
	.fchecker-user .am-radius {
		border-radius: 2px;
	}
	.fchecker-user .slogan {
		font-size: .875em;
		color: #444;
		margin-top: 2px;
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
	}
	.fchecker-action-btn {
		border: none;
		border-radius: 4px;
		padding: 6px 10px;
		color: #fff;
		font-size: 11px;
		cursor: pointer;
		white-space: nowrap;
	}
	.fchecker-setting-item {
		margin-bottom: 15px;
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 14px;
	}
	.fchecker-setting-item input {
		cursor: pointer;
		width: 16px;
		height: 16px;
	}
	#fchecker-main {
		position: fixed;
		top: 60px;
		right: -300px;
		width: 300px;
		pointer-events: auto;
		transition: transform 0.2s ease;
	}
	#fchecker-main:hover {
		transform: translateX(-280px);
	}
	.fchecker-modal-mask {
		position: fixed;
		top: 0; left: 0; right: 0; bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		pointer-events: auto;
		z-index: 1050;
	}
	.fchecker-modal-dialog {
		background: #fff;
		border-radius: 4px;
		width: 550px;
		max-width: 90vw;
		height: 600px;
		max-height: 80vh;
		box-shadow: 0 4px 12px rgba(0,0,0,0.15);
		display: flex;
		flex-direction: column;
		overflow: hidden;
		text-align: left;
	}
	.fchecker-modal-header {
		padding: 14px 20px;
		border-bottom: 1px solid #e8e8e8;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	.fchecker-modal-body {
		padding: 20px;
		flex: 1;
		overflow-y: auto;
	}
	.fchecker-modal-close {
		background: none;
		border: none;
		font-size: 22px;
		color: #999;
		cursor: pointer;
		line-height: 1;
		padding: 0;
	}
	.fchecker-modal-close:hover {
		color: #333;
	}
`);
const main = insert_el(fchecker, "div", "<h3>取关提醒器</h3>", "fchecker-main", "fchecker-card");
const get_btn = insert_el(main, "button", "获取粉丝列表", "", "fchecker-btn");
const set_btn = insert_el(main, "button", "设置", "", "fchecker-btn");
const info_btn = insert_el(main, "button", "其他", "", "fchecker-btn");
async function show_get()
{
	main.style.display = "none";
	document.body.style.overflow = "hidden";

	const mask = insert_el(fchecker, "div", "", "", "fchecker-modal-mask");
	const dialog = insert_el(mask, "div", "", "", "fchecker-modal-dialog");
	const header = insert_el(dialog, "div", "粉丝列表", "", "fchecker-modal-header");
	const quit_btn = insert_el(header, "button", "×", "", "fchecker-modal-close");
	quit_btn.style.visibility = "hidden";

	function destroy_modal()
	{
		mask.remove();
		document.body.style.overflow = "";
		main.style.display = "";
	};

	quit_btn.addEventListener("click", destroy_modal);

	const get_card = insert_el(dialog, "div", "", "", "fchecker-modal-body");
	const get_card_status = insert_el(get_card, "p", "", "", "", "");

	async function parse_followers(html)
	{
		const m = html.match(/<script id="lentille-context" type="application\/json">([\s\S]*?)<\/script>/);
		if (!m) return null;
		const json = JSON.parse(m[1]);
		if (!json?.data?.users?.result) return { success: false, data: "页面解析失败" };
		return { success: true, data: json.data.users.result };
	}
	async function parse_followers_count(html)
	{
		const m = html.match(/<script id="lentille-context" type="application\/json">([\s\S]*?)<\/script>/);
		if (!m) return null;
		const json = JSON.parse(m[1]);
		if (!json?.data?.users?.count) return { success: false, data: "页面解析失败" };
		return { success: true, data: json.data.users.count };
	}
	async function get_followers(uid, page)
	{
		return await fetch(`https://www.luogu.com.cn/user/${uid}/follower?page=${page}`)
			.then(async (data) => {
				const text = await data.text();
				return await parse_followers(text);
			})
			.catch((err) => { return { success: false, data: `获取粉丝列表失败: ${err}` }; });
	}
	async function get_followers_count(uid)
	{
		return await fetch(`https://www.luogu.com.cn/user/${uid}/follower`)
			.then(async (data) => {
				const text = await data.text();
				return await parse_followers_count(text);
			})
			.catch((err) => { return { success: false, data: `获取粉丝数量失败: ${err}` }; });
	}
	async function get_all_followers(uid)
	{
		get_card_status.innerText = `loading...`;
		const cdata = await get_followers_count(uid);
		if (cdata.success)
		{
			const count = cdata.data, pages = Math.ceil(count / 20);
			if (count > 800)
			{
				get_card_status.innerText = `您的粉丝页数太多，为防止高频请求导致封号，禁止使用`;
				return null;
			}
			let nc = 0, success = true, list = [], tasks = [];
			get_card_status.innerText = `loading... 0 / ${count}`;
			for (let i = 1; i <= pages; i++)
			{
				await sleep(1000);
				let p = get_followers(uid, i).then((res) => {
					if (res.success && success)
					{
						nc += res.data.length, list.push(...res.data);
						get_card_status.innerText = `loading... ${nc} / ${count}`;
					}
					else if (!res.success)
					{
						success = false;
						get_card_status.innerText = res.data;
					}
				});
				tasks.push(p);
			}
			await Promise.all(tasks);
			if (success)
			{
				if (nc === count) return list;
				else
				{
					get_card_status.innerText = "获取粉丝列表失败";
					return null;
				}
			}
			else return null;
		}
		else
		{
			get_card_status.innerText = cdata.data;
			return null;
		}
	}

	let list = null, old_list = null;
	const now = new Date();
	const last_time = localStorage.getItem("fchecker-last"), today_list = localStorage.getItem("fchecker-today");
	if (last_time && today_list && (now.toDateString() == last_time))
	{
		list = JSON.parse(today_list);
	}
	else
	{
		list = await get_all_followers(UID);
		if (list)
		{
			localStorage.setItem("fchecker-last", now.toDateString());
			localStorage.setItem("fchecker-today", JSON.stringify(list));
		}
	}
	if (localStorage.getItem("fchecker")) old_list = JSON.parse(localStorage.getItem("fchecker"));
	quit_btn.style.visibility = "";

	function get_color(color)
	{
		color = color.toLowerCase();
		if (color === "gray") return "var(--lfe-color--grey-3)";
		if (color === "cheater") return "var(--lfe-color--yellow-4)";
		return `var(--lfe-color--${color}-3)`;
	}
	function display_followers(list, action_type = "")
	{
		const settings = get_settings_map();
		const show_btn = settings.get("show-btn") !== "false";
		const frag = document.createDocumentFragment();

		for (const user of list)
		{
			let ccf_hook_color = "var(--lfe-color--green-3)";
			if (user.ccfLevel >= 6) ccf_hook_color = "var(--lfe-color--blue-3)";
			if (user.ccfLevel >= 8) ccf_hook_color = "var(--lfe-color--gold-3)";
			const ccf_hook = `
				<svg class="svg-inline--fa fa-badge-check" data-prefix="fad" data-icon="badge-check" role="img" viewBox="0 0 512 512" style="--fa-primary-color: #fff; --fa-secondary-color: ${ccf_hook_color}; --fa-secondary-opacity: 1;">
					<g class="fa-duotone-group">
						<path class="fa-secondary" fill="currentColor" d="M0 256C0 292.8 20.7 324.8 51.1 340.9 41 373.8 49 411 75 437s63.3 34 96.1 23.9C187.2 491.3 219.2 512 256 512s68.8-20.7 84.9-51.1C373.8 471 411 463 437 437s34-63.3 23.9-96.1C491.3 324.8 512 292.8 512 256s-20.7-68.8-51.1-84.9C471 138.2 463 101 437 75s-63.3-34-96.1-23.9C324.8 20.7 292.8 0 256 0s-68.8 20.7-84.9 51.1C138.2 41 101 49 75 75s-34 63.3-23.9 96.1C20.7 187.2 0 219.2 0 256zm152.3 41.6c-9.2-9.5-9-24.7 .6-33.9 9.5-9.2 24.7-8.9 33.9 .6l35.8 37 106.1-145.8c7.8-10.7 22.8-13.1 33.5-5.3 10.7 7.8 13.1 22.8 5.3 33.5L244.7 352.7c-4.2 5.7-10.7 9.4-17.8 9.8-7.1 .5-14-2.2-18.9-7.3l-55.7-57.6z"></path>
						<path class="fa-primary" fill="currentColor" d="M328.7 155.5c7.8-10.7 22.8-13.1 33.5-5.3 10.7 7.8 13.1 22.8 5.3 33.5L244.7 352.7c-4.2 5.7-10.7 9.4-17.8 9.8-7.1 .5-14-2.2-18.9-7.3l-55.7-57.6c-9.2-9.5-9-24.7 .6-33.9 9.5-9.2 24.7-8.9 33.9 .6l35.8 37 106.1-145.8z"></path>
					</g>
				</svg>
			`;

			let xcpc_hook_color = "var(--lfe-color--green-3)";
			if (user.xcpcLevel >= 6) xcpc_hook_color = "var(--lfe-color--blue-3)";
			if (user.xcpcLevel >= 8) xcpc_hook_color = "var(--lfe-color--gold-3)";
			const xcpc_hook = `
				<svg class="svg-inline--fa fa-badge-check" data-prefix="fad" data-icon="badge-check" role="img" viewBox="0 0 512 512" style="--fa-primary-color: #fff; --fa-secondary-color: ${xcpc_hook_color}; --fa-secondary-opacity: 1;">
					<g class="fa-duotone-group">
						<path class="fa-secondary" fill="currentColor" d="M0 192C0 86 86 0 192 0S384 86 384 192c0 128-160 240-160 240l27.9 41.8c2.7 4 4.1 8.8 4.1 13.6 0 13.6-11 24.6-24.6 24.6l-78.9 0c-13.6 0-24.6-11-24.6-24.6 0-4.8 1.4-9.6 4.1-13.6L160 432S0 320 0 192zm104-16c0-39.8 32.2-72 72-72 13.3 0 24-10.7 24-24s-10.7-24-24-24c-66.3 0-120 53.7-120 120 0 13.3 10.7 24 24 24s24-10.7 24-24z"></path>
						<path class="fa-primary" fill="currentColor" d="M56 176c0 13.3 10.7 24 24 24s24-10.7 24-24c0-39.8 32.2-72 72-72 13.3 0 24-10.7 24-24C109.7 56 56 109.7 56 176z"></path>
					</g>
				</svg>
			`;

			const item = insert_el(frag, "div", "", "", "fchecker-user");

			let info_html = `
				<img src="https://cdn.luogu.com.cn/upload/usericon/${user.uid}.png" class="left" />
				<div class="right">
					<div class="user-title">
						<a href="/user/${user.uid}" target="_blank" style="font-weight: bold; font-size: 1em; color: ${get_color(user.color)}">${esc_html(user.name)}</a>
						${user.ccfLevel ? ccf_hook : ''} ${user.xcpcLevel ? xcpc_hook : ''}
						${user.badge ? `<span class="am-badge am-radius" style="font-weight: normal; background-color: ${get_color(user.color)}">${esc_html(user.badge)}</span>` : ''}
					</div>
					<div class="slogan">${esc_html(user.slogan ? user.slogan : "这个家伙很懒，什么也没有留下")}</div>
				</div>
			`;
			insert_el(item, "div", info_html, "", "fchecker-user-info");

			if (show_btn)
			{
				if (action_type === "unfollow")
				{
					const btn = insert_el(item, "button", "回敬", "", "fchecker-action-btn");
					btn.style.backgroundColor = "#ff4d4f";
					btn.addEventListener("click", async () => {
						btn.disabled = true, btn.innerText = "...", btn.style.backgroundColor = "#bfbfbf";
						if (await update_relation(user.uid, 0)) btn.innerText = "已取关";
						else btn.disabled = false, btn.innerText = "失败或未关注";
					});
				}
				else if (action_type === "new")
				{
					const btn = insert_el(item, "button", "回关", "", "fchecker-action-btn");
					btn.style.backgroundColor = "#52c41a";
					btn.addEventListener("click", async () => {
						btn.disabled = true, btn.innerText = "...", btn.style.backgroundColor = "#bfbfbf";
						if (await update_relation(user.uid, 1)) btn.innerText = "已互关";
						else btn.disabled = false, btn.innerText = "失败或已关注";
					});
				}
			}
		}
		get_card.appendChild(frag);
	}
	function save_followers()
	{
		localStorage.setItem("fchecker", JSON.stringify(list));
		show_message("覆盖完成", 3000);
	}
	function comp_followers()
	{
		if (!old_list)
		{
			show_message("还没有旧列表，请先保存哦", 3000);
			return;
		}
		const old_map = new Map();
		for (const u of old_list) old_map.set(u.uid, u);
		const now_map = new Map();
		for (const u of list) now_map.set(u.uid, u);
		const unfollowed = [], new_followers = [];
		for (const [uid, user] of old_map.entries())
			if (!now_map.has(uid)) unfollowed.push(user);
		for (const [uid, user] of now_map.entries())
			if (!old_map.has(uid)) new_followers.push(user);
		get_card.innerHTML = "";
		const save_btn = insert_el(get_card, "button", "覆盖旧列表", "", "fchecker-btn");
		save_btn.addEventListener("click", save_followers);
		insert_el(get_card, "h4", "取关用户", "", "");
		if (unfollowed.length === 0) insert_el(get_card, "p", "无", "", "");
		display_followers(unfollowed, "unfollow");
		insert_el(get_card, "h4", "新粉丝", "", "");
		if (new_followers.length === 0) insert_el(get_card, "p", "无", "", "");
		display_followers(new_followers, "new");
	}
	function show_followers(list)
	{
		get_card.innerHTML = "";
		const comp_btn = insert_el(get_card, "button", "对比差异", "", "fchecker-btn");
		const save_btn = insert_el(get_card, "button", "覆盖旧列表", "", "fchecker-btn");
		comp_btn.addEventListener("click", comp_followers);
		save_btn.addEventListener("click", save_followers);
		display_followers(list);
	}
	if (list) show_followers(list);
}
function show_set()
{
	main.style.display = "none";
	document.body.style.overflow = "hidden";

	const mask = insert_el(fchecker, "div", "", "", "fchecker-modal-mask");
	const dialog = insert_el(mask, "div", "", "", "fchecker-modal-dialog");
	const header = insert_el(dialog, "div", "设置", "", "fchecker-modal-header");
	const quit_btn = insert_el(header, "button", "×", "", "fchecker-modal-close");

	function destroy_modal()
	{
		mask.remove();
		document.body.style.overflow = "";
		main.style.display = "";
	};
	quit_btn.addEventListener("click", destroy_modal);

	const set_card = insert_el(dialog, "div", "", "", "fchecker-modal-body");

	const settings = get_settings_map();
	const show_btn = settings.get("show-btn") !== "false";

	const item1 = insert_el(set_card, "div", "", "", "fchecker-setting-item");
	const cb1 = insert_el(item1, "input", "", "fchecker-cb-btn", "");
	cb1.type = "checkbox";
	cb1.checked = show_btn;
	const label2 = insert_el(item1, "label", "显示回关/回敬按钮", "", "");
	label2.htmlFor = "fchecker-cb-btn";
	cb1.addEventListener("change", () => {
		settings.set("show-btn", String(cb1.checked));
		localStorage.setItem("fchecker-setting", map_to_string(settings));
	});
}
function show_info()
{
	main.style.display = "none";
	document.body.style.overflow = "hidden";

	const mask = insert_el(fchecker, "div", "", "", "fchecker-modal-mask");
	const dialog = insert_el(mask, "div", "", "", "fchecker-modal-dialog");
	const header = insert_el(dialog, "div", "关于", "", "fchecker-modal-header");
	const quit_btn = insert_el(header, "button", "×", "", "fchecker-modal-close");

	function destroy_modal()
	{
		mask.remove();
		document.body.style.overflow = "";
		main.style.display = "";
	};
	quit_btn.addEventListener("click", destroy_modal);

	const html = `
		<h3>洛谷取关提醒器 ${version}</h3>
		<p id="dev-1202669">
			by @<a href="https://www.luogu.com.cn/user/1202669">Gary0</a>
		</p>
		<p>
			<h4>更新获取</h4>
			<a href="https://greasyfork.org/zh-CN/scripts/582602">GreasyFork（推荐）</a>
			||
			<a href="https://github.com/Gary-0925/lg-fchecker/blob/main/main.js">Github</a>
			||
			<a href="https://www.luogu.com.cn/article/ugc80dim">洛谷（更新慢）</a>
		</p>
		<p>
			<h4>反馈与建议</h4>
			<a href="https://www.luogu.com.cn/chat?uid=1202669">洛谷</a>
			||
			<a href="https://github.com/Gary-0925/lg-fchecker/pulls">Github</a>
			||
			<a href="https://greasyfork.org/zh-CN/scripts/582602/feedback">GreasyFork</a>
		</p>
	`;
	insert_el(dialog, "div", html, "", "fchecker-modal-body");

	for (const dev of devs)
	{
		const btn = insert_el(get_el(`dev-${dev}`), "button", "关注 ta", "", "fchecker-action-btn");
		btn.style.backgroundColor = "#52c41a";
		btn.addEventListener("click", async () => {
			btn.disabled = true, btn.innerText = "...", btn.style.backgroundColor = "#bfbfbf";
			if (await update_relation(dev, 1)) btn.innerText = "已关注";
			else btn.disabled = false, btn.innerText = "失败或已关注";
		});
	}
}

get_btn.addEventListener("click", show_get);
set_btn.addEventListener("click", show_set);
info_btn.addEventListener("click", show_info);
