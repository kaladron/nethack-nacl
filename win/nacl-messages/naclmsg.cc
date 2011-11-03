// Copyright 2011 Google Inc. All Rights Reserved.
// Author: jeffbailey@google.com (Jeff Bailey)

#include "naclmsg.h"
#include <stdio.h>
#include <string>
#include <sstream>
#include <ppapi/cpp/var.h>
#include "nacl-mounts/base/MainThreadRunner.h"


NaClMessage::NaClMessage() : data_("[") {
}


NaClMessage& NaClMessage::operator<<(int value) {
  std::stringstream out;
  out << value;
  if (data_.size() > 1) {
    data_ += ",";
  }
  data_ += out.str();
  return *this;
}

static std::string EscapeString(const std::string& s) {
  std::string ret;

  for (std::string::const_iterator pos = s.begin(); pos != s.end(); ++pos) {
    if (*pos == '"') {
      ret += "\\\"";
    } else if (*pos == '\\') {
      ret += "\\\\";
    } else {
      ret += *pos;
    }
  }
  return ret;
}

NaClMessage& NaClMessage::operator<<(const std::string& value) {
  if (data_.size() > 1) {
    data_ += ",";
  }
  data_ += "\"";
  data_ += EscapeString(value);
  data_ += "\"";
  return *this;
}

NaClMessage& NaClMessage::operator<<(const EndOfMessage& value) {
  data_ += "]";
  fprintf(stderr, "PostMessage: %s\n", data_.c_str());
  instance_->PostMessage(pp::Var(data_));
  data_ = "[";
  return *this;
}

void NaClMessage::SetInstance(pp::Instance* instance) {
  instance_ = instance;
}

void NaClMessage::SetReply(const std::string& reply) {
  reply_ = reply;
  MainThreadRunner::PseudoThreadResume();
}

const std::string& NaClMessage::GetReply() {
  MainThreadRunner::PseudoThreadBlock();
  return reply_;
}

pp::Instance* NaClMessage::instance_ = 0;
std::string NaClMessage::reply_;
