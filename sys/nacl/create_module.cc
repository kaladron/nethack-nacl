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
#include "nacl-mounts/base/MainThreadRunner.h"
#include "nacl-mounts/base/UrlLoaderJob.h"
#include "../../win/nacl-messages/naclmsg.h"

#define TARFILE "nethack.tar"

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

  mkdir("/usr", 0777);
  mkdir("/usr/games", 0777);
  mkdir("/usr/games/lib", 0777);
  mkdir("/usr/games/lib/nethackdir", 0777);
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

  // Setup config file.
  {
    mkdir("/myhome", 0777);
    int fh = open("/myhome/.nethackrc", O_CREAT | O_WRONLY);
    const char config[] = "OPTIONS=color\n";
    write(fh, config, sizeof(config) - 1);
    close(fh);
  }

  fprintf(stderr, "started!!!");

  const char *argv[] = {"nethack"};
  nethack_main(1, const_cast<char **>(argv));

  return 0;
}


class NethackInstance : public pp::Instance {
 public:
  explicit NethackInstance(PP_Instance instance) : pp::Instance(instance) {
    NaClMessage::SetInstance(this);
  }

  virtual ~NethackInstance() {
    if (runner_) delete runner_;
  }

  virtual bool Init(uint32_t argc, const char* argn[], const char* argv[]) {
    runner_ = new MainThreadRunner(this);

    MainThreadRunner::PseudoThreadFork(nethack_init, runner_);
    return true;
  }

  virtual void HandleMessage(const pp::Var& message) {
    std::string msg = message.AsString();
    NaClMessage::SetReply(msg);
  }

 private:
  pthread_t nethack_thread_;
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
