#!/usr/bin/env bash

# Save a backup
mv "../dev" "../dev_old_$(date +%s)"

# Clone the repo
git clone -b dev git@github.com:ELVIS-Project/elvis-database.git ../dev

# Set up the virtualenv
virtualenv -p python3 ../dev/.env

# Install requirements
source ../dev/.env/bin/activate
pip install -r ../dev/requirements.txt

# Perform Django management tasks
python ../dev/manage.py collectstatic --noinput
python ../dev/manage.py migrate --noinput
