const money=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(n);

document.querySelectorAll('[data-scenario]').forEach(btn=>btn.addEventListener('click',()=>{
  const target=btn.dataset.scenario;
  const out=document.querySelector('#scenarioResult');
  if(!out)return;
  const scenarios={base:{capital:22450,profit:1500,breakeven:53},lean:{capital:17800,profit:1320,breakeven:44},premium:{capital:28600,profit:1900,breakeven:68}};
  const s=scenarios[target];
  out.innerHTML=`<div class="grid-3"><div class="kpi"><div class="label">Required capital</div><div class="value">${money(s.capital)}</div></div><div class="kpi"><div class="label">Monthly operating profit</div><div class="value">${money(s.profit)}</div></div><div class="kpi"><div class="label">Break-even</div><div class="value">${s.breakeven}/day</div></div></div>`;
}));

document.querySelectorAll('[data-toggle-check]').forEach(el=>el.addEventListener('change',()=>{
  const tasks=[...document.querySelectorAll('[data-toggle-check]')];
  const done=tasks.filter(x=>x.checked).length;
  const pct=Math.round(done/tasks.length*100);
  const label=document.querySelector('#checkProgress');
  const bar=document.querySelector('#checkBar');
  if(label)label.textContent=pct+'%'; if(bar)bar.style.width=pct+'%';
}));

const planner=document.querySelector('#quickPlanner');
if(planner){
  planner.addEventListener('input',()=>{
    const rent=+planner.rent.value||0,salary=+planner.salary.value||0,utilities=+planner.utilities.value||0,startup=+planner.startup.value||0,revenue=+planner.revenue.value||0,months=+planner.months.value||6;
    const monthly=rent+salary+utilities;
    const burn=Math.max(0,monthly-revenue);
    const need=startup+burn*months;
    document.querySelector('#quickResult').innerHTML=`<strong>${money(need)}</strong><span class="muted"> estimated capital before contingency</span>`;
  });
}
