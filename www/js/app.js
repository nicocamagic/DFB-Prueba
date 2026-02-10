/********* UTIL *********/
function go(page) {
  window.location.href = page;
}

function get(key, def = null) {
  return JSON.parse(localStorage.getItem(key)) ?? def;
}

function set(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

/********* CONFIG *********/

document.addEventListener("keydown", (e) => {
  if (e.ctrlKey && e.key.toLowerCase() === "m") {
    console.log("DEBUG: Settings abierto (PC)");
    go("settings.html");
  }
});

/********* THEME *********/
function applyTheme() {
  const cfg = get("config");
  document.body.classList.remove("dark", "light");
  document.body.classList.add(cfg.theme || "dark");
}

/********* NOTES *********/
let editingNoteId = null;

function createNote() {
  const title = document.getElementById("title").value.trim();
  const content = document.getElementById("content").value.trim();
  if (!title || !content) return;

  const items = content.split("\n").filter((i) => i.trim());

  let notes = get("notes", []);

  if (editingNoteId) {
    const note = notes.find((n) => n.id === editingNoteId);
    if (note) {
      note.title = title;
      note.items = items;
    }
    editingNoteId = null;
  } else {
    notes.push({
      id: Date.now(),
      title,
      items,
      date: new Date().toLocaleDateString(),
    });
  }

  set("notes", notes);
  closeModal();
  renderNotes();
}

function openEditSelector() {
  const notes = get("notes", []);
  if (!notes.length) {
    alert("No hay notas para editar");
    return;
  }

  const titles = notes.map((n, i) => `${i + 1}. ${n.title}`).join("\n");
  const choice = prompt("¿Qué nota deseas editar?\n\n" + titles);

  const index = parseInt(choice) - 1;
  if (isNaN(index) || !notes[index]) return;

  openEditModal(notes[index]);
}

function openEditModal(note) {
  editingNoteId = note.id;
  document.getElementById("title").value = note.title;
  document.getElementById("content").value = note.items.join("\n");
  openModal();
}

function renderNotes() {
  const list = document.getElementById("list");
  if (!list) return;
  list.innerHTML = "";

  get("notes", []).forEach((n) => {
    const li = document.createElement("li");
    li.className = "note-row";
    li.innerHTML = `
      <div onclick="selectNote(${n.id})">
        <strong>${n.title}</strong><br>
        <small>${n.items.length} palabras</small>
      </div>
      <button class="delete-btn" onclick="deleteNote(${n.id})">✕</button>
    `;
    list.appendChild(li);
  });
}

function selectNote(id) {
  set("currentNote", id);
  go("perform.html");
}

function deleteNote(id) {
  set(
    "notes",
    get("notes", []).filter((n) => n.id !== id),
  );
  renderNotes();
}

/********* MODAL *********/
function openModal() {
  document.getElementById("modal").classList.remove("hidden");
}

function closeModal() {
  editingNoteId = null;
  document.getElementById("modal").classList.add("hidden");
}

/********* PERFORM *********/
function perform() {
  const container = document.getElementById("perform");
  const note = get("notes", []).find((n) => n.id === get("currentNote"));
  if (!note) {
    container.innerHTML = `<p>${get("config").fakeText}</p>`;
    return;
  }

  const cfg = get("config");
  const forcedIndex = Math.min(cfg.forcedNumber - 1, note.items.length);

  // ⚡ Palabra forzada: si existe, se usa; si no, se toma la de la posición
  let forcedItem =
    cfg.forcedWord && cfg.forcedWord.trim() !== ""
      ? cfg.forcedWord
      : note.items[forcedIndex];

  // Quitar la palabra forzada de la lista original para no duplicarla
  let items = [...note.items].filter((i) => i !== forcedItem);

  // Mezclar los demás
  items.sort(() => Math.random() - 0.5);

  // Insertar la palabra forzada
  if (cfg.centerForce) {
    items.splice(Math.floor(items.length / 2), 0, forcedItem);
  } else {
    items.splice(forcedIndex, 0, forcedItem);
  }

  // Renderizar
  container.innerHTML = "";
  items.forEach((item, i) => {
    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = cfg.showNumbers
      ? `<span class="num">${i + 1}.</span> ${item}`
      : item;

    if (item === forcedItem) {
      //div.dataset.forced = "true";
      div.addEventListener("click", () => navigator.vibrate?.(40));
    }

    container.appendChild(div);
  });

  // Bloqueo total del historial
  history.pushState(null, "", location.href);
  window.onpopstate = () => history.go(1);
}

/********* SETTINGS *********/
function setTheme(theme) {
  const cfg = get("config");
  cfg.theme = theme;
  set("config", cfg);
  applyTheme();
}

function toggleNumbers() {
  const cfg = get("config");
  cfg.showNumbers = !cfg.showNumbers;
  set("config", cfg);
}

function toggleCenter() {
  const cfg = get("config");
  cfg.centerForce = !cfg.centerForce;
  set("config", cfg);
}

function setBackground(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    const cfg = get("config");
    cfg.background = reader.result;
    set("config", cfg);
    applyBackground();
  };
  reader.readAsDataURL(file);
}

function clearBackground() {
  const cfg = get("config");
  cfg.background = null;
  set("config", cfg);
  applyBackground();
}

function saveSettings() {
  alert("Configuración guardada ✅");
  applyTheme();
}
