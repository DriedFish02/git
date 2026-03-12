// --- STATE MANAGEMENT ---
let courtState = Array.from({ length: 8 }, (_, i) => ({
    id: i + 1,
    name: `Court ${i + 1}`,
    status: i === 0 ? "occupied" : i === 2 ? "maintenance" : "available",
    player: i === 0 ? "John Doe" : null,
    time: i === 0 ? "12m left" : i === 2 ? "Repair" : "Ready"
}));

// --- INITIALIZATION ---
function init() {
    setTimeout(() => {
        const loader = document.getElementById('loader');
        if (loader) {
            loader.style.opacity = '0';
            setTimeout(() => loader.style.display = 'none', 500);
        }
    }, 1000);

    renderCourts();
    switchTab('admin-panel');

    const searchInput = document.getElementById('courtSearch');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => renderCourts(e.target.value));
    }
    lucide.createIcons();
}

// --- SIDEBAR COLLAPSE ---
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const expandBtn = document.getElementById('expand-btn');
    sidebar.classList.toggle('sidebar-hidden');

    if (sidebar.classList.contains('sidebar-hidden')) {
        expandBtn.classList.remove('hidden');
    } else {
        expandBtn.classList.add('hidden');
    }
}

// --- NAVIGATION ---
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    const targetTab = document.getElementById(tabId);
    if (targetTab) targetTab.classList.add('active');

    document.querySelectorAll('.nav-btn').forEach(b => {
        b.classList.remove('bg-green-50', 'text-[#166534]', 'border-r-4', 'border-green-600');
        if (b.dataset.tab === tabId) b.classList.add('bg-green-50', 'text-[#166534]', 'border-r-4', 'border-green-600');
    });
}

// --- COURT RENDERING & COLOR LOGIC ---
function renderCourts(filter = "") {
    const grid = document.getElementById('court-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const filtered = courtState.filter(c => c.name.toLowerCase().includes(filter.toLowerCase()));

    filtered.forEach(court => {
        const card = document.createElement('div');

        let bgStyle = "bg-white border-slate-100";
        let badgeClass = "bg-green-500 text-white";
        let btnColor = "bg-[#166534]"; // Default Green
        let btnText = "Open Court";

        if (court.status === 'occupied') {
            bgStyle = "bg-red-50/40 border-red-100";
            badgeClass = "bg-red-600 text-white";
            btnColor = "bg-red-500"; // Red Button when Occupied
            btnText = "Close Court";
        } else if (court.status === 'maintenance') {
            bgStyle = "bg-orange-50/50 border-orange-100";
            badgeClass = "bg-orange-500 text-white";
            btnColor = "bg-orange-400 cursor-not-allowed"; // Orange Button
            btnText = "Maintenance";
        }

        card.className = `${bgStyle} border rounded-[2.5rem] p-6 shadow-sm transition-all flex flex-col relative overflow-hidden`;

        card.innerHTML = `
            <div class="flex justify-between items-start mb-4">
                <h4 class="font-bold text-slate-800">${court.name}</h4>
                <div class="flex items-center gap-2">
                    <span class="text-[9px] font-bold px-2 py-1 rounded-full uppercase ${badgeClass}">${court.status}</span>
                    <div class="relative">
                        <button onclick="toggleCourtDropdown(event)" class="p-1 hover:bg-black/5 rounded-lg text-slate-400">
                            <i data-lucide="more-vertical" class="w-4 h-4"></i>
                        </button>
                        <div class="action-dropdown bg-white border border-slate-100 rounded-xl shadow-xl w-40 py-2 text-xs font-bold text-slate-600">
                            <button onclick="updateStatus(${court.id}, 'maintenance')" class="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2">Set Maintenance</button>
                            <button onclick="updateStatus(${court.id}, 'available')" class="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2">Set Available</button>
                            <button onclick="confirmAction('Remove court?', () => deleteCourt(${court.id}))" class="w-full text-left px-4 py-2 hover:bg-red-50 text-red-500 border-t">Remove</button>
                        </div>
                    </div>
                </div>
            </div>
            <div class="flex-1 flex flex-col items-center justify-center py-6">
                ${court.status === 'occupied' ? `
                    <div class="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center text-white mb-2 shadow-lg"><i data-lucide="user" class="w-5 h-5"></i></div>
                    <p class="font-bold text-slate-800">${court.player || 'Court Closed'}</p>
                    <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">${court.time}</p>
                ` : `
                    <i data-lucide="${court.status === 'maintenance' ? 'wrench' : 'user-plus'}" class="w-10 h-10 text-slate-200 mb-2"></i>
                    <p class="text-[10px] font-bold text-slate-300 uppercase tracking-widest">${court.status === 'maintenance' ? 'Repairing' : 'Ready'}</p>
                `}
            </div>
            <button onclick="handleCourtAction(${court.id})" ${court.status === 'maintenance' ? 'disabled' : ''} class="w-full mt-2 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-white transition-all active:scale-95 ${btnColor}">
                ${btnText}
            </button>
        `;
        grid.appendChild(card);
    });

    // Expansion Slot
    const expandBtn = document.createElement('button');
    expandBtn.onclick = () => confirmAction('Add expansion court?', addCourt);
    expandBtn.className = "border-2 border-dashed border-slate-200 rounded-[2.5rem] flex flex-col items-center justify-center group hover:bg-green-50 transition-all min-h-[250px]";
    expandBtn.innerHTML = `
        <div class="w-12 h-12 bg-white rounded-full flex items-center justify-center text-slate-300 group-hover:text-green-600 border border-slate-200 mb-3 shadow-sm"><i data-lucide="plus"></i></div>
        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Expansion Slot</p>
    `;
    grid.appendChild(expandBtn);
    lucide.createIcons();
}

// --- COURT ACTIONS ---
function handleCourtAction(id) {
    const court = courtState.find(c => c.id === id);
    if (!court) return;

    if (court.status === 'occupied') {
        confirmAction(`End session for ${court.name}?`, () => {
            court.status = 'available';
            court.player = null;
            renderCourts();
        });
    } else {
        confirmAction(`Open ${court.name}?`, () => {
            court.status = 'occupied';
            court.player = null; // Don't assign a player automatically
            court.time = "";
            renderCourts();
        });
    }
}

function addCourt() {
    const nextNum = courtState.length + 1;
    courtState.push({ id: Date.now(), name: `Court ${nextNum}`, status: "available", player: null, time: "Ready" });
    renderCourts();
}

function deleteCourt(id) {
    courtState = courtState.filter(c => c.id !== id);
    renderCourts();
}

function updateStatus(id, status) {
    const court = courtState.find(c => c.id === id);
    if (court) {
        court.status = status;
        if (status !== 'occupied') court.player = null;
        renderCourts();
    }
}

// --- MODALS & UTILS ---
function confirmAction(message, onConfirm) {
    const modal = document.getElementById('confirm-modal');
    document.getElementById('modal-desc').innerText = message;
    modal.classList.remove('hidden');
    document.getElementById('modal-confirm-btn').onclick = () => { onConfirm(); closeModals(); };
}

function closeModals() {
    document.getElementById('confirm-modal').classList.add('hidden');
}

function handleApplySchedule() {
    confirmAction(`Confirm updating operating hours?`, () => alert("System updated!"));
}

function toggleCourtDropdown(e) {
    e.stopPropagation();
    const dropdown = e.currentTarget.nextElementSibling;
    document.querySelectorAll('.action-dropdown').forEach(d => { if (d !== dropdown) d.classList.remove('active'); });
    dropdown.classList.toggle('active');
}

window.onclick = () => document.querySelectorAll('.action-dropdown').forEach(d => d.classList.remove('active'));
window.onload = init;