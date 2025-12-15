// app.js — Invitatie Botez Olivia-Ioana (alb & auriu) + butoane ajustate (Maps/Waze/Calendar/RSVP)

// === CONFIG (schimbi ușor ulterior orele) ===
const INV = {
    babyName: "Olivia-Ioana",
    dateISO: "2026-01-24",
    dateLong: "24 ianuarie 2026",

    // Orele: editezi tu când le stabilești
    // Exemplu: "Ora: 12:00" sau "12:00"
    churchTimeText: "Ora: (urmează să fie stabilită)",
    // Exemplu: "Începând cu ora 17:00" sau "17:00"
    partyTimeText: "Începând cu ora 17:00 (ajustabil)",

    church: {
        name: "Biserica Militară „Sf. Mare Mucenic Mina”",
        address: "Sector 6, București",
        mapsQuery: "Biserica Militara Sf Mare Mucenic Mina Sector 6 Bucuresti",
    },

    restaurant: {
        name: "Restaurant Four Seasons",
        address: "Complex Herăstrău, București",
        mapsQuery: "Complex Herastrau Bucuresti",
    },

    parents: "Ana & Alin DUMITRACHE",
    godparents: "Cosmina & Mircea PUȘCUȚĂ",

    phoneIntl: "+40740487295",
    phoneWa: "40740487295", // fără +
};

// === Helpers ===
const $ = (id) => document.getElementById(id);

function getTimeHHMM(text) {
    // extrage prima oră din text (ex: "Ora: 12:00", "17:00", "începând cu ora 17:00")
    const m = String(text).match(/(\d{1,2}):(\d{2})/);
    if (!m) return null;
    const hh = String(parseInt(m[1], 10)).padStart(2, "0");
    const mm = m[2];
    return `${hh}:${mm}`;
}

function mapsLink(query) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function wazeLink(query) {
    // Waze acceptă query text prin "q"
    return `https://waze.com/ul?q=${encodeURIComponent(query)}&navigate=yes`;
}

function waLink(status) {
    // mesaj elegant + util (scurt, nu roman lung)
    const msg =
        `Bună! ${status} la botezul Oliviei-Ioana, ${INV.dateLong}. ` +
        `Locații: ${INV.church.name} / ${INV.restaurant.name} (Complex Herăstrău). ` +
        `Cu drag, ${INV.parents}.`;
    return `https://wa.me/${INV.phoneWa}?text=${encodeURIComponent(msg)}`;
}

// --- Toast minimalist (fără biblioteci)
function toast(text) {
    let t = document.getElementById("toast");
    if (!t) {
        t = document.createElement("div");
        t.id = "toast";
        t.style.position = "fixed";
        t.style.left = "50%";
        t.style.bottom = "20px";
        t.style.transform = "translateX(-50%)";
        t.style.padding = "10px 14px";
        t.style.borderRadius = "999px";
        t.style.border = "1px solid rgba(201,162,74,.35)";
        t.style.background = "rgba(255,255,255,.92)";
        t.style.color = "rgba(30,25,16,.92)";
        t.style.boxShadow = "0 16px 40px rgba(20,20,18,.12)";
        t.style.fontWeight = "650";
        t.style.fontSize = "13px";
        t.style.zIndex = "9999";
        t.style.opacity = "0";
        t.style.transition = "opacity .18s ease, transform .18s ease";
        document.body.appendChild(t);
    }
    t.textContent = text;
    t.style.opacity = "1";
    t.style.transform = "translateX(-50%) translateY(-2px)";
    clearTimeout(window.__toastTimer);
    window.__toastTimer = setTimeout(() => {
        t.style.opacity = "0";
        t.style.transform = "translateX(-50%) translateY(0px)";
    }, 2200);
}

// === Calendar (.ics) ===
function escapeICS(s) {
    return String(s)
        .replaceAll("\\", "\\\\")
        .replaceAll("\n", "\\n")
        .replaceAll(",", "\\,")
        .replaceAll(";", "\\;");
}

function makeICS({ title, dateISO, timeText, location, description, durationMinutes = 60 }) {
    const dt = dateISO.replaceAll("-", "");
    const hhmm = getTimeHHMM(timeText);

    let dtStart, dtEnd;

    if (!hhmm) {
        // all-day: DTEND trebuie să fie ziua următoare (standard)
        const nextDay = new Date(`${dateISO}T00:00:00`);
        nextDay.setDate(nextDay.getDate() + 1);
        const yyyy = nextDay.getFullYear();
        const mm = String(nextDay.getMonth() + 1).padStart(2, "0");
        const dd = String(nextDay.getDate()).padStart(2, "0");
        const dtNext = `${yyyy}${mm}${dd}`;

        dtStart = `DTSTART;VALUE=DATE:${dt}`;
        dtEnd = `DTEND;VALUE=DATE:${dtNext}`;
    } else {
        const [hh, mm] = hhmm.split(":");
        const start = `${dt}T${hh}${mm}00`;

        // +durationMinutes
        const startDate = new Date(`${dateISO}T${hhmm}:00`);
        const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);
        const endDt = `${dt}T${String(endDate.getHours()).padStart(2, "0")}${String(endDate.getMinutes()).padStart(2, "0")}00`;

        // floating time (fără timezone) — ok pentru invitații
        dtStart = `DTSTART:${start}`;
        dtEnd = `DTEND:${endDt}`;
    }

    const uid = `${Date.now()}-${Math.random().toString(16).slice(2)}@invitatie`;
    const now = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

    return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Invitatie Botez//RO
CALSCALE:GREGORIAN
BEGIN:VEVENT
UID:${uid}
DTSTAMP:${now}
SUMMARY:${escapeICS(title)}
${dtStart}
${dtEnd}
LOCATION:${escapeICS(location)}
DESCRIPTION:${escapeICS(description)}
END:VEVENT
END:VCALENDAR`;
}

function downloadFile(filename, content, mime = "text/calendar;charset=utf-8") {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

function setCountdown() {
    const el = $("countdown");
    if (!el) return;

    const target = new Date(`${INV.dateISO}T00:00:00`);
    const now = new Date();
    const diff = target.getTime() - now.getTime();

    if (diff <= 0) {
        el.textContent = "Astăzi / a trecut";
        return;
    }

    const dayMs = 24 * 60 * 60 * 1000;
    const days = Math.floor(diff / dayMs);
    const hours = Math.floor((diff % dayMs) / (60 * 60 * 1000));
    el.textContent = `${days} zile • ${hours} h`;
}

// === Render (populează pagina) ===
$("dateLong").textContent = INV.dateLong;

$("churchName").textContent = INV.church.name;
$("churchAddr").textContent = INV.church.address;
$("churchTime").textContent = INV.churchTimeText;

$("restName").textContent = INV.restaurant.name;
$("restAddr").textContent = INV.restaurant.address;
$("partyTime").textContent = INV.partyTimeText;

$("parents").textContent = INV.parents;
$("godparents").textContent = INV.godparents;

// === Butoane locații (Maps + Waze) ===
const mapsChurch = $("btnMapsChurch");
const mapsRest = $("btnMapsRest");

mapsChurch.href = mapsLink(INV.church.mapsQuery);
mapsRest.href = mapsLink(INV.restaurant.mapsQuery);

// dacă vrei Waze fără să modifici HTML, îl adăugăm noi sub butoanele existente:
function injectWazeButton(afterEl, label, query) {
    if (!afterEl) return;
    const w = document.createElement("a");
    w.className = "btn ghost";
    w.textContent = label;
    w.href = wazeLink(query);
    w.target = "_blank";
    w.rel = "noopener";
    afterEl.parentElement?.appendChild(w);
}
injectWazeButton(mapsChurch, "Deschide în Waze", INV.church.mapsQuery);
injectWazeButton(mapsRest, "Deschide în Waze", INV.restaurant.mapsQuery);

// === RSVP WhatsApp ===
$("waYes").href = waLink("Confirmăm cu drag prezența");
$("waMaybe").href = waLink("Este posibil să ajungem");
$("waNo").href = waLink("Din păcate nu putem ajunge");

// === Telefon (linkuri) ===
const telLink = $("telLink");
const callBtn = $("callBtn");
if (telLink) telLink.href = `tel:${INV.phoneIntl}`;
if (callBtn) callBtn.href = `tel:${INV.phoneIntl}`;

// === Copy telefon ===
const copyBtn = $("copyBtn");
if (copyBtn) {
    copyBtn.addEventListener("click", async () => {
        try {
            await navigator.clipboard.writeText(INV.phoneIntl);
            const hint = $("copyHint");
            if (hint) hint.textContent = "Numărul a fost copiat ✅";
            toast("Numărul a fost copiat ✅");
            setTimeout(() => {
                const hint = $("copyHint");
                if (hint) hint.textContent = "Apasă „Copiază nr.” pentru clipboard.";
            }, 2200);
        } catch {
            toast("Nu pot copia automat — copiază manual.");
            const hint = $("copyHint");
            if (hint) hint.textContent = "Nu am putut copia automat. Selectează și copiază manual.";
        }
    });
}

// === Calendar buttons (cu logică bună) ===
const btnCalendarChurch = $("btnCalendarChurch");
const btnCalendarParty = $("btnCalendarParty");

function handleCalendarClick(kind) {
    if (kind === "church") {
        const hhmm = getTimeHHMM(INV.churchTimeText);
        if (!hhmm) {
            toast("Setează ora ceremoniei în app.js (ex: „Ora: 12:00”).");
            return;
        }
        const ics = makeICS({
            title: `Botez ${INV.babyName} • Ceremonie`,
            dateISO: INV.dateISO,
            timeText: INV.churchTimeText,
            location: `${INV.church.name}, ${INV.church.address}`,
            description: `Ceremonia religioasă pentru ${INV.babyName}.`,
            durationMinutes: 60,
        });
        downloadFile(`botez-${INV.babyName}-ceremonie.ics`.replaceAll(" ", "-"), ics);
        toast("Evenimentul a fost descărcat (.ics) ✅");
        return;
    }

    if (kind === "party") {
        const hhmm = getTimeHHMM(INV.partyTimeText);
        // dacă nu găsește ora, îl facem all-day (petrecere = totuși ok), dar anunțăm
        if (!hhmm) {
            toast("Nu am găsit ora petrecerii — o adaug ca eveniment all-day.");
        }
        const ics = makeICS({
            title: `Botez ${INV.babyName} • Petrecere`,
            dateISO: INV.dateISO,
            timeText: INV.partyTimeText,
            location: `${INV.restaurant.name}, ${INV.restaurant.address}`,
            description: `Petrecerea de după botezul ${INV.babyName}.`,
            durationMinutes: 240, // 4h implicit (poți schimba)
        });
        downloadFile(`botez-${INV.babyName}-petrecere.ics`.replaceAll(" ", "-"), ics);
        toast("Evenimentul a fost descărcat (.ics) ✅");
    }
}

if (btnCalendarChurch) btnCalendarChurch.addEventListener("click", () => handleCalendarClick("church"));
if (btnCalendarParty) btnCalendarParty.addEventListener("click", () => handleCalendarClick("party"));

// === Countdown ===
setCountdown();
setInterval(setCountdown, 60_000);
