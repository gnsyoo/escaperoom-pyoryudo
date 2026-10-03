import { validateState } from '../domain/game.ts';
import type { GameState } from '../domain/game.ts';
export type SaveSlot = { id:string; savedAt:string; generation:number; state:GameState };
const dbPromise = new Promise<IDBDatabase>((resolve,reject)=>{
  const req=indexedDB.open('pyoryudo-saves',1);
  req.onupgradeneeded=()=>req.result.createObjectStore('slots',{keyPath:'id'});
  req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
});
const request=<T,>(req:IDBRequest<T>)=>new Promise<T>((resolve,reject)=>{req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});
export async function getSlot(id:string):Promise<SaveSlot|null>{
  const db=await dbPromise;
  const value=await request(db.transaction('slots','readonly').objectStore('slots').get(id));
  if(!value)return null;
  return {...value,state:validateState(value.state)};
}
export async function listSlots():Promise<(SaveSlot|null)[]>{return Promise.all(['auto','slot1','slot2','slot3'].map(getSlot));}
let queue:Promise<unknown>=Promise.resolve();
export function saveSlot(id:string,state:GameState):Promise<void>{
  const snapshot=validateState(state);
  const next=queue.catch(()=>{}).then(async()=>{
    const db=await dbPromise;
    await new Promise<void>((resolve,reject)=>{
      const tx=db.transaction('slots','readwrite'),store=tx.objectStore('slots'),req=store.get(id);
      req.onsuccess=()=>{const old=req.result;if(old)store.put({...old,id:id+'.backup'});store.put({id,savedAt:new Date().toISOString(),generation:(old?.generation||0)+1,state:snapshot});};
      tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||new Error('저장에 실패했습니다.'));
    });
  });
  queue=next;return next;
}
