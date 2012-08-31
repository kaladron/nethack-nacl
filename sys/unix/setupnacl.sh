#!/bin/sh
# Copy files to their correct locations.

if [ -f sys/unix/Makefile.top ]; then cd sys/unix; fi

echo "Copying Makefiles."

[ -d ../../obj32 ] || mkdir ../../obj32
[ -d ../../obj64 ] || mkdir ../../obj64

if [ $# -gt 0 ] ; then
	ln -s sys/unix/Makefile.nacl ../../Makefile
	ln -s ../sys/unix/Makefile.dat ../../dat/Makefile
	ln -s ../sys/unix/Makefile.doc ../../doc/Makefile
	ln -s ../sys/unix/Makefile.utl ../../util/Makefile

	ln -s ../sys/unix/Makefile.src ../../obj32/Makefile
	ln -s ../sys/unix/Makefile.src ../../obj64/Makefile
	exit
fi

cp Makefile.nacl ../../Makefile
cp Makefile.dat ../../dat/Makefile
cp Makefile.doc ../../doc/Makefile
cp Makefile.utl ../../util/Makefile

cp Makefile.src ../../obj32/Makefile
cp Makefile.src ../../obj64/Makefile
