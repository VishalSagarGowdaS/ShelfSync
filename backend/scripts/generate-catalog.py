import json, uuid, glob, os
A = {}
for f in glob.glob('/dev-server/src/assets/catalog/*.asset.json'):
    n = os.path.basename(f).replace('.jpg.asset.json','')
    A[n] = json.load(open(f))['url']
NS = uuid.UUID('6f1c3c8e-6b2a-4b8e-9d3a-5a1f0c2e7b11')
cats = [
 ("electronics","Electronics","Earphones, laptops, smartwatches and more","cat-electronics"),
 ("fashion","Fashion","Everyday styles for men and women","cat-fashion"),
 ("home-kitchen","Home & Kitchen","Appliances and essentials for every home","cat-home"),
 ("grocery","Grocery","Pantry staples, dry fruits and beverages","cat-grocery"),
 ("beauty","Beauty & Personal Care","Skincare and haircare you'll love","cat-beauty"),
 ("sports","Sports & Fitness","Gear up for the game and the gym","cat-sports"),
]
# slug, name, category, mrp, price, rating, rating_count, stock, city, sold, days_ago, desc, specs
P = [
 ("bluetooth-earphones","AirBeat Pro True Wireless Bluetooth Earphones","electronics",2999,1299,4.3,18420,120,"Bengaluru",9200,40,"True wireless Bluetooth 5.3 earbuds with 40 hours of total playback, ENx noise isolation for calls and a low-latency gaming mode.",{"Bluetooth":"5.3","Battery":"40 hours with case","Charging":"USB Type-C, fast charge","Water resistance":"IPX5"}),
 ("wireless-headphones","Sonic Max ANC Wireless Headphones","electronics",9999,4499,4.5,6210,45,"Mumbai",3100,25,"Over-ear wireless headphones with hybrid active noise cancellation, plush memory-foam cushions and 60-hour battery life.",{"Noise cancellation":"Hybrid ANC up to 35 dB","Battery":"60 hours","Driver":"40 mm dynamic","Weight":"250 g"}),
 ("smart-watch","FitPulse Ultra Smart Watch","electronics",7999,2799,4.2,12890,80,"Delhi",5400,15,"1.96-inch AMOLED smartwatch with Bluetooth calling, SpO2 and heart-rate monitoring, 100+ sports modes and 7-day battery.",{"Display":"1.96-inch AMOLED","Battery":"Up to 7 days","Sensors":"Heart rate, SpO2, sleep","Water resistance":"IP68"}),
 ("laptop","AeroBook 14 Thin & Light Laptop","electronics",74990,58990,4.4,1840,12,"Bengaluru",620,60,"14-inch FHD+ thin and light laptop with Intel Core i5 13th Gen, 16 GB RAM and 512 GB SSD — built for work, study and travel.",{"Processor":"Intel Core i5-1335U","Memory":"16 GB LPDDR5","Storage":"512 GB NVMe SSD","Display":"14-inch FHD+ IPS","Weight":"1.39 kg"}),
 ("bluetooth-speaker","BassCube Portable Bluetooth Speaker","electronics",4999,1999,4.3,7650,60,"Chennai",2800,33,"20 W portable Bluetooth speaker with deep bass, 12-hour playtime, IPX7 waterproofing and TWS pairing.",{"Output":"20 W","Battery":"12 hours","Water resistance":"IPX7","Connectivity":"Bluetooth 5.3, AUX"}),
 ("mechanical-keyboard","KeyForge K68 Mechanical Keyboard","electronics",5499,3299,4.6,2310,35,"Pune",1250,8,"Compact 68-key hot-swappable mechanical keyboard with RGB backlighting, linear red switches and wired plus Bluetooth modes.",{"Layout":"65%, 68 keys","Switches":"Hot-swappable linear red","Connectivity":"USB-C, Bluetooth 5.1","Backlight":"Per-key RGB"}),
 ("mens-tshirt","Urban Basics Men's Cotton Crew T-Shirt","fashion",999,399,4.1,24500,300,"Tiruppur",15800,50,"Bio-washed 100% combed cotton crew neck t-shirt in a regular fit — soft, breathable and made for everyday wear.",{"Fabric":"100% combed cotton, 180 GSM","Fit":"Regular","Sleeve":"Half sleeve","Care":"Machine wash"}),
 ("womens-kurti","Jaipur Weaves Block Print Cotton Kurti","fashion",1899,749,4.4,9870,150,"Jaipur",6200,20,"Straight-cut cotton kurti with hand block print, mandarin collar and three-quarter sleeves — perfect for office and festive days.",{"Fabric":"Pure cotton","Pattern":"Hand block print","Length":"Calf length","Sleeve":"Three-quarter"}),
 ("running-shoes","Stride Pro Men's Running Shoes","fashion",3999,1799,4.3,8740,90,"Delhi",4300,12,"Lightweight breathable mesh running shoes with responsive EVA cushioning and a high-grip rubber outsole.",{"Upper":"Engineered mesh","Midsole":"Responsive EVA","Outsole":"High-grip rubber","Weight":"260 g per shoe"}),
 ("casual-sneakers","Classic White Leather Sneakers","fashion",2999,1299,4.2,11200,110,"Agra",5900,45,"Minimal white sneakers in premium faux leather with a cushioned insole — pair them with jeans, chinos or ethnic wear.",{"Upper":"Premium faux leather","Insole":"Memory foam","Closure":"Lace-up","Sole":"TPR"}),
 ("denim-jeans","Indigo Slim Fit Stretch Denim Jeans","fashion",2499,999,4.1,15300,140,"Ahmedabad",7400,70,"Mid-rise slim fit jeans in comfort-stretch denim with a classic five-pocket design and a clean mid-blue wash.",{"Fabric":"98% cotton, 2% elastane","Fit":"Slim","Rise":"Mid-rise","Closure":"Zip fly with button"}),
 ("mixer-grinder","PowerChef 750W Mixer Grinder","home-kitchen",5995,3249,4.3,21400,55,"Mumbai",8700,90,"750 W mixer grinder with three stainless steel jars, overload protection and a 5-year motor warranty — built for Indian kitchens.",{"Power":"750 W","Jars":"3 stainless steel jars","Speed":"3 speeds with pulse","Warranty":"2 years, 5 years on motor"}),
 ("electric-kettle","SteelBrew 1.5L Electric Kettle","home-kitchen",1995,849,4.4,32100,200,"Kolkata",14200,55,"1.5-litre stainless steel electric kettle with 1500 W rapid boil, auto shut-off and a 360-degree cordless base.",{"Capacity":"1.5 litres","Power":"1500 W","Safety":"Auto shut-off, dry-boil protection","Material":"Food-grade stainless steel"}),
 ("air-fryer","CrispAir 4.2L Digital Air Fryer","home-kitchen",9999,4999,4.5,9600,30,"Bengaluru",3800,10,"4.2-litre digital air fryer with eight presets, 1400 W rapid air technology and up to 90% less oil.",{"Capacity":"4.2 litres","Power":"1400 W","Presets":"8 one-touch programs","Temperature":"80–200 °C"}),
 ("storage-containers","FreshLock Glass Storage Containers (Set of 4)","home-kitchen",1999,899,4.2,6800,85,"Hyderabad",2600,28,"Set of four airtight borosilicate glass containers with bamboo lids — microwave and dishwasher safe.",{"Set":"4 containers","Capacities":"400, 640, 1040, 1520 ml","Material":"Borosilicate glass, bamboo lids","Safe for":"Microwave, oven, dishwasher"}),
 ("table-lamp","Nordic Ceramic Table Lamp","home-kitchen",3499,1699,4.6,2140,25,"Jaipur",880,5,"Handcrafted ceramic table lamp with a linen drum shade that casts a warm, soft glow — ideal for bedside or study tables.",{"Base":"Handcrafted ceramic","Shade":"Linen drum","Bulb":"E27, LED compatible","Height":"42 cm"}),
 ("basmati-rice","Royal Harvest Extra Long Basmati Rice 5 kg","grocery",1099,699,4.4,28700,250,"Karnal",16500,65,"Aged extra-long grain basmati rice with a rich aroma and fluffy, non-sticky texture — ideal for biryani and pulao.",{"Weight":"5 kg","Grain":"Extra long, aged 12 months","Origin":"Haryana, India","Best for":"Biryani, pulao, jeera rice"}),
 ("almonds","NutriVale California Almonds 1 kg","grocery",1499,899,4.5,19300,180,"Delhi",11900,35,"Premium whole California almonds — crunchy, naturally sweet and packed with protein, fibre and vitamin E.",{"Weight":"1 kg","Variety":"California, whole","Pack":"Resealable zip pouch","Shelf life":"9 months"}),
 ("cooking-oil","GoldenSun Refined Sunflower Oil 5 L","grocery",1050,799,4.3,22600,160,"Indore",13800,80,"Light and healthy refined sunflower oil enriched with vitamins A and D — suitable for everyday Indian cooking and frying.",{"Volume":"5 litres","Type":"Refined sunflower","Fortified with":"Vitamins A and D","Pack":"PET jar"}),
 ("green-tea","Himalayan Leaf Organic Green Tea (100 bags)","grocery",699,399,4.4,13400,220,"Darjeeling",8800,22,"Organic green tea from Himalayan estates, rich in antioxidants with a smooth, refreshing taste.",{"Count":"100 tea bags","Origin":"Darjeeling, India","Certification":"Organic","Caffeine":"Low"}),
 ("organic-honey","Wild Forest Raw Organic Honey 500 g","grocery",599,349,4.6,10800,140,"Dehradun",7300,18,"Unprocessed raw honey collected from wild forests — no added sugar, no preservatives, naturally rich in enzymes.",{"Weight":"500 g","Type":"Raw, unprocessed","Origin":"Uttarakhand, India","Added sugar":"None"}),
 ("face-wash","PureGlow Neem & Tulsi Face Wash","beauty",349,199,4.2,26400,260,"Mumbai",17200,48,"Gentle foaming face wash with neem and tulsi extracts that clears excess oil and helps prevent pimples.",{"Volume":"150 ml","Skin type":"Oily and acne-prone","Key ingredients":"Neem, tulsi, salicylic acid","Paraben free":"Yes"}),
 ("sunscreen","SunShield SPF 50 PA++++ Sunscreen","beauty",699,449,4.4,15800,190,"Chennai",10100,14,"Lightweight, non-greasy SPF 50 PA++++ sunscreen gel with no white cast — suitable for Indian summers.",{"Volume":"80 g","Protection":"SPF 50, PA++++","Finish":"Matte, no white cast","Skin type":"All skin types"}),
 ("moisturizer","HydraSoft Ceramide Moisturizer","beauty",899,549,4.5,9200,120,"Bengaluru",6100,30,"Rich ceramide and hyaluronic acid moisturizer that repairs the skin barrier and keeps skin hydrated for 72 hours.",{"Volume":"50 g","Key ingredients":"Ceramides, hyaluronic acid","Skin type":"Dry and normal","Fragrance":"Fragrance free"}),
 ("shampoo","HerbaLuxe Lavender Anti-Hairfall Shampoo","beauty",599,329,4.1,11700,170,"Pune",7900,42,"Sulphate-free herbal shampoo with lavender, bhringraj and amla to reduce hair fall and add natural shine.",{"Volume":"340 ml","Hair type":"All hair types","Key ingredients":"Lavender, bhringraj, amla","Sulphate free":"Yes"}),
 ("cricket-bat","Kashmir Willow Pro Cricket Bat","sports",3499,1899,4.3,4300,40,"Meerut",2100,38,"Full-size grade-A Kashmir willow cricket bat with a thick edge, Singapore cane handle and a premium grip.",{"Willow":"Grade-A Kashmir willow","Size":"Full size (SH)","Weight":"1150–1250 g","Handle":"Singapore cane"}),
 ("football","Striker Pro Size 5 Football","sports",1499,699,4.2,6900,95,"Jalandhar",3700,26,"Hand-stitched size 5 football with a durable PU outer and butyl bladder for consistent shape and air retention.",{"Size":"5","Outer":"PU, hand-stitched","Bladder":"Butyl","Best for":"Grass and turf"}),
 ("yoga-mat","FlexFlow 6mm Anti-Slip Yoga Mat","sports",1999,749,4.4,14200,130,"Rishikesh",8100,9,"6 mm thick eco-friendly TPE yoga mat with a dual-sided anti-slip texture and a free carry strap.",{"Thickness":"6 mm","Material":"Eco-friendly TPE","Size":"183 x 61 cm","Includes":"Carry strap"}),
 ("dumbbells","IronGrip Hex Dumbbells 5 kg Pair","sports",2999,1599,4.5,5600,50,"Ludhiana",2400,52,"Pair of 5 kg rubber-coated hex dumbbells with knurled chrome handles — anti-roll design for home workouts.",{"Weight":"5 kg x 2","Coating":"Rubber","Handle":"Knurled chrome","Shape":"Hexagonal, anti-roll"}),
 ("sports-shoes","TrailBlaze Cross Training Shoes","sports",4499,2199,4.3,3900,1,"Kolkata",1700,3,"Versatile cross-training shoes with a stable heel, flexible forefoot and a grippy outsole for gym and outdoor sessions.",{"Upper":"Breathable knit mesh","Midsole":"Dual-density foam","Outsole":"Multi-surface rubber","Use":"Gym, cross-training, outdoor"}),
]
from datetime import datetime, timedelta, timezone
base = datetime(2026,11,20,9,0,tzinfo=timezone.utc)
categories = [{"id":str(uuid.uuid5(NS,'cat-'+s)),"slug":s,"name":n,"description":d,"imageUrl":A[img]} for s,n,d,img in cats]
catid = {c["slug"]:c["id"] for c in categories}
products=[]
for (slug,name,cat,mrp,price,rating,rc,stock,city,sold,days,desc,specs) in P:
    products.append({"id":str(uuid.uuid5(NS,'prod-'+slug)),"slug":slug,"name":name,"description":desc,"categorySlug":cat,
      "imageUrl":A['p-'+slug],"originalPrice":mrp,"sellingPrice":price,"discountPercent":round((mrp-price)*100/mrp),
      "rating":rating,"ratingCount":rc,"stock":stock,"city":city,"soldCount":sold,"specifications":specs,
      "createdAt":(base-timedelta(days=days)).isoformat().replace('+00:00','Z')})
media = {"hero":A['hero'],"promo":A['promo']}
hdr = "// Generated from the ShopSphere catalogue generator. Shared seed data for the catalogue.\n"
body = "export const seedCategories = " + json.dumps(categories, indent=2, ensure_ascii=False) + " as const;\n\nexport const seedProducts = " + json.dumps(products, indent=2, ensure_ascii=False) + ";\n"
open('/dev-server/backend/src/database/seed-data.ts','w').write(hdr + body)
open('/dev-server/src/data/catalog.ts','w').write(hdr + "// Frontend copy used only in demo mode (no backend connected). Live mode reads from the backend API.\n" + body + "\nexport const media = " + json.dumps(media) + ";\n")
print(len(products), len(categories))
