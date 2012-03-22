#!/bin/bash
export NACL_SDK_ROOT=~/nacl_sdk/pepper_18
export NACL_TOOLS=${NACL_SDK_ROOT}/tools
export FROG_DIR=~/clients/dart/dart/xcodebuild/Debug_ia32/dart-sdk/bin
export PATH=${NACL_SDK_ROOT}/toolchain/mac_x86_glibc/bin:${FROG_DIR}:${NACL_TOOLS}:$PATH
