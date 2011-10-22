// Copyright 2011 Google Inc. All Rights Reserved.
// Author: jeffbailey@google.com (Jeff Bailey)

#include "naclmsg.h"


void NaClMessage::Send() {
  data += "]";
  instance_->PostMessage(pp::Var(data));
  data = "[";
}

NaClMessage& NaClMessage::operator<<(int value) {
}

NaClMessage& NaClMessage::operator<<(const std::string& value) {
}

void NaClMessage::SetInstance(pp::Instance *instance) {
  instance_ = instance;
}

