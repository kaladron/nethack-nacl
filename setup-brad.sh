#!/bin/bash
export NACL_SDK_ROOT=~/nacl_sdk/pepper_20
export NACL_TOOLS=${NACL_SDK_ROOT}/tools
export DART_DIR=~/src/dart/dart/out/DebugIA32/dart-sdk/bin
export PATH=${NACL_SDK_ROOT}/toolchain/linux_x86_glibc/bin:${DART_DIR}:${NACL_TOOLS}:$PATH
