#!/bin/bash

# 1. Setup the data with ./download_demo_data.sh

# 2. Configure the user-task assignment
cp db_import/users.txt.tmp db_import/users.txt
cp db_import/taskLists.txt.tmp db_import/taskLists.txt

# 3. Setup the database
mkdir -p db
python create_db.py

# 4. Setup the host and port number 
cp server.conf.tmp server.conf

# 5. Run the python app
python labelApp.py

