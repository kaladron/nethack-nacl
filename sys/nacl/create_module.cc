/*
 * Copyright (c) 2011 The Native Client Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#include <ppapi/cpp/module.h>
#include <pthread.h>
#include <stdio.h>
#include "nacl-mounts/base/UrlLoaderJob.h"
#include "nacl-mounts/console/JSPipeMount.h"
#include "nacl-mounts/console/JSPostMessageBridge.h"


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

  mkdir("/usr", 0777);
  mkdir("/usr/games", 0777);
  chdir("/usr/games");

  {
    UrlLoaderJob *job = new UrlLoaderJob;
    job->set_url("nethack.sar");
    std::vector<char> data;
    job->set_dst(&data);
    runner->RunJob(job);
    int fh = open("/nethack.sar", O_CREAT | O_WRONLY);
    write(fh, &data[0], data.size());
    close(fh);
  }

  simple_tar_extract("/nethack.sar");

  // Setup config file.
  {
    mkdir("/myhome", 0777);
    int fh = open("/myhome/.nethackrc", O_CREAT | O_WRONLY);
    const char config[] = "OPTIONS=color\n";
    write(fh, config, sizeof(config) - 1);
    close(fh);
  }

  const char *argv[] = {"nethack"};
  nethack_main(1, const_cast<char **>(argv));

  return 0;
}


class NethackInstance : public pp::Instance {
 public:
  explicit NethackInstance(PP_Instance instance) : pp::Instance(instance) {
    jspipe_ = NULL;
    jsbridge_ = NULL;
  }

  virtual ~NethackInstance() {
    if (jspipe_) delete jspipe_;
    if (jsbridge_) delete jsbridge_;
    if (runner_) delete runner_;
  }

  virtual bool Init(uint32_t argc, const char* argn[], const char* argv[]) {
    runner_ = new MainThreadRunner(this);
    jsbridge_ = new JSPostMessageBridge(runner_);
    jspipe_ = new JSPipeMount();
    jspipe_->set_outbound_bridge(jsbridge_);
    // Replace stdin, stdout, stderr with js console.
    mount("jspipe", "/jspipe", 0, jspipe_);
    close(0);
    close(1);
    close(2);
    int fd;
    fd = open("/jspipe/0", O_RDONLY);
    assert(fd == 0);
    fd = open("/jspipe/1", O_WRONLY);
    assert(fd == 1);
    fd = open("/jspipe/2", O_WRONLY);
    assert(fd == 2);

    pthread_create(&nethack_thread_, NULL, nethack_init, runner_);
    return true;
  }

  virtual void HandleMessage(const pp::Var& message) {
    std::string msg = message.AsString();
    jspipe_->Receive(msg.c_str(), msg.size());
  }

 private:
  pthread_t nethack_thread_;
  JSPipeMount *jspipe_;
  JSPostMessageBridge *jsbridge_;
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
