#!/bin/bash
export NACL_SDK_ROOT=/home/jeffbailey/Programming/nacl_sdk/pepper_20
export NACL_TOOLS=${NACL_SDK_ROOT}/tools
export DART=/home/jeffbailey/Programming/gclienttree/dart/dart/out/Debug_ia32/dart-sdk/bin
export PATH=${DART}:${NACL_SDK_ROOT}/toolchain/linux_x86_glibc/bin:${NACL_TOOLS}:${PATH}
