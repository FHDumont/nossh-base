#!/bin/sh

sed -r '/^ssh-ed25519(.*)wetty-keyfile$/d' -i ~/.ssh/authorized_keys
rm -rf ~/.ssh/wetty*

docker-compose down
