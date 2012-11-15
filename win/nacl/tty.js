'use strict';

lib.ensureRuntimeDependencies();
hterm.init(Nethack.init);

function runit() {
  document.getElementById('header').classList.remove('header-initial');
}

setTimeout(runit, 3000);
