// --- Product Catalog (basic demo data) ---
const PRODUCTS = [
  {id:"cupcake-vanilla", name:"Vanilla Cupcake", price:3.50, img:"https://picsum.photos/seed/cupcake1/400/300", alt:"Vanilla cupcake with frosting"},
  {id:"cupcake-chocolate", name:"Chocolate Cupcake", price:3.75, img:"https://picsum.photos/seed/cupcake2/400/300", alt:"Chocolate cupcake with sprinkles"},
  {id:"cookie-chip", name:"Chocolate Chip Cookies (6)", price:5.00, img:"https://picsum.photos/seed/cookie1/400/300", alt:"Plate of chocolate chip cookies"},
  {id:"cheesecake-mini", name:"Mini Cheesecake", price:4.25, img:"https://picsum.photos/seed/cheesecake/400/300", alt:"Mini cheesecake with berries"},
  {id:"loaf-banana", name:"Banana Bread Loaf", price:6.50, img:"https://picsum.photos/seed/bananabread/400/300", alt:"Banana bread loaf on wooden board"},
  {id:"cake-redvelvet", name:"Red Velvet Cake Slice", price:4.00, img:"https://picsum.photos/seed/redvelvet/400/300", alt:"Red velvet cake slice"}
];

// --- Utilities ---
const $  = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => [...root.querySelectorAll(sel)];
const fmt = new Intl.NumberFormat(undefined, {style:"currency", currency:"USD"});

// --- Storage keys ---
const CART_KEY   = "sdb_cart_v1";
const CUSTOM_KEY = "sdb_custom_order_v1";
const ORDER_KEY  = "sdb_order_processed_v1"; // marks processed order for this tab/session

// --- Cart in localStorage ---
function getCart(){ try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch { return []; } }
function setCart(items){ localStorage.setItem(CART_KEY, JSON.stringify(items)); updateCartBadge(); }
function addToCart(productId){
  const cart = getCart();
  const idx = cart.findIndex(i => i.id === productId);
  if (idx >= 0) cart[idx].qty += 1; else cart.push({id: productId, qty: 1});
  setCart(cart);
  alert("Added to cart!");
}
function removeFromCart(productId){ setCart(getCart().filter(i => i.id !== productId)); }
function updateCartBadge(){
  const el = $("#cartCount"); if(!el) return;
  el.textContent = getCart().reduce((sum, i) => sum + i.qty, 0);
}

// --- Subscribe feature ---
function initSubscribe(){
  const form = $("#subscribeForm"), email = $("#subscribeEmail"), msg = $("#subscribeMessage");
  if(!form || !email) return;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if(!email.value || !email.value.includes("@")){ msg.textContent = "Please enter a valid email address."; return; }
    msg.textContent = "Thanks! You’re subscribed.";
    form.reset();
  });
}

// --- Feedback form validation ---
function initFeedback(){
  const form = $("#feedbackForm"), msg = $("#feedbackMsg"); if(!form) return;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const name = data.get("name")?.trim();
    const email = data.get("email")?.trim();
    const message = data.get("message")?.trim();
    if(!name || !email?.includes("@") || !message){ msg.textContent = "Please complete all fields with a valid email."; return; }
    msg.textContent = "Thanks for your feedback!";
    form.reset();
  });
}

// --- Custom order (sessionStorage) ---
function initCustomOrder(){
  const form = $("#customOrderForm"), msg = $("#customMsg"); if(!form) return;

  // Prefill from session storage
  try {
    const saved = JSON.parse(sessionStorage.getItem(CUSTOM_KEY));
    if(saved){ for(const [k,v] of Object.entries(saved)){ const input = form.querySelector(`[name="${k}"]`); if(input) input.value = v; } }
  } catch {}

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    for(const [k,v] of Object.entries(data)){ if(!v){ msg.textContent = "Please complete all fields."; return; } }
    sessionStorage.setItem(CUSTOM_KEY, JSON.stringify(data));
    msg.textContent = "Custom order saved for this session!";
  });
}

// --- Render product cards ---
function productCard(p){
  const el = document.createElement("article");
  el.className = "card";
  el.innerHTML = `
    <img src="${p.img}" alt="${p.alt}">
    <h3>${p.name}</h3>
    <p>${fmt.format(p.price)}</p>
    <button type="button" data-id="${p.id}">Add to Cart</button>
  `;
  el.querySelector("button").addEventListener("click", () => addToCart(p.id));
  return el;
}
function renderFeatured(){ const wrap = $("#featuredProducts"); if(!wrap) return; wrap.innerHTML = ""; PRODUCTS.slice(0,3).forEach(p => wrap.appendChild(productCard(p))); }
function renderAllProducts(){
  const grid = $("#productGrid"); if(!grid) return;
  grid.innerHTML = "";
  const q = ($("#searchInput")?.value || "").toLowerCase();
  PRODUCTS.filter(p => p.name.toLowerCase().includes(q)).forEach(p => grid.appendChild(productCard(p)));
}

// --- Render cart page (ALWAYS shows summary with buttons) ---
function renderCart(){
  const el = $("#cartContainer"); if(!el) return;

  const cart = getCart();
  const list = document.createElement("div");
  list.className = "stack";

  // Items
  let total = 0;
  if (cart.length > 0){
    cart.forEach(item => {
      const product = PRODUCTS.find(p => p.id === item.id); if(!product) return;
      const line = product.price * item.qty; total += line;
      const row = document.createElement("div");
      row.className = "card";
      row.innerHTML = `
        <div class="grid" style="grid-template-columns:80px 1fr auto; gap:1rem; align-items:center">
          <img src="${product.img}" alt="${product.alt}" style="height:60px; object-fit:cover; border-radius:.5rem">
          <div><strong>${product.name}</strong><br/>Qty: ${item.qty} × ${fmt.format(product.price)}</div>
          <div style="text-align:right">
            <div>${fmt.format(line)}</div>
            <button type="button" data-id="${item.id}" class="btn-secondary" style="margin-top:.5rem">Remove</button>
          </div>
        </div>
      `;
      row.querySelector("button").addEventListener("click", () => { removeFromCart(item.id); renderCart(); });
      list.appendChild(row);
    });
  } else {
    list.appendChild(Object.assign(document.createElement("div"), { className: "card", innerHTML: "Your cart is empty." }));
  }

  // Summary + Buttons
  const summary = document.createElement("div");
  summary.className = "card";
  summary.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center">
      <strong>Total</strong>
      <strong>${fmt.format(total)}</strong>
    </div>
    <div class="stack" style="margin-top:.75rem">
      <button id="processOrder">Process Order</button>
      <button id="clearCart">Clear Cart</button>
      <p class="help">Demo only. You can process a saved custom order even if the cart is empty.</p>
    </div>
  `;
  list.appendChild(summary);

  el.innerHTML = "";
  el.appendChild(list);

  // Clear Cart
  $("#clearCart")?.addEventListener("click", () => {
    if (confirm("Are you sure you want to clear the cart?")) {
      setCart([]); renderCart(); alert("Cart cleared!");
    }
  });

  // Process Order (first click success, second click says 'already processed')
  $("#processOrder")?.addEventListener("click", () => {
    if (sessionStorage.getItem(ORDER_KEY) === "1") { alert("Your order has already been processed. Thank you!"); return; }
    const hasCart = getCart().length > 0;
    const hasCustom = !!sessionStorage.getItem(CUSTOM_KEY);
    if (!hasCart && !hasCustom) { alert("Your cart is empty. Add items or save a custom order first."); return; }
    sessionStorage.setItem(ORDER_KEY, "1");
    setCart([]); sessionStorage.removeItem(CUSTOM_KEY);
    renderCart(); renderCustomSummary();
    alert("Order received! We will contact you to confirm details.");
  });

  // Help you find the button visually
  document.querySelector('#processOrder')?.scrollIntoView({behavior:'smooth', block:'center'});
}

// --- Custom order summary on cart page ---
function renderCustomSummary(){
  const box = $("#customSummary"); if(!box) return;
  try{
    const data = JSON.parse(sessionStorage.getItem(CUSTOM_KEY));
    if(!data){ box.innerHTML = "<p class='help'>No custom order saved this session.</p>"; return; }
    box.innerHTML = `
      <ul class="stack" style="margin:0; padding-left:1rem">
        <li><strong>Size:</strong> ${data.size}</li>
        <li><strong>Flavor:</strong> ${data.flavor}</li>
        <li><strong>Frosting:</strong> ${data.frosting}</li>
        <li><strong>Pickup Date:</strong> ${data.pickupDate}</li>
        <li><strong>Notes:</strong> ${data.notes}</li>
      </ul>
    `;
  } catch { box.innerHTML = "<p class='help'>Could not load custom order.</p>"; }
}

// --- Mobile nav toggle ---
function initNav(){
  const btn = $("#navToggle"), nav = $("#siteNav"); if(!btn || !nav) return;
  btn.addEventListener("click", () => { const open = nav.classList.toggle("open"); btn.setAttribute("aria-expanded", String(open)); });
}

// --- Search on products page ---
function initSearch(){ const input = $("#searchInput"); if(!input) return; input.addEventListener("input", renderAllProducts); }

// --- Page bootstrapping ---
document.addEventListener("DOMContentLoaded", () => {
  initNav(); initSubscribe(); initFeedback(); initCustomOrder(); initSearch(); updateCartBadge();
  renderFeatured(); renderAllProducts(); renderCart(); renderCustomSummary();
});

