create table products(id serial primary key,name text not null,gender text check(gender in('male','female','unisex')),short_desc text,notes text,image_url text,premium bool default false,featured bool default false,active bool default true,slug text unique);
create table variants(id serial primary key,product_id int references products on delete cascade,size_ml int,price int not null,stock int default 0,sku text);
create table promotions(id serial primary key,title text,discount_pct int check(discount_pct between 1 and 90),premium_only bool default true,starts_at timestamptz,ends_at timestamptz,image_url text,cta_text text default 'Shop the Collection',active bool default true);
create table orders(id serial primary key,order_no text unique,customer jsonb,items jsonb,payment_method text,trx_id text,payment_status text default 'unpaid',status text default 'pending',subtotal int,discount int,delivery int,total int,created_at timestamptz default now());
create table settings(key text primary key,value jsonb);
insert into settings values('site','{"hero":{"title":"Where Every Scent Becomes a Memory.","desc":"Luxury eau de parfum crafted for every mood — for him, for her, for everyone.","video":"","poster":""},
"mission":"Our mission is to create memorable fragrances that express individuality, emotion, and elegance, while making premium scent experiences accessible.",
"vision":"Our vision is to build Melody into a trusted fragrance brand where every scent tells a story and every customer discovers a fragrance that feels uniquely their own.",
"about":"Melody is a Bangladeshi fragrance house. Every bottle is a small symphony of notes, memory and emotion.",
"contact":{"phone":"01XXXXXXXXX","email":"hello@melody.com.bd","address":"Dhaka, Bangladesh"},
"delivery":{"dhaka":80,"outside":130},
"payments":{"cod":{"on":true,"note":"Pay when you receive your order."},
"bkash":{"on":true,"number":"01XXXXXXXXX","note":"Send Money (Personal) to this number, then enter the TrxID."},
"nagad":{"on":true,"number":"01XXXXXXXXX","note":"Send Money to this number, then enter the TrxID."},
"rocket":{"on":true,"number":"01XXXXXXXXXX","note":"Send to this Rocket number, then enter the TrxID."},
"bank":{"on":true,"number":"","note":"Bank: ___ | A/C Name: ___ | A/C No: ___ | Branch: ___ | Routing: ___. Enter reference/TrxID after transfer."}}}');
insert into products(name,gender,short_desc,notes,image_url,premium,featured) values
('Chocolate','female','Rich · Warm · Indulgent','Cocoa, vanilla bean, amber','/img/chocolate.jpg',true,true),
('Floral','female','Fresh · Elegant · Romantic','Rose, jasmine, baby''s breath','/img/floral.jpg',false,true),
('Vanilla','unisex','Warm · Sweet · Comforting','Vanilla orchid, musk, sandalwood','/img/vanilla.jpg',false,false),
('Oud Royale','male','Smoky. Deep. Regal.','Oud, incense, leather','/img/oud.jpg',true,true),
('Jasmine Night','male','Heady. Sensual. Luminous.','Jasmine, bergamot, musk','/img/jasmine.jpg',false,false),
('Amber Woods','male','Warm. Woody. Grounding.','Amber, cedar, pine','/img/amber.jpg',false,false),
('Citrus Mood','male','Fresh. Energetic. Confident.','Lime, neroli, green tea','/img/citrus.jpg',false,false),
('Melody Classic','unisex','Timeless signature blend','Bergamot, iris, woods','/img/classic.jpg',false,false);
insert into variants(product_id,size_ml,price,stock) select id,s,case s when 30 then 1500 when 50 then 2500 else 4200 end+(case when premium then 500 else 0 end),50 from products,(values(30),(50),(100)) t(s);
insert into promotions(title,discount_pct,premium_only,starts_at,ends_at,cta_text) values('Premium Scent Sale',40,true,now(),now()+interval '4 days','Shop the Collection');
create table reviews(id serial primary key,product_id int references products on delete cascade,name text not null,rating int not null check(rating between 1 and 5),comment text,approved bool default false,created_at timestamptz default now());
create index reviews_product_idx on reviews(product_id);
