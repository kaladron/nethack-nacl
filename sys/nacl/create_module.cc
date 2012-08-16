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
#include "nacl-mounts/base/KernelProxy.h"
#include "nacl-mounts/base/MainThreadRunner.h"
#include "nacl-mounts/base/UrlLoaderJob.h"
#include "nacl-mounts/console/JSPipeMount.h"
#include "nacl-mounts/console/JSPostMessageBridge.h"
#include "nacl-mounts/pepper/PepperMount.h"
#include "../../win/nacl-messages/naclmsg.h"

#define TARFILE "nethack.tar"
#define USE_PSEUDO_THREADS

extern "C" {
int nethack_main(int argc, char *argv[]);
int simple_tar_extract_to(const char *path, const char *dst);
}


class NethackInstance : public pp::Instance {
 public:
  explicit NethackInstance(PP_Instance instance) : pp::Instance(instance) {
    NaClMessage::SetInstance(this);
    jspipe_ = NULL;
    jsbridge_ = NULL;
    fs_ = NULL;
  }

  virtual ~NethackInstance() {
    if (runner_) delete runner_;
    if (jspipe_) delete jspipe_;
    if (jsbridge_) delete jsbridge_;
    if (fs_) delete fs_;
    pthread_join(nethack_thread_, NULL);
  }

  static void *GameThread(void *arg) {
    NethackInstance *inst = static_cast<NethackInstance*>(arg);
    inst->Run();
    return 0;
  }

  void Run() {
    /* Setup home directory to a known location. */
    setenv("HOME", "/mnt/home", 1);
    /* Setup terminal type. */
    setenv("TERM", "xterm-color", 1);
    /* Blank out USER and LOGNAME. */
    setenv("USER", "", 1);
    setenv("LOGNAME", "", 1);
    /* Indicate where we decompress things. */
    setenv("HACKDIR", "/nethack", 1);
    /* Set location of config file. */
    setenv("NETHACKOPTIONS", "/mnt/home/NetHack.cnf", 1);

    // Setup game directory.
    kp_->mkdir("/nethack", 0777);
    kp_->mkdir("/mnt", 0777);

    // Mount local storage.
    {
      PepperMount* pm = new PepperMount(runner_, fs_, 20 * 1024 * 1024);
      pm->SetPathPrefix("/nethack-userdata");
      int ret = kp_->mount("/mnt", pm);
      assert(ret == 0); 
    }

    kp_->mkdir("/mnt/home", 0777);
    kp_->mkdir("/mnt/playground", 0777);
    kp_->mkdir("/mnt/playground/nethack", 0777);
    kp_->mkdir("/mnt/playground/nethack/save", 0777);

    {
      UrlLoaderJob *job = new UrlLoaderJob;
      job->set_url(TARFILE);
      std::vector<char> data;
      job->set_dst(&data);
      runner_->RunJob(job);
      int fh = open("/" TARFILE, O_CREAT | O_WRONLY);
      write(fh, &data[0], data.size());
      close(fh);
    }

    simple_tar_extract_to("/" TARFILE, "/nethack");

    const char *argv[] = {"nethack"};
    nethack_main(1, const_cast<char **>(argv));
  }

  virtual bool Init(uint32_t argc, const char* argn[], const char* argv[]) {
    fs_ = new pp::FileSystem(this, PP_FILESYSTEMTYPE_LOCALPERSISTENT);
    runner_ = new MainThreadRunner(this);
    kp_ = KernelProxy::KPInstance();

    jsbridge_ = new JSPostMessageBridge(runner_);
    jspipe_ = new JSPipeMount();
    jspipe_->set_outbound_bridge(jsbridge_);
#ifdef USE_PSEUDO_THREADS
    jspipe_->set_using_pseudo_thread(true);
#endif
    // Replace stdin, stdout with js console.
    kp_->mount("/jspipe", jspipe_);
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
    MainThreadRunner::PseudoThreadFork(&GameThread, this);
#else
    pthread_create(&nethack_thread_, NULL, &GameThread, this);
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
  KernelProxy *kp_;
  pp::FileSystem *fs_;
};


class NethackModule : public pp::Module {
 public:
  virtual pp::Instance* CreateInstance(PP_Instance instance) {
    return new NethackInstance(instance);
  }
  virtual ~NethackModule() { }
};


namespace pp {
  Module *CreateModule() {
    return new NethackModule();
  }
}
