/**
 * Chatbot d'assistance CAM travel — widget flottant, injecté sur toutes les pages.
 * C'est un robot à réponses préprogrammées (pas une IA connectée), qui répond aux
 * questions fréquentes et redirige vers WhatsApp pour tout le reste.
 * Numéro du gérant utilisé pour la redirection WhatsApp : 696745324
 */

const WHATSAPP_NUMBER = '237696745324'; // format international sans le +

// Base de connaissances simple : mots-clés -> réponse
const CHATBOT_KB = [
  {
    keywords: ['horaire', 'heure', 'depart', 'départ'],
    reply: "Les bus partent généralement à 08h00, 10h00, 11h00, 13h00. Les colis partent à 07h00, 12h00 et 18h00 tous les jours. Voulez-vous voir les résultats pour un trajet précis ?",
    quick: [{ label: 'Rechercher un trajet', url: 'recherche.html' }]
  },
  {
    keywords: ['tarif', 'prix', 'coute', 'coûte', 'combien'],
    reply: "Les tarifs des trajets varient entre 10 000 et 15 000 FCFA selon la destination. Pour les colis, comptez entre 2 000 et 7 000 FCFA selon la ville et le poids.",
    quick: [{ label: 'Voir les tarifs colis', url: 'colis.html' }, { label: 'Rechercher un trajet', url: 'recherche.html' }]
  },
  {
    keywords: ['reservation', 'réservation', 'reserver', 'réserver', 'billet', 'ticket'],
    reply: "Pour réserver, cliquez sur \"Réserver maintenant\" depuis l'accueil, choisissez votre trajet, remplissez les infos passager, puis payez. Vous recevrez votre ticket avec un QR code.",
    quick: [{ label: 'Réserver maintenant', url: 'recherche.html' }]
  },
  {
    keywords: ['colis', 'envoi', 'expedition', 'expédition', 'paquet'],
    reply: "Vous pouvez expédier un colis entre les grandes villes du Cameroun. Consultez les tarifs par région et les horaires de dépôt sur la page Colis.",
    quick: [{ label: 'Expédier un colis', url: 'colis.html' }]
  },
  {
    keywords: ['paiement', 'payer', 'mobile money', 'momo', 'orange money', 'carte'],
    reply: "Vous pouvez payer par Mobile Money (MTN, Orange, Moov), par carte bancaire, ou directement à bord auprès du conducteur.",
  },
  {
    keywords: ['annul', 'rembours'],
    reply: "Pour une annulation ou un remboursement, contactez directement notre équipe — je vous mets en relation avec un conseiller.",
    forceHuman: true
  },
  {
    keywords: ['compte', 'inscription', 'inscrire', 'mot de passe'],
    reply: "Pour créer un compte, cliquez sur \"Se connecter\" puis \"S'inscrire\". Si vous avez oublié votre mot de passe, contactez notre équipe.",
    quick: [{ label: "S'inscrire", url: 'inscription.html' }, { label: 'Se connecter', url: 'connexion.html' }]
  },
  {
    keywords: ['bagage', 'valise', 'poids'],
    reply: "Chaque passager peut emporter jusqu'à 20 kg de bagages gratuitement. Au-delà, un supplément peut s'appliquer selon le trajet.",
  },
  {
    keywords: ['bonjour', 'bonsoir', 'salut', 'hello'],
    reply: "Bonjour 👋 Je suis l'assistant CAM travel. Je peux vous renseigner sur les horaires, tarifs, réservations et colis. Que puis-je faire pour vous ?",
  },
  {
    keywords: ['merci'],
    reply: "Avec plaisir ! Bon voyage avec CAM travel 🚌",
  },
];

// Petit quiz pour divertir le client pendant qu'il patiente
const QUIZ_QUESTIONS = [
  {
    q: "🚌 À quelle heure part le tout premier bus de la journée ?",
    options: ['06h00', '07h00', '08h00', '09h00'],
    correct: 2,
  },
  {
    q: "🎒 Combien de kg de bagages sont gratuits par passager ?",
    options: ['10 kg', '15 kg', '20 kg', '30 kg'],
    correct: 2,
  },
  {
    q: "💳 Lequel de ces moyens de paiement N'EST PAS accepté ?",
    options: ['Mobile Money', 'Carte bancaire', 'Chèque', 'Paiement à bord'],
    correct: 2,
  },
  {
    q: "📦 À quelle heure part le dernier envoi de colis de la journée ?",
    options: ['12h00', '15h00', '18h00', '20h00'],
    correct: 2,
  },
  {
    q: "🎫 Que recevez-vous après avoir réservé un trajet ?",
    options: ['Un ticket avec QR code', 'Un fax', 'Rien du tout', 'Une carte postale'],
    correct: 0,
  },
];

function chatbotFindReply(message) {
  const text = message.toLowerCase();
  for (const entry of CHATBOT_KB) {
    if (entry.keywords.some(k => text.includes(k))) {
      return entry;
    }
  }
  return null;
}

function chatbotWhatsappLink(prefill) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(prefill)}`;
}

function chatbotInit() {
  const bubble = document.createElement('button');
  bubble.className = 'chatbot-bubble';
  bubble.setAttribute('aria-label', 'Assistance CAM travel');
  bubble.innerHTML = `
    <span class="dot"></span>
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
    </svg>
  `;

  const panel = document.createElement('div');
  panel.className = 'chatbot-panel';
  panel.innerHTML = `
    <div class="chatbot-header">
      <div>
        <div class="title">Assistant CAM travel</div>
        <div class="subtitle">Généralement en ligne</div>
      </div>
      <button class="chatbot-close" aria-label="Fermer">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
      </button>
    </div>
    <div class="chatbot-messages" id="chatbotMessages"></div>
    <div class="chatbot-input-row">
      <input type="text" id="chatbotInput" placeholder="Écrivez votre question...">
      <button class="chatbot-send" id="chatbotSend" aria-label="Envoyer">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M2 21l21-9L2 3v7l15 2-15 2v7z"/></svg>
      </button>
    </div>
  `;

  document.body.appendChild(bubble);
  document.body.appendChild(panel);

  const messagesEl = panel.querySelector('#chatbotMessages');
  const inputEl = panel.querySelector('#chatbotInput');
  const sendBtn = panel.querySelector('#chatbotSend');
  const closeBtn = panel.querySelector('.chatbot-close');

  function addMessage(text, from) {
    const div = document.createElement('div');
    div.className = `chat-msg ${from}`;
    div.innerHTML = text;
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function addQuickReplies(quick) {
    const wrap = document.createElement('div');
    wrap.className = 'chat-quick-replies';
    quick.forEach(q => {
      const btn = document.createElement('button');
      btn.className = 'chat-quick-btn';
      btn.textContent = q.label;
      btn.addEventListener('click', () => {
        if (typeof q.quizAnswer === 'number') {
          addMessage(q.label, 'user');
          answerQuiz(q.quizAnswer);
        } else if (q.startQuiz) {
          addMessage(q.label, 'user');
          startQuiz();
        } else if (q.ask) {
          handleUserMessage(q.ask);
        } else {
          window.location.href = q.url;
        }
      });
      wrap.appendChild(btn);
    });
    messagesEl.appendChild(wrap);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function addWhatsappHandoff(originalMessage) {
    const wrap = document.createElement('div');
    wrap.className = 'chat-quick-replies';
    const btn = document.createElement('a');
    btn.className = 'chat-quick-btn';
    btn.style.textDecoration = 'none';
    btn.textContent = '💬 Parler à un conseiller (WhatsApp)';
    btn.href = chatbotWhatsappLink(originalMessage);
    btn.target = '_blank';
    wrap.appendChild(btn);
    messagesEl.appendChild(wrap);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  let quizState = null; // { index, score }

  function startQuiz() {
    quizState = { index: 0, score: 0 };
    addMessage("🎮 C'est parti pour le petit quiz CAM travel ! 5 questions, on voit si vous connaissez bien nos services.", 'bot');
    setTimeout(askQuizQuestion, 400);
  }

  function askQuizQuestion() {
    if (!quizState) return;
    const question = QUIZ_QUESTIONS[quizState.index];
    addMessage(`Question ${quizState.index + 1}/${QUIZ_QUESTIONS.length} — ${question.q}`, 'bot');
    addQuickReplies(
      question.options.map((label, i) => ({ label, quizAnswer: i }))
    );
  }

  function answerQuiz(choiceIndex) {
    if (!quizState) return;
    const question = QUIZ_QUESTIONS[quizState.index];
    const isCorrect = choiceIndex === question.correct;
    if (isCorrect) {
      quizState.score += 1;
      addMessage("✅ Bonne réponse !", 'bot');
    } else {
      addMessage(`❌ Pas tout à fait — la bonne réponse était : ${question.options[question.correct]}.`, 'bot');
    }

    quizState.index += 1;

    if (quizState.index < QUIZ_QUESTIONS.length) {
      setTimeout(askQuizQuestion, 500);
    } else {
      const finalScore = quizState.score;
      quizState = null;
      setTimeout(() => {
        addMessage(`🏁 Quiz terminé ! Vous avez obtenu ${finalScore}/${QUIZ_QUESTIONS.length}. Merci d'avoir joué 🚌`, 'bot');
        addQuickReplies([
          { label: '🔁 Rejouer', startQuiz: true },
          { label: 'Réserver un trajet', url: 'recherche.html' },
        ]);
      }, 500);
    }
  }

  function handleUserMessage(text) {
    if (!text.trim()) return;
    addMessage(text, 'user');
    inputEl.value = '';

    const lower = text.toLowerCase();
    if (['quiz', 'jeu', 'jouer', 'divertir', 's\'amuser'].some(k => lower.includes(k))) {
      setTimeout(startQuiz, 300);
      return;
    }

    setTimeout(() => {
      const match = chatbotFindReply(text);
      if (match) {
        addMessage(match.reply, 'bot');
        if (match.quick) addQuickReplies(match.quick);
        if (match.forceHuman) addWhatsappHandoff(text);
      } else {
        addMessage("Je ne suis pas certain de pouvoir répondre précisément à cette question. Voulez-vous que je vous mette en relation avec notre équipe ?", 'bot');
        addWhatsappHandoff(text);
      }
    }, 400);
  }

  bubble.addEventListener('click', () => {
    panel.classList.add('open');
    if (messagesEl.children.length === 0) {
      addMessage("Bonjour 👋 Je suis l'assistant CAM travel. Posez-moi une question sur les horaires, tarifs, réservations ou colis !", 'bot');
      addQuickReplies([
        { label: 'Horaires', ask: 'horaires' },
        { label: 'Tarifs colis', url: 'colis.html' },
        { label: 'Réserver un trajet', url: 'recherche.html' },
        { label: '🎮 Jouer au Quiz', startQuiz: true },
      ]);
    }
  });

  closeBtn.addEventListener('click', () => panel.classList.remove('open'));

  sendBtn.addEventListener('click', () => handleUserMessage(inputEl.value));
  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleUserMessage(inputEl.value);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', chatbotInit);
} else {
  chatbotInit();
}
