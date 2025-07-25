chrome.storage.sync.get(["skuList", "allProductsEnabled"], ({ skuList, allProductsEnabled }) => {
  console.log("Loaded skuList:", skuList);
  console.log("allProductsEnabled:", allProductsEnabled);
});


const cooldownSeconds = 30;
const startupIgnoreWindow = 2000;
const skuTimestamps = {};
let observerAttachedTime = 0;

function extractSKU(url) {
  const match = url.match(/\/A-(\d{8})/);
  return match ? match[1] : null;
}

function shouldOpen(sku) {
  const now = Date.now();
  const lastOpened = skuTimestamps[sku] || 0;
  const elapsed = (now - lastOpened) / 1000;
  return elapsed > cooldownSeconds;
}

function handleNewNode(node, skuList, allProductsEnabled) {
  console.log("🔍 New message node detected:", node);
  const now = Date.now();
  if (now - observerAttachedTime < startupIgnoreWindow) return;

  const links = node.querySelectorAll('a');
  links.forEach(link => {
    const url = link.href;
    const sku = extractSKU(url);
    const entry = skuList.find(e => e.sku === sku);

    console.log("Found link:", url, "| SKU:", sku);
    console.log("➡Matching SKU:", sku, "| entry:", entry, "| allEnabled:", allProductsEnabled);

    if ((allProductsEnabled && sku) || (entry && entry.enabled)) {
      if (shouldOpen(sku)) {
        console.log("Opening:", url);
        skuTimestamps[sku] = Date.now();
        chrome.storage.sync.set({ skuLastOpened: skuTimestamps });
        window.open(url, "_blank");
      } else {
        console.log("⏸️ Cooldown active for:", sku);
      }
    }
  });
}

function waitForMessageContainer(callback) {
  const tryFind = () => {
    const container = document.querySelector('[class*="scrollerInner"]');
    if (container) callback(container);
    else setTimeout(tryFind, 500);
  };
  tryFind();
}

chrome.storage.sync.get(["skuList", "allProductsEnabled"], ({ skuList = [], allProductsEnabled = false }) => {
  const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE && node.querySelectorAll) {
          handleNewNode(node, skuList, allProductsEnabled); // fixed: pass third arg
        }
      });
    });
  });

  setTimeout(() => {
    waitForMessageContainer(container => {
      observer.observe(container, { childList: true, subtree: true });
      observerAttachedTime = Date.now(); // ensures cooldown timing works
    });
  }, 1000);
});
