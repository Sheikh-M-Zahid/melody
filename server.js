require('dotenv').config();
const express=require('express'),{Pool}=require('pg'),jwt=require('jsonwebtoken'),multer=require('multer'),path=require('path'),crypto=require('crypto'),fs=require('fs');
let sharp;try{sharp=require('sharp')}catch{console.warn('sharp not installed: uploads will not be compressed')}
const pool=new Pool({connectionString:process.env.DATABASE_URL,ssl:{rejectUnauthorized:false}});
const q=(s,p,c=pool)=>c.query(s,p).then(r=>r.rows);
const app=express(),PUB=path.join(__dirname,'public'),UP=path.join(PUB,'uploads');fs.mkdirSync(UP,{recursive:true});
app.set('trust proxy',1);app.use(express.json());
process.on('unhandledRejection',e=>console.error(e));
const h=f=>(req,res,next)=>Promise.resolve(f(req,res,next)).catch(next);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const T='Melody — A Symphony in Every Scent',D='Melody luxury eau de parfum for men, women & unisex. Delivery across Bangladesh.',B=r=>r.protocol+'://'+r.get('host');
const CT={men:'Men',women:'Women',unisex:'Unisex','best-sellers':'Best Sellers','on-sale':'On Sale'};
// ---- SEO pages: index.html rendered with per-page meta / JSON-LD ----
let IDX;const idx=()=>IDX||(IDX=fs.readFileSync(path.join(PUB,'index.html'),'utf8'));
function page(req,res,m={}){const b=B(req),t=m.title||T,d=m.desc||D,img=m.image&&new URL(m.image,b).href,url=b+req.path;
 const seo=`<meta name="description" content="${esc(d)}"><link rel="canonical" href="${esc(url)}"><meta property="og:site_name" content="Melody"><meta property="og:title" content="${esc(t)}"><meta property="og:description" content="${esc(d)}"><meta property="og:type" content="${m.ld?'product':'website'}"><meta property="og:url" content="${esc(url)}">${img?`<meta property="og:image" content="${esc(img)}">`:''}<meta name="twitter:card" content="${img?'summary_large_image':'summary'}">${m.status==404?'<meta name="robots" content="noindex">':''}${m.ld?`<script type="application/ld+json" id="ld">${JSON.stringify(m.ld).replace(/</g,'\\u003c')}</script>`:''}`;
 res.status(m.status||200).type('html').send(idx().replace(/<title>[^<]*<\/title>/,()=>`<title>${esc(t)}</title>`).replace('<!--SEO-->',()=>seo))}
const slugify=s=>String(s||'').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
async function uniqueSlug(name,id=0,c=pool){const b=slugify(name)||'product';for(let i=1;;i++){const s=i>1?b+'-'+i:b;if(!(await q('select 1 from products where slug=$1 and id<>$2',[s,id],c)).length)return s}}
app.get('/',(req,res)=>page(req,res));
app.get('/p/:slug',h(async(req,res)=>{const p=(await q(PQ+' where p.active and p.slug=$1 group by p.id',[req.params.slug]))[0];
 if(!p)return page(req,res,{status:404,title:'Product not found — Melody'});
 const b=B(req),pr=await promoNow(pool),pc=pr&&(p.premium||!pr.premium_only)?pr.discount_pct:0,url=b+req.path;
 page(req,res,{title:p.name+' — Melody',desc:[p.short_desc,p.notes&&'Notes: '+p.notes].filter(Boolean).join(' · ')||D,image:p.image_url,ld:{'@context':'https://schema.org','@type':'Product',name:p.name,description:p.short_desc||p.name,brand:{'@type':'Brand',name:'Melody'},image:p.image_url?new URL(p.image_url,b).href:undefined,url,
  offers:p.variants.length?{'@type':'Offer',priceCurrency:'BDT',price:Math.min(...p.variants.map(v=>Math.min(v.sale>0?v.sale:v.price,v.price-Math.round(v.price*pc/100)))),url,availability:p.variants.some(v=>v.stock>0)?'https://schema.org/InStock':'https://schema.org/OutOfStock'}:undefined,
  aggregateRating:p.rcount?{'@type':'AggregateRating',ratingValue:p.rating,reviewCount:p.rcount}:undefined}})}));
const PG={'/shop':'Shop','/cart':'Your cart','/checkout':'Checkout','/about':'About Us','/contact':'Contact','/order':'Order confirmed'};
app.get(Object.keys(PG),(req,res)=>page(req,res,{title:PG[req.path]+' — Melody'}));
app.get('/collections',(req,res)=>page(req,res,{title:'Collections — Melody',desc:'Explore Melody fragrance collections for men, women and unisex.'}));
app.get('/collections/:k',(req,res)=>CT[req.params.k]?page(req,res,{title:CT[req.params.k]+' Collection — Melody',desc:'Shop the Melody '+CT[req.params.k]+' fragrance collection. Delivery across Bangladesh.'}):page(req,res,{status:404,title:'Collection not found — Melody'}));
app.get('/robots.txt',(req,res)=>res.type('text').send(`User-agent: *\nAllow: /\nDisallow: /admin.html\nDisallow: /api/admin\nSitemap: ${B(req)}/sitemap.xml\n`));
app.get('/sitemap.xml',h(async(req,res)=>{const b=B(req),ps=await q('select slug from products where active and slug is not null order by id'),u=['/','/shop','/about','/contact','/collections',...Object.keys(CT).filter(k=>k!='on-sale').map(k=>'/collections/'+k),...ps.map(p=>'/p/'+p.slug)];
 res.type('xml').send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${u.map(x=>`<url><loc>${esc(b+x)}</loc></url>`).join('')}</urlset>`)}));
app.use('/uploads',express.static(UP,{maxAge:'30d',immutable:true}));app.use(express.static(PUB,{maxAge:0}));
const up=multer({storage:multer.diskStorage({destination:UP,filename:(_,f,cb)=>cb(null,Date.now()+path.extname(f.originalname))}),limits:{fileSize:300e6}});
const same=(a='',b='')=>{a=Buffer.from(a);b=Buffer.from(b);return a.length===b.length&&crypto.timingSafeEqual(a,b)};
const auth=(req,res,next)=>{try{jwt.verify((req.headers.authorization||'').slice(7),process.env.JWT_SECRET);next()}catch{res.sendStatus(401)}};
const site=async c=>(await q("select value from settings where key='site'",[],c))[0].value;
const promoNow=async c=>(await q("select * from promotions where active and now() between starts_at and ends_at order by id desc limit 1",[],c))[0];
// SERVER-SIDE pricing: the browser is never trusted for prices/discounts
async function calc(c,items,district,lock){
 const promo=await promoNow(c),s=await site(c);let subtotal=0,discount=0,lines=[];
 for(const it of items||[]){
  const r=(await q(`select v.id,v.price,v.sale,v.stock,v.size_ml,p.name,p.premium,p.image_url from variants v join products p on p.id=v.product_id where v.id=$1 and p.active ${lock?'for update of v':''}`,[it.variantId],c))[0];
  const n=Math.max(1,parseInt(it.qty)||1);
  if(!r||r.stock<n)throw new Error('Out of stock: '+(r?r.name:'item'));
  let u=r.sale>0?r.sale:r.price;if(promo&&(r.premium||!promo.premium_only))u=Math.min(u,r.price-Math.round(r.price*promo.discount_pct/100));const off=r.price-u;
  subtotal+=r.price*n;discount+=off*n;lines.push({variantId:r.id,name:r.name,size:r.size_ml,image:r.image_url,qty:n,price:r.price,off});
 }
 const net=subtotal-discount,fr=+s.delivery.free||0,delivery=!lines.length||(fr>0&&net>=fr)?0:/dhaka|ঢাকা/i.test(district||'')?s.delivery.dhaka:s.delivery.outside;
 return{lines,subtotal,discount,delivery,total:net+delivery,site:s};
}
const PQ=`select p.*,(select round(avg(r.rating),1)::float from reviews r where r.product_id=p.id and r.approved) rating,(select count(*)::int from reviews r where r.product_id=p.id and r.approved) rcount,coalesce(json_agg(v order by v.size_ml) filter(where v.id is not null),'[]') variants from products p left join variants v on v.product_id=p.id`;
app.get('/api/store',h(async(_,res)=>res.json({now:new Date(),site:await site(pool),promo:await promoNow(pool)||null,products:await q(PQ+' where p.active group by p.id order by p.id')})));
app.post('/api/quote',async(req,res)=>{try{const{lines,site:_,...t}=await calc(pool,req.body.items,req.body.district);res.json(t)}catch(e){res.status(400).json({error:e.message})}});
app.post('/api/orders',async(req,res)=>{
 const{customer:c={},items,payment,trx}=req.body,cl=await pool.connect();
 try{
  if(!c.name||!/^01\d{9}$/.test(c.phone||'')||!c.address)throw new Error('Name, valid mobile (01XXXXXXXXX) and address are required');
  await cl.query('begin');
  const t=await calc(cl,items,c.district,true),pm=t.site.payments[payment];
  if(!t.lines.length)throw new Error('Cart is empty');
  if(!pm||!pm.on)throw new Error('Payment method unavailable');
  if(['bkash','nagad','rocket'].includes(payment)&&!trx)throw new Error('Transaction ID required');
  for(const l of t.lines)await cl.query('update variants set stock=stock-$1 where id=$2',[l.qty,l.variantId]);
  const no='MEL'+Date.now().toString(36).toUpperCase();
  await cl.query('insert into orders(order_no,customer,items,payment_method,trx_id,subtotal,discount,delivery,total) values($1,$2,$3,$4,$5,$6,$7,$8,$9)',[no,JSON.stringify(c),JSON.stringify(t.lines),payment,trx||null,t.subtotal,t.discount,t.delivery,t.total]);
  await cl.query('commit');res.json({orderNo:no,total:t.total,discount:t.discount,delivery:t.delivery});
 }catch(e){await cl.query('rollback');res.status(400).json({error:e.message})}finally{cl.release()}});
// ---- ADMIN ----
app.post('/api/admin/login',(req,res)=>{const{email,password}=req.body;if(same(email,process.env.ADMIN_EMAIL)&&same(password,process.env.ADMIN_PASSWORD))return res.json({token:jwt.sign({a:1},process.env.JWT_SECRET,{expiresIn:'12h'})});res.status(401).json({error:'Invalid login'})});
const A=express.Router();A.use(auth);app.use('/api/admin',A);
// Images are auto-resized (max 1600px) and converted to WebP; videos/other files are stored as-is
A.post('/upload',up.single('file'),h(async(req,res)=>{const f=req.file;if(!f)return res.status(400).json({error:'No file uploaded'});let name=f.filename;
 if(sharp&&/^image\/(jpe?g|png|webp|avif|tiff)$/.test(f.mimetype)){try{const out=name.replace(/\.\w+$/,'')+'-c.webp',o=path.join(UP,out);
  await sharp(f.path).rotate().resize({width:1600,withoutEnlargement:true}).webp({quality:80}).toFile(o);
  if(fs.statSync(o).size<f.size){fs.unlinkSync(f.path);name=out}else fs.unlinkSync(o)}catch(e){console.error('compress failed:',e.message)}}
 res.json({url:'/uploads/'+name})}));
A.get('/site',async(_,res)=>res.json(await site(pool)));
A.put('/site',async(req,res)=>{await q("update settings set value=$1 where key='site'",[JSON.stringify(req.body)]);res.json({ok:1})});
A.get('/products',async(_,res)=>res.json(await q(PQ+' group by p.id order by p.id')));
async function saveP(id,b){const c=await pool.connect();try{await c.query('begin');
 const f=[b.name,b.gender,b.short_desc,b.notes,b.image_url,!!b.premium,!!b.featured,b.active!==false,b.description||'',!!b.best,!!b.is_new];
 if(id)await c.query('update products set name=$1,gender=$2,short_desc=$3,notes=$4,image_url=$5,premium=$6,featured=$7,active=$8,description=$9,best=$10,is_new=$11 where id=$12',[...f,id]);
 else id=(await c.query('insert into products(name,gender,short_desc,notes,image_url,premium,featured,active,description,best,is_new,slug) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) returning id',[...f,await uniqueSlug(b.name,0,c)])).rows[0].id;
 await c.query('delete from variants where product_id=$1',[id]);
 for(const v of b.variants||[])await c.query('insert into variants(product_id,size_ml,price,stock,sku,sale) values($1,$2,$3,$4,$5,$6)',[id,v.size_ml,v.price,v.stock,v.sku||null,v.sale||0]);
 await c.query('commit')}catch(e){await c.query('rollback');throw e}finally{c.release()}}
const wrap=f=>async(req,res)=>{try{await f(req);res.json({ok:1})}catch(e){res.status(400).json({error:e.message})}};
A.post('/products',wrap(r=>saveP(0,r.body)));
A.put('/products/:id',wrap(r=>saveP(+r.params.id,r.body)));
A.delete('/products/:id',wrap(r=>q('delete from products where id=$1',[r.params.id])));
A.post('/promo',wrap(async r=>{const b=r.body;await q('update promotions set active=false');await q('insert into promotions(title,discount_pct,premium_only,starts_at,ends_at,image_url,cta_text,active,body) values($1,$2,$3,$4,$5,$6,$7,$8,$9)',[b.title,b.discount_pct,!!b.premium_only,b.starts_at,b.ends_at,b.image_url,b.cta_text,b.active!==false,b.body||''])}));
A.get('/orders',async(_,res)=>res.json(await q('select * from orders order by id desc limit 200')));
A.patch('/orders/:id',wrap(r=>q('update orders set status=coalesce($1,status),payment_status=coalesce($2,payment_status) where id=$3',[r.body.status,r.body.payment_status,r.params.id])));
A.get('/stats',async(_,res)=>{const[a]=await q("select count(*)::int orders,coalesce(sum(total) filter(where status<>'cancelled'),0)::int revenue,count(distinct customer->>'phone')::int customers,count(*) filter(where status='pending')::int pending from orders");res.json({...a,top:await q("select customer->>'name' name,customer->>'phone' phone,count(*)::int n,sum(total)::int spent from orders group by 1,2 order by spent desc limit 20")})});
// ---- REVIEWS (new reviews wait for admin approval) ----
const hits=new Map();setInterval(()=>hits.clear(),36e5).unref();
app.get('/api/reviews/:pid',h(async(req,res)=>res.json(await q('select name,rating,comment,created_at from reviews where product_id=$1 and approved order by id desc limit 50',[+req.params.pid]))));
app.post('/api/reviews',h(async(req,res)=>{const b=req.body||{},now=Date.now(),l=(hits.get(req.ip)||[]).filter(t=>now-t<36e5);
 if(l.length>=5)return res.status(429).json({error:'Too many reviews. Please try again later.'});
 const name=String(b.name||'').trim().slice(0,60),comment=String(b.comment||'').trim().slice(0,600),rating=parseInt(b.rating),pid=parseInt(b.product_id);
 if(!name||comment.length<3||!(rating>=1&&rating<=5)||!pid)return res.status(400).json({error:'Please enter your name, a rating and a short comment.'});
 if(!(await q('select 1 from products where id=$1 and active',[pid])).length)return res.status(400).json({error:'Product not found'});
 l.push(now);hits.set(req.ip,l);await q('insert into reviews(product_id,name,rating,comment) values($1,$2,$3,$4)',[pid,name,rating,comment]);res.json({ok:1})}));
A.get('/reviews',h(async(_,res)=>res.json(await q('select r.*,p.name product from reviews r join products p on p.id=r.product_id order by r.approved,r.id desc limit 300'))));
A.patch('/reviews/:id',wrap(r=>q('update reviews set approved=$1 where id=$2',[!!r.body.approved,r.params.id])));
A.delete('/reviews/:id',wrap(r=>q('delete from reviews where id=$1',[r.params.id])));
app.use((e,req,res,next)=>{console.error(e);const m=e.name=='MulterError',c=e.status||(m?400:500);res.status(c).json({error:c<500?e.message:'Server error'})});
// Auto-migration: safe to run on every start (adds reviews table + product slugs to an existing DB)
async function ensure(){
 await q('create table if not exists reviews(id serial primary key,product_id int references products on delete cascade,name text not null,rating int not null check(rating between 1 and 5),comment text,approved bool default false,created_at timestamptz default now())');
 await q('create index if not exists reviews_product_idx on reviews(product_id)');
 await q('alter table products add column if not exists slug text');
 for(const p of await q('select id,name from products where slug is null order by id'))await q('update products set slug=$1 where id=$2',[await uniqueSlug(p.name,p.id),p.id]);
 await q('create unique index if not exists products_slug_key on products(slug)');
 await q('alter table products add column if not exists description text');
 await q('alter table products add column if not exists best bool default false');
 await q('alter table products add column if not exists is_new bool default false');
 await q('alter table variants add column if not exists sale int default 0');
 await q('alter table promotions add column if not exists body text');
 // Fill in any new site-content keys the storefront needs (existing values are never overwritten)
 const DEF={logo:'',bar:'Cash on delivery across Bangladesh · Free delivery over ৳5,000',tagline:'A Symphony in Every Scent',promo_ended:'',
  hero:{cta1:'Shop Now',cta2:'Explore Collections',image:'',vtitle:'Experience Melody',vtext:'Every fragrance has a story. Discover yours.',autoplay:true},
  values:'Craft|Every blend is tested and refined until it feels balanced.\nAuthenticity|Honest notes, honest prices, honest descriptions.\nCare|Careful packing and friendly support on every order.',
  why:'Long-lasting eau de parfum · Gift-ready packaging · Delivery across Bangladesh · Easy returns on unopened bottles',
  ship:'Delivery in 1–3 days inside Dhaka and 3–5 days elsewhere in Bangladesh.',ret:'Unopened bottles can be returned within 7 days of delivery. Contact us to arrange it.',
  eta:'1–3 working days (Dhaka), 3–5 working days (other districts)',contact:{fb:'',ig:'',tt:'',yt:''},delivery:{free:5000}};
 const md=(o,d)=>{let c=0;for(const k in d){if(o[k]===undefined){o[k]=d[k];c=1}else if(d[k]&&typeof d[k]=='object'&&o[k]&&typeof o[k]=='object')c|=md(o[k],d[k])}return c};
 const cur=await site(pool);if(md(cur,DEF))await q("update settings set value=$1 where key='site'",[JSON.stringify(cur)]);
}
ensure().then(()=>app.listen(process.env.PORT||3000,()=>console.log('Melody running'))).catch(e=>{console.error('Startup failed:',e);process.exit(1)});
