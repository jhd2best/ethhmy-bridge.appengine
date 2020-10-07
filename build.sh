#!/bin/bash

sudo docker build -f Dockerfile.build -t ethhmy-bridge.be.build .
rm -rf artifacts
mkdir artifacts
sudo docker run -i --rm -v ${PWD}/artifacts:/mnt/artifacts ethhmy-bridge.be.build /bin/bash << COMMANDS
cp /app/ethhmy-bridge-be.tgz /mnt/artifacts
chown -R $(id -u):$(id -g) /mnt/artifacts
COMMANDS

pushd artifacts
tar xfz ethhmy-bridge-be.tgz
popd

sudo docker build -f Dockerfile.be -t ethhmy-bridge.be .
