#!/bin/bash

if [[ "${USER}" != "root" ]]; then
    echo "Run the script using sudo"
    exit 0
fi

echo ""
echo "==> Docker"
yum remove -y docker \
                  docker-client \
                  docker-client-latest \
                  docker-common \
                  docker-latest \
                  docker-latest-logrotate \
                  docker-logrotate \
                  docker-engine
yum install -y yum-utils
yum-config-manager -y \
    --add-repo \
    https://download.docker.com/linux/centos/docker-ce.repo
yum install -y docker-ce docker-ce-cli containerd.io
systemctl start docker
chkconfig docker on
groupadd docker
usermod -aG docker centos

echo ""
echo "==> Docker Compose"
curl -L "https://github.com/docker/compose/releases/download/1.29.1/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

echo ""
echo "==> Node"
curl -sL https://rpm.nodesource.com/setup_12.x | bash -
yum install nodejs -y

echo ""
echo "==> Other"
yum install httpd-tools -y


