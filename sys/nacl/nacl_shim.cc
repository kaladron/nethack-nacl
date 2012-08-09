extern "C" {

#include "hack.h"

}

void introff() { }

void intron() { }

uid_t getuid() {
  return 1001;
}

void winch() {
  fprintf(stderr, "WINCH called!\n");
}
