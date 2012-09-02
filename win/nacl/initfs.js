/**
 * Sets up the default options file on the filesystem.
 *
 * This is done in a web worker to avoid the annoying async APIs.
 */

onmessage = function(e) {
  try {
  var fstatus = {};
  fstatus.create = true;
  fstatus.exclusive = false;

  var fs = webkitRequestFileSystemSync(PERSISTENT, 5*1024*1024);
  var dirEntry = fs.root.getDirectory('nethack-userdata', fstatus);
  var homeDir = dirEntry.getDirectory('home', fstatus);

  fstatus.exclusive = true;

  var confFile = fs.root.getFile('/nethack-userdata/home/.nethackrc', fstatus);
  var writer = confFile.createWriter();
  var blob = new Blob(
    ['OPTIONS=windowtype:tty,hilite_pet,color\n',
     'OPTIONS=pickup_types:\$\n'],  {type: "text/plain;charset=UTF-8"});

  writer.write(blob);
  } catch (err) {
    // Fall through.  The file probably exists.
  }

  postMessage(true);
}

