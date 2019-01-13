#!/usr/bin/env bash

docker build -f dev/docker/scripts/builder/Dockerfile -t audithsoftworks/uniform .

docker-compose up -d;
docker-compose ps;

docker exec uniform_builder_1 /bin/bash -c "
    npm install;
    optipng ./dist/images/agent/*.png;
    optipng ./dist/images/aristo/*.png;
    optipng ./dist/images/default/*.png;
    optipng ./dist/images/jeans/*.png;
    gulp;
";
