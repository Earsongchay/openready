const money = n => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(Number.isFinite(n)?n:0);
const money2 = n => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',minimumFractionDigits:2,maximumFractionDigits:2}).format(Number.isFinite(n)?n:0);

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

const oldPlanner=document.querySelector('#quickPlanner');
if(oldPlanner){
  oldPlanner.addEventListener('input',()=>{
    const rent=+oldPlanner.rent.value||0,salary=+oldPlanner.salary.value||0,utilities=+oldPlanner.utilities.value||0,startup=+oldPlanner.startup.value||0,revenue=+oldPlanner.revenue.value||0,months=+oldPlanner.months.value||6;
    const monthly=rent+salary+utilities;
    const burn=Math.max(0,monthly-revenue);
    const need=startup+burn*months;
    document.querySelector('#quickResult').innerHTML=`<strong>${money(need)}</strong><span class="muted"> estimated capital before contingency</span>`;
  });
}

const generator=document.querySelector('#planGenerator');
if(generator){
  const form=document.querySelector('#startupPlanForm');
  const panels=[...document.querySelectorAll('.wizard-panel')];
  const pills=[...document.querySelectorAll('[data-go-step]')];
  let currentStep=1;
  let customSetupCosts=[];

  const rampProfiles={
    conservative:[.35,.55,.75,.9,1],
    normal:[.5,.7,.85,1],
    strong:[.7,.85,1]
  };

  const val=name=>Number(form.elements[name]?.value||0);
  const checked=name=>form.elements[name]?.checked;
  const selectedRadio=name=>form.querySelector(`input[name="${name}"]:checked`)?.value;

  const setupTotal=()=>{
    const base=[...document.querySelectorAll('[data-setup-cost]')].filter(x=>x.checked).reduce((sum,x)=>sum+Number(x.dataset.setupCost||0),0);
    return base+customSetupCosts.reduce((a,b)=>a+b,0);
  };

  const calc=()=>{
    const rent=val('rent');
    const deposit=rent*val('depositMonths');
    const advance=rent*val('advanceMonths');
    const locationUpfront=deposit+advance+val('locationExtras');
    const setup=setupTotal();
    const startupCash=locationUpfront+setup+val('alreadySpent');

    const payroll=(val('baristaQty')*val('baristaSalary'))+(val('cashierQty')*val('cashierSalary'));
    const otherFixed=val('electricity')+val('water')+val('internet')+val('marketing')+val('cleaning')+val('maintenance');
    const fixed=rent+payroll+otherFixed;
    const units=val('unitsPerDay');
    const days=val('operatingDays');
    const price=val('avgPrice');
    const variable=val('variableCost');
    const steadyRevenue=units*days*price;
    const steadyVariable=units*days*variable;
    const contributionUnit=Math.max(0,price-variable);
    const steadyProfit=steadyRevenue-steadyVariable-fixed;
    const breakEvenMonthly=contributionUnit>0?fixed/contributionUnit:Infinity;
    const breakEvenDaily=Number.isFinite(breakEvenMonthly)&&days>0?Math.ceil(breakEvenMonthly/days):0;

    const months=Math.max(1,val('planningMonths'));
    const profile=rampProfiles[selectedRadio('ramp')||'normal'];
    let cumulative=0;
    let minimum=0;
    const forecast=[];
    for(let i=0;i<months;i++){
      const factor=profile[Math.min(i,profile.length-1)];
      const revenue=steadyRevenue*factor;
      const variableCost=steadyVariable*factor;
      const net=revenue-variableCost-fixed;
      cumulative+=net;
      minimum=Math.min(minimum,cumulative);
      forecast.push({month:i+1,factor,revenue,variableCost,fixed,net,cumulative});
    }
    const rampCash=Math.abs(minimum);
    const contingencyRate=val('contingency')/100;
    const reserve=(startupCash+rampCash)*contingencyRate;
    const required=startupCash+rampCash+reserve;
    const available=val('availableCapital');
    const gap=Math.max(0,required-available);
    const surplus=Math.max(0,available-required);
    const maxInvestment=val('maxInvestment');

    return {rent,locationUpfront,setup,startupCash,payroll,otherFixed,fixed,units,days,price,variable,steadyRevenue,steadyVariable,contributionUnit,steadyProfit,breakEvenDaily,forecast,rampCash,reserve,required,available,gap,surplus,maxInvestment};
  };

  const updateChoiceCards=()=>{
    document.querySelectorAll('.choice-card').forEach(card=>{
      const input=card.querySelector('input');
      card.classList.toggle('selected',!!input?.checked);
    });
  };

  const updateSummary=()=>{
    const c=calc();
    const business=selectedRadio('businessType')||'Milk-tea shop';
    const size=form.elements.shopSize?.selectedOptions?.[0]?.textContent||'Small shop';
    const label=`${size} ${business.toLowerCase()}`;
    document.querySelector('#liveBusinessName').textContent=label;
    document.querySelector('#liveStartup').textContent=money(c.startupCash);
    document.querySelector('#liveFixed').textContent=money(c.fixed);
    document.querySelector('#liveRevenue').textContent=money(c.steadyRevenue);
    document.querySelector('#liveRequired').textContent=money(c.required);
    document.querySelector('#liveAvailable').textContent=money(c.available);
    document.querySelector('#liveGapLabel').textContent=c.gap>0?'Funding gap':'Cash remaining';
    document.querySelector('#liveGap').textContent=money(c.gap>0?c.gap:c.surplus);
    document.querySelector('#liveGap').classList.toggle('positive',c.gap===0);
    document.querySelector('#liveNote').textContent=c.gap>0
      ?`Current assumptions need ${money(c.gap)} more cash than you have available.`
      :`Your available capital covers the current plan with ${money(c.surplus)} remaining.`;

    document.querySelector('#locationUpfront').textContent=money(c.locationUpfront);
    document.querySelector('#setupTotal').textContent=money(c.setup);
    document.querySelector('#baristaTotal').textContent=money(val('baristaQty')*val('baristaSalary'));
    document.querySelector('#cashierTotal').textContent=money(val('cashierQty')*val('cashierSalary'));
    document.querySelector('#payrollTotal').textContent=money(c.payroll);
    document.querySelector('#steadyRevenue').textContent=money(c.steadyRevenue);
    document.querySelector('#steadyVariable').textContent=money(c.steadyVariable);
    document.querySelector('#contributionUnit').textContent=money2(c.contributionUnit);
    document.querySelector('#fixedMonthlyTotal').textContent=money(c.fixed);
    document.querySelector('#capitalConstraint').innerHTML=`Your current maximum investment is <strong>${money(c.maxInvestment)}</strong>. We will flag choices that push the plan above it.`;

    const hint=document.querySelector('#templateHint');
    if(hint) hint.textContent=`${size} ${business.toLowerCase()} · starter equipment, staff, and a ${val('planningMonths')}-month plan.`;

    const forecastPreview=document.querySelector('#forecastPreview');
    forecastPreview.innerHTML=c.forecast.map(m=>`<div class="forecast-month"><div><span>Month ${m.month}</span><small>${Math.round(m.factor*100)}% of target sales</small></div><div><span>${money(m.revenue)} revenue</span><strong class="${m.net<0?'negative':'positive'}">${m.net<0?'-':'+'}${money(Math.abs(m.net))}</strong></div></div>`).join('');

    document.querySelector('#resultAvailable').textContent=money(c.available);
    document.querySelector('#resultRequired').textContent=money(c.required);
    document.querySelector('#gapLabel').textContent=c.gap>0?'Funding gap':'Cash remaining';
    document.querySelector('#resultGap').textContent=money(c.gap>0?c.gap:c.surplus);
    document.querySelector('#whyStartup').textContent=money(c.startupCash);
    document.querySelector('#whyRamp').textContent=money(c.rampCash);
    document.querySelector('#whyBuffer').textContent=money(c.reserve);
    document.querySelector('#resultRevenue').textContent=money(c.steadyRevenue);
    document.querySelector('#resultOperating').textContent=money(c.fixed+c.steadyVariable);
    document.querySelector('#resultProfit').textContent=money(c.steadyProfit);
    document.querySelector('#resultBreakEven').textContent=c.breakEvenDaily;

    const resultStatus=document.querySelector('#resultStatus');
    const statusStrong=resultStatus.querySelector('strong');
    if(c.gap>0){resultStatus.className='result-status caution';statusStrong.textContent='Needs adjustment';}
    else if(c.steadyProfit<=0){resultStatus.className='result-status danger';statusStrong.textContent='High risk';}
    else{resultStatus.className='result-status good';statusStrong.textContent='Within budget';}

    const rentRatio=c.steadyRevenue>0?Math.round(c.rent/c.steadyRevenue*100):0;
    const salesMargin=c.units-c.breakEvenDaily;
    const risks=[];
    if(c.gap>0) risks.push(`<div class="risk warning"><strong>Funding gap</strong><span>You need about ${money(c.gap)} more than your available cash.</span></div>`);
    if(c.required>c.maxInvestment) risks.push(`<div class="risk critical"><strong>Above your personal limit</strong><span>Recommended capital is ${money(c.required-c.maxInvestment)} above your maximum investment.</span></div>`);
    if(rentRatio>=20) risks.push(`<div class="risk warning"><strong>Rent pressure</strong><span>Rent is about ${rentRatio}% of projected steady revenue.</span></div>`);
    if(salesMargin<=10) risks.push(`<div class="risk critical"><strong>Thin sales safety margin</strong><span>You expect ${c.units}/day and break even near ${c.breakEvenDaily}/day.</span></div>`);
    else risks.push(`<div class="risk good"><strong>Sales cushion</strong><span>Target sales are ${salesMargin} orders/day above estimated break-even.</span></div>`);
    if(c.steadyProfit<=0) risks.push(`<div class="risk critical"><strong>No steady operating profit</strong><span>At current prices and costs, the mature monthly plan is still negative.</span></div>`);
    else risks.push(`<div class="risk good"><strong>Positive steady month</strong><span>Estimated operating profit is ${money(c.steadyProfit)} before tax, financing, and depreciation.</span></div>`);
    document.querySelector('#riskList').innerHTML=risks.join('');
  };

  const showStep=step=>{
    currentStep=Math.max(1,Math.min(9,step));
    panels.forEach(p=>p.classList.toggle('active',Number(p.dataset.step)===currentStep));
    pills.forEach(p=>{
      const n=Number(p.dataset.goStep);
      p.classList.toggle('active',n===currentStep);
      p.classList.toggle('done',n<currentStep);
    });
    const names=['Business','Money','Location','Setup','Staff','Sales','Expenses','Forecast','Results'];
    const pct=Math.round(currentStep/9*100);
    document.querySelector('#stepLabel').textContent=`Step ${currentStep} of 9 · ${names[currentStep-1]}`;
    document.querySelector('#stepPercent').textContent=pct+'%';
    document.querySelector('#wizardProgress').style.width=pct+'%';
    document.querySelector('#prevStep').style.visibility=currentStep===1?'hidden':'visible';
    const next=document.querySelector('#nextStep');
    next.textContent=currentStep===8?'Generate my plan':currentStep===9?'View dashboard':'Continue';
    document.querySelector('#wizardActions').classList.toggle('result-actions',currentStep===9);
    updateSummary();
    window.scrollTo({top:0,behavior:'smooth'});
  };

  document.querySelector('#prevStep').addEventListener('click',()=>showStep(currentStep-1));
  document.querySelector('#nextStep').addEventListener('click',()=>{
    if(currentStep===9){window.location.href='dashboard.html';return;}
    showStep(currentStep+1);
  });
  pills.forEach(p=>p.addEventListener('click',()=>showStep(Number(p.dataset.goStep))));

  document.querySelectorAll('[data-plan-mode]').forEach(btn=>btn.addEventListener('click',()=>{
    document.querySelectorAll('[data-plan-mode]').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    const detailed=btn.dataset.planMode==='detailed';
    document.body.classList.toggle('detailed-mode',detailed);
    document.querySelector('#liveMode').textContent=detailed?'Detailed planning':'Quick estimate';
    document.querySelector('#liveMode').className='tag '+(detailed?'quoted':'estimated');
    document.querySelector('#verificationPct').textContent=detailed?'55%':'25%';
    document.querySelector('#verificationBar').style.width=detailed?'55%':'25%';
  }));

  document.querySelectorAll('.segmented').forEach(group=>{
    group.querySelectorAll('button').forEach(btn=>btn.addEventListener('click',()=>{
      group.querySelectorAll('button').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      const hidden=group.parentElement.querySelector(`input[name="${group.dataset.fillName}"]`);
      if(hidden)hidden.value=btn.dataset.value;
      updateSummary();
    }));
  });

  document.querySelector('#addCustomSetup').addEventListener('click',()=>{
    const amount=Number(prompt('Custom setup cost amount (USD):','250'));
    if(!Number.isFinite(amount)||amount<=0)return;
    customSetupCosts.push(amount);
    const row=document.createElement('div');
    row.className='custom-setup-row';
    row.innerHTML=`<span>Custom setup cost</span><strong>${money(amount)}</strong>`;
    document.querySelector('#customSetupList').appendChild(row);
    updateSummary();
  });

  form.addEventListener('input',()=>{updateChoiceCards();updateSummary();});
  form.addEventListener('change',()=>{updateChoiceCards();updateSummary();});
  updateChoiceCards();
  updateSummary();
  showStep(1);
}
