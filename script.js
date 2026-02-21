
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

    // ==================== SYSTÈME DE SONS ET NOTIFICATIONS ====================
   // Utilisation des serveurs officiels Google (0 blocage CORS)
    const SOUNDS = {
        pop: new Audio('https://actions.google.com/sounds/v1/water/water_drop.ogg'),
        ring: new Audio('https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg')
    };

function playSound(type) {
        try {
            SOUNDS[type].currentTime = 0;
            let playPromise = SOUNDS[type].play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.log("Lecture du son bloquée par le navigateur (attente d'un clic).");
                });
            }
        } catch (e) {}
    }

    function sendBrowserNotification(title, body) {
        if (!("Notification" in window)) return;
        if (Notification.permission === "granted") {
            new Notification(title, { body: body, icon: "https://cdn-icons-png.flaticon.com/512/8862/8862211.png" });
        }
    }

    function triggerAlert(title, message, soundType = 'pop') {
        playSound(soundType);
        sendBrowserNotification(title, message);
        showToast(message, 'success');
    }

    // ==================== WEBHOOKS DISCORD ====================
    const CONFIRMATION_WEBHOOK = 'https://discord.com/api/webhooks/1473811156626837617/N1_ynWzRTcgErVHaV2OiOq8bWmAnLtU8FDOqAYOia621T6u-XhIrfBJgHE6t4EPzbDhC';
    const RECRUITMENT_WEBHOOK = 'https://discord.com/api/webhooks/1473825828700946555/TU29M7GsUXb24Hn8nphfviURKa3uHdt6KA5JyVWvzkLvj83Moy7UdZWR0-GXE1O-fIYj';

    function notifyDiscord(url, message) {
        fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: message }) }).catch(err => {});
    }

    // ==================== DONNÉES LOCALES ====================
// ==================== DONNÉES LOCALES ====================
    const DATA = {
        electromenager: {
            title: "Électroménager", icon: "fa-plug",
            devices: {
                lave_linge: { 
                    title: "Lave-linge", icon: "fa-soap", 
                    problems: ["Ne vidange pas", "Le tambour ne tourne pas", "Fuit par le bas", "Fait un bruit très fort à l'essorage", "Code erreur affiché", "La porte refuse de s'ouvrir"] 
                },
                seche_linge: { 
                    title: "Sèche-linge", icon: "fa-wind", 
                    problems: ["Ne chauffe plus", "Tambour bloqué", "Fait sauter le disjoncteur", "Le linge reste humide", "Courroie cassée"] 
                },
                lave_vaisselle: { 
                    title: "Lave-vaisselle", icon: "fa-sink", 
                    problems: ["Ne lave pas bien la vaisselle", "L'eau ne chauffe pas", "Ne vidange pas l'eau", "Fuit par la porte", "Tablette ne se dissout pas", "S'arrête en plein cycle"] 
                },
                refrigerateur: { 
                    title: "Réfrigérateur", icon: "fa-snowflake", 
                    problems: ["Ne refroidit plus assez", "Fait trop de givre/glace", "Le moteur tourne en permanence", "Fuit de l'eau à l'intérieur", "Joint de porte usé/déchiré"] 
                },
                congelateur: { 
                    title: "Congélateur", icon: "fa-icicles", 
                    problems: ["Les aliments décongèlent", "Accumulation massive de givre", "Fait un bruit de claquement", "Le voyant d'alarme rouge clignote"] 
                },
                cave_a_vin: { 
                    title: "Cave à vin", icon: "fa-wine-bottle", 
                    problems: ["La température est instable", "Fait beaucoup de bruit", "L'écran d'affichage est HS", "De la condensation se forme"] 
                },
                four_encastrable: { 
                    title: "Four Encastrable", icon: "fa-fire-burner", 
                    problems: ["Ne chauffe plus du tout", "Chauffe trop et brûle tout", "La chaleur tournante ne marche plus", "La vitre de la porte est cassée", "Porte bloquée après pyrolyse"] 
                },
                plaque_cuisson: { 
                    title: "Plaque de Cuisson", icon: "fa-temperature-arrow-up", 
                    problems: ["Une plaque (ou feu) ne s'allume plus", "La plaque induction clignote/bip", "Fait sauter les plombs", "Verre fissuré (Induction/Vitro)"] 
                },
                hotte_aspirante: { 
                    title: "Hotte aspirante", icon: "fa-fan", 
                    problems: ["N'aspire plus rien", "Fait un bruit de frottement strident", "L'éclairage ne fonctionne plus", "Les boutons tactiles ne répondent plus"] 
                },
                cuisiniere: { 
                    title: "Cuisinière (Gaz/Mixte)", icon: "fa-fire", 
                    problems: ["Les brûleurs gaz s'éteignent tout seuls", "L'étincelle (piezo) ne marche plus", "Odeur de gaz suspecte"] 
                },
                micro_ondes: { 
                    title: "Micro-ondes", icon: "fa-microwave", 
                    problems: ["Ne chauffe pas les aliments", "Le plateau ne tourne plus", "Fait des étincelles à l'intérieur", "Ne s'allume plus du tout", "Les touches tactiles sont HS"] 
                },
                machine_a_cafe: { 
                    title: "Machine à café / Expresso", icon: "fa-mug-hot", 
                    problems: ["L'eau ne coule plus (Bouchée)", "Fuit par le bas", "Le café coule froid", "Broyeur à grains bloqué", "Voyant détartrage bloqué"] 
                },
                robot_cuisine: { 
                    title: "Robot de Cuisine", icon: "fa-blender", 
                    problems: ["Le moteur tourne dans le vide", "Odeur de chaud ou de plastique brûlé", "Les lames sont bloquées", "Le bol fuit par le bas"] 
                },
                blender_mixeur: { 
                    title: "Blender / Mixeur", icon: "fa-martini-glass", 
                    problems: ["Ne démarre pas", "Fuite au niveau des lames", "Surchauffe très rapidement", "Bruit mécanique anormal"] 
                },
                friteuse: { 
                    title: "Friteuse (Classique / Air Fryer)", icon: "fa-fire-flame-curved", 
                    problems: ["L'huile ne chauffe plus", "Surchauffe (Air Fryer)", "Le minuteur ne sonne plus", "Bac ou panier bloqué"] 
                },
                bouilloire: { 
                    title: "Bouilloire", icon: "fa-mug-steam", 
                    problems: ["Ne s'arrête pas de bouillir", "Ne s'allume plus", "Fuit par le socle", "Fait sauter le courant"] 
                },
                grille_pain: { 
                    title: "Grille-pain", icon: "fa-bread-slice", 
                    problems: ["Le levier ne reste pas en bas", "La résistance ne chauffe plus", "Le pain est bloqué dedans", "Odeur de court-circuit"] 
                },
                aspirateur_classique: { 
                    title: "Aspirateur Traîneau / Balai", icon: "fa-broom", 
                    problems: ["Perte totale d'aspiration", "Le moteur siffle fortement", "La brosse rotative ne tourne plus", "La batterie ne tient plus (Balai)", "Le câble ne s'enroule plus"] 
                },
                aspirateur_robot: { 
                    title: "Aspirateur Robot", icon: "fa-robot", 
                    problems: ["Tourne en rond au même endroit", "Ne retourne pas à sa base", "Erreur de capteur/laser", "Ne charge plus"] 
                },
                centrale_vapeur: { 
                    title: "Centrale Vapeur / Fer", icon: "fa-shirt", 
                    problems: ["Ne fait plus de vapeur", "Crache de l'eau marron/calcaire", "Fuit par la semelle du fer", "Ne chauffe plus", "Bip sans arrêt"] 
                },
                nettoyeur_vapeur: { 
                    title: "Nettoyeur Vapeur", icon: "fa-spray-can-sparkles", 
                    problems: ["Aucune pression en sortie", "Bouché par le calcaire", "La gâchette est coincée", "Le réservoir fuit"] 
                }
            }
        },
        plomberie: {
            title: "Plomberie", icon: "fa-faucet-drip",
            devices: {
                fuite_generale: { title: "Recherche de Fuite", icon: "fa-magnifying-glass-droplet", problems: ["Fuite visible sur tuyau", "Tâche d'humidité mur/plafond", "Compteur tourne tout seul"] },
                robinetterie: { title: "Robinet & Mitigeur", icon: "fa-faucet", problems: ["Robinet qui goutte", "Mitigeur bloqué/dur", "Plus d'eau chaude au robinet", "Remplacement complet"] },
                wc: { title: "Toilettes (WC)", icon: "fa-toilet", problems: ["WC bouché", "Chasse d'eau fuit en continu", "Mécanisme cassé", "L'eau remonte"] },
                chauffe_eau: { title: "Chauffe-eau", icon: "fa-hot-tub-person", problems: ["Plus d'eau chaude", "Fuit par le bas", "Fait disjoncter", "Eau tiède uniquement"] },
                evier_lavabo: { title: "Évier & Lavabo", icon: "fa-sink", problems: ["Bouché", "Siphon qui fuit", "Mauvaises odeurs", "Joint d'étanchéité usé"] },
                douche_baignoire: { title: "Douche & Baignoire", icon: "fa-shower", problems: ["Évacuation lente/bouchée", "Joints silicone moisis", "Pommeau de douche cassé"] }
            }
        },
        electricite: {
            title: "Électricité", icon: "fa-bolt-lightning",
            devices: {
                panne_courant: { title: "Panne de Courant", icon: "fa-power-off", problems: ["Coupure générale", "Disjoncteur saute constamment", "Fusible grillé", "Une pièce sans courant"] },
                prise_interrupteur: { title: "Prises & Interrupteurs", icon: "fa-toggle-on", problems: ["Prise HS", "Prise arrachée", "Interrupteur bloqué", "Grésillement suspect", "Création nouvelle prise"] },
                eclairage: { title: "Éclairage", icon: "fa-lightbulb", problems: ["Luminaire ne s'allume plus", "Installation nouveau lustre/spots", "Ampoule clignote"] },
                tableau_electrique: { title: "Tableau Électrique", icon: "fa-box-archive", problems: ["Remise aux normes", "Bruit suspect (bourdonnement)", "Odeur de brûlé"] },
                interphone_alarme: { title: "Interphone & Alarme", icon: "fa-bell", problems: ["Interphone ne sonne plus", "Caméra visiophone HS", "Alarme sonne sans raison"] }
            }
        },
        informatique: {
            title: "Informatique", icon: "fa-laptop-code",
            devices: {
                ordinateur_portable: { title: "PC Portable", icon: "fa-laptop", problems: ["Ne s'allume plus", "Écran cassé/noir", "Très lent / Virus", "Batterie ne charge plus", "Clavier défectueux"] },
                ordinateur_fixe: { title: "PC Fixe", icon: "fa-desktop", problems: ["Ne démarre pas", "Écran bleu", "Nettoyage poussière", "Problème carte graphique"] },
                smartphone: { title: "Smartphone / Tablette", icon: "fa-mobile-screen-button", problems: ["Écran fissuré/cassé", "Batterie se vide très vite", "Connecteur de charge HS", "Tombé dans l'eau"] },
                reseau_wifi: { title: "Réseau & WiFi", icon: "fa-wifi", problems: ["Pas d'internet", "WiFi coupe ou très lent", "Configuration Box", "Installation répéteur"] },
                imprimante: { title: "Imprimante", icon: "fa-print", problems: ["Bourrage papier", "Problème de connexion/WiFi", "Mauvaise qualité d'impression"] }
            }
        },
        climatisation_chauffage: {
            title: "Climatisation & Chauffage", icon: "fa-snowflake",
            devices: {
                clim_murale: { title: "Clim Murale (Split)", icon: "fa-air-conditioner", problems: ["Ne refroidit pas", "Fuit de l'eau à l'intérieur", "Mauvaise odeur", "Bruit anormal", "Nettoyage et recharge gaz"] },
                chaudiere: { title: "Chaudière", icon: "fa-fire", problems: ["Ne s'allume plus", "Pas de chauffage", "Baisse de pression", "Code erreur affiché"] },
                radiateur: { title: "Radiateurs", icon: "fa-temperature-half", problems: ["Reste froid", "Fuit de l'eau", "Fait du bruit (glouglou)", "Thermostat HS"] }
            }
        },
        antenne_tv: {
            title: "Antenne & Parabole", icon: "fa-satellite-dish",
            devices: {
                parabole: { title: "Parabole", icon: "fa-satellite", problems: ["Perte totale de signal", "Image qui saute ou pixelise", "Orientation suite au vent", "Installation nouvelle parabole"] },
                decodeur: { title: "Décodeur TV", icon: "fa-tv", problems: ["Ne s'allume pas", "Chaînes disparues", "Problème câble HDMI"] },
                tv_murale: { title: "Fixation TV", icon: "fa-border-none", problems: ["Installation support mural TV", "Câblage apparent à cacher", "TV qui penche"] }
            }
        },
        menuiserie_serrurerie: {
            title: "Menuiserie & Bricolage", icon: "fa-door-open",
            devices: {
                serrurerie: { title: "Serrure & Clés", icon: "fa-key", problems: ["Porte claquée (clé à l'intérieur)", "Clé cassée dans la serrure", "Serrure bloquée", "Changement de cylindre"] },
                portes_fenetres: { title: "Portes & Fenêtres", icon: "fa-door-closed", problems: ["Porte frotte au sol", "Fenêtre ne ferme plus", "Vitre cassée", "Poignée arrachée"] },
                volets_stores: { title: "Volets & Stores", icon: "fa-person-shelter", problems: ["Volet roulant coincé", "Moteur HS", "Sangle cassée", "Store banne bloqué"] },
                bricolage: { title: "Petit Bricolage", icon: "fa-hammer", problems: ["Montage meuble en kit (IKEA)", "Fixation étagère/cadre au mur", "Tiroir bloqué/cassé"] }
            }
        },
        jardinage: {
            title: "Jardin & Extérieur", icon: "fa-leaf",
            devices: {
                pelouse_plantes: { title: "Pelouse & Plantes", icon: "fa-seedling", problems: ["Tonte de pelouse", "Débroussaillage", "Arrosage automatique en panne"] },
                arbres: { title: "Arbres & Haies", icon: "fa-tree", problems: ["Taille de haies", "Élagage d'arbre", "Ramassage de feuilles mortes"] },
                piscine: { title: "Piscine", icon: "fa-water", problems: ["Pompe en panne", "Eau verte/Trouble", "Nettoyage du filtre", "Fuite d'eau"] }
            }
        },
        nettoyage_hygiene: {
            title: "Nettoyage & Nuisibles", icon: "fa-broom",
            devices: {
                nettoyage_domicile: { title: "Nettoyage Domicile", icon: "fa-sparkles", problems: ["Grand ménage de printemps", "Nettoyage après travaux", "Nettoyage des vitres", "Nettoyage voiture (Lavage)"] },
                textiles: { title: "Tapis & Canapés", icon: "fa-couch", problems: ["Nettoyage canapé en tissu", "Lavage tapis/moquette", "Nettoyage matelas"] },
                nuisibles: { title: "Dératisation / Insectes", icon: "fa-bug", problems: ["Présence de rats/souris", "Invasion de cafards/blattes", "Punaises de lit", "Nid de guêpes/frelons"] }
            }
        },
        demenagement: {
            title: "Déménagement", icon: "fa-truck-fast",
            devices: {
                transport: { title: "Transport & Camion", icon: "fa-truck", problems: ["Camion avec chauffeur", "Aide au chargement/déchargement", "Transport d'un objet lourd"] },
                manutention: { title: "Manutention", icon: "fa-boxes-stacked", problems: ["Déplacer un meuble lourd", "Monter un électroménager à l'étage", "Mise en carton"] },
                debarras: { title: "Débarras", icon: "fa-trash-can", problems: ["Évacuation d'encombrants", "Vidage de cave/garage", "Aller à la déchetterie"] }
            }
        },
        auto_moto: {
            title: "Auto & Moto (Urgence)", icon: "fa-car-burst",
            devices: {
                batterie: { title: "Batterie", icon: "fa-car-battery", problems: ["Batterie à plat (besoin de câbles)", "Remplacement de batterie"] },
                pneus: { title: "Pneus", icon: "fa-circle-notch", problems: ["Crevaison (Changement de roue)", "Besoin de gonflage"] },
                diagnostic: { title: "Diagnostic Rapide", icon: "fa-wrench", problems: ["La voiture ne démarre pas", "Voyant moteur allumé", "Panne sèche (Besoin d'essence)"] }
            }
        }
    };

    // ==================== ETAT GLOBAL ====================
    let currentUser = null, currentRole = null;
    let currentSelection = { category: null, device: null, problem: null, tech: null, address: null, note: null, missionId: null, techPrice: 0 };
    let waitingTimerInterval = null, waitingSeconds = 30;
    const TIMER_FULL_DASH = 283;
    let supportSessionId = null, activeAdminSessionId = null;
    let knownMissions = new Set(); 
    let currentChatRef = null;

    function getCoordinates() {
        return new Promise((resolve) => {
            if (!navigator.geolocation) { resolve(null); } 
            else { navigator.geolocation.getCurrentPosition(pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }), err => resolve(null), { timeout: 7000 }); }
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

        if ("Notification" in window && Notification.permission !== "granted" && Notification.permission !== "denied") {
            Notification.requestPermission();
        }

        if (currentRole === 'tech') {
            const rawId = document.getElementById('tech-id').value;
            const id = rawId.toUpperCase().replace(/[\s-]/g, ''); 
            const pass = document.getElementById('tech-password').value;
            
            db.ref('users/' + id).once('value').then(snap => {
                const userData = snap.val();
                if (userData && userData.pass === pass) {
                    currentUser = { id: id, name: userData.name, role: userData.role, specialty: userData.specialty };
                    supportSessionId = 'SUP-TECH-' + id; 
                    if (userData.role === 'tech') {
                        db.ref('support_metadata/' + supportSessionId).update({ clientName: `👷 ${currentUser.name}`, phone: rawId, lastMsg: "✅ En ligne", timestamp: Date.now(), unreadByAdmin: true });
                    }
                    enterApp(userData.role);
                } else { errorDiv.textContent = "Identifiants incorrects."; }
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

    // ==================== FLUX CLIENT ====================
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
        
        const list = document.getElementById('problems-list');
        list.innerHTML = deviceData.problems.map(problem => `<div class="list-item" onclick="selectProblem('${problem.replace(/'/g, "\\'")}')"><span>${problem}</span><i class="fas fa-chevron-right"></i></div>`).join('');
        
        list.innerHTML += `
            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.05);">
                <p style="color: var(--text-dim); margin-bottom: 10px; font-size: 0.9rem;"><i class="fas fa-pen"></i> Autre problème ?</p>
                <div style="display: flex; gap: 10px;">
                    <input type="text" id="custom-problem-input" placeholder="Décrivez votre problème..." style="flex: 1; background: var(--bg-input); border: none; padding: 12px 16px; border-radius: 12px; color: white; outline: none;" onkeypress="if(event.key === 'Enter') submitCustomProblem()">
                    <button onclick="submitCustomProblem()" style="background: var(--primary); border: none; color: white; padding: 0 20px; border-radius: 12px; cursor: pointer;"><i class="fas fa-arrow-right"></i></button>
                </div>
            </div>`;
        showView('problems-view');
    }

    window.submitCustomProblem = function() {
        const customProb = document.getElementById('custom-problem-input').value.trim();
        if(!customProb) { showToast("Veuillez décrire votre problème", "error"); return; }
        selectProblem(customProb);
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

        closeMissionModal(); showToast("Recherche de position GPS...", "success");

        const coords = await getCoordinates();
        currentSelection.address = address; currentSelection.note = note; currentSelection.missionId = "MT-" + Date.now();
        
        const missionData = {
            id: currentSelection.missionId, client: currentUser.name, clientPhone: currentUser.phone,
            tech: currentSelection.techName, service: DATA[currentSelection.category].title,
            device: DATA[currentSelection.category].devices[currentSelection.device].title,
            problem: currentSelection.problem, address: address, note: note,
            price: currentSelection.techPrice, status: "pending", timestamp: Date.now()
        };

        let gpsLink = "";
        if(coords) { 
            missionData.clientLat = coords.lat; missionData.clientLng = coords.lng; 
            gpsLink = `\n📍 [Position Client sur Google Maps](https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng})`;
        }
        
        db.ref('missions/' + currentSelection.missionId).set(missionData);
        notifyDiscord(CONFIRMATION_WEBHOOK, `🚨 **NOUVELLE DEMANDE**\n**Client:** ${currentUser.name}\n**Tech:** ${currentSelection.techName}\n**Adresse:** ${address} ${gpsLink}`);

        document.getElementById('wait-tech-name').textContent = `Contact de ${currentSelection.techName}...`;
        document.getElementById('waiting-screen').style.display = 'flex';
        startWaitingTimer();

        db.ref('missions/' + currentSelection.missionId + '/status').off();
        db.ref('missions/' + currentSelection.missionId + '/status').on('value', snap => {
            const status = snap.val();
            if(status === 'accepted') {
                clearInterval(waitingTimerInterval); document.getElementById('waiting-screen').style.display = 'none';
                triggerAlert("Mission Acceptée !", `${currentSelection.techName} est en route !`, 'ring');
                startLiveChat(); 
            } else if(status === 'refused') {
                clearInterval(waitingTimerInterval); document.getElementById('waiting-screen').style.display = 'none';
                showToast("Le technicien est occupé.", "error"); goHome();
            }
        });
    }

    // ==================== DASHBOARD TECHNICIEN ====================
    function listenForTechMissions() {
        db.ref('missions').off(); 
        
        db.ref('missions').on('value', snap => {
            const missions = snap.val() || {};
            let pendingHTML = '', historyHTML = '';
            let pendingCount = 0, approvedCount = 0, completedCount = 0, totalEarned = 0;

            Object.values(missions).reverse().forEach(m => {
                if(m.tech === currentUser.name || m.client === currentUser.name) { 
                    
                    if(m.tech === currentUser.name && m.status === 'pending') {
                        pendingCount++;
                        if(!knownMissions.has(m.id)) {
                            knownMissions.add(m.id);
                            triggerAlert("🚨 Nouvelle Mission !", `${m.device} - ${m.problem}`, 'ring');
                        }

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
                    } else if (m.status !== 'pending') {
                        knownMissions.add(m.id); 
                        let statusColor = '', statusText = '';
                        if (m.status === 'completed') {
                            if(m.tech === currentUser.name) { completedCount++; totalEarned += parseInt(m.price || 0); }
                            statusColor = 'var(--success)'; statusText = 'Terminée';
                        } else if (m.status === 'accepted') {
                            if(m.tech === currentUser.name) { approvedCount++; }
                            statusColor = 'var(--primary)'; statusText = 'En cours';
                        } else if (m.status === 'conflict') {
                            if(m.tech === currentUser.name) { approvedCount++; }
                            statusColor = 'var(--warning)'; statusText = 'Conflit de Prix';
                        } else if (m.status === 'refused') {
                            statusColor = 'var(--danger)'; statusText = 'Refusée';
                        }
                        
                        // NOUVEAUTÉ : Le bouton s'affiche MEME si c'est terminé (Pour voir l'historique)
                        const showChatButton = ['accepted', 'conflict', 'completed'].includes(m.status);
                        const isCompleted = m.status === 'completed';

                        if(m.tech === currentUser.name) {
                            historyHTML += `
                                <div class="mission-item" style="border-left: 2px solid ${statusColor};">
                                    <div class="mission-meta"><span>${new Date(m.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span><span style="color:${statusColor}; font-weight:bold;">${statusText}</span></div>
                                    <div class="mission-details"><p><strong>Client:</strong> ${m.client} - ${m.device}</p>
                                    ${isCompleted ? `<p style="color:#fbbf24; font-weight:bold;">+ ${m.price} MAD</p>` : ''}
                                    </div>
                                    ${showChatButton ? `<button class="btn-primary" style="margin-top:10px; width:100%; background: ${isCompleted ? '#4b5563' : 'var(--primary)'};" onclick="resumeChat('${m.id}')"><i class="fas ${isCompleted ? 'fa-history' : 'fa-comments'}"></i> ${isCompleted ? 'Voir l\'historique' : 'Ouvrir le Chat'}</button>` : ''}
                                </div>`;
                        }
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

    // ==================== LIVE CHAT & CARTE GPS (AVEC LECTURE SEULE) ====================
    function startLiveChat() {
        showView('view-chat');
        const box = document.getElementById('chat-messages-box');
        box.innerHTML = '';
        
        if (currentChatRef) { currentChatRef.off(); }
        currentChatRef = db.ref('chats/' + currentSelection.missionId);
        
        let gpsDiv = document.getElementById('gps-tracker-bar');
        if(!gpsDiv) {
            gpsDiv = document.createElement('div'); gpsDiv.id = 'gps-tracker-bar';
            gpsDiv.style = "background: rgba(16, 185, 129, 0.1); padding: 15px; text-align: center; border-bottom: 1px solid rgba(16, 185, 129, 0.2); display: none;";
            gpsDiv.innerHTML = `<a href="#" target="_blank" id="map-link-btn" style="color: var(--success); font-weight: bold; text-decoration: none; font-size: 1.1rem;"><i class="fas fa-map-marked-alt"></i> 📍 Ouvrir l'itinéraire GPS</a>`;
            box.parentElement.insertBefore(gpsDiv, box);
        }

        const btnTerminer = document.querySelector('button[onclick="endMission()"]');
        const chatInputArea = document.getElementById('chat-input').parentElement; // La div qui contient l'input

        db.ref('missions/' + currentSelection.missionId).on('value', snap => {
            const m = snap.val();
            if(m) {
                // SI LA MISSION EST TERMINÉE : Mode LECTURE SEULE
                if (m.status === 'completed') {
                    if (btnTerminer) btnTerminer.style.display = 'none';
                    if (chatInputArea) chatInputArea.style.display = 'none'; // Cache la barre pour écrire
                    if (gpsDiv) gpsDiv.style.display = 'none'; // Cache le GPS
                    document.getElementById('chat-title').textContent = "Historique (Terminée)";
                } else {
                    // MISSION EN COURS
                    if (chatInputArea) chatInputArea.style.display = 'flex';
                    document.getElementById('chat-title').textContent = "Intervention en cours";

                    // GESTION DU GPS
                    const mapBtn = document.getElementById('map-link-btn');
                    if(m.clientLat && m.techLat) {
                        mapBtn.href = `https://www.google.com/maps/dir/?api=1&origin=${m.techLat},${m.techLng}&destination=${m.clientLat},${m.clientLng}`;
                        gpsDiv.style.display = 'block';
                    } else if(m.clientLat && currentUser.role === 'tech') {
                        mapBtn.href = `https://www.google.com/maps/search/?api=1&query=${m.clientLat},${m.clientLng}`;
                        gpsDiv.style.display = 'block';
                    } else if (m.techLat && currentUser.role === 'client') {
                        mapBtn.href = `https://www.google.com/maps/search/?api=1&query=${m.techLat},${m.techLng}`;
                        gpsDiv.style.display = 'block';
                    } else {
                        gpsDiv.style.display = 'none';
                    }

                    // GESTION DU BOUTON TERMINER (Grisé si on a déjà mis un prix)
                    if (btnTerminer) {
                        if (currentUser.role === 'client' && m.clientPrice) {
                            btnTerminer.textContent = "Attente Tech...";
                            btnTerminer.disabled = true; btnTerminer.style.opacity = '0.5';
                        } else if (currentUser.role === 'tech' && m.techPrice) {
                            btnTerminer.textContent = "Attente Client...";
                            btnTerminer.disabled = true; btnTerminer.style.opacity = '0.5';
                        } else {
                            btnTerminer.innerHTML = "<i class='fas fa-flag-checkered'></i> Terminer";
                            btnTerminer.disabled = false; btnTerminer.style.opacity = '1'; btnTerminer.style.display = 'block';
                        }
                    }
                }
            }
        });

        let initialChatLoad = true;
        currentChatRef.on('child_added', snap => {
            const data = snap.val(); const isMe = data.user === currentUser.name;
            const timeStr = new Date(data.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
            
            if(!initialChatLoad && !isMe) { triggerAlert(`Message de ${data.user}`, data.text, 'pop'); }

            const div = document.createElement('div');
            div.style.padding = "14px 18px"; div.style.borderRadius = "16px"; div.style.maxWidth = "80%"; div.style.marginBottom = "12px"; div.style.color = "white";
            div.style.backgroundColor = isMe ? "var(--primary)" : "var(--bg-input)"; div.style.alignSelf = isMe ? "flex-end" : "flex-start";
            div.style.borderBottomRightRadius = isMe ? "4px" : "16px"; div.style.borderBottomLeftRadius = !isMe ? "4px" : "16px";
            div.innerHTML = `${!isMe ? `<span style="font-size:14px; font-weight:800; color:var(--text-dim); display:block; margin-bottom:5px;">${data.user}</span>` : ''}<span style="font-size:16px; line-height:1.4; display:block;">${data.text}</span><span style="font-size:11px; opacity:0.6; display:block; text-align:right; margin-top:8px;">${timeStr}</span>`;
            box.appendChild(div); 
            
            setTimeout(() => { box.scrollTop = box.scrollHeight; }, 50);
        });
        
        setTimeout(() => { initialChatLoad = false; box.scrollTop = box.scrollHeight; }, 500);
    }

    window.sendChatMessage = function() {
        const input = document.getElementById('chat-input'); const text = input.value.trim(); if(!text) return;
        db.ref('chats/' + currentSelection.missionId).push({ user: currentUser.name, text: text, timestamp: Date.now() });
        input.value = '';
    }

    // ==================== FIN DE MISSION (ANTI-FRAUDE) ====================
    window.endMission = function() {
        if(!currentSelection.missionId) return;

        db.ref('missions/' + currentSelection.missionId).once('value').then(snap => {
            const m = snap.val();
            if ((currentUser.role === 'client' && m.clientPrice) || (currentUser.role === 'tech' && m.techPrice)) { return; }

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
                        showToast("Prix enregistré. En attente de l'autre partie...");
                        listenForPriceConflict(currentSelection.missionId);
                        if(currentUser.role === 'client') goHome(); else showView('tech-dashboard'); 
                    });
                }
            });
        });
    }

    function listenForPriceConflict(missionId) {
        db.ref('missions/' + missionId).off(); 
        db.ref('missions/' + missionId).on('value', snap => {
            const data = snap.val();
            if(data && data.clientPrice && data.techPrice && !data.paymentChecked) {
                db.ref('missions/' + missionId).update({ paymentChecked: true }); 
                if(data.clientPrice === data.techPrice) {
                    db.ref('missions/' + missionId).update({ status: 'completed', price: data.techPrice });
                    notifyDiscord(CONFIRMATION_WEBHOOK, `✅ **MISSION CLÔTURÉE AVEC SUCCÈS**\n**ID:** ${missionId}\n**Prix validé:** ${data.techPrice} MAD`);
                } else {
                    db.ref('missions/' + missionId).update({ status: 'conflict' });
                    notifyDiscord(CONFIRMATION_WEBHOOK, `🚨 **CONFLIT DE PAIEMENT** 🚨\n**Client:** ${data.clientPrice} MAD\n**Tech:** ${data.techPrice} MAD`);
                }
            }
        });
    }

    // ==================== SUPPORT CRM MAJDA ====================
    window.toggleSupport = function() { document.getElementById('support-modal').classList.toggle('open'); }
    
    window.sendSupport = function() {
        const input = document.getElementById('support-input'); const text = input.value.trim(); if(!text) return;
        const senderName = currentUser.role === 'tech' ? `👷 ${currentUser.name}` : `👤 ${currentUser.name}`;
        db.ref('support_metadata/' + supportSessionId).update({ clientName: senderName, phone: currentUser.id || currentUser.phone, lastMsg: text, timestamp: Date.now(), unreadByAdmin: true });
        db.ref('support_chats/' + supportSessionId).push({ sender: currentUser.role, text: text, timestamp: Date.now() });
        input.value = "";
    }

    function listenClientSupport() {
        const chatBox = document.getElementById('support-messages');
        chatBox.innerHTML = '<div style="font-size: 12px; color: #888; text-align: center; margin-bottom: 10px;">Support en ligne</div>';
        
        db.ref('support_chats/' + supportSessionId).off(); 

        let initialSupportLoad = true;
        db.ref('support_chats/' + supportSessionId).on('child_added', snap => {
            const msg = snap.val(); const isMe = msg.sender === currentUser.role;
            const timeStr = new Date(msg.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
            
            if(!initialSupportLoad && msg.sender === 'support') { triggerAlert("Support MenTech", msg.text, 'pop'); }

            chatBox.innerHTML += `
                <div class="message ${isMe ? 'user' : 'support'}" style="align-self: ${isMe ? 'flex-end' : 'flex-start'}; max-width: 85%;">
                    <div class="message-bubble" style="background: ${isMe ? '#dcf8c6' : '#ffffff'}; color: black; padding: 12px; border-radius: 12px;">
                        <div style="font-size: 15px;">${msg.text}</div>
                        <span style="font-size: 10px; color: #999; display: block; text-align: right; margin-top: 4px;">${timeStr}</span>
                    </div>
                </div>`;
            setTimeout(() => { chatBox.scrollTop = chatBox.scrollHeight; }, 50);
        });
        setTimeout(() => { initialSupportLoad = false; }, 1500);
    }

    function listenForSupportTickets() {
        const listDiv = document.getElementById('support-ticket-list');
        db.ref('support_metadata').off(); 
        let initialAdminLoad = true;

        db.ref('support_metadata').orderByChild('timestamp').on('value', snap => {
            const sessions = snap.val();
            if(!sessions) { listDiv.innerHTML = '<p style="color:var(--text-dim);">Aucun ticket.</p>'; return; }
            listDiv.innerHTML = '';
            
            let hasNewUnread = false;
            Object.keys(sessions).sort((a,b) => sessions[b].timestamp - sessions[a].timestamp).forEach(sessionId => {
                const s = sessions[sessionId]; const isUnread = s.unreadByAdmin;
                if(isUnread) hasNewUnread = true;

                listDiv.innerHTML += `
                    <div style="background: var(--bg-input); padding: 15px; border-radius: 12px; margin-bottom: 10px; cursor: pointer; border-left: 4px solid ${isUnread ? 'var(--accent)' : 'transparent'};" onclick="openAdminSupportChat('${sessionId}', '${s.clientName}')">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                            <strong style="color: white;">${s.clientName} <span style="font-size:10px; color:var(--text-dim);">(${s.phone})</span></strong>
                            <span style="font-size:10px; color:var(--text-dim);">${new Date(s.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                        </div>
                        <div style="font-size: 0.9rem; color: var(--text-dim); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${s.lastMsg}</div>
                    </div>`;
            });
            if(!initialAdminLoad && hasNewUnread) { playSound('pop'); }
            initialAdminLoad = false;
        });
    }

    let currentAdminChatRef = null;
    window.openAdminSupportChat = function(sessionId, clientName) {
        if (currentAdminChatRef) { currentAdminChatRef.off(); }
        activeAdminSessionId = sessionId;

        document.getElementById('admin-chat-client-name').textContent = "Discussion avec : " + clientName;
        document.getElementById('admin-chat-window').style.display = 'flex';
        db.ref('support_metadata/' + sessionId).update({unreadByAdmin: false});
        const chatBox = document.getElementById('admin-chat-messages'); chatBox.innerHTML = '';
        
        currentAdminChatRef = db.ref('support_chats/' + sessionId);
        currentAdminChatRef.on('child_added', snap => {
            const msg = snap.val(); const isAdmin = msg.sender === 'support';
            chatBox.innerHTML += `
                <div style="align-self: ${isAdmin ? 'flex-end' : 'flex-start'}; background: ${isAdmin ? 'var(--primary)' : 'var(--bg-input)'}; color: white; padding: 14px 18px; border-radius: 16px; max-width: 80%;">
                    <div style="font-size:16px;">${msg.text}</div>
                </div>`;
            setTimeout(() => { chatBox.scrollTop = chatBox.scrollHeight; }, 50);
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