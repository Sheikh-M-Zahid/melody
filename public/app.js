const $ = s => document.querySelector(s), tk = n => '৳' + Number(n).toLocaleString('en-IN'), esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const J = k => { try { return JSON.parse(localStorage[k] || '[]') } catch { return [] } };
let S, cart = J('cart'), wish = J('wish'), skew = 0, DIST = 'Dhaka', PS = {};
const HT = 'Melody — A Symphony in Every Scent', G = { female: 'Women', male: 'Men', unisex: 'Unisex' }, PN = { cod: 'Cash on Delivery', bkash: 'bKash', nagad: 'Nagad', rocket: 'Rocket', bank: 'Bank Transfer' };
const P = id => S.products.find(p => p.id == id), sc = () => { localStorage.cart = JSON.stringify(cart); localStorage.wish = JSON.stringify(wish) };
/* ---- pricing (mirrors the server; the server re-calculates every order) ---- */
const pOn = () => S.promo && Date.parse(S.promo.ends_at) > Date.now() + skew;
const unit = (p, v) => { let u = v.sale > 0 ? v.sale : v.price; if (pOn() && (p.premium || !S.promo.premium_only)) u = Math.min(u, v.price - Math.round(v.price * S.promo.discount_pct / 100)); return u };
const lo = p => Math.min(...p.variants.map(v => unit(p, v))), lo0 = p => Math.min(...p.variants.map(v => v.price)), stk = p => p.variants.reduce((a, v) => a + +v.stock, 0), onSale = p => p.variants.some(v => unit(p, v) < v.price);
const pct = (p, v) => Math.round(100 - unit(p, v) / v.price * 100);
const price = (p, v) => unit(p, v) < v.price ? `<span class="strike">${tk(v.price)}</span> <b>${tk(unit(p, v))}</b>` : `<b>${tk(v.price)}</b>`;
const pic = (p, cls = '') => p.image_url ? `<img ${cls} loading="lazy" src="${esc(p.image_url)}" alt="${esc(p.name)} eau de parfum" onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'ph',textContent:this.alt.split(' eau')[0]}))">` : `<div class="ph">${esc(p.name)}</div>`;
function pcard(p) { const s = stk(p), d = onSale(p); return `<a class="card ${s ? '' : 'out'}" href="/p/${esc(p.slug)}">${pic(p)}${d ? '<span class="badge">SALE</span>' : p.is_new ? '<span class="badge">NEW</span>' : ''}<div><small>${G[p.gender] || ''}</small><h3 style="margin:0">${esc(p.name)}</h3>${s ? `From ${d && lo0(p) > lo(p) ? `<span class="strike">${tk(lo0(p))}</span> ` : ''}<b>${tk(lo(p))}</b>` : 'Out of stock'}</div></a>` }
const grid = L => L.length ? `<div class="grid">${L.map(pcard).join('')}</div>` : '<p>No scents here yet.</p>';
/* ---- promo ---- */
function cdown() { let r = Math.max(0, Date.parse(S.promo.ends_at) - (Date.now() + skew)); return `<div class="cd" data-cd>${[['Days', 864e5], ['Hours', 36e5], ['Minutes', 6e4], ['Seconds', 1e3]].map(([l, m]) => { const x = Math.floor(r / m); r -= x * m; return `<div><b>${String(x).padStart(2, '0')}</b><span>${l}</span></div>` }).join('')}</div>` }
setInterval(() => { const e = $('[data-cd]'); if (!e) return; if (!pOn()) { S.promo = null; route(); return } e.outerHTML = cdown() }, 1000);
function banner(compact) {
    const q = S.promo; if (!pOn()) return !compact && S.site.promo_ended ? `<p class="save">${esc(S.site.promo_ended)}</p>` : '';
    // promo media: video (home page only) -> falls back to the image; the image is also the video poster
    const hv = ((S.site.hero || {}).video) || '', pvu = q.video_url || hv, media = pvu && !compact ? `<video class="pv" src="${esc(pvu)}" ${q.image_url ? `poster="${esc(q.image_url)}"` : ''} autoplay muted loop playsinline preload="auto"></video>` : q.image_url ? `<img loading="lazy" src="${esc(q.image_url)}" alt="${esc(q.title)}">` : '';
    return `<div class="promo ${media ? '' : 'noimg'}"><div class="t"><small>LIMITED TIME OFFER</small><div class="big">${q.discount_pct}% OFF</div><h2>${esc(q.title)}</h2>${q.body ? `<p>${esc(q.body)}</p>` : ''}${compact ? '' : cdown()}<a class="btn g" href="/shop?sale=1">${esc(q.cta_text || 'Shop the Collection')}</a></div>${media}</div>`
}
/* ---- blocks ---- */
const COLS = [['women', 'female', 'Women'], ['men', 'male', 'Men'], ['unisex', 'unisex', 'Unisex']];
const colls = () => `<div class="tabs">${COLS.map(([k, g, n]) => { const L = S.products.filter(p => p.gender == g), f = L.find(p => p.image_url); return `<div class="col">${f ? `<img loading="lazy" src="${esc(f.image_url)}" alt="${n} fragrances">` : `<div class="ph">${n}</div>`}<a href="/collections/${k}"><h3>${n}</h3>${L.length} scents</a></div>` }).join('')}</div>`;
function vid() { const s = S.site, h = s.hero || {}; if (!h.video) return ''; return `<section class="sec" style="background:var(--peach)"><div class="w" style="text-align:center"><h2>${esc(h.vtitle || '')}</h2><p>${esc(h.vtext || '')}</p><video src="${esc(h.video)}" ${h.poster ? `poster="${esc(h.poster)}"` : ''} ${h.autoplay ? 'autoplay muted' : ''} loop controls playsinline preload="metadata"></video><p><a class="btn" href="/collections">Explore Our Collection</a></p></div></section>` }
function aboutBlock() {
    const s = S.site, why = (s.why || '').split('·').map(x => x.trim()).filter(Boolean), vals = (s.values || '').split('\n').filter(x => x.trim());
    return `<section class="w sec"><div class="two"><div><h2>Our story</h2><p>${esc(s.about)}</p>${why.length ? `<h3>Why choose Melody</h3><ul>${why.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}</div><div class="vals">${vals.map(x => { const [a, b] = x.split('|'); return `<div class="box"><h3>${esc(a)}</h3><p>${esc(b)}</p></div>` }).join('')}</div></div></section>`
}
const mv = () => `<section class="w sec"><div class="two"><div class="box"><h2>Our mission</h2><p>${esc(S.site.mission)}</p></div><div class="box"><h2>Our vision</h2><p>${esc(S.site.vision)}</p></div></div></section>`;
const sec = (h, L) => L.length ? `<section class="w sec"><h2>${h}</h2>${grid(L)}</section>` : '';
/* ---- views ---- */
const V = {
    home() {
        const s = S.site, h = s.hero || {}, best = S.products.filter(p => p.best || p.featured).slice(0, 4);
        return `${s.logo ? `<div class="w" style="text-align:center;padding-top:28px"><img src="${esc(s.logo)}" alt="Melody — A Symphony in Every Scent" style="height:240px;width:auto;margin:auto"></div>` : ''}
<div class="heroband"><div class="w hero ${h.image ? '' : 'solo'}"><div><div class="tag">${esc(s.tagline)}</div><h1>${esc(h.title)}</h1><p>${esc(h.desc)}</p><p><a class="btn" href="/shop">${esc(h.cta1 || 'Shop Now')}</a> <a class="btn o" href="/collections">${esc(h.cta2 || 'Explore Collections')}</a></p></div>${h.image ? `<img src="${esc(h.image)}" alt="Melody eau de parfum">` : ''}</div></div>
${pOn() || s.promo_ended ? `<section class="w promo-sec">${banner()}</section>` : ''}
<section class="w sec"><h2>Find your scent</h2>${colls()}</section>${sec('Best sellers', best)}${mv()}${vid()}${aboutBlock()}${sec('New arrivals', S.products.filter(p => p.is_new))}`
    },
    collections(a, k) {
        const C = { women: ['Women', p => p.gender == 'female', 'Romantic, elegant and warm scents for her.'], men: ['Men', p => p.gender == 'male', 'Bold, deep and confident fragrances for him.'], unisex: ['Unisex', p => p.gender == 'unisex', 'Signature blends made for everyone.'], 'best-sellers': ['Best Sellers', p => p.best || p.featured, 'Our most loved fragrances.'], 'on-sale': ['On Sale', onSale, 'Fragrances with a special price right now.'] };
        if (!k) return `<div class="w sec"><h1>Collections</h1>${colls()}<h2 style="margin-top:40px">Popular now</h2>${grid(S.products.filter(p => p.best || p.featured))}</div>`;
        const c = C[k]; if (!c) return V.nf(); document.title = c[0] + ' Collection — Melody'; return `<div class="w sec"><p><a href="/collections">← All collections</a></p><h1>${c[0]}</h1><p>${c[2]}</p>${S.products.filter(c[1]).length ? grid(S.products.filter(c[1])) : '<p>No fragrances in this collection right now.</p>'}</div>`
    },
    about() { return `<div class="w sec"><h1>About Melody</h1></div>${aboutBlock()}${mv()}` },
    contact() { const c = S.site.contact || {}; return `<div class="w sec"><h1>Contact</h1><p>Phone: <a href="tel:${esc(c.phone)}">${esc(c.phone)}</a><br>Email: <a href="mailto:${esc(c.email)}">${esc(c.email)}</a><br>Address: ${esc(c.address)}</p><h3>Delivery</h3><p>${esc(S.site.ship)}</p><h3>Returns</h3><p>${esc(S.site.ret)}</p></div>` },
    shop(a) {
        const q = (a.q || '').toLowerCase(); let L = S.products.filter(p => (!a.g || p.gender === a.g) && (!q || ((p.name || '') + (p.notes || '') + (p.short_desc || '') + (p.description || '')).toLowerCase().includes(q)) && (!a.sale || onSale(p)) && (!a.stock || stk(p)) && (!a.wish || wish.includes(p.id)) && (!a.tag || p[a.tag]));
        const so = a.s || 'feat'; L.sort((x, y) => so == 'lo' ? lo(x) - lo(y) : so == 'hi' ? lo(y) - lo(x) : so == 'new' ? y.id - x.id : so == 'pop' ? (+!!y.best) - (+!!x.best) : (+!!y.featured) - (+!!x.featured));
        const o = (v, t, c) => `<option value="${v}" ${c ? 'selected' : ''}>${t}</option>`;
        return `<div class="w sec"><h1>${a.wish ? 'Wishlist' : 'Shop'}</h1><form class="flt" onsubmit="event.preventDefault();go(this)"><input id="fq" name="q" placeholder="Search scents" value="${esc(a.q || '')}"><select name="g">${o('', 'All')}${Object.entries(G).map(([k, v]) => o(k, v, a.g === k)).join('')}</select><select name="tag">${o('', 'Any')}${o('best', 'Best sellers', a.tag == 'best')}${o('is_new', 'New arrivals', a.tag == 'is_new')}${o('featured', 'Featured', a.tag == 'featured')}</select><select name="s">${o('feat', 'Featured')}${o('new', 'Newest', so == 'new')}${o('lo', 'Price: low to high', so == 'lo')}${o('hi', 'Price: high to low', so == 'hi')}${o('pop', 'Popular', so == 'pop')}</select><label><input type="checkbox" name="sale" value="1" ${a.sale ? 'checked' : ''}> On sale</label><label><input type="checkbox" name="stock" value="1" ${a.stock ? 'checked' : ''}> In stock</label>${a.wish ? '<input type="hidden" name="wish" value="1">' : ''}<button class="btn">Apply</button></form>${L.length ? grid(L) : '<p>No scents match. Clear a filter to see more.</p>'}</div>`
    },
    p(a, slug) {
        const p = S.products.find(x => x.slug === slug); if (!p) return V.nf(); document.title = p.name + ' — Melody';
        if (PS.id !== p.id) PS = { id: p.id, vi: Math.max(0, p.variants.findIndex(v => v.stock > 0)), q: 1 };
        return `<div class="w pd" id="pb">${pBody(p)}</div><section class="w rv" id="rv"></section><section class="w sec"><h2>You may also like</h2>${grid(S.products.filter(x => x.id !== p.id && (x.gender === p.gender || x.best)).slice(0, 4))}</section>`
    },
    cart() {
        cleanCart(); const L = lines(); if (!L.length) return '<div class="w sec"><h1>Your cart</h1><p>Your cart is empty.</p><a class="btn" href="/shop">Browse scents</a></div>';
        return `<div class="w sec"><h1>Your cart</h1><div class="lay"><div>${L.map(l => `<div class="row">${pic(l.p)}<div><b>${esc(l.p.name)}</b><br><small>${l.v.size_ml}ml</small><br>${l.u < l.v.price ? `<span class="strike">${tk(l.v.price)}</span> <b>${tk(l.u)}</b> <span class="badge s">${pct(l.p, l.v)}% OFF</span>` : tk(l.u)}<br><span class="qty"><button aria-label="Less" onclick="cq(${l.i},-1)">−</button><span>${l.q}</span><button aria-label="More" onclick="cq(${l.i},1)">+</button></span> <a href="#" onclick="rm(${l.i});return false">Remove</a></div><b>${tk(l.u * l.q)}</b></div>`).join('')}${banner(1)}</div><div class="sum"><h3>Summary</h3><div id="sm"></div><small>*Dhaka ${tk(S.site.delivery.dhaka)}, elsewhere ${tk(S.site.delivery.outside)}${+S.site.delivery.free ? `. Free delivery over ${tk(S.site.delivery.free)}` : ''}. Final fee is set at checkout.</small><p><a class="btn g" href="/checkout" style="width:100%;text-align:center">Checkout</a></p></div></div></div>`
    },
    checkout() {
        cleanCart(); const L = lines(); if (!L.length) return '<div class="w sec"><h1>Checkout</h1><p>Your cart is empty.</p><a class="btn" href="/shop">Browse scents</a></div>';
        const on = Object.keys(PN).filter(k => S.site.payments[k] && S.site.payments[k].on), D = ['Dhaka', 'Chattogram', 'Sylhet', 'Rajshahi', 'Khulna', 'Barishal', 'Rangpur', 'Mymensingh', 'Gazipur', 'Narayanganj', 'Cumilla', 'Other'];
        return `<div class="w sec"><h1>Checkout</h1><form class="lay" onsubmit="return order(event)"><div><label>Full name<input name="name" required></label><label>Mobile number<input name="phone" required pattern="01[0-9]{9}" placeholder="01XXXXXXXXX" inputmode="numeric"></label><label>Email<input name="email" type="email"></label><label>Full delivery address<textarea name="addr" required rows="2"></textarea></label><div class="f2"><label>District<select name="dist" onchange="dsel(this)">${D.map(x => `<option ${x == DIST ? 'selected' : ''}>${x}</option>`).join('')}</select></label><label>City / area<input name="city"></label></div><label>Delivery instructions (optional)<input name="note"></label><h3>Payment</h3>${on.map((k, i) => `<label class="pay"><input type="radio" name="pay" value="${k}" ${i ? '' : 'checked'} onchange="pinfo()">${PN[k]}</label>`).join('')}<div id="pi"></div></div>
<div class="sum"><h3>Order summary</h3>${L.map(l => `<div class="row sm">${pic(l.p)}<div>${esc(l.p.name)} <small>${l.v.size_ml}ml × ${l.q}</small></div><span>${tk(l.u * l.q)}</span></div>`).join('')}<div id="sm"></div><p id="oe" class="err"></p><button class="btn g" id="ob" style="width:100%">Place order</button></div></form></div>`
    },
    order() {
        let o; try { o = JSON.parse(sessionStorage.last) } catch { } if (!o) return '<div class="w sec"><h1>No recent order</h1><a class="btn" href="/shop">Continue shopping</a></div>';
        return `<div class="w sec" style="max-width:720px"><div class="tag">Thank you, ${esc(o.name)}</div><h1>Order ${esc(o.no)} confirmed</h1><p class="save">We will call ${esc(o.phone)} to confirm. Estimated delivery: ${esc(S.site.eta)}.</p>${o.items.map(i => `<div class="row sm" style="grid-template-columns:70px 1fr auto">${i.img ? `<img src="${esc(i.img)}" alt="">` : '<div class="ph"></div>'}<div>${esc(i.name)} <small>${i.size}ml × ${i.q}</small></div><span>${tk(i.u * i.q)}</span></div>`).join('')}<p>Subtotal ${tk(o.total - o.delivery + o.discount)} · Discount −${tk(o.discount)} · Delivery ${o.delivery ? tk(o.delivery) : 'Free'}</p><h3>Total ${tk(o.total)}</h3><p>Payment: ${esc(PN[o.pay] || o.pay)}${o.trx ? ' (ref ' + esc(o.trx) + ')' : ''}<br>Deliver to: ${esc(o.addr)}</p><a class="btn" href="/shop">Continue shopping</a></div>`
    },
    nf() { return '<div class="w sec"><h1>Page not found</h1><a class="btn" href="/shop">Back to shop</a></div>' }
};
/* ---- product page ---- */
function pBody(p) {
    const v = p.variants[PS.vi], ok = +v.stock > 0, q = PS.q;
    return `${pic(p, '')}<div><small>${G[p.gender] || ''} · eau de parfum</small><h1>${esc(p.name)}</h1>${p.rcount ? `<p><small>★ ${p.rating} · ${p.rcount} review${p.rcount == 1 ? '' : 's'}</small></p>` : ''}${p.description && p.short_desc ? `<p class="tag" style="font-size:1.2rem">${esc(p.short_desc)}</p>` : ''}<p style="font-size:1.3rem">${price(p, v)} ${unit(p, v) < v.price ? `<span class="badge s">${pct(p, v)}% OFF</span>` : ''}</p><p>${ok ? (v.stock < 6 ? `Only ${v.stock} left` : 'In stock') : 'Out of stock'}${v.sku ? ' · SKU ' + esc(v.sku) : ''}</p>
<div class="vr">${p.variants.map((x, j) => `<button class="${j === PS.vi ? 'on' : ''}" ${x.stock > 0 ? '' : 'disabled'} onclick="pSel(${j})">${x.size_ml}ml</button>`).join('')}</div>
<div class="buy"><span class="qty"><button aria-label="Less" onclick="pQty(-1)">−</button><span>${q}</span><button aria-label="More" onclick="pQty(1)">+</button></span> <button class="btn" ${ok ? '' : 'disabled'} onclick="add(${p.id},${v.id},${q})">Add to cart</button> <button class="btn g" ${ok ? '' : 'disabled'} onclick="add(${p.id},${v.id},${q},1)">Buy now</button> <button class="btn o" aria-label="Wishlist" onclick="tw(${p.id})">${wish.includes(p.id) ? '♥' : '♡'}</button></div>
<h3 style="margin-top:24px">About this scent</h3><p>${esc(p.description || p.short_desc || '')}</p>${p.notes ? `<h3>Fragrance notes</h3><p>${esc(p.notes)}</p>` : ''}<h3>Delivery</h3><p>${esc(S.site.ship)}</p><h3>Returns</h3><p>${esc(S.site.ret)}</p></div>`
}
const pRe = () => { const p = P(PS.id); $('#pb').innerHTML = pBody(p) };
const pSel = i => { PS.vi = i; PS.q = 1; pRe() }, pQty = d => { const v = P(PS.id).variants[PS.vi]; PS.q = Math.max(1, Math.min(+v.stock, PS.q + d)); pRe() };
async function loadRv(id) {
    let r = []; try { r = await (await fetch('/api/reviews/' + id)).json() } catch { } if (!Array.isArray(r)) r = []; const el = $('#rv'); if (!el) return;
    el.innerHTML = `<h2>Customer reviews</h2>${r.length ? r.map(x => `<div class="it"><b>${esc(x.name)}</b> <span class="st">${'★'.repeat(x.rating)}${'☆'.repeat(5 - x.rating)}</span><br><small>${new Date(x.created_at).toLocaleDateString()}</small><p>${esc(x.comment)}</p></div>`).join('') : '<p><small>No reviews yet. Be the first!</small></p>'}<details><summary><b>Write a review</b></summary><input id="rn" placeholder="Your name" maxlength="60"><select id="rr">${[5, 4, 3, 2, 1].map(n => `<option value="${n}">${'★'.repeat(n)} (${n})</option>`).join('')}</select><textarea id="rc" rows="3" maxlength="600" placeholder="Share your experience"></textarea><p id="rm"></p><button class="btn" onclick="sendRv(${id})">Submit review</button></details>`
}
async function sendRv(id) {
    let r; try { r = await (await fetch('/api/reviews', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ product_id: id, name: $('#rn').value, rating: +$('#rr').value, comment: $('#rc').value }) })).json() } catch { r = { error: 'Network error, please try again.' } }
    $('#rm').textContent = r.error || 'Thank you! Your review will appear after approval.'; if (!r.error) { $('#rn').value = ''; $('#rc').value = '' }
}
/* ---- cart / checkout ---- */
function cleanCart() { const n = cart.length; cart = cart.filter(c => { const p = P(c.pid); return p && p.variants.some(v => v.id == c.vid) }); if (cart.length !== n) { sc(); hdr() } }
const lines = () => cart.map((c, i) => { const p = P(c.pid), v = p.variants.find(v => v.id == c.vid); return { p, v, c, i, q: Math.max(1, Math.min(c.qty, +v.stock || 1)), u: unit(p, v) } });
function add(pid, vid, q, buy) { const v = P(pid).variants.find(v => v.id == vid), c = cart.find(x => x.vid == vid); if (c) c.qty = Math.min(c.qty + q, +v.stock); else cart.push({ pid, vid, qty: Math.min(q, +v.stock) }); sc(); hdr(); nav(buy ? '/checkout' : '/cart') }
function cq(i, d) { const c = cart[i], v = P(c.pid).variants.find(v => v.id == c.vid); c.qty = Math.max(1, Math.min(+v.stock, c.qty + d)); sc(); route() }
function rm(i) { cart.splice(i, 1); sc(); hdr(); route() }
function tw(id) { wish = wish.includes(id) ? wish.filter(x => x !== id) : [...wish, id]; sc(); route() }
function go(f) { const a = new URLSearchParams(); for (const [k, v] of new FormData(f)) if (v) a.set(k, v); nav('/shop?' + a) }
const quote = () => fetch('/api/quote', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: cart.map(c => ({ variantId: c.vid, qty: c.qty })), district: location.pathname == '/checkout' ? DIST : '' }) }).then(r => r.json());
async function sumFill() {
    const e = $('#sm'); if (!e || !cart.length) return; let t; try { t = await quote() } catch { t = { error: 'Network error, please try again.' } } if (!$('#sm')) return;
    $('#sm').innerHTML = t.error ? `<p class="err">${esc(t.error)}</p>` : `<p><span>Subtotal</span><span>${tk(t.subtotal)}</span></p>${t.discount ? `<p class="save">✨ You're saving ${tk(t.discount)} on this order!</p><p><span>Discount</span><span>−${tk(t.discount)}</span></p>` : ''}<p><span>Delivery</span><span>${t.delivery ? tk(t.delivery) + (location.pathname == '/cart' ? '*' : '') : 'Free'}</span></p><p><b>Total</b><b>${tk(t.total)}</b></p>`
}
const dsel = s => { DIST = s.value; sumFill() };
function pinfo() {
    const k = (document.querySelector('[name=pay]:checked') || {}).value, y = S.site.payments[k] || {};
    $('#pi').innerHTML = `<div class="save">${y.number ? `<b>${esc(y.number)}</b><br>` : ''}${esc(y.note || '')}</div>${['bkash', 'nagad', 'rocket'].includes(k) ? '<label>Transaction ID<input name="trx" required></label>' : k == 'bank' ? '<label>Transaction reference<input name="trx"></label>' : ''}`
}
async function order(e) {
    e.preventDefault(); const f = Object.fromEntries(new FormData(e.target)), b = $('#ob'), L = lines(); b.disabled = true; $('#oe').textContent = '';
    const addr = f.addr + (f.city ? ', ' + f.city : ''); let r;
    try { r = await (await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ customer: { name: f.name, phone: f.phone, email: f.email, address: addr, district: f.dist, note: f.note }, items: cart.map(c => ({ variantId: c.vid, qty: c.qty })), payment: f.pay, trx: f.trx || '' }) })).json() } catch { r = { error: 'Network error, please try again.' } }
    if (r.error) { $('#oe').textContent = r.error; b.disabled = false; return false }
    sessionStorage.last = JSON.stringify({ no: r.orderNo, name: f.name, phone: f.phone, addr: addr + ', ' + f.dist, pay: f.pay, trx: f.trx || '', total: r.total, discount: r.discount, delivery: r.delivery, items: L.map(l => ({ name: l.p.name, size: l.v.size_ml, q: l.q, u: l.u, img: l.p.image_url })) });
    cart = []; sc(); hdr(); nav('/order'); refresh(); return false
}
async function refresh() { try { const d = await (await fetch('/api/store')).json(); S.products = d.products.filter(p => p.variants.length); S.promo = d.promo } catch { } }
/* ---- shell + routing ---- */
function hdr() {
    const s = S.site, c = s.contact || {}, lg = $('#lg'); $('#bar').textContent = s.bar || '';
    lg.className = s.logo ? '' : 'lt'; lg.innerHTML = s.logo ? `<img src="${esc(s.logo)}" alt="Melody">` : 'Melody'; $('#cc').textContent = cart.reduce((a, x) => a + x.qty, 0) || '';
    const soc = [['fb', 'Facebook'], ['ig', 'Instagram'], ['tt', 'TikTok'], ['yt', 'YouTube']].filter(([k]) => c[k] && c[k] != '#');
    $('#ft').innerHTML = `<div>${s.logo ? `<img src="${esc(s.logo)}" alt="Melody">` : '<h3>Melody</h3>'}<p>${esc(s.tagline)}</p><p>${soc.map(([k, n]) => `<a class="i" href="${esc(c[k])}" target="_blank" rel="noopener">${n}</a>`).join('')}</p><small>${Object.keys(PN).filter(k => S.site.payments[k] && S.site.payments[k].on).map(k => PN[k]).join(' · ')}</small></div><div><h3>Quick links</h3><a href="/">Home</a><a href="/shop">Shop</a><a href="/collections">Collections</a><a href="/about">About Us</a><a href="/contact">Contact</a><a href="/contact">Shipping &amp; Returns</a></div><div><h3>Support</h3><a href="tel:${esc(c.phone)}">${esc(c.phone)}</a><a href="mailto:${esc(c.email)}">${esc(c.email)}</a><span>${esc(c.address)}</span></div>`
}
function nav(u) { history.pushState(null, '', u); route() }
function route() {
    if (!S) return; const u = location.pathname.replace(/\/+$/, '') || '/', a = Object.fromEntries(new URLSearchParams(location.search)), seg = u.split('/').filter(Boolean), n = seg[0] || 'home', k = u + location.search;
    document.title = HT; $('#app').innerHTML = (V[n] || V.nf)(a, seg[1]); hdr();
    document.querySelectorAll('video[autoplay]').forEach(v => { v.muted = true; v.play().catch(() => { }) });
    document.querySelectorAll('.nav a').forEach(x => x.classList.toggle('on', x.getAttribute('href') == (n == 'home' ? '/' : '/' + n)));
    if (n == 'checkout') pinfo(); if (n == 'cart' || n == 'checkout') sumFill(); if (n == 'p' && PS.id) loadRv(PS.id); if (n == 'shop' && a.focus && $('#fq')) $('#fq').focus();
    if (route.k !== k) scrollTo(0, 0); route.k = k
}
addEventListener('popstate', route);
document.addEventListener('click', e => {
    const a = e.target.closest && e.target.closest('a[href]'); if (!a || a.target || e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey) return; const u = new URL(a.href, location.origin);
    if (u.origin !== location.origin || /^\/(admin\.html|uploads|api)/.test(u.pathname) || (a.getAttribute('href') || '').startsWith('#')) return; e.preventDefault(); nav(u.pathname + u.search)
});
(async () => {
    try { S = await (await fetch('/api/store')).json() } catch { $('#app').innerHTML = '<div class="w sec"><h1>Please try again</h1><p>The store could not be loaded.</p></div>'; return }
    skew = Date.parse(S.now) - Date.now(); S.products = S.products.filter(p => p.variants.length); S.site.delivery = S.site.delivery || {}; S.site.payments = S.site.payments || {}; hdr(); route()
})();
