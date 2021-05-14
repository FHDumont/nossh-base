#!/bin/sh

sed -r '/^ssh-ed25519(.*)nossh-keyfile$/d' -i ~/.ssh/authorized_keys
rm -rf ~/.ssh/nossh*

docker-compose down

docker-compose rm -f

