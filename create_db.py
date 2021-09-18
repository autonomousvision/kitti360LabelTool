"""
Copyright 2018 Autonomous Vision Group

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated 
documentation files (the "Software"), to deal in the Software without restriction, including without limitation 
the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and 
to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE 
WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR 
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, 
ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
"""

import os
import sqlite3
import hashlib
from datetime import datetime

db_name = 'db/user_task.db'
now = datetime.now()
date = '%d-%02d-%02d' % (now.year, now.month, now.day)

# KEEP CONSISTENT with labelApp.py
num_subtask = 6

if not os.path.isfile(db_name):
# Setup db if it has not been created before
	conn = sqlite3.connect(db_name)

	conn.execute('CREATE TABLE user_task \
			 (id integer primary key, user_id text, task_id text, status int, editable int)')
	
	conn.execute('CREATE TABLE user \
			 (email text primary key, ack text, username text, password text, is_admin boolean)')

	conn.close()

	print('Table created successfully!')


conn = sqlite3.connect(db_name)

data_folder = 'db_import'
public_folder = 'public'

conn.execute('CREATE TABLE if not exists user_progress \
				(user_id text, task_id text, work_time int DEFAULT 0, work_date date)') 

columns = [i[1] for i in conn.execute('PRAGMA table_info( user )')]   
if 'offset' not in columns:
	conn.execute('ALTER TABLE user ADD COLUMN offset numeric')

for i in range(num_subtask):
	if 'subtask%d' % (i+1) not in columns:
		conn.execute('ALTER TABLE user ADD COLUMN subtask%d boolean DEFAULT 0' % (i+1))

columns = [i[1] for i in conn.execute('PRAGMA table_info( user_task )')]   
for i in range(num_subtask):
	if 'subtask%d' % (i+1) not in columns:
		conn.execute('ALTER TABLE user_task ADD COLUMN subtask%d boolean DEFAULT 0' % (i+1))

# drop information
# conn.execute('DELETE FROM user')
# conn.execute('DELETE FROM user_task')

def encrypt_password(password):
	# Do not use this algorithm in a real environment
	encrypted_pass = hashlib.sha1(password.encode('utf-8')).hexdigest()
	return encrypted_pass

# build up folder structure
results = public_folder + '/results'
print('buildup ' + results)
if not os.path.exists(results):
	os.makedirs(results)

backup = public_folder + '/backup'
print('buildup ' + backup)
if not os.path.exists(backup):
	os.makedirs(backup)

data_loc = public_folder + '/data'
print('buildup ' + data_loc)
if not os.path.exists(data_loc):
	os.makedirs(data_loc)


# read user files
with open(data_folder + '/users.txt') as f:
	for lines in f:
		l = lines.strip().split(' ')

		email = l[0]
		ack = l[1]
		username = l[2]
		password = encrypt_password(l[3])
		is_admin = int(l[4])
		offset = 0
		if len(l)>5:
			offset = float(l[5])

		# subtask is deprecated
		#subtask = [ int(i) for i in l[6].split(',') ]
		subtask = [0]
		

		cursor = conn.execute('SELECT email FROM user WHERE username = \'%s\'' % username)
		data = cursor.fetchone()
		if data is None:
			conn.execute('INSERT OR IGNORE INTO user (email, ack, username, password, is_admin, offset) \
				VALUES (\'%s\', \'%s\', \'%s\', \'%s\', %d,  %f)' \
				% (email, ack, username, password, is_admin, offset))   
		else:
			print('%s already exists, updating...' % username)
			conn.execute('UPDATE user SET email = \'%s\', password = \'%s\', is_admin = %d, offset = %f WHERE username = \'%s\'' % 
				(email, password, is_admin, offset, username))

		# assign mini-tasks
		for i in range(num_subtask):
			if i+1 in subtask:
				conn.execute('UPDATE user SET subtask%d = 1 WHERE username = \'%s\'' % (i+1, username))
			else:
				conn.execute('UPDATE user SET subtask%d = 0 WHERE username = \'%s\'' % (i+1, username))


cursor = conn.execute('SELECT email, username, password from user')
for row in cursor:
	print('email = %s' % row[0])
	print('username = %s' % row[1])

# read task files
with open(data_folder + '/taskLists.txt') as f:
	for lines in f:
		l = lines.strip().split(' ')

		task_name = l[0]
		user_name = l[1]
		editable = int(l[2])

		status = 0
		if editable != 1:
			status = 2


		cursor = conn.execute('SELECT status FROM user_task WHERE task_id = \'%s\' AND user_id = \'%s\'' % (task_name, user_name))
		data = cursor.fetchone()
		if data is None:
			conn.execute('INSERT OR IGNORE INTO user_task (task_id, user_id, status, editable) VALUES (\'%s\', \'%s\', %d, %d)' 
			% (task_name, user_name, status, editable)) 
		else:
			print('(%s, %s) already exists, skip' % (user_name, task_name))

		cursor = conn.execute('SELECT task_id FROM user_progress WHERE task_id = \'%s\' AND user_id = \'%s\'' % (task_name, user_name))
		data = cursor.fetchone()
		if data is None:
			conn.execute('INSERT OR IGNORE INTO user_progress (task_id, user_id, work_date) VALUES (\'%s\', \'%s\', \'%s\')' 
			% (task_name, user_name, date)) 
					
cursor = conn.execute('SELECT id, task_id, user_id from user_task')
for row in cursor:
	print('ID = %s' % row[0])
	print('taskname = %s' % row[1])
	print('username = %s\n' % row[2])

conn.commit()
conn.close()
