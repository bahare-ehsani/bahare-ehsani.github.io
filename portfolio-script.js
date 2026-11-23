(function(){
  "use strict";
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var nav = document.getElementById("nav");
  var route = document.getElementById("route");
  var nodesWrap = document.getElementById("nodes");
  var packet = document.getElementById("packet");
  var links = route ? Array.prototype.slice.call(route.querySelectorAll("a")) : [];

  /* ---- place route nodes under each nav link ---- */
  function placeNodes(){
    if (!nav || !nodesWrap) return;
    nodesWrap.innerHTML = "";
    if (window.innerWidth < 861) return;
    var navRect = nav.getBoundingClientRect();
    links.forEach(function(a){
      var r = a.getBoundingClientRect();
      var d = document.createElement("span");
      d.className = "node";
      d.style.left = (r.left - navRect.left + r.width/2) + "px";
      d.setAttribute("data-for", a.getAttribute("href"));
      nodesWrap.appendChild(d);
    });
    syncActive();
  }

  /* ---- active section ---- */
  var current = "";
  function setActive(id){
    current = id;
    links.forEach(function(a){ a.classList.toggle("active", a.getAttribute("href") === id); });
    if (!nodesWrap) return;
    Array.prototype.forEach.call(nodesWrap.children, function(n){
      n.classList.toggle("on", n.getAttribute("data-for") === id);
    });
  }
  function syncActive(){ setActive(current); }

  var sections = Array.prototype.slice.call(document.querySelectorAll("main section[id]"))
    .filter(function(s){ return s.id !== "top"; });
  if (sections.length && "IntersectionObserver" in window){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){ if (e.isIntersecting) setActive("#" + e.target.id); });
    }, { rootMargin: "-40% 0px -55% 0px", threshold: 0 });
    sections.forEach(function(s){ io.observe(s); });
  }

  /* ---- packet progress + gentle parallax ---- */
  var auraA = document.getElementById("auraA");
  var auraB = document.getElementById("auraB");
  var ticking = false;
  function onScroll(){
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function(){
      var doc = document.documentElement;
      var max = doc.scrollHeight - doc.clientHeight;
      var p = max > 0 ? (window.scrollY || doc.scrollTop) / max : 0;
      p = Math.max(0, Math.min(1, p));
      if (nav && packet){
        var pw = packet.offsetWidth;
        var travel = Math.max(0, nav.clientWidth - pw);
        packet.style.transform = "translateX(" + (pw / 2 + p * travel) + "px)";
      }
      if (!reduced){
        var y = window.scrollY || 0;
        if (auraA) auraA.style.transform = "translateY(" + (y * 0.06) + "px)";
        if (auraB) auraB.style.transform = "translateY(" + (y * -0.04) + "px)";
      }
      ticking = false;
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", function(){ placeNodes(); onScroll(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(placeNodes);
  placeNodes(); onScroll();

  /* ---- scroll reveals ---- */
  var revealEls = Array.prototype.slice.call(document.querySelectorAll("[data-reveal]"));
  if ("IntersectionObserver" in window && !reduced){
    var ro = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if (e.isIntersecting){ e.target.classList.add("in"); ro.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    revealEls.forEach(function(el){ ro.observe(el); });
  } else {
    revealEls.forEach(function(el){ el.classList.add("in"); });
  }

  /* ---- mobile menu ---- */
  var menu = document.getElementById("menu");
  var menuBtn = document.getElementById("menuBtn");
  var menuClose = document.getElementById("menuClose");
  function openMenu(){
    if (!menu) return;
    menu.classList.add("open");
    menu.setAttribute("aria-hidden","false");
    if (menuBtn) menuBtn.setAttribute("aria-expanded","true");
    document.body.style.overflow = "hidden";
    requestAnimationFrame(function(){
      var target = menuClose || menu.querySelector(".menu-links a");
      if (target) target.focus();
    });
  }
  function closeMenu(){
    if (!menu || !menu.classList.contains("open")) return;
    menu.classList.remove("open");
    menu.setAttribute("aria-hidden","true");
    if (menuBtn){
      menuBtn.setAttribute("aria-expanded","false");
      menuBtn.focus();
    }
    document.body.style.overflow = "";
  }
  if (menuBtn) menuBtn.addEventListener("click", openMenu);
  if (menuClose) menuClose.addEventListener("click", closeMenu);
  if (menu){
    Array.prototype.forEach.call(menu.querySelectorAll(".menu-links a"), function(a){
      a.addEventListener("click", closeMenu);
    });
  }
  document.addEventListener("keydown", function(e){
    if (e.key === "Escape" && menu && menu.classList.contains("open")) closeMenu();
  });

  /* ---- cursor glow in hero (fine pointers only) ---- */
  var hero = document.querySelector(".hero");
  var glow = document.getElementById("glow");
  if (glow){
    if (hero && window.matchMedia("(pointer: fine)").matches && !reduced){
      var gx = 600, gy = 260, tx = gx, ty = gy, glowRaf = null;
      var paintGlow = function(){
        glow.style.transform = "translate(" + (gx - 240) + "px," + (gy - 240) + "px)";
      };
      var stepGlow = function(){
        gx += (tx - gx) * 0.08; gy += (ty - gy) * 0.08;
        paintGlow();
        if (Math.abs(tx - gx) > 0.5 || Math.abs(ty - gy) > 0.5){
          glowRaf = requestAnimationFrame(stepGlow);
        } else {
          gx = tx; gy = ty;
          paintGlow();
          glowRaf = null;
        }
      };
      paintGlow();
      hero.addEventListener("pointermove", function(e){
        var r = hero.getBoundingClientRect();
        tx = e.clientX - r.left; ty = e.clientY - r.top;
        if (glowRaf === null) glowRaf = requestAnimationFrame(stepGlow);
      });
    } else {
      glow.style.display = "none";
    }
  }

})();