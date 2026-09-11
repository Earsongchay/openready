(()=>{
  const KEY='openready.workspace.v1';
  const now=()=>new Date().toISOString();
  const clone=v=>JSON.parse(JSON.stringify(v));
  const defaults=()=>({
    activeBusinessId:'business-a',
    businesses:[{
      id:'business-a',
      name:'Business A',
      type:'Milk-tea shop',
      city:'Phnom Penh',
      createdAt:now(),updatedAt:now(),
      quickPlan:{},
      detailedPlan:null
    }]
  });
  const load=()=>{try{const raw=localStorage.getItem(KEY);if(!raw)return defaults();const parsed=JSON.parse(raw);if(!Array.isArray(parsed.businesses)||!parsed.businesses.length)return defaults();return parsed;}catch{return defaults();}};
  const save=state=>{localStorage.setItem(KEY,JSON.stringify(state));window.dispatchEvent(new CustomEvent('openready:workspace',{detail:clone(state)}));return state;};
  const getState=()=>load();
  const getActiveBusiness=()=>{const s=load();return s.businesses.find(b=>b.id===s.activeBusinessId)||s.businesses[0];};
  const setActiveBusiness=id=>{const s=load();if(s.businesses.some(b=>b.id===id)){s.activeBusinessId=id;save(s);}return getActiveBusiness();};
  const createBusiness=(name='New business',type='Milk-tea shop',city='Phnom Penh')=>{const s=load();const id='business-'+Date.now().toString(36);s.businesses.push({id,name,type,city,createdAt:now(),updatedAt:now(),quickPlan:{},detailedPlan:null});s.activeBusinessId=id;save(s);return s.businesses.find(b=>b.id===id);};
  const updateBusiness=(id,patch)=>{const s=load();const i=s.businesses.findIndex(b=>b.id===id);if(i<0)return null;s.businesses[i]={...s.businesses[i],...patch,updatedAt:now()};save(s);return s.businesses[i];};
  const deleteBusiness=id=>{const s=load();if(s.businesses.length===1)return false;const i=s.businesses.findIndex(b=>b.id===id);if(i<0)return false;s.businesses.splice(i,1);if(s.activeBusinessId===id)s.activeBusinessId=s.businesses[0].id;save(s);return true;};
  const saveQuickPlan=plan=>{const b=getActiveBusiness();return updateBusiness(b.id,{name:plan.businessName||b.name,type:plan.businessType||b.type,city:plan.city||b.city,quickPlan:{...plan,savedAt:now()}});};
  const saveDetailedPlan=plan=>{const b=getActiveBusiness();return updateBusiness(b.id,{detailedPlan:{...plan,savedAt:now()}});};
  window.OpenReadyStore={getState,getActiveBusiness,setActiveBusiness,createBusiness,updateBusiness,deleteBusiness,saveQuickPlan,saveDetailedPlan};
})();
