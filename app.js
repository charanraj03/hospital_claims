const firebaseConfig = {
    apiKey: "AIzaSyDKfjRsf2hr8i6aYGeqfieHeEsuZDZpIf4",
    authDomain: "hospital-claims.firebaseapp.com",
    projectId: "hospital-claims",
    storageBucket: "hospital-claims.firebasestorage.app",
    messagingSenderId: "124682602331",
    appId: "1:124682602331:web:7492057d2517549e04fc7e"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

let currentTab = "all";

/* TAB SWITCH */
function showTab(tab, event) {
    currentTab = tab;
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    event.target.classList.add("active");
    renderClaims();
}

/* ADD CLAIM */
function addClaim() {
    const patient = document.getElementById("patientName").value.trim();
    const insurance = document.getElementById("insurance").value.trim();
    const amount = parseFloat(document.getElementById("amount").value);

    if (!patient || !insurance || !amount) {
        alert("Fill all fields");
        return;
    }

    db.collection("claims").add({
        patientName: patient,
        insuranceCompany: insurance,
        amount: amount,
        status: "pending",
        createdAt: new Date()
    })
    .then(() => {
        document.getElementById("patientName").value = "";
        document.getElementById("insurance").value = "";
        document.getElementById("amount").value = "";
    })
    .catch((error) => {
        console.error("Error adding claim:", error);
    });
}

/* UPDATE STATUS IN FIRESTORE */
function updateStatus(docId, newStatus) {
    db.collection("claims").doc(docId).update({
        status: newStatus
    })
    .then(() => {
        console.log("Status updated to " + newStatus);
    })
    .catch((error) => {
        console.error("Error updating status: ", error);
    });
}

/* RENDER CLAIMS */
function renderClaims() {
    // We use onSnapshot so the UI updates automatically when data changes
    db.collection("claims")
    .orderBy("createdAt", "desc")
    .onSnapshot(snapshot => {
        let html = "";
        let pending = 0, approved = 0, rejected = 0;

        snapshot.forEach(doc => {
            const c = doc.data();
            const id = doc.id;

            // Update Totals
            if (c.status === "pending") pending += Number(c.amount || 0);
            if (c.status === "approved") approved += Number(c.amount || 0);
            if (c.status === "rejected") rejected += Number(c.amount || 0);

            // Filter based on Tab
            if (currentTab !== "all" && c.status !== currentTab) return;

            let rowClass = "";
            if (c.status === "pending") rowClass = "pendingRow";
            if (c.status === "approved") rowClass = "approvedRow";
            if (c.status === "rejected") rowClass = "rejectedRow";

            html += `
            <tr class="${rowClass}">
                <td>${c.patientName}</td>
                <td>${c.insuranceCompany}</td>
                <td>₹${c.amount}</td>
                <td><strong>${c.status.toUpperCase()}</strong></td>
                <td>
                    <select class="status-select" onchange="updateStatus('${id}', this.value)">
                        <option value="pending" ${c.status === 'pending' ? 'selected' : ''}>Pending</option>
                        <option value="approved" ${c.status === 'approved' ? 'selected' : ''}>Approve</option>
                        <option value="rejected" ${c.status === 'rejected' ? 'selected' : ''}>Reject</option>
                    </select>
                </td>
            </tr>
            `;
        });

        document.getElementById("claimsTable").innerHTML = html;
        document.getElementById("pendingTotal").innerText = "₹" + pending;
        document.getElementById("approvedTotal").innerText = "₹" + approved;
        document.getElementById("rejectedTotal").innerText = "₹" + rejected;
    });
}

// Initial Call
renderClaims();