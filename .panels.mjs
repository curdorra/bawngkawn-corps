import sharp from "sharp"; import fs from "fs";
const dir=process.argv[2];
const res={};
for (const f of fs.readdirSync(dir).filter(f=>f.endsWith(".jpg"))) {
  const {data,info}=await sharp(dir+"/"+f).raw().toBuffer({resolveWithObject:true});
  const {width:W,height:H,channels:C}=info;
  const bg=[data[C*(5*W+5)],data[C*(5*W+5)+1],data[C*(5*W+5)+2]];
  const diff=(x,y)=>{const i=C*(y*W+x);return Math.abs(data[i]-bg[0])+Math.abs(data[i+1]-bg[1])+Math.abs(data[i+2]-bg[2])>60};
  // rows where >60% pixels differ from bg = photo rows
  const rowOn=[];for(let y=0;y<H;y++){let c=0;for(let x=0;x<W;x+=2)c+=diff(x,y);rowOn.push(c/(W/2)>0.6)}
  const runs=[];let s=-1;for(let y=0;y<=H;y++){if(y<H&&rowOn[y]){if(s<0)s=y}else if(s>=0){if(y-s>150)runs.push([s,y]);s=-1}}
  const panels=runs.map(([a,b])=>{const m=Math.floor((a+b)/2);const colOn=[];for(let x=0;x<W;x++){let c=0;for(let y=a;y<b;y+=4)c+=diff(x,y);colOn.push(c/((b-a)/4)>0.6)}
    let l=colOn.indexOf(true),r=colOn.lastIndexOf(true);return {left:l+6,top:a+6,width:r-l-12,height:b-a-12}});
  res[f]=panels;
  console.log(f,JSON.stringify(panels));
}
fs.writeFileSync(process.argv[3],JSON.stringify(res,null,1));
