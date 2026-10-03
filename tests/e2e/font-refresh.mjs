import { chromium } from './browser.mjs';
import {writeFileSync} from 'node:fs';
const b=await chromium.launch({headless:true});
try{
 const p=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});await p.goto('http://127.0.0.1:5173/');await p.locator('.title-art').waitFor();
 await p.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode()));document.activeElement?.blur();});
 await p.screenshot({path:'art/ui-screens/v02/20_title_390x844_pretendard_v02.png'});
 await p.getByRole('button',{name:'새로운 기억'}).click();for(let i=0;i<3;i++)await p.getByRole('button',{name:'다음 대사'}).click();await p.getByRole('button',{name:'조사 표시',exact:true}).click();
 await p.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode()));document.activeElement?.blur();});
 await p.screenshot({path:'art/ui-screens/v02/21_explore-chair_390x844_pretendard_v02.png'});
 const fonts=await p.evaluate(()=>({loaded:document.fonts.check('16px "Pretendard Variable"'),body:getComputedStyle(document.body).fontFamily,title:getComputedStyle(document.querySelector('.chapter-label')).fontFamily}));
 writeFileSync('test-results/font-check.json',JSON.stringify(fonts,null,2));console.log(fonts);
}finally{await b.close();}
