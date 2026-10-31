import { GenderPreference } from '../types';

export interface ArchetypeGenderTitles {
  universal: string;
  feminine: string;
  masculine: string;
}

export interface JungArchetype {
  id: string;
  name: string;
  genderTitles?: ArchetypeGenderTitles;
  avatar: string;
  desire: string;
  fear: string;
  description: string;
  primaryStat: 'fuerza' | 'disciplina' | 'mente' | 'energia' | 'estudio';
  statBonus: string;
  color: string;
  badgeBg: string;
  companion: {
    title: string;
    icon: string;
    color: string;
    shadow: string;
    border: string;
  };
  quotes: string[];
}

export const JUNG_ARCHETYPES: JungArchetype[] = [
  {
    id: 'inocente',
    name: 'El Inocente',
    genderTitles: {
      universal: 'Espíritu Puro',
      feminine: 'La Inocente',
      masculine: 'El Inocente',
    },
    avatar: '🕊️',
    desire: 'Vivir tranquilo, feliz y hacer las cosas en paz.',
    fear: 'El conflicto, meter la pata o perder la calma interior.',
    description: 'Prefieres la sencillez, la honestidad y hacer las cosas bien sin dramas. Tu mayor tesoro es irte a dormir con la conciencia limpia.',
    primaryStat: 'disciplina',
    statBonus: '+15% XP en Tareas Diarias',
    color: 'from-amber-500 to-yellow-600',
    badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    companion: {
      title: 'Espíritu de Luz',
      icon: '🦄',
      color: 'from-amber-400 to-yellow-500',
      shadow: 'shadow-[0_0_25px_rgba(251,191,36,0.5)]',
      border: 'border-amber-400'
    },
    quotes: [
      "Tu optimismo es un faro de luz; nunca dejes que el cinismo del mundo lo apague.",
      "Está bien no saberlo todo; la pureza de tus intenciones es tu mayor fortaleza.",
      "Mantén viva tu capacidad de asombro; es tu superpoder más grande.",
      "Tu fe en las personas inspira a los demás a ser mejores.",
      "Recuerda que equivocarse es parte de crecer, no te hace menos valioso.",
      "Tu bondad genuina deja una huella más profunda de lo que imaginas.",
      "El mundo necesita tu visión esperanzadora; no permitas que la duden.",
      "La alegría que compartes se multiplica y siempre vuelve a ti.",
      "Está bien buscar la seguridad; mereces un lugar donde sientas paz.",
      "Tu honestidad es refrescante y necesaria; sigue hablando desde el corazón.",
      "No tienes que cargar con los problemas del mundo; tu luz ya hace suficiente.",
      "Confía en esa voz interior que siempre busca el bien común.",
      "La belleza que ves en lo simple es un regalo extraordinario.",
      "Que nadie te convenza de que ser amable es ser débil.",
      "Mantén tu espíritu libre de rencor; esa es tu verdadera libertad.",
      "Tu sonrisa tiene el poder de cambiar el día de alguien más.",
      "Cree en los finales felices; tu fe ayuda a construirlos.",
      "Protege tu paz interior, es tu refugio más sagrado.",
      "El universo cuida de aquellos que caminan con intenciones puras como las tuyas.",
      "Está permitido descansar y disfrutar de las cosas simples que amas.",
      "Tu lealtad a tus principios es admirable y digna de respeto.",
      "No dejes que el miedo al fracaso paralice tu deseo de hacer las cosas bien.",
      "Tu capacidad para ver lo mejor en los demás es tu mayor don.",
      "Eres suficiente tal y como eres; no necesitas probar nada a nadie.",
      "La esperanza que llevas dentro es una fuerza imparable.",
      "Celebra las pequeñas victorias; son el camino hacia tus grandes sueños.",
      "Mantén tu corazón abierto, incluso cuando el mundo parezca duro.",
      "Tu presencia irradia una calma que todos necesitamos a veces.",
      "Sigue creyendo en la magia de los nuevos comienzos.",
      "Tu bondad es la respuesta que este mundo necesita."
    ]
  },
  {
    id: 'huerfano',
    name: 'El Hombre Corriente (El Huérfano)',
    genderTitles: {
      universal: 'Voz Comunitaria',
      feminine: 'La Aliada',
      masculine: 'El Aliado',
    },
    avatar: '🤝',
    desire: 'Sentirte parte de un grupo de confianza, encajar y tener gente leal a tu lado.',
    fear: 'Sentirte excluido, que te dejen solo o tener que aparentar lo que no eres.',
    description: 'Cero pretensiones. Eres una persona con los pies en la tierra, leal y de palabra. Crees en el esfuerzo honesto, en apoyarse mutuamente y en que nadie se quede atrás.',
    primaryStat: 'disciplina',
    statBonus: '+15% Monedas en Tareas',
    color: 'from-blue-600 to-indigo-800',
    badgeBg: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    companion: {
      title: 'Canino de Compañía',
      icon: '🐕',
      color: 'from-blue-400 to-cyan-600',
      shadow: 'shadow-[0_0_25px_rgba(59,130,246,0.5)]',
      border: 'border-blue-400'
    },
    quotes: [
      "Tu autenticidad es magnética; no necesitas fingir para ser aceptado.",
      "Eres parte fundamental de este equipo; tu presencia importa y mucho.",
      "Tu empatía conecta corazones; nunca subestimes el poder de escuchar.",
      "No estás solo; hay muchas personas que valoran exactamente quién eres.",
      "Tu sentido de la igualdad hace de este lugar un entorno mejor para todos.",
      "Tus raíces te dan fuerza, pero eres libre de construir tu propio camino.",
      "Encuentra tu tribu, aquellos que te celebren tal como eres.",
      "Tu capacidad para entender el dolor ajeno te hace profundamente humano.",
      "La conexión genuina que buscas está más cerca de lo que crees.",
      "Tienes el derecho a pertenecer, a ocupar tu espacio sin pedir perdón.",
      "Tu pragmatismo es la base sobre la que construimos grandes cosas.",
      "La verdadera pertenencia comienza cuando te aceptas a ti mismo primero.",
      "No temas destacar; brillar no significa dejar a los demás atrás.",
      "Tu resiliencia frente a la adversidad es una inspiración silenciosa.",
      "Las conexiones que formas son auténticas porque nacen de la verdad.",
      "Valoro tu lealtad y el esfuerzo que pones en mantenernos unidos.",
      "Eres el pegamento que mantiene unida a esta comunidad.",
      "Tu voz representa a muchos que a menudo no son escuchados; úsala.",
      "Encuentra la belleza en la cotidianidad; tú eres un experto en eso.",
      "No permitas que el miedo a no encajar te impida mostrar tu valor real.",
      "Tu sentido común es una brújula invaluable en tiempos de confusión.",
      "La solidaridad que muestras nos recuerda lo mejor de la humanidad.",
      "Eres valioso no por lo que haces, sino por quién eres.",
      "Tu capacidad para trabajar en equipo es tu mayor superpoder.",
      "Construye puentes, no muros; tu empatía es la herramienta perfecta.",
      "Recuerda que todos tenemos inseguridades; compártelas y encontrarás apoyo.",
      "Tu constancia y esfuerzo diario no pasan desapercibidos.",
      "Eres un recordatorio constante de que todos merecemos ser vistos.",
      "Tu amistad es un refugio seguro para quienes te rodean.",
      "Juntos somos más fuertes, y tú eres una parte esencial de ese 'juntos'."
    ]
  },
  {
    id: 'heroe',
    name: 'El Héroe',
    genderTitles: {
      universal: 'Espíritu Heroico',
      feminine: 'La Heroína',
      masculine: 'El Héroe',
    },
    avatar: '🛡️',
    desire: 'Superarte día a día, vencer las dificultades y demostrarte de qué estás hecho.',
    fear: 'Rendirte antes de tiempo, quedarte corto o sentirte incapaz frente a un reto.',
    description: 'No te achicas ante los problemas. Tienes disciplina, ganas de salir adelante y esa chispa que te hace levantarte y luchar aunque el día esté cuesta arriba.',
    primaryStat: 'fuerza',
    statBonus: '+20% XP en Entrenamiento',
    color: 'from-red-600 to-rose-900',
    badgeBg: 'bg-red-500/20 text-red-300 border-red-500/40',
    companion: {
      title: 'Águila Fénix',
      icon: '🦅',
      color: 'from-red-500 to-amber-600',
      shadow: 'shadow-[0_0_25px_rgba(239,68,68,0.5)]',
      border: 'border-red-500'
    },
    quotes: [
      "Tu coraje no reside en no tener miedo, sino en avanzar a pesar de él.",
      "Cada desafío es una oportunidad para demostrar tu inmensa fortaleza.",
      "Levántate una vez más; tu resiliencia es legendaria.",
      "Tienes el poder de cambiar el rumbo de esta historia.",
      "No necesitas salvar el mundo todos los días; hoy, salvarte a ti mismo es suficiente.",
      "Tu determinación inspira a todos los que te observan luchar.",
      "Abraza tu vulnerabilidad; reconocerla te hace aún más fuerte.",
      "La verdadera victoria es la batalla ganada contra tus propias dudas.",
      "Tu disciplina te llevará a la meta, sin importar los obstáculos.",
      "Eres un guerrero; tus cicatrices son medallas de tu experiencia.",
      "Canaliza tu energía en aquello que realmente importa; enfoca tu fuego.",
      "No temas pedir ayuda; incluso los héroes necesitan aliados en su viaje.",
      "Tu fuerza interior es inagotable; confía en tus capacidades.",
      "Supera tus límites, pero recuerda siempre escuchar a tu cuerpo.",
      "Tu liderazgo en tiempos de crisis es un faro para los demás.",
      "La justicia que defiendes es el legado que dejarás atrás.",
      "Transforma tu dolor en el combustible de tu próximo gran triunfo.",
      "Tienes el coraje necesario para tomar las decisiones difíciles.",
      "Tu tenacidad es la prueba viviente de que lo imposible es posible.",
      "Celebra tus victorias, por pequeñas que sean; te las has ganado.",
      "No permitas que una derrota defina tu camino; es solo un desvío.",
      "Tu valentía nos da permiso a los demás para ser valientes también.",
      "Enfrenta a tus dragones; tienes la espada necesaria para vencerlos.",
      "Tu compromiso con la excelencia es admirable y motivador.",
      "La fuerza que buscas afuera siempre ha estado dentro de ti.",
      "Defiende a los más vulnerables; tu escudo es tan importante como tu espada.",
      "Descansa, guerrero; el reposo también es parte del entrenamiento.",
      "Tu legado no será lo que conquistaste, sino lo que superaste.",
      "Mantén tu mirada en el horizonte y tu corazón en la batalla.",
      "Eres más fuerte de lo que crees, y este desafío solo te lo demostrará."
    ]
  },
  {
    id: 'cuidador',
    name: 'El Cuidador',
    genderTitles: {
      universal: 'Alma Protectora',
      feminine: 'La Protectora',
      masculine: 'El Protector',
    },
    avatar: '💖',
    desire: 'Que los tuyos estén bien, protegidos y que nunca les falte apoyo ni cariño.',
    fear: 'Que alguien que quieres sufra por tu culpa o no haber estado ahí cuando te necesitaban.',
    description: 'Tienes un corazón enorme. Siempre estás atento a los demás, cuidando los detalles y dando una mano sincera a quien lo necesita sin pedir nada a cambio.',
    primaryStat: 'energia',
    statBonus: '+15% XP en Salud y Bienestar',
    color: 'from-emerald-600 to-teal-800',
    badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    companion: {
      title: 'Ciervo Protector',
      icon: '🦌',
      color: 'from-emerald-400 to-teal-600',
      shadow: 'shadow-[0_0_25px_rgba(16,185,129,0.5)]',
      border: 'border-emerald-400'
    },
    quotes: [
      "Tu compasión sana heridas que ni siquiera podemos ver.",
      "Recuerda cuidarte a ti mismo; no puedes servir de una copa vacía.",
      "Tu generosidad es un regalo invaluable para este mundo.",
      "Está bien decir 'no'; poner límites es un acto de amor propio.",
      "Tu presencia protectora brinda paz a quienes te rodean.",
      "No tienes que arreglar a todos; a veces, solo acompañar es suficiente.",
      "El amor que das siempre encuentra el camino de regreso a ti.",
      "Tu empatía es tu mayor fortaleza, no permitas que te agote.",
      "Permítete recibir cuidado; tú también mereces ser sostenido.",
      "Tu paciencia infinita es un faro en medio de la tormenta.",
      "Eres un refugio seguro; gracias por brindar consuelo constante.",
      "Tu sacrificio no pasa desapercibido; valoramos todo lo que haces.",
      "Priorizar tus necesidades no es egoísmo, es supervivencia.",
      "Tu instinto protector hace de este lugar un espacio más seguro.",
      "Nutre tu propia alma con el mismo esmero que nutres a los demás.",
      "La gratitud que no siempre escuchas existe profundamente en nuestros corazones.",
      "Tu ternura es una fuerza revolucionaria en un mundo endurecido.",
      "Confía en que estás marcando una diferencia, incluso cuando no lo ves.",
      "Eres el ancla emocional que muchos necesitamos.",
      "Perdónate por no poder salvar a todos; haces más de lo posible.",
      "Tu devoción a los demás es un ejemplo luminoso de humanidad.",
      "Acepta ayuda cuando se te offereda; permite que otros te cuiden.",
      "Tu amor incondicional es el regalo más hermoso que puedes dar.",
      "Dedica tiempo a recargar energías; tu bienestar es fundamental.",
      "Tu sensibilidad te permite ver las necesidades que otros ignoran.",
      "Gracias por ser siempre esa mano amiga dispuesta a sostenernos.",
      "Encuentra el equilibrio entre dar a otros y dártelo a ti mismo.",
      "Tu capacidad de perdonar muestra la inmensidad de tu corazón.",
      "Sigue irradiando amor, pero guárdate un poco para ti.",
      "Eres un ángel en la tierra para muchos; nunca olvides tu valor."
    ]
  },
  {
    id: 'explorador',
    name: 'El Explorador',
    genderTitles: {
      universal: 'Espíritu Libre',
      feminine: 'La Exploradora',
      masculine: 'El Explorador',
    },
    avatar: '🧭',
    desire: 'Sentirte libre, probar cosas nuevas y salir de la rutina aburrida del día a día.',
    fear: 'La monotonía, sentirte atrapado en una jaula o conformarte con una vida mediocre.',
    description: 'Inquieto y curioso por naturaleza. Necesitas aire fresco, aprender cosas distintas y vivir experiencias que te hagan sentir vivo de verdad.',
    primaryStat: 'fuerza',
    statBonus: '+15% Monedas en Foco',
    color: 'from-amber-600 to-orange-800',
    badgeBg: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
    companion: {
      title: 'Lobo Nómada',
      icon: '🐺',
      color: 'from-orange-400 to-amber-600',
      shadow: 'shadow-[0_0_25px_rgba(249,115,22,0.5)]',
      border: 'border-orange-400'
    },
    quotes: [
      "El mundo es inmenso y está esperando ser descubierto por ti.",
      "Tu curiosidad insaciable te llevará a lugares extraordinarios.",
      "No temas perderte; a veces es la mejor forma de encontrarte a ti mismo.",
      "Tu espíritu libre es inspirador; nunca dejes que te encierren.",
      "Rompe la rutina; la aventura que buscas está al otro lado del miedo.",
      "Sigue explorando, tanto el mundo exterior como tu paisaje interno.",
      "La monotonía no tiene cabida en tu vida; crea tu propia aventura hoy.",
      "Tu sed de conocimiento es la brújula que te guiará hacia la verdad.",
      "Abraza la incertidumbre; ahí es donde reside la verdadera magia.",
      "Eres un pionero; abre caminos donde otros solo ven obstáculos.",
      "Tu independencia es tu tesoro; protégela con fiereza.",
      "Cada viaje es una lección; mantén los ojos y el corazón abiertos.",
      "No te conformes con lo establecido; cuestiona, busca, descubre.",
      "La libertad que anhelas comienza tomando el control de tu propio destino.",
      "Tu valentía para salir de la zona de confort es digna de admiración.",
      "Explora nuevas ideas con la misma pasión que exploras nuevos lugares.",
      "El horizonte no es el límite, es solo el comienzo de tu viaje.",
      "Tu capacidad de adaptación te permite prosperar en cualquier entorno.",
      "Sigue persiguiendo lo auténtico; no te detengas ante las ilusiones.",
      "Permítete cambiar de rumbo; la flexibilidad es parte de la exploración.",
      "Tu vida es una aventura épica; asegúrate de ser el protagonista.",
      "Descubre la belleza de lo desconocido y compártela con nosotros.",
      "La rutina asfixia al explorador; busca la novedad en lo cotidiano.",
      "Tu deseo de experimentar la vida en toda su plenitud es contagioso.",
      "Sigue tu intuición; es el mejor mapa que posees.",
      "No hay caminos equivocados, solo nuevas experiencias por vivir.",
      "Tu búsqueda de significado te llevará a descubrimientos profundos.",
      "Eres un ciudadano del mundo; encuentra tu hogar en el movimiento.",
      "Atrévete a ir más allá; tu alma nómada necesita alimentarse de nuevas vistas.",
      "Sigue adelante; la próxima gran aventura está a la vuelta de la esquina."
    ]
  },
  {
    id: 'rebelde',
    name: 'El Rebelde (El Forajido)',
    genderTitles: {
      universal: 'Fuerza Rebelde',
      feminine: 'La Rebelde',
      masculine: 'El Rebelde',
    },
    avatar: '⚡',
    desire: 'Cambiar lo que no tiene sentido, romper moldes y hacer tu vida bajo tus propias reglas.',
    fear: 'Sentirte sumiso, conformarte con lo injusto o dejar que otros decidan por ti.',
    description: 'No te conformas con el "siempre se ha hecho así". Cuestionas lo que no cuadra, vas contracorriente cuando es necesario y buscas dejar una huella auténtica.',
    primaryStat: 'fuerza',
    statBonus: '+20% Monedas en Tareas',
    color: 'from-purple-700 to-black',
    badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    companion: {
      title: 'Dragón Rebelde',
      icon: '🐉',
      color: 'from-purple-500 to-indigo-900',
      shadow: 'shadow-[0_0_25px_rgba(168,85,247,0.5)]',
      border: 'border-purple-400'
    },
    quotes: [
      "Tu capacidad para cuestionar el sistema es el motor del verdadero cambio.",
      "No temas ser diferente; la revolución empieza rompiendo el molde.",
      "Tu rebeldía no es destructiva, es la fuerza necesaria para reconstruir.",
      "Desafía el status quo; sabes que hay una manera mejor de hacer las cosas.",
      "Tu indignación ante la injusticia es el fuego que ilumina la oscuridad.",
      "Rompe las reglas que no sirven, pero mantén intactos tus principios.",
      "Eres el catalizador de la transformación que tanto necesitamos.",
      "Tu valentía para hablar cuando otros callan es admirable.",
      "Canaliza tu ira hacia acciones constructivas que dejen huella.",
      "No permitas que te silencien; tu voz provocadora es esencial.",
      "Destruye los viejos paradigmas para dar paso a la innovación.",
      "Tu inconformismo es la señal de que te niegas a aceptar la mediocridad.",
      "Lidera el cambio desde la disrupción; tú sabes cómo hacerlo.",
      "No pidas permiso para ser auténtico y luchar por lo que crees.",
      "Tu energía salvaje puede transformar la apatía en acción.",
      "Desafía la autoridad injusta; tu empoderamiento inspira a otros.",
      "Eres el viento de cambio que arrasa con lo obsoleto.",
      "No te dejes domesticar; tu espíritu libre es tu mayor arma.",
      "Convierte tu rebelión en una causa con propósito y dirección.",
      "Sacude los cimientos; a veces hay que destruir para volver a crear.",
      "Tu audacia desafía los límites de lo que creíamos posible.",
      "No temas a la confrontación si es necesaria para la verdad.",
      "Eres el recordatorio de que las reglas están hechas para cuestionarse.",
      "Tu lucha constante por la liberación abre caminos para los demás.",
      "Transforma tu descontento en el combustible de tu revolución personal.",
      "Eres la voz de los silenciados; grita fuerte por ellos.",
      "No te conformes con migajas; exige el cambio completo que mereces.",
      "Tu irreverencia es un soplo de aire fresco en un mundo rígido.",
      "Desafía lo establecido con inteligencia y estrategia implacable.",
      "Tu fuerza destructiva es la semilla de la creación de un mañana mejor."
    ]
  },
  {
    id: 'amante',
    name: 'El Amante',
    genderTitles: {
      universal: 'Corazón Apasionado',
      feminine: 'La Apasionada',
      masculine: 'El Apasionado',
    },
    avatar: '🌹',
    desire: 'Vivir con pasión, sentirte querido y conectar de verdad con las personas que te rodean.',
    fear: 'La soledad, la frialdad en el trato o vivir una vida apagada y sin entusiasmo.',
    description: 'Le pones el corazón a todo lo que haces. Buscas relaciones sinceras y profundas, disfrutas de los buenos momentos y valoras la belleza de la vida.',
    primaryStat: 'mente',
    statBonus: '+15% XP en Creatividad',
    color: 'from-pink-600 to-rose-800',
    badgeBg: 'bg-pink-500/20 text-pink-300 border-pink-500/40',
    companion: {
      title: 'Flamenco Dorado',
      icon: '🦩',
      color: 'from-pink-400 to-rose-500',
      shadow: 'shadow-[0_0_25px_rgba(244,63,94,0.5)]',
      border: 'border-pink-400'
    },
    quotes: [
      "Tu capacidad de amar apasionadamente hace que la vida brille con más fuerza.",
      "No temas mostrar tus sentimientos; tu vulnerabilidad es sumamente atractiva.",
      "Busca la conexión profunda que anhelas, pero empieza por amarte a ti mismo.",
      "Tu intensidad emocional es un don; no permitas que nadie te pida que la apague.",
      "Cultiva relaciones que nutran tu alma y celebren tu autenticidad.",
      "La belleza que buscas en los demás es un reflejo de tu propia belleza interior.",
      "Entrégate a tus pasiones, ya sea en el amor, el arte o tu trabajo.",
      "Tu lealtad inquebrantable te convierte en un compañero invaluable.",
      "Abraza la intimidad sin miedo; eres digno de ser amado profundamente.",
      "Transforma tu miedo al rechazo en el coraje para ser tú mismo.",
      "Tu sensualidad y aprecio por la belleza enriquecen el mundo que te rodea.",
      "Expresa tu afecto libremente; el amor nunca debe ser guardado.",
      "Atrae lo que deseas irradiando amor desde tu centro.",
      "Construye vínculos basados en la confianza mutua y la admiración profunda.",
      "Tu capacidad de compromiso es la base de relaciones duraderas.",
      "Encuentra el romance en los pequeños detalles de la vida cotidiana.",
      "No te pierdas en el otro; mantén viva tu propia identidad brillante.",
      "Tu empatía te permite conectar almas de maneras profundas y significativas.",
      "Celebra tus conexiones; son el verdadero tesoro de tu existencia.",
      "Permítete seducir y ser seducido por la vida y sus maravillas.",
      "Tu corazón abierto es tu mayor fortaleza, no tu debilidad.",
      "Cultiva la armonía en tu entorno; la necesitas para florecer.",
      "Atrévete a buscar el tipo de amor que devora y transforma.",
      "Tu deseo de unión es una fuerza poderosa; guíala con sabiduría.",
      "Aprecia el arte, la música y todo lo que despierte tus sentidos.",
      "Tu dedicación a las personas que amas es verdaderamente inspiradora.",
      "Recuerda que la conexión más importante es la que tienes contigo mismo.",
      "No te conformes con amores a medias; busca la entrega total.",
      "Tu pasión es contagiosa; úsala para encender chispas en otros.",
      "El amor es el motor de tu vida; sigue permitiendo que te impulse hacia adelante."
    ]
  },
  {
    id: 'creador',
    name: 'El Creador',
    genderTitles: {
      universal: 'Mente Creadora',
      feminine: 'La Creadora',
      masculine: 'El Creador',
    },
    avatar: '🎨',
    desire: 'Darle vida a tus ideas y construir proyectos con tu propio sello personal.',
    fear: 'Quedarte estancado sin inspiración o terminar haciendo cosas genéricas sin alma.',
    description: 'Tu cabeza siempre está maquinando algo nuevo. Te apasiona inventar, resolver con ingenio y plasmar proyectos que nazcan de tu propia imaginación.',
    primaryStat: 'mente',
    statBonus: '+20% XP en Proyectos',
    color: 'from-fuchsia-600 to-purple-800',
    badgeBg: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/40',
    companion: {
      title: 'Zorro Creador',
      icon: '🦊',
      color: 'from-fuchsia-400 to-purple-600',
      shadow: 'shadow-[0_0_25px_rgba(217,70,239,0.5)]',
      border: 'border-fuchsia-400'
    },
    quotes: [
      "Tu imaginación no tiene límites; confía en tu visión única del mundo.",
      "No temas a la página en blanco; es el lienzo perfecto para tu genialidad.",
      "Tu necesidad de crear no es un pasatiempo, es tu forma de respirar.",
      "Acepta que el proceso creativo es caótico, pero el resultado será extraordinario.",
      "Tu innovación desafía las reglas y abre nuevas posibilidades para todos.",
      "No te obsesiones con la perfección; la belleza a menudo reside en las imperfecciones.",
      "Tu obra es un legado que perdurará mucho más allá del momento presente.",
      "Canaliza tu intensidad en dar vida a ideas que nadie más puede ver.",
      "El mundo necesita tu talento; no escondas tus creaciones por miedo al juicio.",
      "Eres un alquimista moderno, transformando ideas abstractas en realidades tangibles.",
      "Celebra tu originalidad; no intentes encajar en moldes que no te pertenecen.",
      "La frustración creativa es solo una señal de que estás a punto de lograr un avance.",
      "Tu sensibilidad al arte y la estética es un don invaluable; cultívalo.",
      "Expresa tu voz interior a través de tu obra; tienes algo importante que decir.",
      "Construye tu imperio desde cero; tienes la visión y la habilidad para hacerlo.",
      "No temas a la crítica; utilízala como combustible para perfeccionar tu arte.",
      "Encuentra inspiración en lo mundano; tu ojo experto siempre sabe encontrar belleza.",
      "Dedica tiempo a nutrir tu inspiración; es la fuente de tu poder creativo.",
      "Tu capacidad para resolver problemas con creatividad te hace indispensable.",
      "Permítete soñar a lo grande; tu mente es un laboratorio de ideas maravillosas.",
      "No te compares con otros creadores; tu huella es irrepetible y valiosa.",
      "Protege tu tiempo y espacio creativo; son sagrados para tu proceso.",
      "Aborda cada proyecto con la pasión de un niño y la destreza de un maestro.",
      "Transforma tu caos interno en obras maestras que conmoverán al mundo.",
      "Comparte tu proceso; inspirarás a otros a encontrar su propia voz creativa.",
      "Tu innovación constante es la prueba de que el arte nunca se estanca.",
      "Deja que tu intuición guíe tus manos y tu mente creadora.",
      "Rompe barreras con tu arte; es la mejor forma de generar impacto.",
      "Tu legado será la belleza y la innovación que dejaste atrás.",
      "Sigue creando, incluso cuando dudes; el mundo necesita tu magia."
    ]
  },
  {
    id: 'bufon',
    name: 'El Bufón',
    genderTitles: {
      universal: 'Espíritu Lúdico',
      feminine: 'La Bufona',
      masculine: 'El Bufón',
    },
    avatar: '🃏',
    desire: 'Pasarla bien, reírte a carcajadas y quitarle dramatismo a las presiones diarias.',
    fear: 'El aburrimiento pesado y amargarse la vida por cosas que tienen solución.',
    description: 'Eres el rayo de sol del grupo. Alivias el estrés con una sonrisa, sabes disfrutar el momento presente y le recuerdas a todos que la vida es para gozarla.',
    primaryStat: 'energia',
    statBonus: '+20% Monedas en Recompensas',
    color: 'from-cyan-500 to-teal-700',
    badgeBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    companion: {
      title: 'Mapache Juguetón',
      icon: '🐒',
      color: 'from-cyan-400 to-teal-500',
      shadow: 'shadow-[0_0_25px_rgba(6,182,212,0.5)]',
      border: 'border-cyan-400'
    },
    quotes: [
      "Tu risa es la mejor medicina que puedes ofrecerle al mundo.",
      "Nunca pierdas tu capacidad de asombrarte y jugar como un niño.",
      "La irreverencia con la que abordas la vida es un recordatorio de que no debemos tomarnos tan en serio.",
      "Tu humor inteligente puede desarmar la tensión en cualquier habitación.",
      "Disfruta del momento presente; es el único lugar donde ocurre la verdadera alegría.",
      "Tu capacidad de encontrar lo absurdo en la vida cotidiana es genialidad pura.",
      "Usa tu alegría como un escudo contra el pesimismo y la tristeza del entorno.",
      "No dejes que la rigidez de otros apague tu chispa juguetona.",
      "Tu presencia ilumina los espacios oscuros; sigue esparciendo esa luz.",
      "Recuerda que la risa es una forma profunda de conexión humana.",
      "Celebra la vida todos los días; tu entusiasmo es contagioso y necesario.",
      "Usa tu ingenio para decir verdades incómodas con una sonrisa amable.",
      "Rompe la tensión con un chiste; tienes el timing perfecto para hacerlo.",
      "Tu espontaneidad nos recuerda la importancia de dejarnos llevar.",
      "Encuentra la diversión en las tareas más tediosas; tú sabes cómo hacerlo.",
      "No temas ser el centro de atención si eso trae alegría a los demás.",
      "Tu espíritu libre es un antídoto contra el estrés de la vida moderna.",
      "Comparte tus ocurrencias; el mundo es un lugar mejor cuando ríe contigo.",
      "Transforma el aburrimiento en aventuras espontáneas e inolvidables.",
      "Mantén tu actitud lúdica, es tu superpoder para superar las adversidades.",
      "Tu humor agudo es una muestra de tu gran inteligencia emocional.",
      "Aleja la tristeza de los demás con tu capacidad para sacar sonrisas.",
      "Atrévete a ser el alma de la fiesta; es un rol importante y valioso.",
      "Vive cada día como si fuera una oportunidad para una nueva broma o descubrimiento.",
      "Tu alegría genuina tiene un impacto más profundo del que imaginas.",
      "Desafía lo convencional a través de la risa y el humor ligero.",
      "No dejes que la seriedad del mundo te quite tu maravillosa ligereza.",
      "Tu capacidad de reírte de ti mismo muestra una increíble fortaleza y madurez.",
      "Esparce confeti emocional donde quiera que vayas.",
      "Nunca subestimes el poder transformador de una buena carcajada."
    ]
  },
  {
    id: 'sabio',
    name: 'El Sabio',
    genderTitles: {
      universal: 'Mente Sabia',
      feminine: 'La Sabia',
      masculine: 'El Sabio',
    },
    avatar: '📜',
    desire: 'Entender el porqué de las cosas, aprender sin parar y tener las ideas bien claras.',
    fear: 'Estar desinformado, que te engañen con mentiras o actuar a ciegas sin reflexionar.',
    description: 'Te gusta pensar con calma antes de actuar. Eres observador, curioso y con criterio propio; siempre buscas la verdad y el fondo de las cosas.',
    primaryStat: 'estudio',
    statBonus: '+20% XP en Estudio',
    color: 'from-violet-600 to-indigo-900',
    badgeBg: 'bg-violet-500/20 text-violet-300 border-violet-500/40',
    companion: {
      title: 'Búho Sabio',
      icon: '🦉',
      color: 'from-violet-400 to-indigo-600',
      shadow: 'shadow-[0_0_25px_rgba(139,92,246,0.5)]',
      border: 'border-violet-400'
    },
    quotes: [
      "Tu búsqueda incesante de la verdad ilumina el camino de los demás.",
      "La sabiduría no solo reside en conocer los datos, sino en comprender su significado profundo.",
      "No temas cuestionarlo todo; la duda es el principio del verdadero conocimiento.",
      "Tu capacidad analítica te permite ver patrones donde otros solo ven caos.",
      "Comparte tu conocimiento generosamente; es la mejor forma de multiplicar tu impacto.",
      "La inteligencia sin empatía es fría; une tu intelecto a tu humanidad.",
      "Tus reflexiones son un refugio en un mundo ruidoso y superficial.",
      "Sigue leyendo, aprendiendo y expandiendo los horizontes de tu mente brillante.",
      "No te desesperes ante la ignorancia ajena; asume el rol de maestro con paciencia.",
      "Tu objetividad es fundamental para tomar decisiones justas y sabias.",
      "Cultiva el silencio; a menudo es ahí donde encuentras las respuestas más claras.",
      "Confía en tu intuición tanto como confías en tu intelecto riguroso.",
      "Tu sed de comprensión del universo es inspiradora e incansable.",
      "Utiliza tus habilidades analíticas para resolver los problemas complejos que enfrentamos.",
      "Atrévete a desafiar tus propias creencias; ahí radica el verdadero crecimiento intelectual.",
      "Tu mente crítica es el mejor antídoto contra la desinformación y el engaño.",
      "Sé un faro de conocimiento, guiando a aquellos que buscan respuestas en la oscuridad.",
      "Encuentra belleza en la lógica, las teorías y las ideas complejas.",
      "Recuerda que no todas las respuestas se encuentran en los libros; experimenta la vida directamente.",
      "Tu calma reflexiva transmite seguridad y confianza a quienes te rodean.",
      "Analiza el pasado para comprender el presente y prever el futuro con lucidez.",
      "Eres un puente entre los datos y la comprensión humana profunda.",
      "Cultiva la humildad intelectual; reconocer lo que no sabes es signo de verdadera sabiduría.",
      "Tu capacidad para sintetizar información compleja es un don invaluable.",
      "Sigue explorando los misterios del universo; el aprendizaje nunca termina para ti.",
      "Dedica tiempo a la contemplación; tu mente necesita espacio para respirar y pensar.",
      "Sé un mentor para aquellos que admiran tu profunda sabiduría.",
      "Tu mente es tu templo; cuida lo que dejas entrar en ella.",
      "Transforma el conocimiento en acción significativa que mejore el mundo.",
      "La verdad que buscas con tanto ahínco te hará libre, a ti y a los demás."
    ]
  },
  {
    id: 'mago',
    name: 'El Mago',
    genderTitles: {
      universal: 'Mente Alquimista',
      feminine: 'La Maga',
      masculine: 'El Mago',
    },
    avatar: '🔮',
    desire: 'Transformar tu realidad, cumplir tus metas y hacer que las cosas difíciles parezcan fáciles.',
    fear: 'Quedarte estancado en el mismo lugar o que una mala decisión perjudique tu rumbo.',
    description: 'Tienes una chispa especial para conectar ideas y convertir momentos difíciles en grandes oportunidades. Inspiras a los demás a creer que el cambio sí es posible.',
    primaryStat: 'mente',
    statBonus: '+20% XP en Pomodoros',
    color: 'from-indigo-600 to-purple-900',
    badgeBg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
    companion: {
      title: 'Gato Astral',
      icon: '🐈‍⬛',
      color: 'from-indigo-400 to-purple-600',
      shadow: 'shadow-[0_0_25px_rgba(99,102,241,0.5)]',
      border: 'border-indigo-400'
    },
    quotes: [
      "Tu visión carismática tiene el poder de inspirar a multitudes hacia un propósito mayor.",
      "Cree en tu capacidad para catalizar cambios profundos en ti mismo y en tu entorno.",
      "Tienes el don de conectar el mundo visible con posibilidades invisibles y extraordinarias.",
      "Tu intuición te guía en la alquimia de transformar sueños en realidades tangibles.",
      "Comprende las leyes del universo y úsalas para el mayor bien de todos.",
      "No temas a tu propio poder; asume la responsabilidad que conlleva tu influencia magnética.",
      "Tus palabras son conjuros; úsalas con intención, cuidado y amor genuino.",
      "Transforma las situaciones negativas en oportunidades doradas de crecimiento.",
      "Tu presencia es sanadora; tienes el don de transmutar el dolor en sanación.",
      "Confía en el proceso de transformación, incluso cuando parezca caótico o abrumador.",
      "Eres un arquitecto de realidades; diseña con visión audaz y ejecución impecable.",
      "Combina tu profundo intelecto con tu aguda intuición para encontrar soluciones mágicas.",
      "Cultiva tu sabiduría interna; es la fuente de tu verdadero poder transformador.",
      "Guía a otros en su propio viaje de autodescubrimiento y metamorfosis personal.",
      "Tu capacidad para ver el panorama completo te permite orquestar cambios extraordinarios.",
      "Utiliza tu carisma para unir a las personas en torno a una visión compartida.",
      "Mantente centrado y conectado a la tierra mientras exploras realidades superiores.",
      "Eres un canal de energía creativa; deja que fluya a través de ti sin obstáculos.",
      "Transmuta el miedo en valentía; es el paso crucial hacia tu maestría personal.",
      "Tu magia reside en tu capacidad para cambiar perspectivas e iluminar mentes.",
      "Cree en los milagros; tu fe es el primer paso para manifestarlos en tu vida.",
      "Alinea tus acciones con tus intenciones más puras y observa cómo todo fluye.",
      "Eres un visionario adelantado a tu tiempo; confía en tu intuición pionera.",
      "Desarrolla tus talentos naturales y utilízalos para empoderar a quienes te rodean.",
      "Tu magnetismo atrae hacia ti las personas y oportunidades que necesitas.",
      "Abraza la sincronicidad de la vida; no hay coincidencias en tu viaje de transformación.",
      "Sé un maestro del cambio positivo, guiando con el ejemplo y la inspiración.",
      "Tu conocimiento profundo de las motivaciones humanas es tu herramienta más poderosa.",
      "Descubre la magia que reside en tu propio ser y compártela generosamente con el mundo.",
      "Transforma cada desafío en un escalón hacia tu evolución espiritual y personal."
    ]
  },
  {
    id: 'gobernante',
    name: 'El Gobernante',
    genderTitles: {
      universal: 'Voz de Liderazgo',
      feminine: 'La Líder',
      masculine: 'El Líder',
    },
    avatar: '👑',
    desire: 'Poner orden, tener las riendas de tu vida y construir estabilidad para ti y los tuyos.',
    fear: 'El descontrol, el caos y la falta de rumbo en las cosas que realmente importan.',
    description: 'Tomas la iniciativa con seguridad y aplomo. Te gusta organizar, planificar a futuro y crear un entorno sólido y seguro donde todos puedan avanzar.',
    primaryStat: 'disciplina',
    statBonus: '+20% Monedas en General',
    color: 'from-amber-600 to-yellow-800',
    badgeBg: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
    companion: {
      title: 'León Imperial',
      icon: '🦁',
      color: 'from-yellow-400 to-amber-600',
      shadow: 'shadow-[0_0_25px_rgba(250,204,21,0.5)]',
      border: 'border-yellow-400'
    },
    quotes: [
      "Tu capacidad para organizar y estructurar es el fundamento del éxito de todos.",
      "Lidera con firmeza, pero no olvides gobernar siempre desde la compasión y la justicia.",
      "El control que buscas no debe asfixiar a otros, sino empoderarlos para alcanzar su potencial.",
      "Tu visión estratégica garantiza que construyamos sobre cimientos sólidos y duraderos.",
      "Asume la responsabilidad con valentía; eres el pilar en tiempos de incertidumbre y crisis.",
      "Delega tareas; confiar en tu equipo fortalecerá aún más tu liderazgo y tu reino.",
      "El verdadero poder reside en servir a los demás, no en dominarlos desde arriba.",
      "Tu búsqueda de prosperidad beneficia a toda la comunidad; mantén ese enfoque noble.",
      "Abraza el caos ocasional; a veces es necesario para la innovación y el crecimiento genuino.",
      "Tu autoridad natural inspira respeto; úsala para fomentar un ambiente de colaboración.",
      "Sé un líder ejemplar; tus acciones hablan mucho más alto que tus directrices.",
      "Cultiva la estabilidad sin caer en la rigidez extrema; la adaptabilidad también es fuerza.",
      "Tus decisiones difíciles protegen el bienestar a largo plazo de aquellos que lideras.",
      "Reconoce y premia los esfuerzos de tu equipo; la lealtad se gana con aprecio sincero.",
      "Eres el arquitecto de sistemas eficientes; sigue perfeccionando tu visión organizacional.",
      "Equipa a tu gente con las herramientas que necesitan para triunfar de manera autónoma.",
      "Tu sentido del deber es inquebrantable; eres una roca sólida en la que podemos confiar.",
      "Fomenta un ambiente de orden donde la creatividad y el talento puedan florecer libremente.",
      "Gestiona los recursos con sabiduría, garantizando un futuro próspero para tu comunidad.",
      "Mantén la calma bajo presión; tu ecuanimidad es esencial para liderar eficazmente.",
      "Sé un pacificador; utiliza tu influencia para resolver conflictos con justicia y diplomacia.",
      "Tu legado se medirá por la estabilidad y el crecimiento que facilitaste, no solo por tus logros.",
      "Escucha activamente a aquellos que lideras; el verdadero gobernante entiende a su pueblo.",
      "Transforma tu necesidad de control en una gestión maestra de proyectos e iniciativas.",
      "Eres el guardián de las tradiciones valiosas, asegurando la continuidad y el propósito.",
      "Promueve el desarrollo integral de tu equipo; su éxito es el reflejo directo de tu liderazgo.",
      "Mantén tu visión a largo plazo; las decisiones impulsivas son enemigas del buen gobierno.",
      "Lidera con integridad absoluta; la confianza es el cimiento más importante de tu poder.",
      "Eres el ancla de tu familia o empresa; tu solidez nos da seguridad a todos.",
      "Asume tu rol de líder con orgullo y humildad; naciste para guiar con éxito."
    ]
  }
];

export const getArchetypeByName = (name?: string): JungArchetype => {
  if (!name) return JUNG_ARCHETYPES[0];
  const normalize = (str: string) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const normInput = normalize(name);

  const found = JUNG_ARCHETYPES.find((a) => {
    if (normalize(a.name) === normInput || normalize(a.id) === normInput) return true;
    if (a.genderTitles) {
      if (normalize(a.genderTitles.universal) === normInput) return true;
      if (normalize(a.genderTitles.feminine) === normInput) return true;
      if (normalize(a.genderTitles.masculine) === normInput) return true;
    }
    return false;
  });
  if (found) return found;

  const partial = JUNG_ARCHETYPES.find((a) => {
    if (normInput.includes(normalize(a.id)) || normalize(a.name).includes(normInput) || normInput.includes(normalize(a.name))) return true;
    if (a.genderTitles) {
      if (normInput.includes(normalize(a.genderTitles.universal)) || normalize(a.genderTitles.universal).includes(normInput)) return true;
      if (normInput.includes(normalize(a.genderTitles.feminine)) || normalize(a.genderTitles.feminine).includes(normInput)) return true;
      if (normInput.includes(normalize(a.genderTitles.masculine)) || normalize(a.genderTitles.masculine).includes(normInput)) return true;
    }
    return false;
  });
  return partial || JUNG_ARCHETYPES[0];
};

/**
 * Retorna el título correspondiente del arquetipo según la preferencia de género del usuario
 * (universal, femenino o masculino), manteniendo la elegancia y lenguaje natural.
 */
export const getArchetypeTitle = (
  archetypeOrName: JungArchetype | string | undefined,
  genderPreference: GenderPreference = 'universal'
): string => {
  if (!archetypeOrName) return 'Espíritu Heroico';
  const arch = typeof archetypeOrName === 'string' ? getArchetypeByName(archetypeOrName) : archetypeOrName;
  if (!arch.genderTitles) return arch.name;
  return arch.genderTitles[genderPreference] || arch.genderTitles.universal || arch.name;
};

export const getDailyQuoteForArchetype = (archetype: JungArchetype, quoteIndexOffset: number = 0): string => {
  const today = new Date();
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
  );
  const index = (dayOfYear + quoteIndexOffset) % archetype.quotes.length;
  return archetype.quotes[Math.abs(index)];
};

export interface CompanionEvolution {
  stage: 1 | 2 | 3;
  stageLabel: string;
  stageName: string;
  title: string;
  icon: string;
  glowClass: string;
  borderClass: string;
  badgeBg: string;
}

export const getCompanionEvolution = (
  archetype: JungArchetype,
  level: number = 1,
  streakDays: number = 0
): CompanionEvolution => {
  const comp = archetype.companion;
  
  if (level >= 25 || streakDays >= 21) {
    return {
      stage: 3,
      stageLabel: 'Fase 3',
      stageName: 'Entidad Legendaria',
      title: `${comp.title} Supremo`,
      icon: comp.icon,
      glowClass: 'shadow-[0_0_35px_rgba(250,204,21,0.8)] animate-pulse',
      borderClass: 'border-amber-400 border-2 ring-4 ring-amber-500/30',
      badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/50',
    };
  }

  if (level >= 10 || streakDays >= 7) {
    return {
      stage: 2,
      stageLabel: 'Fase 2',
      stageName: 'Guardián Madurado',
      title: `${comp.title} Guardián`,
      icon: comp.icon,
      glowClass: 'shadow-[0_0_25px_rgba(34,211,238,0.6)]',
      borderClass: 'border-cyan-400 border-2',
      badgeBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50',
    };
  }

  return {
    stage: 1,
    stageLabel: 'Fase 1',
    stageName: 'Esencia Inicial',
    title: comp.title,
    icon: comp.icon,
    glowClass: comp.shadow,
    borderClass: comp.border,
    badgeBg: 'bg-slate-800 text-slate-300 border-slate-700',
  };
};

export interface ArchetypeBuff {
  name: string;
  description: string;
  xpMultiplier: number;
  coinMultiplier: number;
  grantsShield?: boolean;
}

export const getArchetypeBuff = (archetype: JungArchetype): ArchetypeBuff => {
  switch (archetype.id) {
    case 'inocente':
      return {
        name: 'Aura de Inocencia',
        description: '+50% XP extra en todas las tareas restantes del día.',
        xpMultiplier: 1.5,
        coinMultiplier: 1.0,
      };
    case 'huerfano':
      return {
        name: 'Fuerza Colectiva',
        description: '+50% Monedas extra en todas las tareas del día.',
        xpMultiplier: 1.0,
        coinMultiplier: 1.5,
      };
    case 'heroe':
      return {
        name: 'Furia del Vencedor',
        description: '¡Doble XP! (+100% XP) en todas las tareas del día.',
        xpMultiplier: 2.0,
        coinMultiplier: 1.0,
      };
    case 'cuidador':
      return {
        name: 'Bálsamo de Sanación',
        description: '+1 Escudo de Racha gratis y +30% XP extra.',
        xpMultiplier: 1.3,
        coinMultiplier: 1.0,
        grantsShield: true,
      };
    case 'explorador':
      return {
        name: 'Botín del Nómada',
        description: '¡Doble Monedas! (+100% Monedas) en todas las tareas del día.',
        xpMultiplier: 1.0,
        coinMultiplier: 2.0,
      };
    case 'rebelde':
      return {
        name: 'Disrupción Anárquica',
        description: '+50% XP extra y +50% Monedas extra en todo el día.',
        xpMultiplier: 1.5,
        coinMultiplier: 1.5,
      };
    case 'amante':
      return {
        name: 'Fuego Pasional',
        description: '+60% XP extra y +30% Monedas extra.',
        xpMultiplier: 1.6,
        coinMultiplier: 1.3,
      };
    case 'creador':
      return {
        name: 'Chispa Divina',
        description: '+75% XP extra en todas las actividades.',
        xpMultiplier: 1.75,
        coinMultiplier: 1.0,
      };
    case 'bufon':
      return {
        name: 'Golpe de Fortuna',
        description: '¡Doble probabilidad de botín! (+100% Monedas).',
        xpMultiplier: 1.0,
        coinMultiplier: 2.0,
      };
    case 'sabio':
      return {
        name: 'Iluminación Mental',
        description: '+80% XP extra en todas las tareas del día.',
        xpMultiplier: 1.8,
        coinMultiplier: 1.0,
      };
    case 'mago':
      return {
        name: 'Alquimia Superior',
        description: '+50% XP extra y +50% Monedas extra.',
        xpMultiplier: 1.5,
        coinMultiplier: 1.5,
      };
    case 'gobernante':
      return {
        name: 'Tesorero Imperial',
        description: '+80% Monedas extra en todas las tareas.',
        xpMultiplier: 1.0,
        coinMultiplier: 1.8,
      };
    default:
      return {
        name: 'Impulso Legendario',
        description: '+50% XP y +50% Monedas extra.',
        xpMultiplier: 1.5,
        coinMultiplier: 1.5,
      };
  }
};
