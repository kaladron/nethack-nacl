#!/bin/bash
export NACL_SDK_ROOT=~/clients/naclports/src
export FROG_DIR=~/clients/dart/dart/out/Debug_ia32/dart-sdk/bin
export PATH=${NACL_SDK_ROOT}/toolchain/mac_x86_newlib/bin:${FROG_DIR}:$PATH
