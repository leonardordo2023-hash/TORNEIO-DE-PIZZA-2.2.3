
export type Language = 'pt' | 'es' | 'en';

export const translations = {
  pt: {
    appTitle: "Torneio de Pizza",
    news: "Notícias",
    avisos: "Avisos",
    rules: "Regras",
    grid: "Fichas",
    rankings: "Rankings",
    album: "Galeria",
    dates: "Datas",
    dynamics: "Dinâmica",
    history: "História",
    online: "ONLINE",
    offline: "OFFLINE",
    login: "Login",
    register: "Cadastrar",
    logout: "Sair",
    reset: "Reiniciar Pontuação",
    export: "Exportar CSV",
    addPizza: "Adicionar Pizza",
    beauty: "Aparência",
    taste: "Sabor",
    total: "Total",
    votes: "votos",
    points: "pts",
    yourNotes: "Suas Anotações",
    globalNotes: "Críticas Anônimas (Todos veem)",
    notVoted: "Não votado",
    guest: "Convidado",
    settings: "Configurações",
    profile: "Perfil",
    language: "Idioma",
    appearance: "Aparência",
    theme: "Tema",
    light: "Claro",
    dark: "Escuro",
    save: "Salvar",
    cancel: "Cancelar",
    confirmReset: "ATENCÃO: Você vai limpar todos os VOTOS. As fotos, vídeos e pizzas continuarão salvas. Tem certeza?",
    deletePizza: "Excluir Pizza",
    deleteConfirm: "Tem certeza que deseja excluir?",
    share: "Compartilhar",
    upload: "Adicionar Foto / Vídeo",
    download: "Baixar",
    comments: "Comentários",
    likes: "Curtidas",
    commentPlaceholder: "Adicione um comentário...",
    publish: "Publicar",
    leader: "Líder Atual",
    computedVotes: "Votos Computados",
    noMedia: "Nenhuma mídia",
    voteButton: "VOTAR",
    voteSent: "VOTO ENVIADO",
    abertura: {
        welcome: "Bem - Vindos",
        subtitle: "Torneio de Pizza",
        professional: "Diversão Profissional",
        tapToEnter: "Toque para entrar"
    },
    auth: {
        welcome: "Bem-vindo!",
        welcomeUser: "Olá, ",
        selectProfile: "Selecione seu perfil para entrar",
        searchPlaceholder: "Buscar por apelido...",
        judgeList: "Lista de Jurados (A-Z)",
        addProfile: "Adicionar Perfil",
        adminPanel: "Painel Administrativo",
        accessDenied: "Acesso Negado",
        alreadyOnline: "já está online.",
        entering: "Entrando",
        creatingAccount: "Criando conta para",
        continue: "Continuar",
        createAccount: "Criar Conta",
        nickname: "Apelido (@obrigatório)",
        email: "Telefone (com DDD)",
        password: "Senha (4 dígitos)",
        enter: "Entrar",
        next: "Cadastrar",
        noAccount: "Não tem uma conta?",
        hasAccount: "Já tem conta?",
        verifyTitle: "Verifique seu Telefone",
        verifyText: "Enviamos um SMS para",
        verifySim: "Confirmar Cadastro (Simulação)",
        backLogin: "Trocar Apelido",
        forgotPassword: "Esqueci a senha",
        recoverTitle: "Recuperar Senha",
        recoverText: "Digite seu apelido para ver sua senha.",
        sendPassword: "Enviar Senha",
        passwordSent: "Sua senha é:",
        mustStartWithAt: "O apelido deve começar com @",
        adminMode: "Modo Admin",
        restrictedAccess: "Acesso Restrito",
        wrongPassword: "Senha incorreta.",
        accessPanel: "Acessar Painel"
    },
    rankingPanel: {
        grandFinal: "Grande Final",
        simultaneous: "Apuração Simultânea: Salgada & Doce",
        startBroadcast: "INICIAR TRANSMISSÃO",
        processing: "Processando",
        panelTitle: "Painel de Apuração",
        salgadaTitle: "Ranking Salgada",
        doceTitle: "Ranking Doce",
        waitingData: "Aguardando dados...",
        championDoce: "Grande Campeã Doce",
        finalScore: "Pontuação Final",
        weakSignal: "REDE FRACA",
        reconnecting: "Reconectando ao servidor principal",
        readyQuestion: "ESTÃO PREPARADOS?",
        position: "º Lugar"
    },
    categories: {
        pizza: "Fotos de Pizza",
        champion: "Campeões",
        team: "Equipe"
    },
    gamification: {
        title: "Dinâmica do Torneio",
        subtitle: "Entenda a pontuação e suba de nível!",
        pizzaPointsTitle: "Pontos de Pizza (Notas Recebidas)",
        pizzaPointsDesc: "Estes pontos refletem a qualidade técnica da sua pizza!<br><br>📈 <b>XP GANHO:</b> Cada <b>1 Ponto</b> de nota (Aparência ou Sabor) recebido aumenta sua barra em exatamente <b>1.0%</b>.",
        extraBonusTitle: "BÔNUS EXTRA (Massa)",
        extraBonusDesc: "Valorize o trabalho artesanal! A pessoa que fizer a <b>massa da pizza</b> manualmente irá ganhar <b>1 ponto extra</b> na somatória final.<br><br>✨ <b>XP GANHO:</b> Ao receber este bônus (Estrela), você ganha <b>8.5% de XP</b>!",
        socialPointsTitle: "Engajamento Social",
        socialPointsDesc: "Mostra o quanto você é participativo! Ganhe progresso interagindo com a comunidade.<br><br>❤️ <b>CURTIDAS:</b> Cada <b>Like</b> em fotos ou comentários dá <b>2.5% de XP</b> e <b>1 Ponto</b>.<br>💬 <b>COMENTÁRIOS:</b> Cada <b>Comentário</b> em postagens diferentes dá <b>2.5% de XP</b>.",
        levelTitle: "Cálculo do Nível (XP)",
        levelDesc: "Sua barra sobe combinando suas habilidades e engajamento:<br><br>✨ <b>Fórmula:</b> (Notas × 1.0%) + (Bônus × 8.5%) + (Likes × 2.5%) + (Comentários × 2.5%) = Progresso.",
        prizeTitle: "Recompensa Especial",
        prizeDesc: "Ao alcançar o (nível máximo <b>5</b>), o Jurado / Jogador ganhará um <b>Prêmio com poder de escolha</b> em até <b>120 reais</b> em produtos da <b>Natura, Boticário, Avon ou Mary Kay</b> pelo seu empenho! 🎁",
        notifyPlayers: "Notificar Jogadores"
    },
    historyContent: {
        title: "Nossa História",
        subtitle: "Tradição, Sabor e Amizade",
        close: "Fechar Livro",
        notify: "Notificar Mudança na História",
        sections: [
            {
                title: "O Início de Tudo",
                text: "Tudo começou como uma pequena reunião entre amigos apaixonados por culinária. A ideia era simples: quem faz a melhor pizza caseira? O que era para ser apenas um jantar se transformou em uma competição acirrada e divertida."
            },
            {
                title: "A Evolução",
                text: "A cada edição, o nível subiu. Massas de fermentação natural, molhos secretos e combinações ousadas. O 'Torneio de Pizza' deixou de ser apenas sobre comer e passou a ser sobre a arte de criar experiências."
            },
            {
                title: "O Legado",
                text: "Hoje, não avaliamos apenas o sabor, mas a apresentação e a criatividade. Este aplicativo serve para eternizar esses momentos, registrar nossas receitas campeãs e celebrar a amizade que nos une."
            },
            {
                title: "Próximos Capítulos",
                text: "A história continua sendo escrita a cada fatia. Prepare sua massa, aqueça o forno e faça parte dessa lenda!"
            }
        ]
    },
    charts: {
        totalPoints: "Total de Pontos (Soma dos Juízes)",
        scatter: "Dispersão: Sabor vs. Aparência",
        noData: "Comece a avaliar e clique em VOTAR para ver o gráfico"
    },
    profileEdit: {
        changePhoto: "Alterar Foto",
        editProfile: "Editar Perfil",
        newNickname: "Novo Apelido",
        newPassword: "Nova Senha (4 dígitos)",
        saveChanges: "Salvar Alterações",
        success: "Perfil atualizado com sucesso!",
        error: "Erro ao atualizar perfil."
    },
    rulesContent: [
        {
            title: "Critérios de Avaliação",
            desc: "🍽️ Cada pizza deve ser avaliada em duas categorias: <b>(Aparência)</b> e <b>(Sabor)</b>! 🤤\n\n🔢 As notas variam de <b>0.0 a 10.0</b>. Notas <b>abaixo de 5.0</b> precisam ser <b>justificadas na mensagem anônima</b>. Não se preocupe, pois ela é <b>totalmente privada</b>: não mostra seu nome nem o número da pizza comentada. Prepare seu paladar e seja justo! ✨",
            icon: "star"
        },
        {
            title: "Registro Fotográfico",
            desc: "📸 <b>Comprove sua Autoria:</b> Tire fotos do <b>início</b> (preparo) e do <b>fim</b> (pronta)! Vídeos da montagem são super bem-vindos. 🎥\n\n🌟 <b>GANHE +1 PONTO BÔNUS:</b> Envie foto ou vídeo <b>fazendo e modelando a massa</b>! O verdadeiro sabor está na base, não só no recheio. 🥟\n\n💡 <b>Dica:</b> Envie antes ou depois da apresentação. O formato é livre, use sua criatividade! 🎨",
            icon: "camera"
        },
        {
            title: "Comentários",
            desc: "💬 <b>Justifique Notas Extremas:</b> Se der <b>abaixo de 5</b> ou <b>acima de 9</b>, conte o <b>porquê</b>! Use as <b>anotações</b> ou <b>comentários globais</b>. Sua opinião é o tempero extra! 🌶️",
            icon: "message"
        },
        {
            title: "Forma de Pagamento",
            desc: "💸 <b>Contribuição:</b> O pagamento deve ser feito diretamente ao <b>Administrador</b>!\n\n📲 <b>PIX:</b> Chave <b>12915240965</b> (Banco Caixa).\n💵 <b>Dinheiro:</b> Pode ser entregue em mãos no dia do evento.\n\n⚠️ <b>Importante:</b> Não esqueça de <b>avisar o administrador</b> qual forma você escolheu para facilitar a organização! 🤝",
            icon: "wallet"
        },
        {
            title: "O Vencedor & Prêmios",
            desc: "🏆 <b>Vence a pizza</b> que tiver a maior soma total de pontos (<b>Sabor + Aparência</b>) de todos os jurados presentes!\n\n🍕 <b>Prêmios da Pizza Salgada:</b>\n🥇 <b>1° Lugar:</b> R$ 10,00 de cada participante + um <b>Prêmio Misterioso</b>! 🕵️\n🥈 <b>2° Lugar:</b> <b>Prêmio Misterioso</b>! 🕵️\n🥉 <b>3° Lugar:</b> Uma <b>Caneca Personalizada</b> com tema do Torneio! 🍺\n\n🍬 <b>Pizza Doce:</b>\n🥇 <b>1° Lugar:</b> R$ 10,00 de cada participante.\n\n💰 <b>Totalizando:</b> R$ 20,00 de cada participante.",
            icon: "trophy"
        }
    ]
  },
  es: {
    appTitle: "Torneo de Pizza",
    news: "Noticias",
    avisos: "Avisos",
    rules: "Reglas",
    grid: "Fichas",
    rankings: "Rankings",
    album: "Galería",
    dates: "Fechas",
    dynamics: "Dinámica",
    history: "Historia",
    online: "EN LÍNEA",
    offline: "DESCONECTADO",
    login: "Entrar",
    register: "Registrarse",
    logout: "Salir",
    reset: "Reiniciar Puntuación",
    export: "Exportar CSV",
    addPizza: "Añadir Pizza",
    beauty: "Apariencia",
    taste: "Sabor",
    total: "Total",
    votes: "votos",
    points: "pts",
    yourNotes: "Tus Notas",
    globalNotes: "Críticas Anónimas (Público)",
    notVoted: "Sin votar",
    guest: "Invitado",
    settings: "Configuración",
    profile: "Perfil",
    language: "Idioma",
    appearance: "Apariencia",
    theme: "Tema",
    light: "Claro",
    dark: "Oscuro",
    save: "Guardar",
    cancel: "Cancelar",
    confirmReset: "ATENCIÓN: Se borrarán todos los VOTOS. Las fotos, videos y pizzas se mantendrán. ¿Estás seguro?",
    deletePizza: "Borrar Pizza",
    deleteConfirm: "¿Seguro que deseas borrar?",
    share: "Compartir",
    upload: "Añadir Foto / Video",
    download: "Descargar",
    comments: "Comentarios",
    likes: "Me gusta",
    commentPlaceholder: "Escribe un comentario...",
    publish: "Publicar",
    leader: "Líder Actual",
    computedVotes: "Votos Contados",
    noMedia: "Sin medios",
    voteButton: "VOTAR",
    voteSent: "VOTO ENVIADO",
    abertura: {
        welcome: "Bien - Venidos",
        subtitle: "Torneo de Pizza",
        professional: "Diversión Profesional",
        tapToEnter: "Toca para entrar"
    },
    auth: {
        welcome: "¡Bienvenido!",
        welcomeUser: "Hola, ",
        selectProfile: "Selecciona tu perfil para entrar",
        searchPlaceholder: "Buscar por apodo...",
        judgeList: "Lista de Jueces (A-Z)",
        addProfile: "Añadir Perfil",
        adminPanel: "Panel Administrativo",
        accessDenied: "Acceso Denegado",
        alreadyOnline: "ya está en línea.",
        entering: "Entrando",
        creatingAccount: "Creando cuenta para",
        continue: "Continuar",
        createAccount: "Crear Cuenta",
        nickname: "Apodo (@obligatorio)",
        email: "Teléfono (con código)",
        password: "Clave (4 dígitos)",
        enter: "Entrar",
        next: "Registrarse",
        noAccount: "¿No tienes cuenta?",
        hasAccount: "¿Ya tienes cuenta?",
        verifyTitle: "Verifica tu Teléfono",
        verifyText: "Enviamos un SMS a",
        verifySim: "Confirmar Registro (Sim)",
        backLogin: "Cambiar Apodo",
        forgotPassword: "Olvidé la contraseña",
        recoverTitle: "Recuperar Contraseña",
        recoverText: "Ingresa tu apodo para ver tu clave.",
        sendPassword: "Enviar Contraseña",
        passwordSent: "Tu contraseña es:",
        mustStartWithAt: "El apodo debe comenzar con @",
        adminMode: "Modo Admin",
        restrictedAccess: "Acceso Restringido",
        wrongPassword: "Clave incorrecta.",
        accessPanel: "Acceder al Panel"
    },
    rankingPanel: {
        grandFinal: "Gran Final",
        simultaneous: "Escrutinio Simultáneo: Salada & Dulce",
        startBroadcast: "INICIAR TRANSMISIÓN",
        processing: "Procesando",
        panelTitle: "Panel de Escrutinio",
        salgadaTitle: "Ranking Salada",
        doceTitle: "Ranking Dulce",
        waitingData: "Esperando datos...",
        championDoce: "Gran Campeona Dulce",
        finalScore: "Puntuación Final",
        weakSignal: "RED DÉBIL",
        reconnecting: "Reconectando al servidor principal",
        readyQuestion: "¿ESTÁIS PREPARADOS?",
        position: "º Lugar"
    },
    categories: {
        pizza: "Fotos de Pizza",
        champion: "Campeones",
        team: "Equipo"
    },
    gamification: {
        title: "Dinámica del Torneo",
        subtitle: "¡Entiende la puntuación y sube de nivel!",
        pizzaPointsTitle: "Puntos de Pizza (Notas Recibidas)",
        pizzaPointsDesc: "¡Representa la qualidade técnica de tu pizza!<br><br>📈 <b>XP GANADO:</b> Cada <b>1 Punto</b> de nota aumenta tu nivel en <b>1.0%</b>.",
        extraBonusTitle: "BONO EXTRA (Masa)",
        extraBonusDesc: "¡Valora el trabajo manual! La persona que haga la <b>masa de la pizza</b> ganará <b>1 punto extra</b>.<br><br>✨ <b>XP GANADO:</b> Al recibir este bono (Estrella), ¡ganas <b>8.5% de XP</b>!",
        socialPointsTitle: "Compromiso Social",
        socialPointsDesc: "¡Demuestra tu participación! Gana puntos por interacciones.<br><br>❤️ <b>ME GUSTA:</b> Cada <b>Like</b> da <b>2.5% de XP</b> y <b>1 Punto</b>.<br>💬 <b>COMENTARIOS:</b> Cada <b>Comentario</b> da <b>2.5% de XP</b>.",
        levelTitle: "Cálculo de Nivel (XP)",
        levelDesc: "Tu nivel sube combinando tus habilidades:<br><br>✨ <b>Fórmula:</b> (Notas × 1.0%) + (Bono × 8.5%) + (Likes × 2.5%) + (Comentarios × 2.5%) = Progreso.",
        prizeTitle: "Recompensa Especial",
        prizeDesc: "Al llegar al (nivel máximo <b>5</b>), ganarás un vale de regalo de 120 reales en productos de belleza por tu esfuerzo. 🎁",
        notifyPlayers: "Notificar Jugadores"
    },
    historyContent: {
        title: "Nuestra Historia",
        subtitle: "Tradición, Sabor y Amistad",
        close: "Cerrar Libro",
        notify: "Notificar Cambio en la Historia",
        sections: [
            {
                title: "El Comienzo de Todo",
                text: "Todo comenzó como una pequeña reunión entre amigos apasionados por la cocina. La idea era simple: ¿quién hace la mejor pizza casera? Lo que iba a ser solo una cena se convirtió en una competición divertida."
            },
            {
                title: "La Evolución",
                text: "En cada edición, el nivel subió. Masas de fermentación natural, salsas secretas y combinaciones audaces. El 'Torneo de Pizza' pasó de ser solo comida a ser el arte de crear experiencias."
            },
            {
                title: "El Legado",
                text: "Hoy, no evaluamos solo el sabor, sino también la presentación y la creatividad. Esta aplicación sirve para eternizar esos momentos y celebrar la amistad que nos une."
            },
            {
                title: "Próximos Capítulos",
                text: "La historia se sigue escribiendo con cada porción. ¡Prepara tu masa, calienta el horno y forma parte de esta leyenda!"
            }
        ]
    },
    charts: {
        totalPoints: "Puntos Totales (Suma de Jueces)",
        scatter: "Dispersión: Sabor vs. Belleza",
        noData: "Empieza a evaluar y haz clic en VOTAR para ver el gráfico"
    },
    profileEdit: {
        changePhoto: "Cambiar Foto",
        editProfile: "Editar Perfil",
        newNickname: "Nuevo Apodo",
        newPassword: "Nueva Contraseña (4 dígitos)",
        saveChanges: "Guardar Cambios",
        success: "¡Perfil actualizado con éxito!",
        error: "Error al actualizar perfil."
    },
    rulesContent: [
        {
            title: "Criterios de Evaluación",
            desc: "Cada pizza debe ser evaluada en dos categorías: Belleza (Apariencia) y Sabor. Las notas van de 0.0 a 10.0.",
            icon: "star"
        },
        {
            title: "Registro Fotográfico",
            desc: "📸 <b>Comprueba tu Autoría:</b> ¡Saca fotos del <b>inicio</b> (preparación) e del <b>final</b> (lista)! Videos del montaje son bienvenidos. 🎥\n\n🌟 <b>GANA +1 PUNTO EXTRA:</b> ¡Envía foto o video <b>haciendo la masa</b>! El verdadero sabor está en la base, no solo en el relleno. 🥟\n\n💡 <b>Tip:</b> Envía antes o después de la presentación. ¡Formato libre, usa tu creatividad! 🎨",
            icon: "camera"
        },
        {
            title: "Comentarios",
            desc: "💬 <b>Justifica Notas Extremas:</b> Si das <b>menos de 5</b> o <b>más de 9</b>, ¡cuéntanos por qué! Usa las <b>notas</b> o <b>comentarios globales</b>. ¡Tu opinión es el toque extra! 🌶️",
            icon: "message"
        },
        {
            title: "Forma de Pago",
            desc: "💸 <b>Contribución:</b> ¡El pago debe hacerse directamente al <b>Administrador</b>!\n\n📲 <b>PIX:</b> Clave <b>12915240965</b> (Banco Caixa).\n💵 <b>Efectivo:</b> Se puede entregar en mano el día del evento.\n\n⚠️ <b>Importante:</b> ¡No olvides <b>avisar al administrador</b> qué forma elegiste para facilitar la organización! 🤝",
            icon: "wallet"
        },
        {
            title: "El Ganador",
            desc: "Gana la pizza que tenga la mayor suma total de puntos (Sabor + Belleza) de todos los jueces presentes.",
            icon: "trophy"
        }
    ]
  },
  en: {
    appTitle: "Pizza Tournament",
    news: "News",
    avisos: "Alerts",
    rules: "Rules",
    grid: "Sheets",
    rankings: "Rankings",
    album: "Gallery",
    dates: "Dates",
    dynamics: "Dynamics",
    history: "History",
    online: "ONLINE",
    offline: "OFFLINE",
    login: "Login",
    register: "Sign Up",
    logout: "Logout",
    reset: "Reset Scores",
    export: "Export CSV",
    addPizza: "Add Pizza",
    beauty: "Appearance",
    taste: "Taste",
    total: "Total",
    votes: "votes",
    points: "pts",
    yourNotes: "Your Notes",
    globalNotes: "Anonymous Reviews (Public)",
    notVoted: "Not voted",
    guest: "Guest",
    settings: "Settings",
    profile: "Profile",
    language: "Language",
    appearance: "Appearance",
    theme: "Theme",
    light: "Light",
    dark: "Dark",
    save: "Save",
    cancel: "Cancel",
    confirmReset: "WARNING: You are about to clear all VOTES. Photos, videos, and pizzas will remain. Are you sure?",
    deletePizza: "Delete Pizza",
    deleteConfirm: "Are you sure you want to delete?",
    share: "Share",
    upload: "Add Photo / Video",
    download: "Download",
    comments: "Comments",
    likes: "Likes",
    commentPlaceholder: "Add a comment...",
    publish: "Post",
    leader: "Current Leader",
    computedVotes: "Votes Counted",
    noMedia: "No media",
    voteButton: "VOTE",
    voteSent: "VOTE SENT",
    abertura: {
        welcome: "Welcome",
        subtitle: "Pizza Tournament",
        professional: "Professional Fun",
        tapToEnter: "Tap to enter"
    },
    auth: {
        welcome: "Welcome!",
        welcomeUser: "Hello, ",
        selectProfile: "Select your profile to enter",
        searchPlaceholder: "Search by nickname...",
        judgeList: "Judge List (A-Z)",
        addProfile: "Add Profile",
        adminPanel: "Admin Panel",
        accessDenied: "Access Denied",
        alreadyOnline: "is already online.",
        entering: "Entering",
        creatingAccount: "Creating account for",
        continue: "Continue",
        createAccount: "Create Account",
        nickname: "Nickname (@required)",
        email: "Phone (with Area Code)",
        password: "Password (4 digits)",
        enter: "Enter",
        next: "Register",
        noAccount: "Don't have an account?",
        hasAccount: "Already have an account?",
        verifyTitle: "Verify Phone",
        verifyText: "We sent an SMS to",
        verifySim: "Confirm Registration (Sim)",
        backLogin: "Change Nickname",
        forgotPassword: "Forgot password",
        recoverTitle: "Recover Password",
        recoverText: "Enter your nickname to see your password.",
        sendPassword: "Send Password",
        passwordSent: "Password sent to",
        mustStartWithAt: "Nickname must start with @",
        adminMode: "Admin Mode",
        restrictedAccess: "Restricted Access",
        wrongPassword: "Wrong password.",
        accessPanel: "Access Panel"
    },
    rankingPanel: {
        grandFinal: "Grand Final",
        simultaneous: "Simultaneous Count: Savory & Sweet",
        startBroadcast: "START BROADCAST",
        processing: "Processing",
        panelTitle: "Counting Panel",
        salgadaTitle: "Savory Ranking",
        doceTitle: "Sweet Ranking",
        waitingData: "Waiting for data...",
        championDoce: "Sweet Grand Champion",
        finalScore: "Final Score",
        weakSignal: "WEAK SIGNAL",
        reconnecting: "Reconnecting to main server",
        readyQuestion: "ARE YOU READY?",
        position: " Place"
    },
    categories: {
        pizza: "Pizza Photos",
        champion: "Champions",
        team: "Team"
    },
    gamification: {
        title: "Tournament Dynamics",
        subtitle: "Understand scoring and level up!",
        pizzaPointsTitle: "Pizza Points (Votes Received)",
        pizzaPointsDesc: "Represents your pizza's technical quality!<br><br>📈 <b>XP GAIN:</b> Each <b>1 Point</b> received increases your level by <b>1.0%</b>.",
        extraBonusTitle: "EXTRA BONUS (Dough)",
        extraBonusDesc: "Value craftsmanship! The person who makes the <b>pizza dough</b> manually will earn <b>1 extra point</b>.<br><br>✨ <b>XP GAIN:</b> By receiving this bonus (Star), you instantly gain <b>8.5% XP</b>!",
        socialPointsTitle: "Social Engagement",
        socialPointsDesc: "Shows your active participation! Earn progress by interacting with others.<br><br>❤️ <b>LIKES:</b> Each <b>Like</b> gives <b>2.5% XP</b> and <b>1 Point</b>.<br>💬 <b>COMMENTS:</b> Each <b>Comment</b> gives <b>2.5% XP</b>.",
        levelTitle: "Level Calculation (XP)",
        levelDesc: "Your level rises by combining skills and engagement:<br><br>✨ <b>Formula:</b> (Scores × 1.0%) + (Bonus × 8.5%) + (Likes × 2.5%) + (Comments × 2.5%) = Progress.",
        prizeTitle: "Special Reward",
        prizeDesc: "By reaching (max level <b>5</b>), you win a gift voucher worth 120 BRL to choose beauty products! 🎁",
        notifyPlayers: "Notify Players"
    },
    historyContent: {
        title: "Our History",
        subtitle: "Tradition, Taste and Friendship",
        close: "Close Book",
        notify: "Notify History Update",
        sections: [
            {
                title: "How It All Began",
                text: "It all started as a small gathering among friends passionate about cooking. The idea was simple: who makes the best homemade pizza? What was supposed to be just a dinner turned into a fun competition."
            },
            {
                title: "The Evolution",
                text: "With each edition, the level rose. Sourdough crusts, secret sauces, and bold combinations. The 'Pizza Tournament' evolved from just eating to the art of creating experiences."
            },
            {
                title: "The Legacy",
                text: "Today, we don't just evaluate taste, but also presentation and creativity. This app serves to eternalize those moments and celebrate the friendship that unites us."
            },
            {
                title: "Next Chapters",
                text: "The story continues to be written with every slice. Prepare your dough, heat the oven and be part of this legend!"
            }
        ]
    },
    charts: {
        totalPoints: "Total Points (Sum of Judges)",
        scatter: "Scatter: Taste vs. Appearance",
        noData: "Start rating and click VOTE to see charts"
    },
    profileEdit: {
        changePhoto: "Change Photo",
        editProfile: "Edit Profile",
        newNickname: "New Nickname",
        newPassword: "New Password (4 digits)",
        saveChanges: "Save Changes",
        success: "Profile updated successfully!",
        error: "Error updating profile."
    },
    rulesContent: [
        {
            title: "Evaluation Criteria",
            desc: "Each pizza must be rated in two categories: Appearance and Taste. Scores range from 0.0 to 10.0.",
            icon: "star"
        },
        {
            title: "Photo Record",
            desc: "📸 <b>Prove Authorship:</b> Take photos of the <b>start</b> (prep) and the <b>end</b> (finished)! Assembly videos are welcome. 🎥\n\n🌟 <b>GET +1 BONUS POINT:</b> Send a photo or video <b>making the dough</b>! True flavor lies in the base, not just the toppings. 🥟\n\n💡 <b>Tip:</b> Upload before or after presentation. Free format, get creative! 🎨",
            icon: "camera"
        },
        {
            title: "Comments",
            desc: "💬 <b>Justify Extreme Scores:</b> If you rate <b>below 5</b> or <b>above 9</b>, tell us why! Use <b>notes</b> or <b>global comments</b>. Your opinion is the extra spice! 🌶️",
            icon: "message"
        },
        {
            title: "Payment Method",
            desc: "💸 <b>Contribution:</b> Payment must be made directly to the <b>Administrator</b>!\n\n📲 <b>PIX:</b> Key <b>12915240965</b> (Caixa Bank).\n💵 <b>Cash:</b> Can be paid on the day of the event.\n\n⚠️ <b>Important:</b> Please <b>notify the administrator</b> which method you chose to help with organization! 🤝",
            icon: "wallet"
        },
        {
            title: "The Winner",
            desc: "The winner is the pizza with the highest total sum of points (Taste + Appearance) from all judges present.",
            icon: "trophy"
        }
    ]
  }
};
