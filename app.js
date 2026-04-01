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
const auth = firebase.auth();
let currentTab = "all";
let unsubscribe = null;

// MONITOR LOGIN STATE
auth.onAuthStateChanged(user => {
    if (user) {
        document.getElementById("authContainer").style.display = "none";
        document.getElementById("mainDashboard").style.display = "block";
        renderClaims(user.uid);
    } else {
        document.getElementById("authContainer").style.display = "block";
        document.getElementById("mainDashboard").style.display = "none";
        if (unsubscribe) unsubscribe();
    }
});

// AUTH FUNCTIONS
function handleSignUp() {
    const email = document.getElementById("loginEmail").value;
    const pass = document.getElementById("loginPassword").value;
    auth.createUserWithEmailAndPassword(email, pass).catch(err => alert(err.message));
}

function handleLogin() {
    const email = document.getElementById("loginEmail").value;
    const pass = document.getElementById("loginPassword").value;
    auth.signInWithEmailAndPassword(email, pass).catch(err => alert(err.message));
}

function handleLogout() { auth.signOut(); }

// DASHBOARD FUNCTIONS
function addClaim() {
    const user = auth.currentUser;
    const patient = document.getElementById("patientName").value;
    const insurance = document.getElementById("insurance").value;
    const amount = document.getElementById("amount").value;

    if (!patient || !insurance || !amount) return alert("Fill all fields");

    db.collection("claims").add({
        patientName: patient,
        insuranceCompany: insurance,
        amount: Number(amount),
        status: "pending",
        userId: user.uid,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        document.getElementById("patientName").value = "";
        document.getElementById("insurance").value = "";
        document.getElementById("amount").value = "";
    });
}

function updateStatus(id, newStatus) {
    db.collection("claims").doc(id).update({ status: newStatus });
}

function renderClaims(uid) {
    unsubscribe = db.collection("claims")
        .where("userId", "==", uid)
        .orderBy("createdAt", "desc")
        .onSnapshot(snapshot => {
            let html = "";
            let totals = { pending: 0, approved: 0, rejected: 0 };
            snapshot.forEach(doc => {
                const c = doc.data();
                if (totals[c.status] !== undefined) totals[c.status] += c.amount;
                if (currentTab !== "all" && c.status !== currentTab) return;

                html += `
                <tr class="${c.status}Row">
                    <td>${c.patientName}</td>
                    <td>${c.insuranceCompany}</td>
                    <td>₹${c.amount}</td>
                    <td><b>${c.status.toUpperCase()}</b></td>
                    <td>
                        <select onchange="updateStatus('${doc.id}', this.value)">
                            <option value="pending" ${c.status==='pending'?'selected':''}>Pending</option>
                            <option value="approved" ${c.status==='approved'?'selected':''}>Approve</option>
                            <option value="rejected" ${c.status==='rejected'?'selected':''}>Reject</option>
                        </select>
                    </td>
                </tr>`;
            });
            document.getElementById("claimsTable").innerHTML = html;
            document.getElementById("pendingTotal").innerText = "₹" + totals.pending;
            document.getElementById("approvedTotal").innerText = "₹" + totals.approved;
            document.getElementById("rejectedTotal").innerText = "₹" + totals.rejected;
        });
}

function showTab(tab, e) {
    currentTab = tab;
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    e.target.classList.add("active");
    renderClaims(auth.currentUser.uid);
}