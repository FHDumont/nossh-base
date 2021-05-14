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
    ./scripts/createKey.sh

    IP_ADDRESS=`ip addr show | grep "\binet\b.*\bdocker0\b" | awk '{print $2}' | cut -d '/' -f 1`
    IP_ADDRESS=${IP_ADDRESS} docker-compose up -d --remove-orphans #--build

    if [[ -f /home/centos/controller_dns.txt ]]; then
        CONTROLLER_DNS=$(</home/centos/controller_dns.txt)
    fi
    ENVIRONMENT_TYPE=CONTROLLER CONTROLLER_DNS=${CONTROLLER_DNS} node app/index.js

fi
