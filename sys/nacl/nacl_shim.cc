extern "C" {

#include "hack.h"

char erase_char, kill_char;

void gettty() { }

void settty(const char* unused) { }

void setftty() {
  iflags.cbreak = ON;
  iflags.echo = OFF;
}

void setctty() { }

}

void introff() { }

void intron() { }

<<<<<<< HEAD
//int isatty(int fd) {
//  return 1;
//}

=======
>>>>>>> 7d06465299cea3edc59252488684c7c24dcd2f49
uid_t getuid() {
  return 1001;
}
