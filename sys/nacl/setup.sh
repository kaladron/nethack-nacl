#!/bin/bash
export NACL_SDK_ROOT=/home/jeffbailey/Programming/svntree/naclports/src/
#export DART=/home/jeffbailey/Programming/gclienttree/dart/dart/frog/
#export DART=/home/jeffbailey/Programming/gclienttree/dart-bleeding/dart/frog/
export DART=/home/jeffbailey/Programming/gclienttree/dart-bleeding/dart/out/Debug_ia32/dart-sdk/bin
export PATH=${DART}:${NACL_SDK_ROOT}/toolchain/linux_x86_newlib/bin:$PATH
