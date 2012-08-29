#!/bin/sh
# Copy files to their correct locations.

echo "Copying Makefiles."

[ -d ../../obj32 ] || mkdir ../../obj32
[ -d ../../obj64 ] || mkdir ../../obj64

cp Makefile.nacl ../../Makefile
cp Makefile.dat ../../dat/Makefile
cp Makefile.doc ../../doc/Makefile
cp Makefile.utl ../../util/Makefile

cp Makefile.src ../../obj32/Makefile
cp Makefile.src ../../obj64/Makefile
