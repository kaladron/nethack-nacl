/*
 * Copyright (c) 2011 The Native Client Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#include <ppapi/cpp/module.h>
#include <fcntl.h>
#include <pthread.h>
#include <stdio.h>
#include <sys/stat.h>
#include <ppapi/cpp/instance.h>
#include "nacl-mounts/AppEngine/AppEngineMount.h"
#include "nacl-mounts/base/MainThreadRunner.h"
#include "nacl-mounts/base/UrlLoaderJob.h"
#include "nacl-mounts/console/JSPipeMount.h"
#include "nacl-mounts/console/JSPostMessageBridge.h"
#include "../../win/nacl-messages/naclmsg.h"

#define TARFILE "nethack.tar"
#define USE_PSEUDO_THREADS

extern "C" {
int nethack_main(int argc, char *argv[]);
int mount(const char *type, const char *dir, int flags, void *data);
int simple_tar_extract(const char *path);
}


static void *nethack_init(void *arg) {
  MainThreadRunner *runner = reinterpret_cast<MainThreadRunner*>(arg);

  /* Setup home directory to a known location. */
  setenv("HOME", "/myhome", 1);
  /* Setup terminal type. */
  setenv("TERM", "xterm-color", 1);
  /* Blank out USER and LOGNAME. */
  setenv("USER", "", 1);
  setenv("LOGNAME", "", 1);
  /* Indicate where we decompress things. */
  setenv("NETHACKDIR", "/usr/games/lib/nethackdir", 1);
  /* Set location of config file. */
  setenv("NETHACKOPTIONS", "/myhome/NetHack.cnf", 1);

  mkdir("/usr", 0777);
  mkdir("/usr/games", 0777);
  mkdir("/usr/games/lib", 0777);
  mkdir("/usr/games/lib/nethackdir", 0777);
  mkdir("/usr/games/lib/nethackdir/save", 0777);
  AppEngineMount* aem = new AppEngineMount(
      runner, "http://naclhack.appspot.com/_file");
  int ret = mount("AppEngine", "/usr/games/lib/nethackdir/save", 0, aem);
  assert(ret == 0);                                             
  chdir("/usr/games/lib/nethackdir");

  {
    UrlLoaderJob *job = new UrlLoaderJob;
    job->set_url(TARFILE);
    std::vector<char> data;
    job->set_dst(&data);
    runner->RunJob(job);
    int fh = open("/" TARFILE, O_CREAT | O_WRONLY);
    write(fh, &data[0], data.size());
    close(fh);
  }

  simple_tar_extract("/" TARFILE);

  const char *argv[] = {"nethack"};
  nethack_main(1, const_cast<char **>(argv));

  return 0;
}


class NethackInstance : public pp::Instance {
 public:
  explicit NethackInstance(PP_Instance instance) : pp::Instance(instance) {
    NaClMessage::SetInstance(this);
    jspipe_ = NULL;
    jsbridge_ = NULL;
  }

  virtual ~NethackInstance() {
    if (runner_) delete runner_;
    if (jspipe_) delete jspipe_;
    if (jsbridge_) delete jsbridge_;
  }

  virtual bool Init(uint32_t argc, const char* argn[], const char* argv[]) {
    runner_ = new MainThreadRunner(this);

    mkdir("/myhome", 0777);
    FILE* cfg_file = fopen("/myhome/NetHack.cnf", "w+");
    if (cfg_file == NULL) {
      fprintf(stderr, "Cannot open config file!\n");
      exit(1);
    }


    const char**argnwalk = argn;
    const char**argvwalk = argv;
    uint32_t argcwalk = 0;
    for (;argcwalk < argc; argnwalk++, argvwalk++, argcwalk++) {
      // Skip DOM noise.
      if (!strcmp(*argnwalk, "width")) continue;
      if (!strcmp(*argnwalk, "height")) continue;
      if (!strcmp(*argnwalk, "data")) continue;
      if (!strcmp(*argnwalk, "type")) continue;
      if (!strcmp(*argnwalk, "src")) continue;
      if (!strcmp(*argnwalk, "@dev")) continue;

      fprintf(stderr, "argn: %s, argv: %s\n", *argnwalk, *argvwalk);

      if (!strcmp(*argvwalk, "")) {
        fprintf(cfg_file, "OPTIONS=%s\n", *argnwalk);
      } else {
        fprintf(cfg_file, "OPTIONS=%s:%s\n", *argnwalk, *argvwalk);
      }
    }
    fclose(cfg_file);

    jsbridge_ = new JSPostMessageBridge(runner_);
    jspipe_ = new JSPipeMount();
    jspipe_->set_outbound_bridge(jsbridge_);
#ifdef USE_PSEUDO_THREADS
    jspipe_->set_using_pseudo_thread(true);
#endif
    // Replace stdin, stdout with js console.
    mount("jspipe", "/jspipe", 0, jspipe_);
    close(0);
    close(1);
    int fd;
    fd = open("/jspipe/0", O_RDONLY);
    assert(fd == 0);
    fd = open("/jspipe/1", O_WRONLY);
    assert(fd == 1);
    // Open pipe for messages.
    fd = open("/jspipe/3", O_RDWR);
    assert(fd == 3);
    
#ifdef USE_PSEUDO_THREADS
    MainThreadRunner::PseudoThreadFork(nethack_init, runner_);
#else
    pthread_create(&nethack_thread_, NULL, nethack_init, runner_);
#endif
    return true;
  }

  virtual void HandleMessage(const pp::Var& message) {
    std::string msg = message.AsString();
    jspipe_->Receive(msg.c_str(), msg.size());
  }

 private:
  pthread_t nethack_thread_;
  JSPipeMount* jspipe_;
  JSPostMessageBridge* jsbridge_;
  MainThreadRunner *runner_;
};


class NethackModule : public pp::Module {
 public:
  virtual pp::Instance* CreateInstance(PP_Instance instance) {
    return new NethackInstance(instance);
  }
};


namespace pp {
  Module *CreateModule() {
    return new NethackModule();
  }
}
