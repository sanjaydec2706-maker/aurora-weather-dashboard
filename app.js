(function () {
  "use strict";

  /* ===================== Data ===================== */
  var state = {
    unit: "C", // C | F
    windUnit: "kmh",
    location: { city: "Chennai", region: "Tamil Nadu, IN" },
    reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  };

  var current = {
    tempC: 31, feelsLikeC: 35, highC: 32, lowC: 26,
    condition: "partly-cloudy", isDay: true,
    summary: "Warm and humid with building afternoon clouds",
    humidity: 68, uvIndex: 8, aqi: 74,
    pressureHpa: 1011, pressureTrend: "falling",
    wind: { speedKph: 18, gustKph: 29, directionDeg: 122 },
    visibilityKm: 8, dewPointC: 24,
  };

  var hourly = [
    { time: "Now", tempC: 31, condition: "partly-cloudy", precip: 10 },
    { time: "15:00", tempC: 32, condition: "partly-cloudy", precip: 15 },
    { time: "16:00", tempC: 32, condition: "cloudy", precip: 25 },
    { time: "17:00", tempC: 31, condition: "cloudy", precip: 35 },
    { time: "18:00", tempC: 29, condition: "rain", precip: 60 },
    { time: "19:00", tempC: 28, condition: "rain", precip: 65 },
    { time: "20:00", tempC: 27, condition: "cloudy", precip: 40 },
    { time: "21:00", tempC: 27, condition: "cloudy", precip: 30 },
    { time: "22:00", tempC: 26, condition: "clear", precip: 10 },
    { time: "23:00", tempC: 26, condition: "clear", precip: 5 },
    { time: "00:00", tempC: 25, condition: "clear", precip: 5 },
    { time: "01:00", tempC: 25, condition: "clear", precip: 5 },
    { time: "02:00", tempC: 24, condition: "clear", precip: 0 },
    { time: "03:00", tempC: 24, condition: "clear", precip: 0 },
    { time: "04:00", tempC: 24, condition: "fog", precip: 0 },
    { time: "05:00", tempC: 24, condition: "fog", precip: 0 },
    { time: "06:00", tempC: 25, condition: "partly-cloudy", precip: 5 },
    { time: "07:00", tempC: 26, condition: "partly-cloudy", precip: 5 },
    { time: "08:00", tempC: 28, condition: "clear", precip: 0 },
    { time: "09:00", tempC: 29, condition: "clear", precip: 0 },
    { time: "10:00", tempC: 30, condition: "clear", precip: 0 },
    { time: "11:00", tempC: 31, condition: "partly-cloudy", precip: 10 },
    { time: "12:00", tempC: 32, condition: "partly-cloudy", precip: 10 },
    { time: "13:00", tempC: 32, condition: "partly-cloudy", precip: 15 },
  ];

  var tenDay = [
    { day: "Today", date: "Jul 5", condition: "partly-cloudy", highC: 32, lowC: 26, precip: 30 },
    { day: "Mon", date: "Jul 6", condition: "rain", highC: 29, lowC: 25, precip: 70 },
    { day: "Tue", date: "Jul 7", condition: "rain", highC: 28, lowC: 24, precip: 80 },
    { day: "Wed", date: "Jul 8", condition: "storm", highC: 27, lowC: 24, precip: 90 },
    { day: "Thu", date: "Jul 9", condition: "cloudy", highC: 29, lowC: 25, precip: 40 },
    { day: "Fri", date: "Jul 10", condition: "partly-cloudy", highC: 31, lowC: 26, precip: 20 },
    { day: "Sat", date: "Jul 11", condition: "clear", highC: 33, lowC: 27, precip: 5 },
    { day: "Sun", date: "Jul 12", condition: "clear", highC: 33, lowC: 27, precip: 5 },
    { day: "Mon", date: "Jul 13", condition: "partly-cloudy", highC: 32, lowC: 26, precip: 15 },
    { day: "Tue", date: "Jul 14", condition: "cloudy", highC: 30, lowC: 25, precip: 35 },
  ];

  var aiConversation = [
    { from: "ai", tag: "insight", text: "Good afternoon. It's 31° and building humidity over Chennai — expect a band of afternoon showers rolling in around 6 PM that should ease off by 9." },
    { from: "ai", tag: "advisory", text: "UV is sitting at 8, high for this hour. If you're headed out before 3 PM, reapply sunscreen and keep to shade where you can." },
    { from: "ai", tag: "insight", text: "Pressure is easing off — that's usually your first sign of the evening system moving in. Nothing severe expected, just a damp commute." },
  ];

  var suggestedPrompts = [
    "Will it rain during my commute?",
    "Best time for a run today?",
    "Explain this week's humidity trend",
  ];

  var communityAlerts = [
    { area: "Adyar", note: "Ponding on OMR near the signal, moderate traffic", minutesAgo: 12 },
    { area: "T. Nagar", note: "Brief spell of hail reported, already clearing", minutesAgo: 34 },
    { area: "Velachery", note: "Strong gusts knocked down a banner, road clear", minutesAgo: 51 },
  ];

  /* ===================== Helpers ===================== */
  function cToF(c) { return Math.round((c * 9) / 5 + 32); }
  function fmtTemp(c) {
    return (state.unit === "C" ? Math.round(c) : cToF(c)) + "°";
  }
  function kphToMph(k) { return Math.round(k * 0.621371); }
  function fmtWind(k) {
    return state.windUnit === "kmh" ? Math.round(k) + " km/h" : kphToMph(k) + " mph";
  }
  function toast(msg) {
    var el = document.getElementById("toast");
    el.textContent = msg;
    el.classList.add("is-visible");
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { el.classList.remove("is-visible"); }, 2200);
  }

  /* Condition -> inline SVG icon (elegant, monoline, accent colored) */
  function conditionIcon(cond, size) {
    size = size || 24;
    var stroke = "currentColor";
    var icons = {
      "clear": '<circle cx="12" cy="12" r="5" fill="none" stroke="'+stroke+'" stroke-width="1.6"/><g stroke="'+stroke+'" stroke-width="1.6" stroke-linecap="round"><path d="M12 2v2.4M12 19.6V22M4.9 4.9l1.7 1.7M17.4 17.4l1.7 1.7M2 12h2.4M19.6 12H22M4.9 19.1l1.7-1.7M17.4 6.6l1.7-1.7"/></g>',
      "partly-cloudy": '<circle cx="9.2" cy="10" r="4" fill="none" stroke="'+stroke+'" stroke-width="1.5"/><path d="M7 17.5h9a3.6 3.6 0 0 0 .5-7.16A5.2 5.2 0 0 0 7.3 12.6" fill="none" stroke="'+stroke+'" stroke-width="1.6" stroke-linejoin="round"/>',
      "cloudy": '<path d="M6.2 17.5h11.1a3.7 3.7 0 0 0 .4-7.38A5.6 5.6 0 0 0 7 12.2a3.4 3.4 0 0 0-.8 5.3Z" fill="none" stroke="'+stroke+'" stroke-width="1.6" stroke-linejoin="round"/>',
      "rain": '<path d="M6.2 14.2h11.1a3.7 3.7 0 0 0 .4-7.38A5.6 5.6 0 0 0 7 8.9a3.4 3.4 0 0 0-.8 5.3Z" fill="none" stroke="'+stroke+'" stroke-width="1.6" stroke-linejoin="round"/><g stroke="'+stroke+'" stroke-width="1.6" stroke-linecap="round"><path d="M9 18.5l-1 2.2M13 18.5l-1 2.2M17 18.5l-1 2.2"/></g>',
      "storm": '<path d="M6.2 12.7h11.1a3.7 3.7 0 0 0 .4-7.38A5.6 5.6 0 0 0 7 7.4a3.4 3.4 0 0 0-.8 5.3Z" fill="none" stroke="'+stroke+'" stroke-width="1.6" stroke-linejoin="round"/><path d="M13 14l-3 5h3l-2 4" fill="none" stroke="'+stroke+'" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>',
      "snow": '<path d="M6.2 12.7h11.1a3.7 3.7 0 0 0 .4-7.38A5.6 5.6 0 0 0 7 7.4a3.4 3.4 0 0 0-.8 5.3Z" fill="none" stroke="'+stroke+'" stroke-width="1.6" stroke-linejoin="round"/><g stroke="'+stroke+'" stroke-width="1.5" stroke-linecap="round"><path d="M9 17v5M6.7 18.5l4.6 2M11.3 18.5l-4.6 2"/><path d="M15 17v5M12.7 18.5l4.6 2M17.3 18.5l-4.6 2"/></g>',
      "fog": '<g stroke="'+stroke+'" stroke-width="1.6" stroke-linecap="round"><path d="M4 9.5h13M4 13h16M4 16.5h13"/></g>',
    };
    var body = icons[cond] || icons["partly-cloudy"];
    return '<svg viewBox="0 0 24 24" width="'+size+'" height="'+size+'" aria-hidden="true">'+body+'</svg>';
  }

  var conditionColor = {
    clear: "var(--amber)", "partly-cloudy": "var(--amber)", cloudy: "var(--ink-2)",
    rain: "var(--teal)", storm: "var(--violet)", snow: "var(--ink-1)", fog: "var(--ink-3)",
  };

  /* ===================== Render: hero ===================== */
  function renderHero() {
    document.getElementById("heroSummary").textContent = current.summary;
    document.getElementById("heroTemp").textContent = fmtTemp(current.tempC);
    document.getElementById("heroFeels").textContent = "Feels like " + fmtTemp(current.feelsLikeC);
    document.getElementById("heroHumidity").textContent = "Humidity " + current.humidity + "%";
    document.getElementById("heroHigh").textContent = fmtTemp(current.highC);
    document.getElementById("heroLow").textContent = fmtTemp(current.lowC);

    var scene = document.getElementById("heroScene");
    scene.dataset.condition = current.condition;
    var sun = scene.querySelector(".scene-sun");
    var rain = scene.querySelector(".scene-rain");
    var stars = scene.querySelector(".scene-stars");
    var sky = scene.querySelector(".scene-sky");

    var skies = {
      "clear": "linear-gradient(160deg,#1B2A52 0%, #2E3F72 45%, #7CA8C9 100%)",
      "partly-cloudy": "linear-gradient(160deg,#1B2A52 0%, #2E3F72 45%, #6B87AE 100%)",
      "cloudy": "linear-gradient(160deg,#232842 0%, #3A4062 50%, #6B7192 100%)",
      "rain": "linear-gradient(160deg,#1A1E33 0%, #2A3049 55%, #3C4560 100%)",
      "storm": "linear-gradient(160deg,#0C0A16 0%, #1B1730 55%, #2C2444 100%)",
    };
    sky.style.background = skies[current.condition] || skies["partly-cloudy"];
    rain.style.opacity = (current.condition === "rain" || current.condition === "storm") ? "1" : "0";
    stars.style.opacity = current.isDay ? "0" : "0.7";
    sun.style.opacity = current.isDay && current.condition !== "storm" ? "1" : "0";
  }

  /* ===================== Render: gauges ===================== */
  function setArc(el, value, max) {
    var pct = Math.max(0, Math.min(1, value / max));
    var circumference = 163;
    el.style.strokeDashoffset = String(circumference * (1 - pct));
  }
  function renderGauges() {
    document.querySelectorAll(".gauge").forEach(function (g) {
      var arc = g.querySelector(".gauge-arc");
      if (arc) setArc(arc, Number(g.dataset.value), Number(g.dataset.max));
    });
    document.getElementById("compassNeedle").setAttribute("transform", "rotate(" + current.wind.directionDeg + " 32 32)");
    // wind value display
    var compassValue = document.querySelector("#windCompass .gauge-value");
    compassValue.textContent = fmtWind(current.wind.speedKph).split(" ")[0];
    document.querySelector("#windCompass .gauge-label small").textContent = state.windUnit === "kmh" ? "km/h" : "mph";
  }

  /* ===================== Render: hourly ===================== */
  function renderHourly() {
    var strip = document.getElementById("hourlyStrip");
    strip.innerHTML = "";
    hourly.forEach(function (h) {
      var item = document.createElement("div");
      item.className = "hour-item" + (h.time === "Now" ? " is-now" : "");
      item.setAttribute("role", "listitem");
      item.innerHTML =
        '<span class="hour-time">' + h.time + '</span>' +
        '<span class="hour-icon" style="color:' + conditionColor[h.condition] + '">' + conditionIcon(h.condition, 24) + '</span>' +
        '<span class="hour-temp">' + fmtTemp(h.tempC) + '</span>' +
        '<span class="hour-precip">' + h.precip + '%</span>';
      strip.appendChild(item);
    });
  }

  /* ===================== Render: 10-day ===================== */
  function renderTenDay() {
    var list = document.getElementById("tenDayList");
    list.innerHTML = "";
    tenDay.forEach(function (d) {
      var li = document.createElement("li");
      li.className = "tenday-row";
      li.innerHTML =
        '<div><span class="tenday-day">' + d.day + '</span><span class="tenday-date">' + d.date + '</span></div>' +
        '<span class="tenday-icon" style="color:' + conditionColor[d.condition] + '">' + conditionIcon(d.condition, 22) + '</span>' +
        '<div><div class="precip-bar"><span style="width:' + d.precip + '%"></span></div><span class="precip-chance">' + d.precip + '% precip</span></div>' +
        '<div class="tenday-temps"><span>' + fmtTemp(d.highC) + '</span><span class="lo">' + fmtTemp(d.lowC) + '</span></div>';
      list.appendChild(li);
    });
  }

  /* ===================== Render: stats ===================== */
  function renderStats() {
    var stats = document.querySelectorAll(".stats-card .stat strong");
    if (!stats.length) return;
    stats[0].textContent = current.visibilityKm + " km";
    stats[1].textContent = fmtWind(current.wind.gustKph);
    stats[2].textContent = current.humidity + "%";
    stats[3].textContent = fmtTemp(current.dewPointC);
  }

  /* ===================== Render: alerts ===================== */
  function renderAlerts() {
    [document.getElementById("alertList"), document.getElementById("alertListSide")].forEach(function (list) {
      if (!list) return;
      list.innerHTML = "";
      communityAlerts.forEach(function (a) {
        var li = document.createElement("li");
        li.className = "alert-row";
        li.innerHTML =
          '<div class="alert-head"><span>' + a.area + '</span><time>' + a.minutesAgo + 'm ago</time></div>' +
          '<p>' + a.note + '</p>';
        list.appendChild(li);
      });
    });
  }

  /* ===================== Chat ===================== */
  var chatMessages = aiConversation.slice();
  function renderChat() {
    var scroll = document.getElementById("chatScroll");
    scroll.innerHTML = "";
    chatMessages.forEach(function (m) {
      var div = document.createElement("div");
      div.className = "msg from-" + m.from + (m.tag === "alert" ? " tag-alert" : "");
      var tagLabel = m.tag === "advisory" ? "Advisory" : m.tag === "alert" ? "Alert" : m.from === "ai" ? "Insight" : "";
      div.innerHTML = (m.from === "ai" && m.tag ? '<span class="msg-tag">' + tagLabel + '</span>' : '') + escapeHtml(m.text);
      scroll.appendChild(div);
    });
    scroll.scrollTop = scroll.scrollHeight;
  }
  function escapeHtml(s) {
    var d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }
  function renderPrompts() {
    var row = document.getElementById("promptRow");
    row.innerHTML = "";
    suggestedPrompts.forEach(function (p) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "prompt-chip";
      btn.textContent = p;
      btn.addEventListener("click", function () { sendChat(p); });
      row.appendChild(btn);
    });
  }
  function sendChat(text) {
    text = (text || "").trim();
    if (!text) return;
    chatMessages.push({ from: "user", text: text });
    chatMessages.push({
      from: "ai", tag: "insight",
      text: "Looking at the next few hours, conditions stay stable with a light breeze — I'll flag anything that changes before it affects your plans.",
    });
    renderChat();
  }

  /* ===================== Navigation ===================== */
  var views = ["dashboard", "radar", "insights", "settings"];
  function showView(name) {
    views.forEach(function (v) {
      var section = document.getElementById("view-" + v);
      var active = v === name;
      section.hidden = !active;
      section.classList.toggle("is-active", active);
    });
    document.querySelectorAll(".nav-item").forEach(function (btn) {
      var active = btn.dataset.target === name;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-selected", String(active));
    });
    document.querySelectorAll(".tab-item").forEach(function (btn) {
      btn.classList.toggle("is-active", btn.dataset.target === name);
    });
    document.getElementById("view-" + name).focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: state.reducedMotion ? "auto" : "smooth" });
  }

  function bindNav() {
    document.querySelectorAll("[data-target]").forEach(function (el) {
      el.addEventListener("click", function () {
        showView(el.dataset.target);
      });
    });
  }

  /* ===================== Unit toggle ===================== */
  function setUnit(unit) {
    state.unit = unit;
    document.querySelectorAll(".unit-pill").forEach(function (pill) {
      pill.querySelector("[data-unit-c]").classList.toggle("active", unit === "C");
      pill.querySelector("[data-unit-f]").classList.toggle("active", unit === "F");
    });
    document.querySelectorAll('[data-segmented="units"] .seg-btn').forEach(function (btn) {
      btn.classList.toggle("is-active", btn.dataset.value === unit);
    });
    renderHero();
    renderHourly();
    renderTenDay();
    renderStats();
  }
  function bindUnitToggle() {
    ["sidebarUnitToggle", "topUnitToggle"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener("click", function () { setUnit(state.unit === "C" ? "F" : "C"); });
    });
  }

  /* ===================== Segmented controls & switches (Settings) ===================== */
  function bindSettings() {
    document.querySelectorAll(".segmented").forEach(function (group) {
      group.addEventListener("click", function (e) {
        var btn = e.target.closest(".seg-btn");
        if (!btn) return;
        group.querySelectorAll(".seg-btn").forEach(function (b) { b.classList.remove("is-active"); });
        btn.classList.add("is-active");
        var kind = group.dataset.segmented;
        if (kind === "units") setUnit(btn.dataset.value);
        if (kind === "wind") { state.windUnit = btn.dataset.value; renderGauges(); renderStats(); }
        if (kind === "theme") toast(btn.dataset.value + " theme applied");
      });
    });

    document.querySelectorAll(".switch[data-setting]").forEach(function (sw) {
      sw.addEventListener("click", function () {
        var on = !sw.classList.contains("is-on");
        sw.classList.toggle("is-on", on);
        sw.setAttribute("aria-checked", String(on));
        if (sw.dataset.setting === "reducedMotion") {
          state.reducedMotion = on;
          document.body.classList.toggle("reduced-motion", on);
        }
      });
    });
  }

  /* ===================== Location dialog ===================== */
  function bindLocation() {
    var dialog = document.getElementById("locationDialog");
    document.getElementById("locationBtn").addEventListener("click", function () {
      dialog.showModal();
      document.getElementById("locationSearch").focus();
    });
    document.querySelectorAll(".location-option").forEach(function (btn) {
      btn.addEventListener("click", function () {
        state.location = { city: btn.dataset.city, region: btn.dataset.region };
        document.getElementById("topLocation").textContent = state.location.city;
        document.getElementById("topRegion").textContent = state.location.region;
        dialog.close();
        toast("Showing forecast for " + state.location.city);
      });
    });
  }

  /* ===================== Refresh ===================== */
  function bindRefresh() {
    document.getElementById("refreshBtn").addEventListener("click", function (e) {
      e.currentTarget.classList.add("is-spinning");
      setTimeout(function () { e.currentTarget.classList.remove("is-spinning"); }, 700);
      toast("Forecast updated");
    });
  }

  /* ===================== Radar frames ===================== */
  function bindRadar() {
    document.querySelectorAll(".radar-frame").forEach(function (btn) {
      btn.addEventListener("click", function () {
        document.querySelectorAll(".radar-frame").forEach(function (b) { b.classList.remove("is-active"); });
        btn.classList.add("is-active");
      });
    });
  }

  /* ===================== Chat form ===================== */
  function bindChat() {
    document.getElementById("chatForm").addEventListener("submit", function (e) {
      e.preventDefault();
      var input = document.getElementById("chatInput");
      sendChat(input.value);
      input.value = "";
    });
  }

  /* ===================== Init ===================== */
  function init() {
    bindNav();
    bindUnitToggle();
    bindSettings();
    bindLocation();
    bindRefresh();
    bindRadar();
    bindChat();

    renderHero();
    renderGauges();
    renderHourly();
    renderTenDay();
    renderStats();
    renderAlerts();
    renderChat();
    renderPrompts();

    if (state.reducedMotion) document.body.classList.add("reduced-motion");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
