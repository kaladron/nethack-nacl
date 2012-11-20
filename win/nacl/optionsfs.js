"use strict";

onmessage = function(e) {
  if (e.data[0] == "get") {
    get(e.data);
    return;
  } else if (e.data[0] == "put") {
    put(e.data);
    return;
  }
}

function get(e) {
  var fstatus = {};
  fstatus.create = true;
  fstatus.exclusive = false;

  var fs = webkitRequestFileSystemSync(PERSISTENT, 5*1024*1024);

  var confFile = fs.root.getFile('/nethack-userdata/home/.nethackrc', fstatus);

  var reader = new FileReaderSync();
  var str = reader.readAsBinaryString(confFile.file());
  postMessage(str);
}

function put(e) {
  var fstatus = {};
  fstatus.create = true;
  fstatus.exclusive = false;

  var fs = webkitRequestFileSystemSync(PERSISTENT, 5*1024*1024);

  var confFile = fs.root.getFile('/nethack-userdata/home/.nethackrc', fstatus);

  var writer = confFile.createWriter();
  var blob = new Blob([e[1]], {type: "text/plain;charset=UTF-8"});
  writer.truncate(0);
  writer.write(blob);
}
