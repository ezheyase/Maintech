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

    // ==================== WEBHOOKS DISCORD ====================
    const CONFIRMATION_WEBHOOK = 'https://discord.com/api/webhooks/1473811156626837617/N1_ynWzRTcgErVHaV2OiOq8bWmAnLtU8FDOqAYOia621T6u-XhIrfBJgHE6t4EPzbDhC';
    const RECRUITMENT_WEBHOOK = 'https://discord.com/api/webhooks/1473825828700946555/TU29M7GsUXb24Hn8nphfviURKa3uHdt6KA5JyVWvzkLvj83Moy7UdZWR0-GXE1O-fIYj';

    function notifyDiscord(url, message) {
        fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: message }) })
        .catch(err => console.error("Erreur Webhook:", err));
    }

    // ==================== DONNÉES LOCALES (SERVICES) ====================
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

    // ==================== ETAT GLOBAL ====================
    let currentUser = null, currentRole = null;
    let currentSelection = { category: null, device: null, problem: null, tech: null, address: null, note: null, missionId: null, techPrice: 0 };
    let waitingTimerInterval = null, waitingSeconds = 30;
    const TIMER_FULL_DASH = 283;
    let supportSessionId = null, activeAdminSessionId = null;

    function getCoordinates() {
        return new Promise((resolve) => {
            if (!navigator.geolocation) { resolve(null); } 
            else {
                navigator.geolocation.getCurrentPosition(
                    pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                    err => resolve(null), { timeout: 7000 }
                );
            }
        });
    }

    // ==================== LOGIN (100% DB) ====================
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
            // NOUVEAU : On nettoie le nom saisi (Majuscules, suppression des espaces et des tirets)
            const rawId = document.getElementById('tech-id').value;
            const id = rawId.toUpperCase().replace(/[\s-]/g, ''); 
            const pass = document.getElementById('tech-password').value;
            
            db.ref('users/' + id).once('value').then(snap => {
                const userData = snap.val();
                if (userData && userData.pass === pass) {
                    currentUser = { id: id, name: userData.name, role: userData.role, specialty: userData.specialty };
                    supportSessionId = 'SUP-TECH-' + id; 
                    
                    if (userData.role === 'tech') {
                        db.ref('support_metadata/' + supportSessionId).update({
                            clientName: `👷 ${currentUser.name} (Tech)`,
                            phone: rawId,
                            lastMsg: "✅ En ligne",
                            timestamp: Date.now(),
                            unreadByAdmin: true
                        });
                    }

                    enterApp(userData.role);
                } else {
                    errorDiv.textContent = "Nom ou mot de passe incorrect.";
                }
            }).catch(err => { errorDiv.textContent = "Erreur de connexion à la base de données."; });
        } else {
            const name = document.getElementById('client-name').value.trim();
            const phone = document.getElementById('client-phone').value.trim();
            if (name && phone) {
                currentUser = { name: name, phone: phone, role: 'client' };
                supportSessionId = 'SUP-CLIENT-' + phone; 
                enterApp('client');
            } else { errorDiv.textContent = "Veuillez entrer votre prénom et téléphone."; }
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
        
        const supportWidget = document.getElementById('support-widget');
        if(supportWidget) supportWidget.style.display = (role === 'client' || role === 'tech') ? 'block' : 'none';
        
        const recruitBtn = document.getElementById('nav-recruit-btn');

        if (role === 'client') {
            document.getElementById('client-views').style.display = 'block';
            if(recruitBtn) recruitBtn.style.display = 'block';
            buildCategories(); goHome(); listenClientSupport(); 
        } else if (role === 'tech') {
            document.getElementById('tech-views').style.display = 'block';
            if(recruitBtn) recruitBtn.style.display = 'none';
            listenForTechMissions(); listenClientSupport(); 
        } else if (role === 'support') {
            document.getElementById('support-views').style.display = 'block';
            if(recruitBtn) recruitBtn.style.display = 'none';
            listenForSupportTickets(); 
        }
    }

    window.logout = function() { window.location.reload(); }

    // ==================== FLUX CLIENT & TECHNICIENS DB ====================
    function buildCategories() {
        const grid = document.getElementById('categories-grid');
        grid.innerHTML = Object.entries(DATA).map(([key, cat]) => `
            <div class="card-item" onclick="selectCategory('${key}')"><div class="card-icon"><i class="fas ${cat.icon}"></i></div><h3 class="card-title">${cat.title}</h3></div>`).join('');
    }
    window.selectCategory = function(catKey) {
        currentSelection.category = catKey; document.getElementById('selected-category-title').textContent = DATA[catKey].title;
        const grid = document.getElementById('devices-grid');
        grid.innerHTML = Object.entries(DATA[catKey].devices).map(([devKey, dev]) => `
            <div class="card-item" onclick="selectDevice('${devKey}')"><div class="card-icon"><i class="fas ${dev.icon}"></i></div><h3 class="card-title">${dev.title}</h3></div>`).join('');
        showView('devices-view');
    }
    window.selectDevice = function(devKey) {
        currentSelection.device = devKey; const deviceData = DATA[currentSelection.category].devices[devKey];
        document.getElementById('selected-device-title').textContent = deviceData.title;
        document.getElementById('selected-device-icon').innerHTML = `<i class="fas ${deviceData.icon}"></i>`;
        document.getElementById('problems-list').innerHTML = deviceData.problems.map(problem => `
            <div class="list-item" onclick="selectProblem('${problem.replace(/'/g, "\\'")}')"><span>${problem}</span><i class="fas fa-chevron-right"></i></div>`).join('');
        showView('problems-view');
    }
    
    window.selectProblem = function(problem) {
        currentSelection.problem = problem;
        db.ref('users').once('value').then(snap => {
            const users = snap.val(); let relevantTechs = [];
            if(users) { Object.keys(users).forEach(k => { if(users[k].role === 'tech' && users[k].specialty === currentSelection.category) relevantTechs.push(users[k]); }); }
            renderTechnicians(relevantTechs);
        });
    }

    function renderTechnicians(techs) {
        const grid = document.getElementById('technicians-grid');
        if (techs.length === 0) grid.innerHTML = '<p class="view-subtitle" style="grid-column: 1/-1; text-align: center;">Aucun technicien disponible.</p>';
        else {
            grid.innerHTML = techs.map(t => {
                const price = t.price || 150; 
                return `
                <div class="tech-card">
                    <div class="tech-header"><div class="tech-avatar">${t.name.charAt(0)}</div><div class="tech-info"><h4>${t.name}</h4><div class="tech-rating"><i class="fas fa-star"></i> 4.9</div></div></div>
                    <div class="tech-body"><div class="tech-detail"><i class="fas fa-coins"></i> Tarif indicatif : <span class="tech-price">${price} DH/h</span></div></div>
                    <div class="tech-footer"><button class="btn-primary" onclick="openMissionModal('${t.name}', ${price})">Engager maintenant</button></div>
                </div>`;
            }).join('');
        }
        showView('techs-view');
    }

    // ==================== GESTION MISSION & GPS ====================
    window.openMissionModal = function(techName, price) {
        currentSelection.techName = techName; currentSelection.techPrice = price;
        document.getElementById('mission-modal').style.display = 'flex';
    }
    window.closeMissionModal = function() { document.getElementById('mission-modal').style.display = 'none'; }

    window.confirmMission = async function() {
        const address = document.getElementById('mission-address').value.trim();
        const note = document.getElementById('mission-note').value.trim();
        if (!address) { showToast("L'adresse est obligatoire", 'error'); return; }

        closeMissionModal(); showToast("Recherche de votre position GPS...", "success");

        const coords = await getCoordinates();
        currentSelection.address = address; currentSelection.note = note; currentSelection.missionId = "MT-" + Date.now();
        
        const missionData = {
            id: currentSelection.missionId, client: currentUser.name, clientPhone: currentUser.phone,
            tech: currentSelection.techName, service: DATA[currentSelection.category].title,
            device: DATA[currentSelection.category].devices[currentSelection.device].title,
            problem: currentSelection.problem, address: address, note: note,
            price: currentSelection.techPrice, status: "pending", timestamp: Date.now()
        };

        let gpsLinkForDiscord = "";
        if(coords) { 
            missionData.clientLat = coords.lat; missionData.clientLng = coords.lng; 
            gpsLinkForDiscord = `\n📍 [Position Client sur Google Maps](https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng})`;
        }
        
        db.ref('missions/' + currentSelection.missionId).set(missionData);
        notifyDiscord(CONFIRMATION_WEBHOOK, `🚨 **NOUVELLE DEMANDE EN ATTENTE**\n**Client:** ${currentUser.name} (${currentUser.phone})\n**Tech:** ${currentSelection.techName}\n**Intervention:** ${missionData.device} - ${missionData.problem}\n**Adresse:** ${address} ${gpsLinkForDiscord}`);

        document.getElementById('wait-tech-name').textContent = `Contact de ${currentSelection.techName}...`;
        document.getElementById('waiting-screen').style.display = 'flex';
        startWaitingTimer();

        db.ref('missions/' + currentSelection.missionId + '/status').on('value', snap => {
            const status = snap.val();
            if(status === 'accepted') {
                clearInterval(waitingTimerInterval); document.getElementById('waiting-screen').style.display = 'none';
                showToast("Mission acceptée ! Le technicien est en route."); startLiveChat(); 
            } else if(status === 'refused') {
                clearInterval(waitingTimerInterval); document.getElementById('waiting-screen').style.display = 'none';
                showToast("Le technicien est occupé.", "error"); goHome();
            }
        });
    }

    // ==================== DASHBOARD TECHNICIEN ====================
    function listenForTechMissions() {
        db.ref('missions').on('value', snap => {
            const missions = snap.val() || {};
            let pendingHTML = '', historyHTML = '';
            let pendingCount = 0, approvedCount = 0, completedCount = 0, totalEarned = 0;

            Object.values(missions).reverse().forEach(m => {
                if(m.tech === currentUser.name) {
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
                                </div>
                                <div class="mission-actions">
                                    <button class="btn-accept" onclick="respondToMission('${m.id}', 'accepted')">ACCEPTER</button>
                                    <button class="btn-decline" onclick="respondToMission('${m.id}', 'refused')">REFUSER</button>
                                </div>
                            </div>`;
                    } else {
                        let statusColor = '', statusText = '';
                        if (m.status === 'completed') {
                            completedCount++; totalEarned += parseInt(m.price || 0);
                            statusColor = 'var(--success)'; statusText = 'Terminée';
                        } else if (m.status === 'accepted') {
                            approvedCount++; statusColor = 'var(--primary)'; statusText = 'En cours';
                        } else if (m.status === 'conflict') {
                            approvedCount++; statusColor = 'var(--warning)'; statusText = 'Conflit de Prix';
                        } else if (m.status === 'refused') {
                            statusColor = 'var(--danger)'; statusText = 'Refusée';
                        }
                        
                        historyHTML += `
                            <div class="mission-item" style="border-left: 2px solid ${statusColor};">
                                <div class="mission-meta"><span>${new Date(m.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span><span style="color:${statusColor}; font-weight:bold;">${statusText}</span></div>
                                <div class="mission-details"><p><strong>Client:</strong> ${m.client} - ${m.device}</p>
                                ${m.status === 'completed' ? `<p style="color:#fbbf24; font-weight:bold;">+ ${m.price} MAD</p>` : ''}
                                </div>
                                ${m.status === 'accepted' || m.status === 'conflict' ? `<button class="btn-primary" style="margin-top:10px; width:100%;" onclick="resumeChat('${m.id}')">Ouvrir le Chat</button>` : ''}
                            </div>`;
                    }
                }
            });
            document.getElementById('pending-count').textContent = pendingCount; document.getElementById('approved-count').textContent = approvedCount;
            document.getElementById('completed-count').textContent = completedCount; document.getElementById('total-earned').textContent = totalEarned;
            document.getElementById('pending-missions').innerHTML = pendingHTML || '<p style="color:var(--text-dim); text-align:center;">Aucune mission en attente.</p>';
            document.getElementById('completed-missions').innerHTML = historyHTML || '<p style="color:var(--text-dim); text-align:center;">Aucun historique.</p>';
        });
    }

    window.respondToMission = async function(missionId, status) {
        if(status === 'accepted') {
            showToast("Récupération de votre position GPS...");
            const coords = await getCoordinates();
            let updates = { status: status };
            if(coords) { updates.techLat = coords.lat; updates.techLng = coords.lng; }
            db.ref('missions/' + missionId).update(updates);
            currentSelection.missionId = missionId; startLiveChat(); 
        } else {
            db.ref('missions/' + missionId).update({status: status});
        }
    }
    window.resumeChat = function(missionId) { currentSelection.missionId = missionId; startLiveChat(); }

    // ==================== LIVE CHAT & CARTE GPS EXACTE ====================
    function startLiveChat() {
        showView('view-chat');
        const box = document.getElementById('chat-messages-box');
        box.innerHTML = '';
        
        let gpsDiv = document.getElementById('gps-tracker-bar');
        if(!gpsDiv) {
            gpsDiv = document.createElement('div'); gpsDiv.id = 'gps-tracker-bar';
            gpsDiv.style = "background: rgba(16, 185, 129, 0.1); padding: 15px; text-align: center; border-bottom: 1px solid rgba(16, 185, 129, 0.2); display: none;";
            gpsDiv.innerHTML = `<a href="#" target="_blank" id="map-link-btn" style="color: var(--success); font-weight: bold; text-decoration: none; font-size: 1.1rem;"><i class="fas fa-map-marked-alt"></i> 📍 Ouvrir l'itinéraire GPS</a>`;
            box.parentElement.insertBefore(gpsDiv, box);
        }

        db.ref('missions/' + currentSelection.missionId).on('value', snap => {
            const m = snap.val();
            if(m) {
                const mapBtn = document.getElementById('map-link-btn');
                if(m.clientLat && m.techLat) {
                    // Les deux ont le GPS : Google Maps mode "Itinéraire"
                    mapBtn.href = `https://www.google.com/maps/dir/?api=1&origin=${m.techLat},${m.techLng}&destination=${m.clientLat},${m.clientLng}`;
                    gpsDiv.style.display = 'block';
                } else if(m.clientLat && currentUser.role === 'tech') {
                    // Seulement client
                    mapBtn.href = `https://www.google.com/maps/search/?api=1&query=${m.clientLat},${m.clientLng}`;
                    gpsDiv.style.display = 'block';
                } else if (m.techLat && currentUser.role === 'client') {
                    // Seulement tech
                    mapBtn.href = `https://www.google.com/maps/search/?api=1&query=${m.techLat},${m.techLng}`;
                    gpsDiv.style.display = 'block';
                }
            }
        });

        db.ref('chats/' + currentSelection.missionId).on('child_added', snap => {
            const data = snap.val(); const isMe = data.user === currentUser.name;
            const timeStr = new Date(data.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
            const div = document.createElement('div');
            div.style.padding = "14px 18px"; div.style.borderRadius = "16px"; div.style.maxWidth = "80%"; div.style.marginBottom = "12px"; div.style.color = "white";
            div.style.backgroundColor = isMe ? "var(--primary)" : "var(--bg-input)"; div.style.alignSelf = isMe ? "flex-end" : "flex-start";
            div.style.borderBottomRightRadius = isMe ? "4px" : "16px"; div.style.borderBottomLeftRadius = !isMe ? "4px" : "16px";
            div.innerHTML = `${!isMe ? `<span style="font-size:14px; font-weight:800; color:var(--text-dim); display:block; margin-bottom:5px;">${data.user}</span>` : ''}<span style="font-size:16px; line-height:1.4; display:block;">${data.text}</span><span style="font-size:11px; opacity:0.6; display:block; text-align:right; margin-top:8px;">${timeStr}</span>`;
            box.appendChild(div); box.scrollTop = box.scrollHeight;
        });
    }

    window.sendChatMessage = function() {
        const input = document.getElementById('chat-input'); const text = input.value.trim(); if(!text) return;
        db.ref('chats/' + currentSelection.missionId).push({ user: currentUser.name, text: text, timestamp: Date.now() });
        input.value = '';
    }

    // ==================== DOUBLE VALIDATION DU PRIX (ANTI-FRAUDE) ====================
    window.endMission = function() {
        if(!currentSelection.missionId) return;
        Swal.fire({
            title: 'Intervention Terminée',
            text: currentUser.role === 'client' ? 'Combien avez-vous payé le technicien (en MAD) ?' : 'Combien avez-vous reçu du client (en MAD) ?',
            input: 'number', inputAttributes: { min: 0 },
            showCancelButton: true, confirmButtonText: 'Valider', cancelButtonText: 'Annuler',
            background: 'var(--bg-card)', color: 'var(--text-light)', confirmButtonColor: 'var(--success)'
        }).then((result) => {
            if (result.isConfirmed && result.value) {
                const finalPrice = parseInt(result.value);
                const updateField = currentUser.role === 'client' ? { clientPrice: finalPrice } : { techPrice: finalPrice };
                
                db.ref('missions/' + currentSelection.missionId).update(updateField).then(() => {
                    showToast("Prix enregistré. En attente de la confirmation de l'autre partie...");
                    listenForPriceConflict(currentSelection.missionId);
                    if(currentUser.role === 'client') goHome(); else showView('tech-dashboard'); 
                });
            }
        });
    }

    function listenForPriceConflict(missionId) {
        db.ref('missions/' + missionId).on('value', snap => {
            const data = snap.val();
            if(data && data.clientPrice && data.techPrice && !data.paymentChecked) {
                db.ref('missions/' + missionId).update({ paymentChecked: true }); 
                
                if(data.clientPrice === data.techPrice) {
                    db.ref('missions/' + missionId).update({ status: 'completed', price: data.techPrice });
                    notifyDiscord(CONFIRMATION_WEBHOOK, `✅ **MISSION CLÔTURÉE AVEC SUCCÈS**\n**ID:** ${missionId}\n**Client:** ${data.client}\n**Technicien:** ${data.tech}\n**Prix validé:** ${data.techPrice} MAD`);
                } else {
                    db.ref('missions/' + missionId).update({ status: 'conflict' });
                    notifyDiscord(CONFIRMATION_WEBHOOK, `🚨 **CONFLIT DE PAIEMENT** 🚨\n**ID:** ${missionId}\n**Client (${data.client}):** a déclaré **${data.clientPrice} MAD**\n**Tech (${data.tech}):** a déclaré **${data.techPrice} MAD**\n@everyone Intervention du support requise !`);
                }
            }
        });
    }

    // ==================== SUPPORT CRM MAJDA ====================
    window.toggleSupport = function() { document.getElementById('support-modal').classList.toggle('open'); }
    
    window.sendSupport = function() {
        const input = document.getElementById('support-input'); const text = input.value.trim(); if(!text) return;
        const senderName = currentUser.role === 'tech' ? `👷 ${currentUser.name}` : `👤 ${currentUser.name}`;
        const phoneOrId = currentUser.phone || currentUser.id;

        db.ref('support_metadata/' + supportSessionId).update({ clientName: senderName, phone: phoneOrId, lastMsg: text, timestamp: Date.now(), unreadByAdmin: true });
        db.ref('support_chats/' + supportSessionId).push({ sender: currentUser.role, text: text, timestamp: Date.now() });
        input.value = "";
    }

    function listenClientSupport() {
        const chatBox = document.getElementById('support-messages');
        chatBox.innerHTML = '<div style="font-size: 12px; color: #888; text-align: center; margin-bottom: 10px;">Support en ligne</div>';
        
        let initialLoad = true;
        
        db.ref('support_chats/' + supportSessionId).on('child_added', snap => {
            const msg = snap.val(); const isMe = msg.sender === currentUser.role;
            const timeStr = new Date(msg.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
            chatBox.innerHTML += `
                <div class="message ${isMe ? 'user' : 'support'}" style="align-self: ${isMe ? 'flex-end' : 'flex-start'}; max-width: 85%;">
                    <div class="message-bubble" style="background: ${isMe ? '#dcf8c6' : '#ffffff'}; color: black; padding: 12px; border-radius: 12px;">
                        <div style="font-size: 15px;">${msg.text}</div>
                        <span style="font-size: 10px; color: #999; display: block; text-align: right; margin-top: 4px;">${timeStr}</span>
                    </div>
                </div>`;
            chatBox.scrollTop = chatBox.scrollHeight;

            // Notification pour le technicien (ou client) si Majda répond !
            if(!initialLoad && msg.sender === 'support') {
                showToast("Nouveau message de Majda (Support) !", "success");
            }
        });
        
        setTimeout(() => { initialLoad = false; }, 2000);
    }

    function listenForSupportTickets() {
        const listDiv = document.getElementById('support-ticket-list');
        db.ref('support_metadata').orderByChild('timestamp').on('value', snap => {
            const sessions = snap.val();
            if(!sessions) { listDiv.innerHTML = '<p style="color:var(--text-dim);">Aucun ticket.</p>'; return; }
            listDiv.innerHTML = '';
            Object.keys(sessions).sort((a,b) => sessions[b].timestamp - sessions[a].timestamp).forEach(sessionId => {
                const s = sessions[sessionId]; const isUnread = s.unreadByAdmin;
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
        document.getElementById('admin-chat-client-name').textContent = "Discussion avec : " + clientName;
        document.getElementById('admin-chat-window').style.display = 'flex';
        db.ref('support_metadata/' + sessionId).update({unreadByAdmin: false});
        const chatBox = document.getElementById('admin-chat-messages'); chatBox.innerHTML = '';
        db.ref('support_chats').off(); 
        db.ref('support_chats/' + sessionId).on('child_added', snap => {
            const msg = snap.val(); const isAdmin = msg.sender === 'support';
            chatBox.innerHTML += `
                <div style="align-self: ${isAdmin ? 'flex-end' : 'flex-start'}; background: ${isAdmin ? 'var(--primary)' : 'var(--bg-input)'}; color: white; padding: 14px 18px; border-radius: 16px; max-width: 80%;">
                    <div style="font-size:16px;">${msg.text}</div>
                </div>`;
            chatBox.scrollTop = chatBox.scrollHeight;
        });
    }

    window.sendAdminMessage = function() {
        const input = document.getElementById('admin-chat-input'); const text = input.value.trim();
        if(!text || !activeAdminSessionId) return;
        db.ref('support_chats/' + activeAdminSessionId).push({ sender: 'support', text: text, timestamp: Date.now() });
        db.ref('support_metadata/' + activeAdminSessionId).update({ lastMsg: text, timestamp: Date.now() });
        input.value = "";
    }

    // ==================== UTILS ====================
    window.showRecruitment = () => showView('recruitment-view');
    window.submitRecruitment = () => {
        const name = document.getElementById('recruit-name').value.trim(); const phone = document.getElementById('recruit-phone').value.trim();
        const city = document.getElementById('recruit-city').value.trim(); const spec = document.getElementById('recruit-specialty').value;
        if(!name || !phone) { showToast("Nom et téléphone obligatoires", "error"); return; }
        notifyDiscord(RECRUITMENT_WEBHOOK, `📄 **NOUVELLE CANDIDATURE MENTECH**\n**Nom:** ${name}\n**Tél:** ${phone}\n**Ville:** ${city}\n**Spécialité:** ${spec}`);
        showToast("Candidature envoyée avec succès !"); setTimeout(() => { goHome(); }, 1500);
    }
    function startWaitingTimer() {
        clearInterval(waitingTimerInterval); waitingSeconds = 30; updateTimerUI(waitingSeconds);
        waitingTimerInterval = setInterval(() => { waitingSeconds--; updateTimerUI(waitingSeconds); if (waitingSeconds <= 0) { clearInterval(waitingTimerInterval); handleTimeout(); } }, 1000);
    }
    function updateTimerUI(seconds) { document.getElementById('waiting-timer').textContent = seconds; document.getElementById('timer-path').style.strokeDashoffset = TIMER_FULL_DASH * (1 - (seconds / 30)); }
    function handleTimeout() {
        document.getElementById('waiting-screen').style.display = 'none';
        if(currentSelection.missionId) db.ref('missions/' + currentSelection.missionId).update({status: 'timeout'});
        Swal.fire({ icon: 'error', title: 'Délai dépassé', text: "Aucune réponse.", background: 'var(--bg-card)', color: 'var(--text-light)', confirmButtonColor: 'var(--primary)' });
    }
    window.cancelWaiting = function() {
        clearInterval(waitingTimerInterval); document.getElementById('waiting-screen').style.display = 'none';
        if(currentSelection.missionId) db.ref('missions/' + currentSelection.missionId).update({status: 'cancelled'});
        showToast("Demande annulée", 'error');
    }
    window.goHome = () => showView('home-view');
    window.backToDevices = () => showView('devices-view');
    window.backToProblems = () => showView('problems-view');
    function showView(viewId) { document.querySelectorAll('.view').forEach(v => v.classList.remove('active')); document.getElementById(viewId).classList.add('active'); window.scrollTo(0, 0); }
    window.showToast = function(msg, type = 'success') {
        const toast = document.getElementById('toast'); toast.textContent = msg;
        toast.style.border = type === 'success' ? '1px solid var(--success)' : '1px solid var(--danger)';
        toast.style.color = type === 'success' ? 'var(--success)' : 'var(--danger)';
        toast.style.display = 'block'; setTimeout(() => toast.style.display = 'none', 3000);
    }

    currentRole = 'client';
});