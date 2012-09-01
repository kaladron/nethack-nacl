function toggleHelp() {
  document.querySelector('.help').classList.toggle('hidden');
  document.body.classList.toggle('dim');
}

(function() {
  var term = new Terminal('container');
  term.initFS(true, 1024 * 1024);

  if (document.location.hash) {
    var theme = document.location.hash.substring(1).split('=')[1];
    term.setTheme(theme);
  } else if (localStorage.theme) {
    term.setTheme(localStorage.theme);
  }

  document.body.addEventListener('keydown', function(e) {
    if (e.keyCode == 27) { // Esc
      toggleHelp();
      e.stopPropagation();
      e.preventDefault();
    }
  }, false);

  // Setup the DnD listeners for file drop.
  document.body.addEventListener('dragenter', function(e) {
    e.stopPropagation();
    e.preventDefault();
    this.classList.add('dropping');
  }, false);

  document.body.addEventListener('dragover', function(e) {
    e.stopPropagation();
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
  }, false);

  document.body.addEventListener('dragleave', function(e) {
   this.classList.remove('dropping');
  }, false);
  
  document.body.addEventListener('drop', function(e) {
    e.stopPropagation();
    e.preventDefault();
    this.classList.remove('dropping');
    term.addDroppedFiles(e.dataTransfer.files);
    term.output('<div>File(s) added!</div>');
  }, false);
})();
