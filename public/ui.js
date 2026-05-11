(function () {
  function toast(msg) {
    var el = document.getElementById("toast");
    if (!el) return;
    el.textContent = msg;
    el.classList.add("toast--show");
    clearTimeout(el._t);
    el._t = setTimeout(function () {
      el.classList.remove("toast--show");
    }, 2200);
  }

  document.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-fill-user]");
    if (btn) {
      var u = document.querySelector('input[name="username"]');
      var p = document.querySelector('input[name="password"]');
      if (u) u.value = btn.getAttribute("data-fill-user") || "";
      if (p) p.value = btn.getAttribute("data-fill-pass") || "";
      toast("Fields filled — submit when ready.");
      return;
    }

    btn = e.target.closest("[data-copy]");
    if (btn) {
      var text = btn.getAttribute("data-copy") || "";
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(
          function () {
            toast("Copied to clipboard.");
          },
          function () {
            toast("Copy failed — select text manually.");
          }
        );
      } else {
        toast("Clipboard unavailable — select text manually.");
      }
    }
  });
})();
