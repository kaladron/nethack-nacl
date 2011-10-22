// Copyright 2011 Google Inc. All Rights Reserved.
// Author: jeffbailey@google.com (Jeff Bailey)

#include "naclmsg.h"
#include <string>
#include <sstream>
#include <ppapi/cpp/var.h>


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
  return s;
}

NaClMessage& NaClMessage::operator<<(const std::string& value) {
  data_ += "\"";
  data_ += EscapeString(value);
  data_ += "\"";
  return *this;
}

NaClMessage& NaClMessage::operator<<(const EndOfMessage& value) {
  data_ += "]";
  instance_->PostMessage(pp::Var(data_));
  data_ = "[";
  return *this;
}

void NaClMessage::SetInstance(pp::Instance* instance) {
  instance_ = instance;
}

pp::Instance* NaClMessage::instance_ = 0;
