import type { CSSProperties } from 'react';
const files=import.meta.glob<string>('../../art/production/v01/overlays/ch01/*.svg',{query:'?raw',import:'default',eager:true});
export default function VectorArt({name,className='',style,label}:{name:string;className?:string;style?:CSSProperties;label?:string}){
 const markup=files['../../art/production/v01/overlays/ch01/'+name+'.svg'];
 if(!markup)throw new Error('Missing vector art: '+name);
 return <span className={'inline-vector '+className} style={style} role={label?'img':undefined} aria-label={label} aria-hidden={label?undefined:true} dangerouslySetInnerHTML={{__html:markup}}/>;
}
