#!/bin/sh
# Copy files to their correct locations.

echo "Copying Makefiles."

mkdir ../../obj32
mkdir ../../obj64

cp Makefile.top ../../Makefile
cp Makefile.dat ../../dat/Makefile
cp Makefile.doc ../../doc/Makefile
cp Makefile.utl ../../util/Makefile

cp Makefile.src ../../obj32/Makefile
cp Makefile.src ../../obj64/Makefile
