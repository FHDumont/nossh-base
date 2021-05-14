#!/bin/bash

if [[ ! -f "auth/nginx.htpasswd" ]]; then
    echo 
    echo "==> ERROR <=="
    echo "It's required a file the user/password"
    echo 
    echo "Create one running:"
    echo "htpasswd -bn user_name password > auth/nginx.htpasswd"
    echo 
    echo
    rm -rf auth
    mkdir -p auth
else 
    ./stop.sh

    mkdir -p ~/.ssh
    ssh-keygen -q -C "wetty-keyfile" -t ed25519 -N '' -f ~/.ssh/wetty 2>/dev/null <<< y >/dev/null
    cat ~/.ssh/wetty.pub >> ~/.ssh/authorized_keys
    chmod 700 ~/.ssh
    chmod 644 ~/.ssh/authorized_keys
    chmod 600 ~/.ssh/wetty

    IP_ADDRESS=`ip addr show | grep "\binet\b.*\bdocker0\b" | awk '{print $2}' | cut -d '/' -f 1`

    IP_ADDRESS=${IP_ADDRESS} docker-compose up -d --remove-orphans
fi