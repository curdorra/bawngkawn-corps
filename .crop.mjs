import sharp from "sharp"; import fs from "fs";
const [dir,pj,out]=process.argv.slice(2); const P=JSON.parse(fs.readFileSync(pj));
P["p10_2.jpg"]=[{left:60,top:588,width:1320,height:666}];
for (const [f,ps] of Object.entries(P)) ps.forEach((p,i)=>{ if(p.height>=240) sharp(dir+"/"+f).extract(p).toFile(`${out}/${f.replace(".jpg","")}-${i}.jpg`)});
