/**
 * Explicaciones "de una idea por pantalla" para las lecciones A1-A2.
 * Reglas de redacción (pensadas para atención corta / TDAH):
 *  - máx. ~25 palabras por pantalla, una sola idea
 *  - siempre ejemplo con audio justo después de la regla
 *  - una micro-pregunta (quick) cada 2-3 pantallas: recordar > releer
 *  - **negrita** = la parte clave en el alemán
 */
export type Ex = { de: string; es: string };

export type Slide =
  | { t: "hook"; emoji: string; title: string; text: string }
  | { t: "rule"; title: string; text: string; ex?: Ex[] }
  | { t: "table"; title: string; note?: string; say?: "left" | "both" | "none"; rows: [string, string, string?][] }
  | { t: "versus"; title: string; a: Ex; b: Ex; aLabel?: string; bLabel?: string; why: string }
  | { t: "points"; title: string; items: string[] }
  | { t: "tip"; emoji: string; text: string }
  | { t: "quick"; q: string; choices: string[]; a: string; why?: string };

export const SLIDES: Record<string, Slide[]> = {
  "paso-a1-1-pronombres": [
    { t: "hook", emoji: "👋", title: "Quién hace la acción", text: "Con 7 palabritas puedes hablar de ti, de ti y de todos. Vamos." },
    {
      t: "table",
      title: "Los pronombres",
      say: "left",
      note: "Toca una fila para oírla",
      rows: [
        ["**ich**", "yo"],
        ["**du**", "tú"],
        ["**er / sie / es**", "él / ella / ello"],
        ["**wir**", "nosotros"],
        ["**ihr**", "vosotros"],
        ["**sie**", "ellos"],
        ["**Sie**", "usted (siempre con mayúscula)"],
      ],
    },
    { t: "quick", q: "¿Cómo se dice «nosotros»?", choices: ["wir", "ihr", "sie"], a: "wir", why: "wir = nosotros" },
    {
      t: "rule",
      title: "Mi, tu, su…",
      text: "Los posesivos nacen del pronombre: ich → **mein**, du → **dein**, wir → **unser**.",
      ex: [
        { de: "Das ist **mein** Handy.", es: "Este es mi móvil." },
        { de: "Das ist **meine** Tasche.", es: "Este es mi bolso." },
      ],
    },
    { t: "tip", emoji: "💡", text: "¿mein o meine? Mira el artículo: **der / das → mein**, **die → meine**." },
    { t: "quick", q: "Das ist ___ Tasche (die Tasche)", choices: ["mein", "meine"], a: "meine", why: "die Tasche → meine" },
  ],

  "paso-a1-2-presente-regular": [
    { t: "hook", emoji: "🧩", title: "Verbos = raíz + final", text: "Quita **-en** al verbo y pega la terminación. Siempre igual." },
    {
      t: "table",
      title: "wohnen (vivir)",
      note: "Fíjate solo en la terminación",
      rows: [
        ["ich", "wohn**e**"],
        ["du", "wohn**st**"],
        ["er / sie / es", "wohn**t**"],
        ["wir", "wohn**en**"],
        ["ihr", "wohn**t**"],
        ["sie / Sie", "wohn**en**"],
      ],
    },
    { t: "quick", q: "du ___ (lernen)", choices: ["lernst", "lernt", "lerne"], a: "lernst", why: "du → -st" },
    {
      t: "rule",
      title: "Truco: verbos en -t / -d",
      text: "Si la raíz acaba en t/d, mete una **e** para poder pronunciarlo.",
      ex: [
        { de: "Du arbeit**e**st.", es: "Tú trabajas." },
        { de: "Er arbeit**e**t.", es: "Él trabaja." },
      ],
    },
    { t: "quick", q: "er ___ (arbeiten)", choices: ["arbeitet", "arbeitt", "arbeite"], a: "arbeitet" },
  ],

  "paso-a1-3-sein-haben": [
    { t: "hook", emoji: "⭐", title: "Los dos verbos VIP", text: "**sein** (ser/estar) y **haben** (tener). No siguen reglas: se memorizan. Por suerte, son solo 12 formas." },
    {
      t: "table",
      title: "sein",
      rows: [
        ["ich", "**bin**"],
        ["du", "**bist**"],
        ["er / sie / es", "**ist**"],
        ["wir", "**sind**"],
        ["ihr", "**seid**"],
        ["sie / Sie", "**sind**"],
      ],
    },
    { t: "quick", q: "Ich ___ müde (cansado).", choices: ["bin", "bist", "ist"], a: "bin" },
    {
      t: "table",
      title: "haben",
      rows: [
        ["ich", "**habe**"],
        ["du", "**hast**"],
        ["er / sie / es", "**hat**"],
        ["wir", "**haben**"],
        ["ihr", "**habt**"],
        ["sie / Sie", "**haben**"],
      ],
    },
    {
      t: "rule",
      title: "Cambian la vocal e → i",
      text: "Algunos verbos cambian solo con **du** y **er**.",
      ex: [
        { de: "Du sprichst gut Deutsch.", es: "Hablas bien alemán." },
        { de: "Er isst Pizza.", es: "Él come pizza." },
      ],
    },
    { t: "quick", q: "Er ___ Deutsch. (sprechen)", choices: ["spricht", "sprecht", "sprechen"], a: "spricht" },
  ],

  "paso-a1-4-akkusativ": [
    { t: "hook", emoji: "🎯", title: "Quién recibe la acción", text: "El objeto directo (lo que ves, compras, comes) cambia **un solo** artículo." },
    {
      t: "table",
      title: "Nominativ → Akkusativ",
      say: "none",
      note: "Solo el masculino cambia",
      rows: [
        ["**der** Mann", "**den** Mann"],
        ["die Frau", "die Frau"],
        ["das Kind", "das Kind"],
        ["ein Mann", "**einen** Mann"],
      ],
    },
    {
      t: "versus",
      title: "Sujeto vs objeto",
      a: { de: "**Der** Mann trinkt Kaffee.", es: "El hombre (sujeto) bebe café." },
      b: { de: "Ich sehe **den** Mann.", es: "Yo veo al hombre (objeto)." },
      aLabel: "Sujeto",
      bLabel: "Objeto",
      why: "Si hace la acción: der. Si la recibe: den.",
    },
    { t: "quick", q: "Ich kaufe ___ Tisch. (der Tisch)", choices: ["der", "den", "dem"], a: "den" },
    { t: "quick", q: "Ich sehe ___ Frau. (die Frau)", choices: ["die", "den", "einen"], a: "die", why: "Femenino no cambia" },
  ],

  "paso-a1-5-numeros-tiempo": [
    { t: "hook", emoji: "🔢", title: "Números sin miedo", text: "El truco alemán: en 21+ se dice **al revés**, como un acertijo." },
    {
      t: "rule",
      title: "Unidad + und + decena",
      text: "21 = «uno-y-veinte».",
      ex: [
        { de: "**ein**und**zwanzig**", es: "21 (uno y veinte)" },
        { de: "**drei**und**dreißig**", es: "33 (tres y treinta)" },
      ],
    },
    { t: "quick", q: "¿Cómo se dice 22?", choices: ["zweiundzwanzig", "zwanzigzwei", "zwanzigundzwei"], a: "zweiundzwanzig" },
    {
      t: "rule",
      title: "Los días",
      text: "Todos son masculinos (**der**). Para «el lunes»: **am** Montag.",
      ex: [
        { de: "**Am Montag** arbeite ich.", es: "El lunes trabajo." },
        { de: "**Am Freitag** habe ich frei.", es: "El viernes libro." },
      ],
    },
    { t: "quick", q: "«El martes» = ___ Dienstag", choices: ["am", "im", "um"], a: "am" },
  ],

  "paso-a1-6-comida": [
    { t: "hook", emoji: "☕", title: "Pide como un local", text: "Dos frases y ya sobrevives en cualquier café." },
    {
      t: "rule",
      title: "Pedir algo",
      text: "**Ich möchte…** (quisiera) o directo: producto + **bitte**.",
      ex: [
        { de: "**Ich möchte** einen Kaffee.", es: "Quisiera un café." },
        { de: "Einen Kaffee, **bitte**.", es: "Un café, por favor." },
      ],
    },
    {
      t: "rule",
      title: "Pagar",
      text: "Cuando terminas, esta frase es oro:",
      ex: [{ de: "**Die Rechnung, bitte.**", es: "La cuenta, por favor." }],
    },
    { t: "quick", q: "Para pedir la cuenta dices…", choices: ["Die Rechnung, bitte", "Ich habe Hunger", "Guten Appetit"], a: "Die Rechnung, bitte" },
  ],

  "paso-a1-7-du-vs-sie": [
    { t: "hook", emoji: "🎩", title: "¿Tú o usted?", text: "Equivocarte no es grave, pero acertar da muy buena imagen." },
    {
      t: "versus",
      title: "Sie vs du",
      aLabel: "Formal · Sie",
      bLabel: "Informal · du",
      a: { de: "Wie heißen **Sie**?", es: "¿Cómo se llama usted?" },
      b: { de: "Wie heißt **du**?", es: "¿Cómo te llamas?" },
      why: "Sie: desconocidos, médicos, jefes, oficinas. du: amigos, familia, WhatsApp.",
    },
    { t: "tip", emoji: "✍️", text: "**Sie** (usted) siempre con **S mayúscula**. **sie** (ellos/ella) va en minúscula." },
    { t: "quick", q: "Hablas con el médico. Dices…", choices: ["Können Sie mir helfen?", "Kannst du mir helfen?"], a: "Können Sie mir helfen?" },
  ],

  "paso-a1-8-articulos-genero": [
    { t: "hook", emoji: "🎨", title: "der · die · das", text: "Cada palabra tiene color: 🔵 **der** · 🔴 **die** · 🟢 **das**. Aprende la palabra CON su artículo." },
    {
      t: "rule",
      title: "Tres géneros",
      text: "No siempre tienen lógica: ¡la niña es neutra!",
      ex: [
        { de: "**der** Vater", es: "el padre" },
        { de: "**die** Mutter", es: "la madre" },
        { de: "**das** Mädchen", es: "la niña" },
      ],
    },
    { t: "quick", q: "___ Mutter", choices: ["der", "die", "das"], a: "die" },
    {
      t: "rule",
      title: "Un / una",
      text: "**ein** para der y das · **eine** para die.",
      ex: [
        { de: "**ein** Bruder", es: "un hermano" },
        { de: "**eine** Schwester", es: "una hermana" },
      ],
    },
    { t: "quick", q: "Ich habe ___ Schwester.", choices: ["ein", "eine"], a: "eine" },
  ],

  "paso-a1-9-modalverben": [
    { t: "hook", emoji: "🧰", title: "Verbos ayudantes", text: "**können, müssen, wollen, dürfen**: poder, tener que, querer, tener permiso." },
    {
      t: "rule",
      title: "El otro verbo, al final",
      text: "El modal va en 2ª posición y el verbo principal se queda **al final**, sin conjugar.",
      ex: [
        { de: "Ich **möchte** eine Hose **kaufen**.", es: "Quiero comprar unos pantalones." },
        { de: "Ich **muss** heute **arbeiten**.", es: "Hoy tengo que trabajar." },
      ],
    },
    {
      t: "table",
      title: "können y müssen",
      say: "none",
      note: "ich y er: sin terminación",
      rows: [
        ["ich", "kann · muss"],
        ["du", "kannst · musst"],
        ["er / sie / es", "kann · muss"],
        ["wir", "können · müssen"],
      ],
    },
    { t: "quick", q: "Ich ___ schwimmen. (poder)", choices: ["kann", "kannst", "können"], a: "kann" },
  ],

  "paso-a1-10-negacion": [
    { t: "hook", emoji: "🚫", title: "Decir que no", text: "Dos formas de negar. Una regla simple decide cuál." },
    {
      t: "versus",
      title: "kein vs nicht",
      aLabel: "kein → niega cosas",
      bLabel: "nicht → niega el resto",
      a: { de: "Ich habe **keine** Schmerzen.", es: "No tengo dolores." },
      b: { de: "Mir geht es **nicht** gut.", es: "No me encuentro bien." },
      why: "¿Había un 'ein/eine' o ningún artículo? → kein. Verbo o adjetivo → nicht.",
    },
    { t: "quick", q: "Ich habe ___ Zeit. (no tengo tiempo)", choices: ["keine", "nicht"], a: "keine" },
    { t: "quick", q: "Das ist ___ gut.", choices: ["kein", "nicht"], a: "nicht", why: "'gut' es adjetivo" },
  ],

  "paso-a1-11-w-fragen": [
    { t: "hook", emoji: "❓", title: "Preguntar en la calle", text: "Aprende estas 4 y encontrarás cualquier sitio." },
    {
      t: "table",
      title: "Palabras W",
      say: "left",
      rows: [
        ["**wo**", "dónde (estoy)"],
        ["**wohin**", "a dónde (voy)"],
        ["**woher**", "de dónde (vengo)"],
        ["**wie**", "cómo"],
      ],
    },
    {
      t: "rule",
      title: "El verbo va justo detrás",
      text: "Palabra W + **verbo** + el resto.",
      ex: [
        { de: "**Wo ist** der Bahnhof?", es: "¿Dónde está la estación?" },
        { de: "**Wohin gehst** du?", es: "¿A dónde vas?" },
      ],
    },
    { t: "quick", q: "___ ist die Apotheke?", choices: ["Wo", "Wohin", "Woher"], a: "Wo" },
  ],

  "paso-a1-12-plural": [
    { t: "hook", emoji: "👯", title: "Plurales", text: "No hay una sola regla: se aprende con cada palabra. Pero hay una buena noticia…" },
    { t: "tip", emoji: "🎁", text: "En plural **todo** usa **die**, sea der, die o das." },
    {
      t: "rule",
      title: "Terminaciones comunes",
      text: "-e · -er (+Umlaut) · -n/-en · -s · sin cambio",
      ex: [
        { de: "der Mann → **die Männer**", es: "los hombres" },
        { de: "die Frau → **die Frauen**", es: "las mujeres" },
        { de: "das Auto → **die Autos**", es: "los coches" },
      ],
    },
    { t: "quick", q: "Plural de «der Mann»", choices: ["die Männer", "die Manns", "der Männer"], a: "die Männer" },
  ],

  "paso-a1-13-imperativ": [
    { t: "hook", emoji: "📣", title: "Dar órdenes con educación", text: "Muy útil para pedir ayuda, indicaciones y en la calle." },
    {
      t: "versus",
      title: "du vs Sie",
      aLabel: "Con du: solo raíz",
      bLabel: "Con Sie: verbo + Sie",
      a: { de: "**Komm** her!", es: "¡Ven aquí!" },
      b: { de: "**Kommen Sie** bitte!", es: "¡Venga, por favor!" },
      why: "du: quita el -en. Sie: invierte verbo y pronombre.",
    },
    { t: "quick", q: "Imperativo de «warten» con Sie", choices: ["Warten Sie!", "Wartet du!", "Sie warten!"], a: "Warten Sie!" },
  ],

  "paso-a1-14-perfekt-intro": [
    { t: "hook", emoji: "⏪", title: "Hablar del pasado", text: "El pasado hablado = **haben/sein** + **participio al final**." },
    {
      t: "rule",
      title: "Con haben (la mayoría)",
      text: "ge- + raíz + -t",
      ex: [{ de: "Ich **habe** Deutsch **gelernt**.", es: "Aprendí alemán." }],
    },
    {
      t: "rule",
      title: "Con sein (movimiento)",
      text: "gehen, fahren, kommen → **sein**.",
      ex: [{ de: "Ich **bin** nach Berlin **gefahren**.", es: "Fui a Berlín (en vehículo)." }],
    },
    { t: "quick", q: "Ich ___ nach Hause gegangen.", choices: ["bin", "habe"], a: "bin", why: "gehen = movimiento → sein" },
  ],

  "paso-a2-1-dativ": [
    { t: "hook", emoji: "🎁", title: "El Dativ", text: "El «a quién / con quién». Aparece tras preposiciones clave." },
    {
      t: "table",
      title: "Artículos en Dativ",
      say: "none",
      rows: [
        ["der → ", "**dem**"],
        ["die → ", "**der**"],
        ["das → ", "**dem**"],
        ["plural → ", "**den** (+n)"],
      ],
    },
    {
      t: "rule",
      title: "Siempre Dativ tras…",
      text: "**mit, bei, nach, von, zu, aus, seit**",
      ex: [
        { de: "Ich wohne **bei meiner** Freundin.", es: "Vivo con mi amiga." },
        { de: "Ich fahre **mit dem** Bus.", es: "Voy en autobús." },
      ],
    },
    { t: "quick", q: "Ich fahre mit ___ Bus. (der Bus)", choices: ["dem", "den", "der"], a: "dem" },
    {
      t: "rule",
      title: "Verbos que piden Dativ",
      text: "helfen, gefallen, gehören, danken.",
      ex: [{ de: "Können Sie **mir** helfen?", es: "¿Puede ayudarme?" }],
    },
  ],

  "paso-a2-2-excepciones": [
    { t: "hook", emoji: "⚠️", title: "Trampas al escribir", text: "Tres cosas que confunden a todos. Aquí van resueltas." },
    {
      t: "versus",
      title: "ß vs ss",
      aLabel: "ß · vocal larga",
      bLabel: "ss · vocal corta",
      a: { de: "die Stra**ß**e", es: "la calle" },
      b: { de: "e**ss**en", es: "comer" },
      why: "Vocal larga o diptongo → ß. Vocal corta → ss.",
    },
    { t: "tip", emoji: "⌨️", text: "¿Sin teclado alemán? Escribe **ae, oe, ue** en vez de ä, ö, ü (für → fuer)." },
    {
      t: "rule",
      title: "Verbos separables",
      text: "El prefijo salta **al final** de la frase.",
      ex: [{ de: "Ich **stehe** um 7 Uhr **auf**.", es: "Me levanto a las 7." }],
    },
    { t: "quick", q: "Ich ___ um 8 Uhr ___. (aufstehen)", choices: ["stehe … auf", "aufstehe … -", "stehe auf … um"], a: "stehe … auf" },
  ],

  "paso-a2-3-perfekt-completo": [
    { t: "hook", emoji: "💼", title: "Contar tu día", text: "Los verbos irregulares cambian dentro. Mejor memorizarlos en pareja." },
    {
      t: "table",
      title: "Participios irregulares",
      rows: [
        ["sehen", "**gesehen**"],
        ["sprechen", "**gesprochen**"],
        ["nehmen", "**genommen**"],
      ],
    },
    { t: "tip", emoji: "🚫", text: "Los verbos con **be-, ver-, ent-** y los acabados en **-ieren** **no** llevan «ge-»." },
    {
      t: "rule",
      title: "Sin ge-",
      text: "Se quedan igual o solo cambian la terminación.",
      ex: [
        { de: "Ich habe Post **bekommen**.", es: "He recibido correo." },
        { de: "Ich habe **telefoniert**.", es: "He llamado por teléfono." },
      ],
    },
    { t: "quick", q: "Participio de «telefonieren»", choices: ["telefoniert", "getelefoniert"], a: "telefoniert" },
  ],

  "paso-a2-4-praeteritum-basico": [
    { t: "hook", emoji: "✈️", title: "Pasado escrito y hablado", text: "Con **sein, haben y modales** se usa el Präteritum incluso hablando." },
    {
      t: "table",
      title: "sein y haben",
      rows: [
        ["ich", "**war** · **hatte**"],
        ["du", "**warst** · **hattest**"],
        ["er / sie / es", "**war** · **hatte**"],
        ["wir", "**waren** · **hatten**"],
      ],
    },
    {
      t: "rule",
      title: "Modales",
      text: "können → **konnte** · müssen → **musste**",
      ex: [{ de: "Ich **musste** den Zug nehmen.", es: "Tuve que coger el tren." }],
    },
    { t: "quick", q: "Gestern ___ ich krank. (sein)", choices: ["war", "bin", "hatte"], a: "war" },
  ],

  "paso-a2-5-adjektivdeklination": [
    { t: "hook", emoji: "🎀", title: "Adjetivos con final", text: "El adjetivo cambia según el artículo que lo precede. Dos casos clave." },
    {
      t: "versus",
      title: "Con der/die/das vs ein/eine",
      aLabel: "Artículo definido",
      bLabel: "Artículo indefinido",
      a: { de: "der freundlich**e** Mann", es: "el hombre amable" },
      b: { de: "ein freundlich**er** Mann", es: "un hombre amable" },
      why: "Con der/die/das el adjetivo termina en -e. Con ein, toma el final que falta (-er, -e, -es).",
    },
    { t: "quick", q: "ein wichtig___ Thema (das)", choices: ["es", "e", "er"], a: "es" },
  ],

  "paso-a2-6-komparativ-superlativ": [
    { t: "hook", emoji: "📈", title: "Comparar", text: "Tres escalones: **normal → más → el más**." },
    {
      t: "table",
      title: "Escalera",
      say: "none",
      rows: [
        ["klein", "klein**er** · am klein**sten**"],
        ["groß", "gr**ö**ß**er** · am gr**ö**ß**ten**"],
        ["gut", "**besser** · am **besten**"],
        ["gern", "**lieber** · am **liebsten**"],
      ],
    },
    {
      t: "rule",
      title: "Comparar con «als»",
      text: "Más que = **-er … als**",
      ex: [{ de: "Berlin ist **größer als** München.", es: "Berlín es más grande que Múnich." }],
    },
    { t: "quick", q: "Mein Auto ist ___ als deins. (schnell)", choices: ["schneller", "am schnellsten", "schnell"], a: "schneller" },
  ],

  "paso-a2-7-wechselpraepositionen": [
    { t: "hook", emoji: "🔀", title: "Dos casos, una pregunta", text: "an, auf, in, unter, vor, zwischen: pregunta **¿wohin o wo?**" },
    {
      t: "versus",
      title: "Movimiento vs lugar",
      aLabel: "wohin? → Akkusativ",
      bLabel: "wo? → Dativ",
      a: { de: "Ich lege die Karte auf **den** Tisch.", es: "Pongo la tarjeta sobre la mesa." },
      b: { de: "Die Karte liegt auf **dem** Tisch.", es: "La tarjeta está sobre la mesa." },
      why: "Hay movimiento → Akkusativ. Está quieta → Dativ.",
    },
    { t: "quick", q: "Ich gehe in ___ Park. (der Park)", choices: ["den", "dem"], a: "den", why: "Voy a → wohin → Akkusativ" },
    { t: "quick", q: "Ich bin in ___ Park.", choices: ["den", "dem"], a: "dem", why: "Estoy en → wo → Dativ" },
  ],

  "paso-a2-8-nebensaetze": [
    { t: "hook", emoji: "🧠", title: "Frases con «porque»", text: "Con **weil, dass, wenn** el verbo salta **al final**." },
    {
      t: "versus",
      title: "Orden normal vs subordinada",
      a: { de: "Ich schwimme gern.", es: "Me gusta nadar." },
      b: { de: "…, weil es mir Spaß **macht**.", es: "…porque me divierte." },
      aLabel: "Principal",
      bLabel: "Con weil",
      why: "El verbo conjugado se va al final de la frase con weil.",
    },
    {
      t: "rule",
      title: "wenn = si / cuando",
      text: "Subordinada primero → el verbo va **inmediatamente después**.",
      ex: [{ de: "**Wenn** ich Zeit **habe**, **gehe** ich wandern.", es: "Si tengo tiempo, voy de senderismo." }],
    },
    { t: "quick", q: "Ich bleibe zu Hause, weil ich krank ___.", choices: ["bin", "ich bin", "bin ich"], a: "bin" },
  ],

  "paso-a2-9-possessivartikel": [
    { t: "hook", emoji: "🩺", title: "Mi doctor, mi doctora", text: "Los posesivos cambian igual que ein/eine." },
    {
      t: "rule",
      title: "Akkusativ: solo el masculino",
      text: "mein → **meinen**",
      ex: [{ de: "Ich rufe **meinen** Arzt an.", es: "Llamo a mi médico." }],
    },
    {
      t: "rule",
      title: "Dativ: cambia todo",
      text: "fem. → **meiner** · masc./neutro → **meinem**",
      ex: [{ de: "Ich vertraue **meiner** Ärztin.", es: "Confío en mi doctora." }],
    },
    { t: "quick", q: "Ich helfe ___ Mutter. (meine Mutter)", choices: ["meiner", "meine", "meinen"], a: "meiner" },
  ],

  "paso-a2-10-reflexive-verben": [
    { t: "hook", emoji: "🪞", title: "Verbos reflexivos", text: "Muchos son reflexivos aunque en español no lo parezcan." },
    {
      t: "table",
      title: "Pronombres reflexivos",
      rows: [
        ["ich", "**mich**"],
        ["du", "**dich**"],
        ["er / sie / es", "**sich**"],
        ["wir", "**uns**"],
        ["ihr", "**euch**"],
        ["sie / Sie", "**sich**"],
      ],
    },
    {
      t: "rule",
      title: "Dónde va",
      text: "Justo después del verbo conjugado.",
      ex: [{ de: "Ich freue **mich** auf die Party.", es: "Tengo ganas de la fiesta." }],
    },
    { t: "quick", q: "Wir freuen ___.", choices: ["uns", "sich", "euch"], a: "uns" },
  ],
};

/** Lección de gramática (/lessons) -> paso de la ruta con sus tarjetas visuales. */
export const LESSON_TO_STEP: Record<string, string> = {
  "pronombres-personales-posesivos": "paso-a1-1-pronombres",
  "presente-verbos-regulares": "paso-a1-2-presente-regular",
  "verbos-irregulares-comunes": "paso-a1-3-sein-haben",
  "nominativ-akkusativ": "paso-a1-4-akkusativ",
  "du-vs-sie": "paso-a1-7-du-vs-sie",
  "articulos-genero": "paso-a1-8-articulos-genero",
  "modalverben-basicos": "paso-a1-9-modalverben",
  "negacion-nicht-kein": "paso-a1-10-negacion",
  "w-fragen": "paso-a1-11-w-fragen",
  "plural-sustantivos": "paso-a1-12-plural",
  "imperativ-basico": "paso-a1-13-imperativ",
  "perfekt-intro": "paso-a1-14-perfekt-intro",
  dativ: "paso-a2-1-dativ",
  "excepciones-y-trampas": "paso-a2-2-excepciones",
  "perfekt-completo": "paso-a2-3-perfekt-completo",
  "praeteritum-sein-haben-modal": "paso-a2-4-praeteritum-basico",
  "adjektivdeklination-intro": "paso-a2-5-adjektivdeklination",
  "komparativ-superlativ": "paso-a2-6-komparativ-superlativ",
  wechselpraepositionen: "paso-a2-7-wechselpraepositionen",
  "nebensaetze-weil-dass-wenn": "paso-a2-8-nebensaetze",
  "possessivartikel-dativ-akkusativ": "paso-a2-9-possessivartikel",
  "reflexive-verben": "paso-a2-10-reflexive-verben",
};
