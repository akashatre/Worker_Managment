let workers = JSON.parse(localStorage.getItem('workers')) || [];
let attendance = JSON.parse(localStorage.getItem('attendance')) || [];
let editingWorkerId = null;
let selectedWorkerId = null;

function saveData() {
    localStorage.setItem('workers', JSON.stringify(workers));
    localStorage.setItem('attendance', JSON.stringify(attendance));
}

function addWorker(event) {
    event.preventDefault();
    const worker = {
        id: Date.now(),
        name: document.getElementById('name').value,
        mobileNumber: document.getElementById('mobile').value,
        joinDate: document.getElementById('joinDate').value,
        advancePayments: []
    };
    workers.push(worker);
    saveData();
    renderWorkers();
    event.target.reset();
}

function renderWorkers() {
    const tbody = document.querySelector('#workerList tbody');
    tbody.innerHTML = '';
    workers.forEach(worker => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${worker.name}</td>
            <td>${worker.mobileNumber}</td>
            <td>${worker.joinDate}</td>
            <td>
                <button onclick="viewWorkerDetails(${worker.id})" class="btn btn-secondary">View Details</button>
                <button onclick="showEditWorkerModal(${worker.id})" class="btn">Edit</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function viewWorkerDetails(id) {
    const worker = workers.find(w => w.id === id);
    selectedWorkerId = id;
    const attendanceSummary = calculateAttendanceSummary(id);
    const totalPayment = calculateTotalPayment(id);
    const totalAdvance = calculateTotalAdvance(worker);
    const content = `
        <p><strong>Name:</strong> ${worker.name}</p>
        <p><strong>Mobile:</strong> ${worker.mobileNumber}</p>
        <p><strong>Join Date:</strong> ${worker.joinDate}</p>
        <h3>Attendance Summary</h3>
        <p>Present: ${attendanceSummary.present}</p>
        <p>Absent: ${attendanceSummary.absent}</p>
        <p>Half-day: ${attendanceSummary['half-day']}</p>
        <p>Total Payment: ${totalPayment}</p>
        <p>Total Advance: ${totalAdvance}</p>
        <p>Balance: ${totalPayment - totalAdvance}</p>
        <h3>Advance Payments</h3>
        <table>
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Amount</th>
                </tr>
            </thead>
            <tbody>
                ${worker.advancePayments.map(payment => `
                    <tr>
                        <td>${payment.date}</td>
                        <td>${payment.amount}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        <button onclick="showAddAdvanceModal()" class="btn">Add Advance</button>
    `;
    document.getElementById('workerDetailsContent').innerHTML = content;
    document.getElementById('workerDetailsModal').style.display = 'block';
}

function showEditWorkerModal(id) {
    const worker = workers.find(w => w.id === id);
    editingWorkerId = id;
    document.getElementById('editName').value = worker.name;
    document.getElementById('editMobile').value = worker.mobileNumber;
    document.getElementById('editJoinDate').value = worker.joinDate;
    document.getElementById('editWorkerModal').style.display = 'block';
}

function updateWorker(event) {
    event.preventDefault();
    const updatedWorker = {
        id: editingWorkerId,
        name: document.getElementById('editName').value,
        mobileNumber: document.getElementById('editMobile').value,
        joinDate: document.getElementById('editJoinDate').value,
        advancePayments: workers.find(w => w.id === editingWorkerId).advancePayments
    };
    workers = workers.map(w => w.id === editingWorkerId ? updatedWorker : w);
    saveData();
    renderWorkers();
    document.getElementById('editWorkerModal').style.display = 'none';
}

function showAddAdvanceModal() {
    document.getElementById('addAdvanceModal').style.display = 'block';
}

function addAdvancePayment(event) {
    event.preventDefault();
    const amount = Number(document.getElementById('advanceAmount').value);
    const date = document.getElementById('advanceDate').value;
    const worker = workers.find(w => w.id === selectedWorkerId);
    worker.advancePayments.push({ id: Date.now(), amount, date });
    saveData();
    viewWorkerDetails(selectedWorkerId);
    document.getElementById('addAdvanceModal').style.display = 'none';
    event.target.reset();
}

function renderAttendance() {
    const month = document.getElementById('attendanceMonth').value;
    const defaultWage = document.getElementById('defaultWage').value;
    if (!month) return;

    const [year, monthIndex] = month.split('-');
    const daysInMonth = new Date(year, monthIndex, 0).getDate();
    
    const thead = document.querySelector('#attendanceTable thead tr');
    thead.innerHTML = '<th>Name</th>';
    for (let i = 1; i <= daysInMonth; i++) {
        thead.innerHTML += `<th>${i}</th>`;
    }
    thead.innerHTML += '<th>Total Payment</th>';
    thead.innerHTML += '<th>Advance Payment</th>';
    
    const tbody = document.querySelector('#attendanceTable tbody');
    tbody.innerHTML = '';
    workers.forEach(worker => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${worker.name}</td>`;
        for (let i = 1; i <= daysInMonth; i++) {
            const date = `${year}-${monthIndex.padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            const record = attendance.find(a => a.workerId === worker.id && a.date === date);
            tr.innerHTML += `
                <td>
                    <div class="attendance-cell">
                        <select onchange="updateAttendance(${worker.id}, '${date}', this.value)" class="attendance-status">
                            <option value="">-</option>
                            <option value="present" ${record && record.status === 'present' ? 'selected' : ''}>Present</option>
                            <option value="absent" ${record && record.status === 'absent' ? 'selected' : ''}>Absent</option>
                            <option value="half-day" ${record && record.status === 'half-day' ? 'selected' : ''}>Half-day</option>
                        </select>
                        <input type="number" placeholder="Wage" value="${record ? record.wage : defaultWage}" 
                            onchange="updateWage(${worker.id}, '${date}', this.value)" class="attendance-wage">
                    </div>
                </td>
            `;
        }
        const totalPayment = calculateTotalPayment(worker.id);
        const totalAdvance = calculateTotalAdvance(worker);
        tr.innerHTML += `
            <td>${totalPayment}</td>
            <td>
                <button onclick="showAddAdvanceModal(); selectedWorkerId = ${worker.id};" class="btn btn-secondary">Add Advance</button>
                <div>Total: ${totalAdvance}</div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function updateAttendance(workerId, date, status) {
    const index = attendance.findIndex(a => a.workerId === workerId && a.date === date);
    if (index !== -1) {
        attendance[index].status = status;
    } else {
        attendance.push({ workerId, date, status, wage: document.getElementById('defaultWage').value || 0 });
    }
    saveData();
}

function updateWage(workerId, date, wage) {
    const index = attendance.findIndex(a => a.workerId === workerId && a.date === date);
    if (index !== -1) {
        attendance[index].wage = Number(wage);
    } else {
        attendance.push({ workerId, date, status: '', wage: Number(wage) });
    }
    saveData();
}

function calculateTotalPayment(workerId) {
    return attendance
        .filter(a => a.workerId === workerId)
        .reduce((total, record) => {
            if (record.status === 'present') {
                return total + Number(record.wage);
            } else if (record.status === 'half-day') {
                return total + Number(record.wage) / 2;
            }
            return total;
        }, 0);
}

function calculateAttendanceSummary(workerId) {
    return attendance
        .filter(a => a.workerId === workerId)
        .reduce((summary, record) => {
            summary[record.status]++;
            return summary;
        }, { present: 0, absent: 0, 'half-day': 0 });
}

function calculateTotalAdvance(worker) {
    return worker.advancePayments.reduce((total, payment) => total + payment.amount, 0);
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('addWorkerForm').addEventListener('submit', addWorker);
    document.getElementById('editWorkerForm').addEventListener('submit', updateWorker);
    document.getElementById('addAdvanceForm').addEventListener('submit', addAdvancePayment);
    document.getElementById('attendanceMonth').addEventListener('change', renderAttendance);
    document.getElementById('defaultWage').addEventListener('change', renderAttendance);

    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(tab.dataset.tab).classList.add('active');
        });
    });

    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', () => {
            closeBtn.closest('.modal').style.display = 'none';
        });
    });

    window.onclick = function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    }

    renderWorkers();
    renderAttendance();
});
