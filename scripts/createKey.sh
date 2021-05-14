#!/bin/bash

mkdir -p ~/.ssh
ssh-keygen -q -C "nossh-keyfile" -t ed25519 -N '' -f ~/.ssh/nossh 2>/dev/null <<< y >/dev/null
cat ~/.ssh/nossh.pub >> ~/.ssh/authorized_keys
chmod 700 ~/.ssh
chmod 644 ~/.ssh/authorized_keys
chmod 600 ~/.ssh/nossh
