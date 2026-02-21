document.addEventListener('DOMContentLoaded', () => {
    // ==================== CONFIGURATION FIREBASE ====================
    const firebaseConfig = {
        apiKey: "AIzaSyCvyRWcn7UInVxpLjHsuhEmzkunP-jJ7H0",
        authDomain: "mentech-chat.firebaseapp.com",
        databaseURL: "https://mentech-chat-default-rtdb.firebaseio.com",
        projectId: "mentech-chat",
        storageBucket: "mentech-chat.firebasestorage.app",
        messagingSenderId: "58331382384",
        appId: "1:58331382384:web:f129da8c07b0f06ce76ab5"
    };
    
    if (!firebase.apps.length) { firebase.initializeApp(firebaseConfig); }
    const db = firebase.database();

    // ==================== DONNÉES LOCALES ====================
    const DATA = {
        electromenager: {
            title: "Électroménager", icon: "fa-plug",
            devices: {
                lave_linge: { title: "Lave-linge", icon: "fa-soap", problems: ["Ne vidange pas", "Le tambour ne tourne pas", "Fuit par le bas", "Fait un bruit fort (essorage)"] },
                lave_vaisselle: { title: "Lave-vaisselle", icon: "fa-sink", problems: ["Ne lave pas bien", "L'eau ne chauffe pas", "Ne vidange pas", "Fuit"] },
                refrigerateur: { title: "Réfrigérateur", icon: "fa-snowflake", problems: ["Ne refroidit plus", "Fait trop de givre/glace", "Bruit anormal", "Porte ne ferme pas"] },
                four: { title: "Four / Cuisinière", icon: "fa-fire-burner", problems: ["Ne chauffe pas", "Chauffe trop/brûle", "Problème de thermostat"] }
            }
        },
        plomberie: {
            title: "Plomberie", icon: "fa-faucet-drip",
            devices: {
                fuite_generale: { title: "Recherche de Fuite", icon: "fa-magnifying-glass-droplet", problems: ["Fuite visible", "Tâche d'humidité mur/plafond", "Compteur tourne tout seul"] },
                robinetterie: { title: "Robinet & Mitigeur", icon: "fa-faucet", problems: ["Robinet qui goutte", "Mitigeur bloqué", "Remplacement complet"] },
                wc: { title: "Toilettes (WC)", icon: "fa-toilet", problems: ["WC bouché", "Chasse d'eau fuit", "Mécanisme cassé"] },
                chauffe_eau: { title: "Chauffe-eau", icon: "fa-hot-tub-person", problems: ["Plus d'eau chaude", "Fuit par le bas", "Fait disjoncter"] }
            }
        },
        electricite: {
            title: "Électricité", icon: "fa-bolt-lightning",
            devices: {
                panne_courant: { title: "Panne de Courant", icon: "fa-power-off", problems: ["Coupure générale", "Disjoncteur saute", "Fusible grillé"] },
                prise_interrupteur: { title: "Prises & Interrupteurs", icon: "fa-toggle-on", problems: ["Prise HS", "Prise arrachée", "Interrupteur bloqué"] },
                eclairage: { title: "Éclairage", icon: "fa-lightbulb", problems: ["Luminaire ne s'allume plus", "Installation nouveau lustre"] },
                tableau_electrique: { title: "Tableau Électrique", icon: "fa-box-archive", problems: ["Remise aux normes", "Bruit suspect"] }
            }
        },
        informatique: {
            title: "Informatique", icon: "fa-laptop-code",
            devices: {
                ordinateur_portable: { title: "PC Portable", icon: "fa-laptop", problems: ["Ne s'allume plus", "Écran cassé", "Très lent / Virus", "Surchauffe"] },
                ordinateur_fixe: { title: "PC Fixe", icon: "fa-desktop", problems: ["Ne démarre pas", "Écran bleu", "Nettoyage poussière"] },
                smartphone: { title: "Smartphone", icon: "fa-mobile-screen-button", problems: ["Écran cassé", "Batterie HS", "Connecteur de charge"] },
                reseau_wifi: { title: "Réseau & WiFi", icon: "fa-wifi", problems: ["Pas d'internet", "WiFi coupe", "Configuration box"] }
            }
        },
        climatisation: {
            title: "Climatisation", icon: "fa-snowflake",
            devices: {
                clim_murale: { title: "Clim Murale", icon: "fa-air-conditioner", problems: ["Ne refroidit pas", "Fuit de l'eau", "Mauvaise odeur", "Bruit anormal"] }
            }
        }
    };

    // Techs de secours (Si la DB est vide)
    const TECHNICIANS = [
        { id: 1, name: 'Hassan El Amrani', specialty: 'plomberie', rating: 4.9, reviews: 124, price: 150 },
        { id: 2, name: 'Yassine Berrada', specialty: 'electromenager', rating: 4.8, reviews: 98, price: 130 },
        { id: 3, name: 'Omar Tazi', specialty: 'electricite', rating: 5.0, reviews: 210, price: 180 },
        { id: 4, name: 'Karim Bennani', specialty: 'informatique', rating: 4.7, reviews: 76, price: 200 },
        { id: 5, name: 'Rachid Fassi', specialty: 'climatisation', rating: 4.9, reviews: 155, price: 220 }
    ];

    const TECH_PRICING = { "Hassan El Amrani": 150, "Yassine Berrada": 130, "Omar Tazi": 180, "Karim Bennani": 200, "Rachid Fassi": 220 };

    // ==================== ETAT GLOBAL ====================
    let currentUser = null;
    let currentRole = null;
    let currentSelection = { category: null, device: null, problem: null, tech: null, address: null, note: null, missionId: null };
    let waitingTimerInterval = null, waitingSeconds = 30;
    const TIMER_FULL_DASH = 283;
    let supportSessionId = null;
    let activeAdminSessionId = null;

    // ==================== LOGIN ====================
    window.switchTab = function(role) {
        document.querySelectorAll('.login-tab').forEach(t => t.classList.remove('active'));
        event.currentTarget.classList.add('active');
        document.getElementById('client-login').style.display = role === 'client' ? 'block' : 'none';
        document.getElementById('tech-login').style.display = role === 'tech' ? 'block' : 'none';
        currentRole = role;
    }

    window.handleLogin = function() {
        const errorDiv = document.getElementById('login-error');
        errorDiv.textContent = 'Connexion en cours...';

        if (currentRole === 'tech') {
            const id = document.getElementById('tech-id').value.toUpperCase();
            const pass = document.getElementById('tech-password').value;
            
            // 100% SÉCURISÉ : On lit depuis Firebase, AUCUN mot de passe dans le code JS.
            db.ref('users/' + id).once('value').then(snap => {
                const userData = snap.val();
                
                if (userData && userData.pass === pass) {
                    currentUser = { id: id, name: userData.name, role: userData.role, specialty: userData.specialty };
                    enterApp(userData.role);
                } else {
                    errorDiv.textContent = "Identifiants ou mot de passe incorrects.";
                }
            }).catch(err => {
                errorDiv.textContent = "Erreur de connexion à la base de données.";
            });

        } else {
            const name = document.getElementById('client-name').value.trim();
            const phone = document.getElementById('client-phone').value.trim();
            if (name && phone) {
                currentUser = { name: name, phone: phone, role: 'client' };
                supportSessionId = 'SUP-' + phone; 
                enterApp('client');
            } else {
                errorDiv.textContent = "Veuillez entrer votre prénom et téléphone.";
            }
        }
    }

    function enterApp(role) {
        document.getElementById('login-page').style.display = 'none';
        document.getElementById('navbar').style.display = 'block';
        document.getElementById('main-container').style.display = 'block';
        document.getElementById('user-name').textContent = currentUser.name;

        document.getElementById('client-views').style.display = 'none';
        document.getElementById('tech-views').style.display = 'none';
        document.getElementById('support-views').style.display = 'none';
        
        // Afficher/Cacher le bouton Whatsapp
        const supportWidget = document.getElementById('support-widget');
        if(supportWidget) supportWidget.style.display = (role === 'client') ? 'block' : 'none';

        if (role === 'client') {
            document.getElementById('client-views').style.display = 'block';
            buildCategories();
            goHome();
            listenClientSupport(); 
        } else if (role === 'tech') {
            document.getElementById('tech-views').style.display = 'block';
            listenForTechMissions(); 
        } else if (role === 'support') {
            document.getElementById('support-views').style.display = 'block';
            listenForSupportTickets(); 
        }
    }

    window.logout = function() { window.location.reload(); }

    // ==================== FLUX CLIENT ====================
    function buildCategories() {
        const grid = document.getElementById('categories-grid');
        grid.innerHTML = Object.entries(DATA).map(([key, cat]) => `
            <div class="card-item" onclick="selectCategory('${key}')">
                <div class="card-icon"><i class="fas ${cat.icon}"></i></div>
                <h3 class="card-title">${cat.title}</h3>
            </div>
        `).join('');
    }

    window.selectCategory = function(catKey) {
        currentSelection.category = catKey;
        document.getElementById('selected-category-title').textContent = DATA[catKey].title;
        const grid = document.getElementById('devices-grid');
        grid.innerHTML = Object.entries(DATA[catKey].devices).map(([devKey, dev]) => `
            <div class="card-item" onclick="selectDevice('${devKey}')">
                <div class="card-icon"><i class="fas ${dev.icon}"></i></div>
                <h3 class="card-title">${dev.title}</h3>
            </div>
        `).join('');
        showView('devices-view');
    }

    window.selectDevice = function(devKey) {
        currentSelection.device = devKey;
        const deviceData = DATA[currentSelection.category].devices[devKey];
        document.getElementById('selected-device-title').textContent = deviceData.title;
        document.getElementById('selected-device-icon').innerHTML = `<i class="fas ${deviceData.icon}"></i>`;
        
        const list = document.getElementById('problems-list');
        list.innerHTML = deviceData.problems.map(problem => `
            <div class="list-item" onclick="selectProblem('${problem.replace(/'/g, "\\'")}')">
                <span>${problem}</span><i class="fas fa-chevron-right"></i>
            </div>
        `).join('');
        showView('problems-view');
    }

    window.selectProblem = function(problem) {
        currentSelection.problem = problem;
        
        // SOLUTION ANTI-BUG : On récupère tout, et on filtre nous même !
        db.ref('users').once('value').then(snap => {
            const users = snap.val();
            let relevantTechs = [];
            
            if(users) {
                Object.keys(users).forEach(k => {
                    if(users[k].role === 'tech' && users[k].specialty === currentSelection.category) {
                        relevantTechs.push(users[k]);
                    }
                });
            }
            
            // Si la base de données est vide, on utilise la liste de secours
            if (relevantTechs.length === 0) {
                relevantTechs = TECHNICIANS.filter(t => t.specialty === currentSelection.category);
            }
            
            renderTechnicians(relevantTechs);
        }).catch(err => {
            // Si internet coupe ou Firebase bug, on utilise la liste de secours
            const fallbackTechs = TECHNICIANS.filter(t => t.specialty === currentSelection.category);
            renderTechnicians(fallbackTechs);
        });
    }

    function renderTechnicians(techs) {
        const grid = document.getElementById('technicians-grid');
        if (techs.length === 0) {
            grid.innerHTML = '<p class="view-subtitle" style="grid-column: 1/-1; text-align: center;">Aucun technicien disponible.</p>';
        } else {
            grid.innerHTML = techs.map(t => {
                const price = TECH_PRICING[t.name] || t.price || 150; 
                return `
                <div class="tech-card">
                    <div class="tech-header">
                        <div class="tech-avatar">${t.name.charAt(0)}</div>
                        <div class="tech-info">
                            <h4>${t.name}</h4>
                            <div class="tech-rating"><i class="fas fa-star"></i> 4.9</div>
                        </div>
                    </div>
                    <div class="tech-body">
                        <div class="tech-detail"><i class="fas fa-coins"></i> Tarif indicatif : <span class="tech-price">${price} DH/h</span></div>
                    </div>
                    <div class="tech-footer">
                        <button class="btn-primary" onclick="openMissionModal('${t.name}', ${price})">Engager maintenant</button>
                    </div>
                </div>`;
            }).join('');
        }
        showView('techs-view');
    }

    // ==================== GESTION MISSION ====================
    window.openMissionModal = function(techName, price) {
        currentSelection.techName = techName;
        currentSelection.techPrice = price;
        document.getElementById('mission-modal').style.display = 'flex';
    }
    window.closeMissionModal = function() { document.getElementById('mission-modal').style.display = 'none'; }

    window.confirmMission = function() {
        const address = document.getElementById('mission-address').value.trim();
        const note = document.getElementById('mission-note').value.trim();
        if (!address) { showToast("L'adresse est obligatoire", 'error'); return; }

        currentSelection.address = address;
        currentSelection.note = note;
        currentSelection.missionId = "MT-" + Date.now();
        closeMissionModal();
        
        const missionData = {
            id: currentSelection.missionId,
            client: currentUser.name,
            clientPhone: currentUser.phone,
            tech: currentSelection.techName,
            service: DATA[currentSelection.category].title,
            device: DATA[currentSelection.category].devices[currentSelection.device].title,
            problem: currentSelection.problem,
            address: address,
            note: note,
            price: currentSelection.techPrice,
            status: "pending",
            timestamp: Date.now()
        };
        
        db.ref('missions/' + currentSelection.missionId).set(missionData);
        document.getElementById('wait-tech-name').textContent = `Contact de ${currentSelection.techName}...`;
        document.getElementById('waiting-screen').style.display = 'flex';
        startWaitingTimer();

        db.ref('missions/' + currentSelection.missionId + '/status').on('value', snap => {
            const status = snap.val();
            if(status === 'accepted') {
                clearInterval(waitingTimerInterval);
                document.getElementById('waiting-screen').style.display = 'none';
                showToast("Mission acceptée ! Le technicien est en route.");
                startLiveChat(); 
            } else if(status === 'refused') {
                clearInterval(waitingTimerInterval);
                document.getElementById('waiting-screen').style.display = 'none';
                showToast("Le technicien est occupé.", "error");
                goHome();
            }
        });
    }

    // ==================== DASHBOARD TECHNICIEN ====================
  function listenForTechMissions() {
        db.ref('missions').on('value', snap => {
            const missions = snap.val() || {};
            let pendingHTML = '', historyHTML = '';
            
            // Nouveaux compteurs
            let pendingCount = 0;
            let approvedCount = 0;
            let completedCount = 0;
            let totalEarned = 0;

            Object.values(missions).reverse().forEach(m => {
                if(m.tech === currentUser.name) {
                    // 1. Mission en attente d'acceptation
                    if(m.status === 'pending') {
                        pendingCount++;
                        pendingHTML += `
                            <div class="mission-item" style="border-left: 4px solid var(--warning);">
                                <div class="mission-meta"><span class="mission-id">${m.id}</span><span style="color:var(--warning)">EN ATTENTE</span></div>
                                <div class="mission-details">
                                    <p><strong>Client:</strong> ${m.client} (${m.clientPhone})</p>
                                    <p><strong>Appareil:</strong> ${m.device} - <span style="color:var(--accent)">${m.problem}</span></p>
                                    <p><strong>Adresse:</strong> ${m.address}</p>
                                    ${m.note ? `<p><strong>Note:</strong> ${m.note}</p>` : ''}
                                    <p><strong>Gain Prévu:</strong> ${m.price} MAD</p>
                                </div>
                                <div class="mission-actions">
                                    <button class="btn-accept" onclick="respondToMission('${m.id}', 'accepted')">ACCEPTER</button>
                                    <button class="btn-decline" onclick="respondToMission('${m.id}', 'refused')">REFUSER</button>
                                </div>
                            </div>`;
                    } 
                    // 2. Historique (Acceptées, Terminées, Refusées)
                    else {
                        let statusColor = '';
                        let statusText = '';
                        
                        if (m.status === 'completed') {
                            completedCount++;
                            totalEarned += parseInt(m.price || 0); // Ajoute au total gagné
                            statusColor = 'var(--success)';
                            statusText = 'Terminée';
                        } else if (m.status === 'accepted') {
                            approvedCount++; // Compte les missions en cours
                            statusColor = 'var(--primary)';
                            statusText = 'En cours';
                        } else if (m.status === 'refused') {
                            statusColor = 'var(--danger)';
                            statusText = 'Refusée';
                        }
                        
                        historyHTML += `
                            <div class="mission-item" style="border-left: 2px solid ${statusColor};">
                                <div class="mission-meta">
                                    <span>${new Date(m.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                    <span style="color: ${statusColor}; font-weight:bold;">${statusText}</span>
                                </div>
                                <div class="mission-details">
                                    <p><strong>Client:</strong> ${m.client} - ${m.device}</p>
                                    ${m.status === 'completed' ? `<p style="color: #fbbf24; font-weight: bold;">+ ${m.price} MAD</p>` : ''}
                                </div>
                                ${m.status === 'accepted' ? `<button class="btn-primary" style="margin-top:10px; width: 100%;" onclick="resumeChat('${m.id}')">Ouvrir le Chat Actif</button>` : ''}
                            </div>`;
                    }
                }
            });

            // Mise à jour de l'interface (DOM)
            document.getElementById('pending-count').textContent = pendingCount;
            document.getElementById('approved-count').textContent = approvedCount;
            document.getElementById('completed-count').textContent = completedCount;
            document.getElementById('total-earned').textContent = totalEarned;

            document.getElementById('pending-missions').innerHTML = pendingHTML || '<p style="color:var(--text-dim); text-align:center; padding: 20px 0;">Aucune mission en attente.</p>';
            document.getElementById('completed-missions').innerHTML = historyHTML || '<p style="color:var(--text-dim); text-align:center; padding: 20px 0;">Aucun historique.</p>';
        });
    }

    window.respondToMission = function(missionId, status) {
        db.ref('missions/' + missionId).update({status: status});
        if(status === 'accepted') { currentSelection.missionId = missionId; startLiveChat(); }
    }
    window.resumeChat = function(missionId) { currentSelection.missionId = missionId; startLiveChat(); }

    // ==================== LIVE CHAT MISSION ====================
    function startLiveChat() {
        showView('view-chat');
        const box = document.getElementById('chat-messages-box');
        box.innerHTML = '';
        db.ref('chats/' + currentSelection.missionId).on('child_added', snap => {
            const data = snap.val();
            const isMe = data.user === currentUser.name;
            const timeStr = new Date(data.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
            const div = document.createElement('div');
            div.className = `msg flex flex-col ${isMe ? 'sent' : 'received'}`;
            div.innerHTML = `${!isMe ? `<span style="font-size:10px; color:var(--primary); font-weight:bold; margin-bottom:2px;">${data.user}</span>` : ''}<span>${data.text}</span><span style="font-size:9px; opacity:0.7; text-align:right; margin-top:4px;">${timeStr}</span>`;
            box.appendChild(div);
            box.scrollTop = box.scrollHeight;
        });
    }

    window.sendChatMessage = function() {
        const input = document.getElementById('chat-input');
        const text = input.value.trim();
        if(!text) return;
        db.ref('chats/' + currentSelection.missionId).push({ user: currentUser.name, text: text, timestamp: Date.now() });
        input.value = '';
    }

    window.endMission = function() {
        if(!currentSelection.missionId) return;
        db.ref('missions/' + currentSelection.missionId).update({status: 'completed'});
        showToast("L'intervention est terminée.");
        if(currentUser.role === 'client') goHome(); else { showView('tech-dashboard'); }
    }

    // ==================== LIVE SUPPORT (CRM MAJDA) ====================
    window.toggleSupport = function() { document.getElementById('support-modal').classList.toggle('open'); }
    
    window.sendSupport = function() {
        const input = document.getElementById('support-input');
        const text = input.value.trim();
        if(!text) return;

        db.ref('support_metadata/' + supportSessionId).set({
            clientName: currentUser.name, phone: currentUser.phone,
            lastMsg: text, timestamp: Date.now(), unreadByAdmin: true
        });

        db.ref('support_chats/' + supportSessionId).push({ sender: 'client', text: text, timestamp: Date.now() });
        input.value = "";
    }

    function listenClientSupport() {
        const chatBox = document.getElementById('support-messages');
        chatBox.innerHTML = '<div style="font-size: 12px; color: #888; text-align: center; margin-bottom: 10px;">Support en ligne</div>';
        
        db.ref('support_chats/' + supportSessionId).on('child_added', snap => {
            const msg = snap.val();
            const isClient = msg.sender === 'client';
            const timeStr = new Date(msg.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
            chatBox.innerHTML += `
                <div class="message ${isClient ? 'user' : 'support'}" style="align-self: ${isClient ? 'flex-end' : 'flex-start'}; max-width: 85%;">
                    <div class="message-bubble" style="background: ${isClient ? '#dcf8c6' : '#ffffff'}; color: black; padding: 10px; border-radius: 10px;">
                        <div>${msg.text}</div>
                        <span style="font-size: 10px; color: #999; display: block; text-align: right; margin-top: 4px;">${timeStr}</span>
                    </div>
                </div>`;
            chatBox.scrollTop = chatBox.scrollHeight;
        });
    }

    function listenForSupportTickets() {
        const listDiv = document.getElementById('support-ticket-list');
        db.ref('support_metadata').orderByChild('timestamp').on('value', snap => {
            const sessions = snap.val();
            if(!sessions) { listDiv.innerHTML = '<p style="color:var(--text-dim);">Aucun ticket.</p>'; return; }
            
            listDiv.innerHTML = '';
            Object.keys(sessions).sort((a,b) => sessions[b].timestamp - sessions[a].timestamp).forEach(sessionId => {
                const s = sessions[sessionId];
                const isUnread = s.unreadByAdmin;
                listDiv.innerHTML += `
                    <div style="background: var(--bg-input); padding: 15px; border-radius: 12px; margin-bottom: 10px; cursor: pointer; border-left: 4px solid ${isUnread ? 'var(--accent)' : 'transparent'};" onclick="openAdminSupportChat('${sessionId}', '${s.clientName}')">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                            <strong style="color: white;">${s.clientName} <span style="font-size:10px; color:var(--text-dim);">(${s.phone})</span></strong>
                            <span style="font-size:10px; color:var(--text-dim);">${new Date(s.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                        </div>
                        <div style="font-size: 0.9rem; color: var(--text-dim); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${s.lastMsg}</div>
                    </div>`;
            });
        });
    }

    window.openAdminSupportChat = function(sessionId, clientName) {
        activeAdminSessionId = sessionId;
        document.getElementById('admin-chat-client-name').textContent = "Client : " + clientName;
        document.getElementById('admin-chat-window').style.display = 'flex';
        
        db.ref('support_metadata/' + sessionId).update({unreadByAdmin: false});
        const chatBox = document.getElementById('admin-chat-messages');
        chatBox.innerHTML = '';

        db.ref('support_chats').off(); 
        db.ref('support_chats/' + sessionId).on('child_added', snap => {
            const msg = snap.val();
            const isAdmin = msg.sender === 'support';
            chatBox.innerHTML += `
                <div style="align-self: ${isAdmin ? 'flex-end' : 'flex-start'}; background: ${isAdmin ? 'var(--primary)' : 'var(--bg-input)'}; color: white; padding: 12px 16px; border-radius: 12px; max-width: 80%;">
                    ${msg.text}
                </div>`;
            chatBox.scrollTop = chatBox.scrollHeight;
        });
    }

    window.sendAdminMessage = function() {
        const input = document.getElementById('admin-chat-input');
        const text = input.value.trim();
        if(!text || !activeAdminSessionId) return;

        db.ref('support_chats/' + activeAdminSessionId).push({ sender: 'support', text: text, timestamp: Date.now() });
        db.ref('support_metadata/' + activeAdminSessionId).update({ lastMsg: text, timestamp: Date.now() });
        input.value = "";
    }

    // ==================== UTILS TIMER ====================
    function startWaitingTimer() {
        clearInterval(waitingTimerInterval);
        waitingSeconds = 30;
        updateTimerUI(waitingSeconds);
        waitingTimerInterval = setInterval(() => {
            waitingSeconds--;
            updateTimerUI(waitingSeconds);
            if (waitingSeconds <= 0) { clearInterval(waitingTimerInterval); handleTimeout(); }
        }, 1000);
    }
    function updateTimerUI(seconds) {
        document.getElementById('waiting-timer').textContent = seconds;
        const dashoffset = TIMER_FULL_DASH * (1 - (seconds / 30));
        document.getElementById('timer-path').style.strokeDashoffset = dashoffset;
    }
    function handleTimeout() {
        document.getElementById('waiting-screen').style.display = 'none';
        if(currentSelection.missionId) db.ref('missions/' + currentSelection.missionId).update({status: 'timeout'});
        Swal.fire({ icon: 'error', title: 'Délai dépassé', text: "Aucune réponse.", background: 'var(--bg-card)', color: 'var(--text-light)', confirmButtonColor: 'var(--primary)' });
    }
    window.cancelWaiting = function() {
        clearInterval(waitingTimerInterval);
        document.getElementById('waiting-screen').style.display = 'none';
        if(currentSelection.missionId) db.ref('missions/' + currentSelection.missionId).update({status: 'cancelled'});
        showToast("Demande annulée", 'error');
    }

    window.goHome = () => showView('home-view');
    window.backToDevices = () => showView('devices-view');
    window.backToProblems = () => showView('problems-view');
    function showView(viewId) {
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        document.getElementById(viewId).classList.add('active');
        window.scrollTo(0, 0);
    }
    window.showToast = function(msg, type = 'success') {
        const toast = document.getElementById('toast');
        toast.textContent = msg;
        toast.style.border = type === 'success' ? '1px solid var(--success)' : '1px solid var(--danger)';
        toast.style.color = type === 'success' ? 'var(--success)' : 'var(--danger)';
        toast.style.display = 'block';
        setTimeout(() => toast.style.display = 'none', 3000);
    }

    currentRole = 'client';
});