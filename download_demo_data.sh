#!/bin/bash

set -e

data_dir=public/data/
demo_seq=2013_05_28_drive_0000_sync_002282_002514

mkdir -p $data_dir 
wget https://s3.eu-central-1.amazonaws.com/avg-projects/KITTI-360/data_gui/${demo_seq}.zip -P $data_dir

cd $data_dir
unzip ${demo_seq}.zip
cd ../../

echo Data Preparation Done!
