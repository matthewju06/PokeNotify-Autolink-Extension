const DEFAULT_SKUS = [
  { sku: "94636860", name: "White Flare ETB", set: "BBWF", enabled: true },
  { sku: "94636862", name: "Black Bolt ETB", set: "BBWF", enabled: true },
  { sku: "94681785", name: "White Flare Bundle", set: "BBWF", enabled: true },
  { sku: "94681770", name: "Black Bolt Bundle", set: "BBWF", enabled: true },
  { sku: "94636851", name: "White Flare Binder", set: "BBWF", enabled: true },
  { sku: "94636856", name: "Black Bolt Binder", set: "BBWF", enabled: true },
  { sku: "94681780", name: "White Flare Sticker", set: "BBWF", enabled: true },
  { sku: "94681767", name: "Black Bolt Sticker", set: "BBWF", enabled: true },
  { sku: "94636852", name: "BBWF Poster", set: "BBWF", enabled: true },
  { sku: "94636866", name: "Victini Collec.", set: "BBWF", enabled: true },
  { sku: "94636858", name: "BBWF Mini Tin", set: "BBWF", enabled: true },
  { sku: "94300069", name: "Destined ETB", set: "Destined Rivals", enabled: true },
  { sku: "94300067", name: "Destined Bundle", set: "Destined Rivals", enabled: true },
  { sku: "94300082", name: "Destined Kangaskhan Blister", set: "Destined Rivals", enabled: true },
  { sku: "94300073", name: "Destined Zebstrika Blister", set: "Destined Rivals", enabled: true },
  { sku: "93803439", name: "Journey ETB", set: "Journey Together", enabled: true },
  { sku: "94300074", name: "Journey Bundle", set: "Journey Together", enabled: true },
  { sku: "93859728", name: "Journey Scrafty Blister", set: "Journey Together", enabled: true },
  { sku: "93859727", name: "Journey Yanmega Blister", set: "Journey Together", enabled: true },
  { sku: "93954435", name: "Prismatic ETB", set: "Prismatic Evolutions", enabled: true },
  { sku: "93954446", name: "Prismatic Bundle", set: "Prismatic Evolutions", enabled: true },
  { sku: "94300072", name: "Prismatic SPC", set: "Prismatic Evolutions", enabled: true },
  { sku: "94336414", name: "Prismatic Surprise Box", set: "Prismatic Evolutions", enabled: true },
  { sku: "94300053", name: "Prismatic Pouch", set: "Prismatic Evolutions", enabled: true },
  { sku: "94300066", name: "Prismatic Binder", set: "Prismatic Evolutions", enabled: true },
  { sku: "93803457", name: "Prismatic Poster", set: "Prismatic Evolutions", enabled: true },
  { sku: "94300083", name: "Prismatic Blister", set: "Prismatic Evolutions", enabled: true },
  { sku: "94300075", name: "Prismatic Leafeon Sticker", set: "Prismatic Evolutions", enabled: true },
  { sku: "94300058", name: "Prismatic Sylveon Sticker", set: "Prismatic Evolutions", enabled: true },
  { sku: "94300080", name: "Prismatic Glaceon Sticker", set: "Prismatic Evolutions", enabled: true },
  { sku: "91619922", name: "Surging ETB", set: "Surging Sparks", enabled: true },
  { sku: "91619929", name: "Surging Bundle", set: "Surging Sparks", enabled: true },
  { sku: "89432660", name: "Paldean Fates Bundle", set: "Paldean Fates", enabled: true },
  { sku: "94724987", name: "Blooming Water", set: "151", enabled: true },
  { sku: "88897904", name: "151 Bundle", set: "151", enabled: true },
  { sku: "89444929", name: "151 Binder", set: "151", enabled: true },
  { sku: "89444928", name: "151 Poster", set: "151", enabled: true },
  { sku: "88897898", name: "151 Zapdos", set: "151", enabled: true },
  { sku: "89444931", name: "151 Alakazam", set: "151", enabled: true },
  { sku: "94091405", name: "Crown Zenith Bundle", set: "Crown Zenith", enabled: true },
];

let lastOpened = {};
let allEnabled = false;

chrome.storage.sync.get("skuList", data => {
  if (!data.skuList) {
    chrome.storage.sync.set({ skuList: DEFAULT_SKUS }, () => {
      console.log("Initialized default SKU list");
    });
  }
});

function loadUI(skus) {
  const list = document.getElementById("sku-list");
  const filterEl = document.getElementById("set-filter");
  const selectedSet = filterEl.value;
  list.innerHTML = "";
  const filtered = selectedSet === "*" ? skus : skus.filter(p => p.set === selectedSet);
  filtered.forEach((item) => {
    const row = document.createElement("div");
    row.className = "sku-item";
    const label = document.createElement("span");
    label.textContent = `${item.name} (${item.sku})`;
    const toggle = document.createElement("input");
    toggle.type = "checkbox";
    toggle.checked = item.enabled;
    toggle.disabled = allEnabled;
    toggle.onchange = () => {
      item.enabled = toggle.checked;
      chrome.storage.sync.get("skuList", data => {
        const skuList = data.skuList || [];
        const index = skuList.findIndex(p => p.sku === item.sku);
        if (index !== -1) {
          skuList[index].enabled = toggle.checked;
          chrome.storage.sync.set({ skuList });
        }
      });
    };
    const cooldownSpan = document.createElement("span");
    cooldownSpan.style.marginLeft = "8px";
    const last = lastOpened[item.sku] || 0;
    const left = 30 - Math.floor((Date.now() - last) / 1000);
    cooldownSpan.textContent = left > 0 ? `Wait ${left}s` : `Ready`;
    row.appendChild(label);
    row.appendChild(toggle);
    row.appendChild(cooldownSpan);
    list.appendChild(row);
  });
}

function populateSetDropdown(skus) {
  const select = document.getElementById("set-filter");
  const sets = Array.from(new Set(skus.map(p => p.set))).sort();
  sets.forEach(set => {
    const option = document.createElement("option");
    option.value = set;
    option.textContent = set;
    select.appendChild(option);
  });
  select.onchange = () => loadUI(skus);
}

function handleImport(skusRaw) {
  try {
    const parsed = JSON.parse(skusRaw);
    if (!Array.isArray(parsed)) throw new Error();
    const valid = parsed.every(e => typeof e.sku === "string" && typeof e.name === "string" && typeof e.enabled === "boolean");
    if (!valid) throw new Error();
    chrome.storage.sync.set({ skuList: parsed }, () => {
      loadUI(parsed);
      alert("SKUs replaced successfully.");
    });
  } catch {
    alert("Invalid JSON format. Must be an array of {sku, name, enabled}.");
  }
}

function handleFile(file) {
  const reader = new FileReader();
  reader.onload = () => {
    const text = reader.result.trim();
    try {
      const data = JSON.parse(text);
      handleImport(JSON.stringify(data));
    } catch {
      alert("Invalid file format. Only .json with valid SKU objects is supported.");
    }
  };
  reader.readAsText(file);
}

chrome.storage.sync.get(["skuList", "skuLastOpened", "allProductsEnabled"], data => {
  lastOpened = data.skuLastOpened || {};
  allEnabled = data.allProductsEnabled || false;
  document.getElementById("all-toggle").checked = allEnabled;
  document.getElementById("all-toggle").onchange = () => {
    allEnabled = document.getElementById("all-toggle").checked;
    chrome.storage.sync.set({ allProductsEnabled: allEnabled }, () => {
      chrome.storage.sync.get("skuList", updated => {
        loadUI(updated.skuList || DEFAULT_SKUS);
      });
    });
  };
  const skuData = data.skuList && Array.isArray(data.skuList) ? data.skuList : DEFAULT_SKUS;
  loadUI(skuData);
  populateSetDropdown(skuData);
});

document.getElementById("file-import-btn").onclick = () => {
  const fileInput = document.getElementById("file-input");
  const file = fileInput.files[0];
  if (!file) {
    alert("Please select a file first.");
    return;
  }
  handleFile(file);
};

setInterval(() => {
  chrome.storage.sync.get("skuLastOpened", ({ skuLastOpened }) => {
    const now = Date.now();
    document.querySelectorAll(".sku-item").forEach(el => {
      const label = el.querySelector("span");
      const match = label.textContent.match(/\((\d+)\)$/);
      if (!match) return;
      const sku = match[1];
      const last = skuLastOpened?.[sku] || 0;
      const cooldownSpan = el.querySelector("span:last-child");
      const left = 30 - Math.floor((now - last) / 1000);
      cooldownSpan.textContent = left > 0 ? `Cooldown ${left}s` : `Ready`;
    });
  });
}, 1000);
