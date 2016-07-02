#!/usr/bin/env bash

docker build -f dev/docker/scripts/builder/Dockerfile -t audithsoftworks/uniform .

#docker-compose -f docker-compose.yml pull;
#docker-compose -f docker-compose.yml up -d;
#docker-compose -f docker-compose.yml ps;

#docker exec uniform_builder_1 /bin/bash -c "echo $(docker inspect -f '{{ .NetworkSettings.IPAddress }}' basis_nginx_1) basis.audith.org | tee -a /etc/hosts";

#test -f .env || cat .env.example | sed s/DB_HOST=.*/DB_HOST=mysql56/g | sed s/DB_USERNAME=.*/DB=mysql/g | sed s/DB_PASSWORD=.*//g | tee .env;

docker exec uniform_builder_1 /bin/bash -c "
    npm install;
    gulp;
";

#docker-compose -f docker-compose.yml stop;

#sleep 10;

#docker rm $(docker ps -a | grep "Exited" | awk "{print \$1}")
#docker rmi $(docker images | grep "<none>" | awk "{print \$3}");
