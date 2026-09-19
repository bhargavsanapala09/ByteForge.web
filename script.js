/* =========================================================
   THEME
========================================================= */
function applyTheme(theme){
  document.documentElement.setAttribute('data-theme', theme);
  const knob = document.getElementById('themeKnob');
  if(knob) knob.textContent = theme === 'light' ? '☀️' : '🌙';
  try{ localStorage.setItem('cea-theme', theme); }catch(e){}
}

(function initTheme(){
  let saved = null;
  try{ saved = localStorage.getItem('cea-theme'); }catch(e){}
  const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
  applyTheme(saved || (prefersLight ? 'light' : 'dark'));
})();

document.addEventListener('click', function(e){
  if(e.target && e.target.closest && e.target.closest('#themeToggle')){
    const current = document.documentElement.getAttribute('data-theme');
    applyTheme(current === 'light' ? 'dark' : 'light');
  }
});


/* =========================================================
   INTRO SPLASH -> LOGIN
========================================================= */
window.addEventListener('load', function(){
  const splash = document.getElementById('introSplash');
  const login = document.getElementById('loginScreen');

  requestAnimationFrame(()=> splash.classList.add('playing'));

  setTimeout(function(){
    splash.classList.add('leaving');
    login.classList.add('visible');

    setTimeout(()=> splash.remove(), 650);
  }, 2200);
});


/* =========================================================
   LOGIN
========================================================= */
document.getElementById('loginForm').addEventListener('submit', function(e){
  e.preventDefault();

  const email = document.getElementById('loginEmail').value.trim();
  const pass = document.getElementById('loginPassword').value.trim();
  const errorBox = document.getElementById('loginError');
  const card = document.querySelector('.login-card');

  if(!email || !pass){
    errorBox.classList.add('show');

    card.classList.remove('login-shake');
    void card.offsetWidth;
    card.classList.add('login-shake');

    return;
  }

  errorBox.classList.remove('show');

  const loginScreen = document.getElementById('loginScreen');
  loginScreen.classList.remove('visible');

  setTimeout(function(){
    loginScreen.classList.add('hidden');
    document.getElementById('app').classList.add('visible');
  }, 500);
});


document.getElementById('logoutBtn').addEventListener('click', function(){
  document.getElementById('app').classList.remove('visible');

  document.getElementById('loginScreen').classList.remove('hidden');

  requestAnimationFrame(() =>
    document.getElementById('loginScreen').classList.add('visible')
  );

  document.getElementById('loginForm').reset();
});


/* =========================================================
   DASHBOARD LOGIC
========================================================= */

function openDashboard(){
  document
    .getElementById('dashboard')
    .scrollIntoView({ behavior:'smooth' });
}


function openSchedule(){
  document
    .getElementById('schedule')
    .scrollIntoView({
      behavior:'smooth',
      block:'center'
    });
}


/* =========================================================
   ENERGY SAVINGS CALCULATION
========================================================= */

const ENERGY_TARIFF = 9.2;
// ₹ per kWh — same working tariff used by the schedule optimizer

const WEEKS_PER_YEAR = 52;


/* =========================================================
   BUILDING DATA
========================================================= */

const buildingData = {

  all:{
    waste:1248,
    anomalies:12,
    peak:"2:00 PM"
  },

  academic:{
    waste:412,
    anomalies:4,
    peak:"1:00 PM"
  },

  hostel:{
    waste:348,
    anomalies:3,
    peak:"9:00 PM"
  },

  library:{
    waste:276,
    anomalies:2,
    peak:"6:00 PM"
  },

  lab:{
    waste:198,
    anomalies:2,
    peak:"2:00 PM"
  },

  sports:{
    waste:142,
    anomalies:1,
    peak:"5:00 PM"
  }

};


/* =========================================================
   FORMAT RUPEES
========================================================= */

function formatRupeesCompact(value){

  if(value >= 10000000){

    return `₹${(
      value / 10000000
    ).toFixed(2)}Cr`;

  }

  if(value >= 100000){

    return `₹${(
      value / 100000
    ).toFixed(2)}L`;

  }

  if(value >= 1000){

    return `₹${(
      value / 1000
    ).toFixed(1)}K`;

  }

  return `₹${Math.round(value)
    .toLocaleString('en-IN')}`;
}


/* =========================================================
   UPDATE ANNUAL SAVINGS CARD
========================================================= */

function updateSavingsCard(wasteKwh){

  const annualSavings =
    wasteKwh *
    WEEKS_PER_YEAR *
    ENERGY_TARIFF;

  const monthlySavings =
    annualSavings / 12;

  const annualEl =
    document.getElementById(
      'annualSavingsValue'
    );

  const monthlyEl =
    document.querySelector(
      '.savings .metric-change'
    );


  if(annualEl){

    annualEl.textContent =
      formatRupeesCompact(
        annualSavings
      );

  }


  if(monthlyEl){

    monthlyEl.textContent =
      `↑ ${formatRupeesCompact(
        monthlySavings
      )}/mo`;

  }

}


/* =========================================================
   CHANGE BUILDING
========================================================= */

function changeBuilding(){

  const selected =
    document.getElementById(
      'buildingSelect'
    ).value;

  const data =
    buildingData[selected];


  document.getElementById(
    'wasteValue'
  ).textContent =
    data.waste.toLocaleString('en-IN');


  document.getElementById(
    'anomalyValue'
  ).textContent =
    data.anomalies;


  document.getElementById(
    'peakValue'
  ).textContent =
    data.peak;


  updateSavingsCard(
    data.waste
  );


  const scheduleBuilding =
    document.getElementById(
      'scheduleBuilding'
    );


  if(
    scheduleBuilding &&
    selected !== 'all'
  ){

    scheduleBuilding.value =
      selected;

    renderSchedule(false);
  }

}


/* =========================================================
   AI SCHEDULE OPTIMIZER
========================================================= */

const scheduleProfiles = {

  academic: {

    label:'Academic Block',

    baseline:412,

    confidence:94,

    peak:'1:00–3:00 PM',

    precondition:'6:45 AM',

    close:'5:30–7:00 PM',

    headline:
      'A calmer peak without a colder classroom',

    summary:
      'Pre-condition before arrival, then move flexible equipment away from the afternoon spike.',

    peakAction:
      'Stagger AV and non-critical room starts',

    reason:
      'the Academic Block’s AC demand rises before the day’s highest occupancy, so a short pre-cool and staggered equipment start reduces the 1 PM peak.'
  },


  hostel: {

    label:'Hostel',

    baseline:348,

    confidence:91,

    peak:'7:00–10:00 PM',

    precondition:'5:30 PM',

    close:'10:30 PM–12:00 AM',

    headline:
      'Lower the evening surge, not student comfort',

    summary:
      'Prepare common areas before the evening rush and rotate water-heating loads after the peak.',

    peakAction:
      'Rotate water heating and common-area cooling',

    reason:
      'hostel demand clusters around evening showers and common-area use, so rotating water heating away from the comfort window takes pressure off the grid.'
  },


  library: {

    label:'Library',

    baseline:276,

    confidence:96,

    peak:'4:00–7:00 PM',

    precondition:'7:30 AM',

    close:'8:30–10:00 PM',

    headline:
      'Let the library work hard—only when it is open',

    summary:
      'Match lighting and cooling to occupancy while protecting the late-afternoon study period.',

    peakAction:
      'Use occupancy-based lighting scenes',

    reason:
      'the Library’s lights and cooling remain elevated after peak occupancy, so occupancy-aware scenes can retain study comfort while removing empty-zone load.'
  },


  lab: {

    label:'Lab Building',

    baseline:198,

    confidence:89,

    peak:'1:00–3:30 PM',

    precondition:'7:00 AM',

    close:'6:00–7:30 PM',

    headline:
      'Protect experiments while smoothing equipment starts',

    summary:
      'Keep essential equipment stable and schedule flexible instruments around the highest-demand window.',

    peakAction:
      'Queue flexible instruments outside the peak',

    reason:
      'the Lab Building has a sharp demand step when equipment starts together, so a controlled start sequence limits the spike without interrupting essential experiments.'
  },


  sports: {

    label:'Sports Complex',

    baseline:142,

    confidence:88,

    peak:'5:00–8:00 PM',

    precondition:'3:45 PM',

    close:'9:30–10:30 PM',

    headline:
      'Prepare the courts before the after-class rush',

    summary:
      'Pre-cool high-use zones and place pool, laundry, and ventilation loads on a steadier sequence.',

    peakAction:
      'Shift pool and support loads to low demand',

    reason:
      'the Sports Complex’s evening activity overlaps with utility peak demand, so starting support loads earlier or later keeps facilities ready with less simultaneous draw.'
  }

};


/* =========================================================
   PLAN MODES
========================================================= */

const planModes = {

  balanced:{

    reduction:18.6,

    label:'Balanced savings',

    activeOffset:0,

    nightOffset:2,

    peakDetail:
      'Keep non-essential loads from starting during the demand peak.'
  },


  savings:{

    reduction:24.2,

    label:'Maximum savings',

    activeOffset:1,

    nightOffset:3,

    peakDetail:
      'Delay flexible loads until the peak has passed and cap non-critical zones.'
  },


  comfort:{

    reduction:13.4,

    label:'Maximum comfort',

    activeOffset:0,

    nightOffset:1,

    peakDetail:
      'Protect occupied-zone comfort while delaying only the most flexible loads.'
  }

};


/* =========================================================
   DAY SETTINGS
========================================================= */

const daySettings = {

  weekday:{

    label:'Teaching day',

    adjustment:0,

    occupancy:'normal occupancy'
  },


  weekend:{

    label:'Weekend / low occupancy',

    adjustment:3.2,

    occupancy:'reduced occupancy'
  },


  event:{

    label:'Event day',

    adjustment:-2.4,

    occupancy:'event occupancy'
  }

};


/* =========================================================
   PLANNER INPUTS
========================================================= */

function plannerInputs(){

  return {

    building:
      document.getElementById(
        'scheduleBuilding'
      ).value,

    day:
      document.getElementById(
        'scheduleDay'
      ).value,

    goal:
      document.getElementById(
        'scheduleGoal'
      ).value,

    temperature:
      Number(
        document.getElementById(
          'targetTemperature'
        ).value
      )

  };

}


/* =========================================================
   RENDER AI SCHEDULE
========================================================= */

function renderSchedule(showUpdate){

  const input =
    plannerInputs();

  const profile =
    scheduleProfiles[
      input.building
    ];

  const mode =
    planModes[
      input.goal
    ];

  const day =
    daySettings[
      input.day
    ];


  const temperatureEffect =
    (input.temperature - 24) * .55;


  const reduction =
    Math.max(
      8,
      Math.min(
        29,
        mode.reduction +
        day.adjustment +
        temperatureEffect
      )
    );


  const savedKwh =
    Math.round(
      profile.baseline *
      reduction /
      100
    );


  const savedCost =
    Math.round(
      savedKwh *
      ENERGY_TARIFF
    );


  const activeSetpoint =
    Math.min(
      27,
      input.temperature +
      mode.activeOffset
    );


  const nightSetpoint =
    Math.min(
      28,
      input.temperature +
      mode.nightOffset
    );


  const headline =
    input.day === 'event'
      ? 'A peak-aware plan for a busier building'
      : profile.headline;


  const summary =
    input.day === 'weekend'
      ? 'Trim conditioning in low-use areas while keeping the spaces that are open ready for occupants.'
      : profile.summary;


  /* =====================================================
     UPDATE UI
  ===================================================== */

  document.getElementById(
    'temperatureValue'
  ).textContent =
    `${input.temperature}°C`;


  document.getElementById(
    'resultBuilding'
  ).textContent =
    profile.label;


  document.getElementById(
    'scheduleHeadline'
  ).textContent =
    headline;


  document.getElementById(
    'scheduleSummary'
  ).textContent =
    summary;


  document.getElementById(
    'scheduleConfidence'
  ).textContent =
    `High · ${profile.confidence}%`;


  document.getElementById(
    'scheduleReduction'
  ).textContent =
    `${reduction.toFixed(1)}%`;


  document.getElementById(
    'scheduleKwh'
  ).textContent =
    `${savedKwh} kWh today`;


  document.getElementById(
    'scheduleCost'
  ).textContent =
    `₹${savedCost.toLocaleString('en-IN')}`;


  document.getElementById(
    'schedulePeak'
  ).textContent =
    profile.peak;


  document.getElementById(
    'heroPotential'
  ).textContent =
    `${reduction.toFixed(1)}%`;


  document.getElementById(
    'statPotential'
  ).textContent =
    `${reduction.toFixed(1)}%`;


  document.getElementById(
    'scheduleReason'
  ).textContent =
    `Why this plan: ${profile.reason}`;


  /* =====================================================
     TIMELINE
  ===================================================== */

  const rows = [

    {

      time:'12:00–06:00',

      title:'Night setback',

      type:'eco',

      tag:'Eco baseline',

      detail:
        `Hold non-essential zones at ${nightSetpoint}°C; keep security and essential equipment online.`
    },


    {

      time:
        `${profile.precondition}–08:00`,

      title:'Pre-condition occupied zones',

      type:'active',

      tag:'Smooth start',

      detail:
        `Bring priority spaces to ${activeSetpoint}°C before arrivals; use a gradual start sequence.`
    },


    {

      time:profile.peak,

      title:profile.peakAction,

      type:'peak',

      tag:'Peak guard',

      detail:
        mode.peakDetail
    },


    {

      time:profile.close,

      title:'Close-down automation',

      type:'eco',

      tag:'Auto shutoff',

      detail:
        `Return unused zones to ${nightSetpoint}°C and switch off lighting and equipment on the close-down list.`
    }

  ];


  document.getElementById(
    'scheduleTimeline'
  ).innerHTML =

    rows.map(row => `

      <div class="timeline-item ${row.type}">

        <span class="timeline-time">
          ${row.time}
        </span>

        <i
          class="timeline-marker"
          aria-hidden="true">
        </i>

        <div class="timeline-copy">

          <strong>
            ${row.title}
          </strong>

          <p>
            ${row.detail}
          </p>

        </div>

        <span class="timeline-tag">
          ${row.tag}
        </span>

      </div>

    `).join('');


  /* =====================================================
     APPLY BUTTON
  ===================================================== */

  const applyButton =
    document.getElementById(
      'applySchedule'
    );


  applyButton.classList.remove(
    'applied'
  );


  applyButton.innerHTML =
    'Apply this schedule <span>→</span>';


  applyButton.dataset.schedule =
    JSON.stringify({

      building:
        profile.label,

      reduction,

      savedKwh,

      savedCost,

      setpoint:
        activeSetpoint,

      day:
        day.label,

      mode:
        mode.label

    });


  if(showUpdate){

    showToast(
      `New plan ready for ${profile.label}: save about ${savedKwh} kWh today.`
    );

  }

}


/* =========================================================
   TOAST MESSAGE
========================================================= */

function showToast(message){

  const toast =
    document.getElementById(
      'toast'
    );

  if(!toast) return;


  toast.textContent =
    message;


  toast.classList.add(
    'show'
  );


  clearTimeout(
    window._toastTimer
  );


  window._toastTimer =
    setTimeout(
      () =>
        toast.classList.remove(
          'show'
        ),
      3600
    );

}


/* =========================================================
   INITIALIZE PLANNER
========================================================= */

function initPlanner(){

  const generate =
    document.getElementById(
      'generateSchedule'
    );


  if(!generate) return;


  const plannerControls = [

    'scheduleBuilding',

    'scheduleDay',

    'scheduleGoal'

  ];


  plannerControls.forEach(
    id => {

      document
        .getElementById(id)
        .addEventListener(
          'change',
          () => renderSchedule(false)
        );

    }
  );


  // Slider: only update the visible °C label while dragging.
  // Full schedule recalculation happens on button click, not while moving the slider.
  document
    .getElementById('targetTemperature')
    .addEventListener('input', () => {

      document.getElementById('temperatureValue').textContent =
        `${document.getElementById('targetTemperature').value}°C`;

    });


  generate.addEventListener(
    'click',
    () => renderSchedule(true)
  );


  document
    .getElementById('resetSchedule')
    .addEventListener(
      'click',
      () => {

        document.getElementById(
          'scheduleBuilding'
        ).value = 'academic';


        document.getElementById(
          'scheduleDay'
        ).value = 'weekday';


        document.getElementById(
          'scheduleGoal'
        ).value = 'balanced';


        document.getElementById(
          'targetTemperature'
        ).value = '24';


        document.getElementById(
          'temperatureValue'
        ).textContent = '24°C';


        renderSchedule(true);

      }
    );


  document
    .getElementById('applySchedule')
    .addEventListener(
      'click',
      function(){

        const schedule =
          JSON.parse(
            this.dataset.schedule
          );


        try{

          localStorage.setItem(
            'cea-applied-schedule',
            JSON.stringify(schedule)
          );

        }catch(e){}


        this.classList.add(
          'applied'
        );


        this.innerHTML =
          'Schedule applied <span>✓</span>';


        showToast(
          `${schedule.building} plan applied. Target: ${schedule.reduction.toFixed(1)}% less energy today.`
        );

      }
    );


  renderSchedule(false);

}


/* =========================================================
   STARTUP
========================================================= */

initPlanner();

updateSavingsCard(
  buildingData.all.waste
);


/* =========================================================
   NAV ACTIVE STATE
========================================================= */

const sections =
  document.querySelectorAll(
    '#app section'
  );


const navLinks =
  document.querySelectorAll(
    '#app nav a'
  );


window.addEventListener(
  'scroll',
  function(){

    let current = '';


    sections.forEach(
      function(section){

        const sectionTop =
          section.offsetTop - 120;


        if(
          window.scrollY >= sectionTop
        ){

          current =
            section.getAttribute(
              'id'
            );

        }

      }
    );


    navLinks.forEach(
      function(link){

        link.classList.remove(
          'active'
        );


        if(
          link.getAttribute('href') ===
          '#' + current
        ){

          link.classList.add(
            'active'
          );

        }

      }
    );

  }
);
