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

from datetime import datetime
import os
import sys
import time
import base64

import cherrypy
import sqlite3
from PIL import Image
from io import BytesIO

from user_auth import AuthController, require, member_of
from jinja2 import Environment, FileSystemLoader
from create_db import num_subtask


TASK_KEY = '_cp_task'
MODE_KEY = '_cp_mode'

env = Environment(loader = FileSystemLoader('views'))


# --------------------------------------------------- 
# Parse the task
# @param username       username
# @param is_admin       whether the user is admin, boolean
# @param data       	user data queried from user table
# @param data_progress  progress data queried from progress table
# @return               A list of tasks
# --------------------------------------------------- 
def parseTask(username, is_admin, mode, data, data_progress):
	lists = []
	map = {}
	key_value = {0: 'new', 1: 'ongoing', 2: 'finished'}
	mode_value = {0: 'readonly', 1: 'normal', 2: 'playground'}
	index = 0 
	for row in data:

		# list tasks w.r.t. to user
		m_name = row[1]
		p_name = row[1]
		subtasks = []
		editable = row[3]

		time = 0
		for r in data_progress:
			if (r[0] == row[0] and r[1] == p_name):
				time = r[2]
				break
		h = int (time/3600)
		m = int (time/60) % 60
		time_str = "%02d:%02d" % ( h, m )
		
		m_task = {
			'name': row[0],
			'status': key_value[row[2]],
			'editable': mode_value[editable],
			'time': time,
			'substatus': subtasks,
			'first_frame': int(row[0][27:33])
		} 
	
	        user_id = row[1]
	        cherrypy.session[TASK_KEY]['%s_%s' % (m_task['name'], user_id)] = m_task['editable']
	        
	        if m_name in map:
	        	lists[map[m_name]]['tasklist'].append(m_task)
	        else:
	        	task_info = {
	        		 'userid': m_name,
	        		 'tasklist': [],
	        	}

	        	task_info['tasklist'].append(m_task)
	        	lists.append(task_info)
	        	map[m_name] = index
	        	index = len(lists)

	return lists


class RestrictedArea:
	
	# all methods in this controller (and subcontrollers) is
	# open only to members of the admin group
	
	_cp_config = {
		'auth.require': [member_of('admin')]
	}
	
	@cherrypy.expose
	def index(self):
		return """This is the admin only area."""


class Root:
	
	_cp_config = {
		'tools.sessions.on': True,
		'tools.auth.on': True
	}
	
	auth = AuthController()
	
	restricted = RestrictedArea()
	
	@cherrypy.expose
	@require()
	# --------------------------------------------------- 
	# Index page
	# @param curr_task       current task that user is doing before redirecting to the index page
	# @return                rendered html of task lists
	# --------------------------------------------------- 
	def index(self, curr_task='None'):

		# delete lockfile when loading the list page
		if curr_task != 'None':
			lockfile = 'public/lockfile/' + curr_task + '.lock'
			if os.path.isfile(lockfile):
				os.remove(lockfile)

		username = cherrypy.request.login
		mode = cherrypy.session[MODE_KEY]

		# DB
		#--------------------------------------#
		conn = sqlite3.connect('db/user_task.db')

		# first check if in the admin status
		cursor = conn.execute("SELECT is_admin from user WHERE username = \'%s\'" % (username))
		user_data = cursor.fetchone()
		is_admin = user_data[0]
		cherrypy.session['admin'] = is_admin
		cherrypy.session[TASK_KEY] = {}
		
		# then check mini-tasks of the user
		sub_task = []
		for i in range(num_subtask):
			if not is_admin:
				cursor = conn.execute("SELECT subtask%d from user WHERE username = \'%s\'" % (i+1, username))
				subtask_data = cursor.fetchone()
				if subtask_data[0]:
					sub_task.append(i+1)
			else:
				sub_task.append(i+1)
		cherrypy.session['subtask'] = sub_task 

		# get task list
		if not is_admin:
			cursor = conn.execute("SELECT task_id, user_id, status, editable from user_task WHERE user_id = \'%s\' " % (username)) # todo: use email to identify
		else:
			cursor = conn.execute("SELECT task_id, user_id, status, editable from user_task ") # todo: use email to identify
		data = cursor.fetchall()

		# get working progress
		if not is_admin:
			cursor = conn.execute("SELECT task_id, user_id, SUM(work_time) from user_progress WHERE user_id = \'%s\' GROUP BY task_id, user_id" % (username)) # todo: use email to identify
		else:
			cursor = conn.execute("SELECT task_id, user_id, SUM(work_time) from user_progress GROUP BY task_id, user_id ") # todo: use email to identify
		data_progress = cursor.fetchall()

		conn.close()
		#--------------------------------------#

		lists = parseTask(username, is_admin, mode, data, data_progress )

		# render html
		tmpl = env.get_template('task_lists.html')
		return tmpl.render(user = username, tasks = lists, prevTask = curr_task, mode = mode, subTask = sub_task )
	

	@cherrypy.expose
	@require()
	# --------------------------------------------------- 
	# List the backup versions of the xml files
	# @param task_id         task name
	# @param user_id         user account in current session
	# @param curr_user       user account in edit session (userId != currUser for the admin mode) 
	# @return                rendered html of backup task lists
	# --------------------------------------------------- 
	def backup(self, task_id, curr_user):
		lists = []

		user_id = cherrypy.request.login
		is_admin = cherrypy.session['admin']
		if is_admin:
			user_id = curr_user

		conn = sqlite3.connect('db/user_task.db')
		# get working progress
		cursor = conn.execute("SELECT SUM(work_time) from user_progress WHERE user_id = \'%s\' and task_id = \'%s\' " % (user_id, task_id)) # todo: use email to identify
		data = cursor.fetchone()
		conn.close()

		if data is None:
			offset = 0
		else:
			offset = data[0]

		# read local disk to show the backup tasks
		src = 'public/backup/' + user_id + '/' + task_id;

		for (dirpath, dirnames, filenames) in os.walk(src):
			filenames.sort(reverse=True)

			for files in filenames:
				timestamp = os.path.splitext(os.path.basename(files))[0]
				backup_date = datetime.fromtimestamp(float(timestamp)/1000).strftime("%Y-%m-%d %H:%M:%S")
				filePath = os.path.join(dirpath, files)
				file_szie = os.path.getsize(filePath)

				if (file_szie >= 1000):
					backup_date += ' (%.1f KB)' % (file_szie/1000.0)
				else:
					backup_date += ' (%d bytes)' % (file_szie)
				
				stamp = {
					'date': backup_date,
					'time': timestamp
				}
				lists.append(stamp)

				if (len(lists) > 100):
					break
				

		tmpl = env.get_template('backup_lists.html')
		print('Redirect...')
		return tmpl.render(user = user_id, stamps = lists, task = task_id, timer_offset = offset)

	@cherrypy.expose
	@require()
	# --------------------------------------------------- 
	# List progress of the current user
	# @param unit            variable to show progress w.r.t. different period (week, month, all)
	# @param user_id         user account 
	# @return                rendered html of progress lists
	# --------------------------------------------------- 
	def progress(self, unit='all'):

		user_id = cherrypy.request.login
		is_admin = cherrypy.session['admin']

		if unit=='all':
			group_time = ''
		else:
			group_time = '%%Y-%%%s' % (unit)

		# get finished hours
		conn = sqlite3.connect('db/user_task.db') 
		if not is_admin:
			cursor = conn.execute("SELECT user_id, SUM(work_time), strftime(\'%s\' , work_date) period from user_progress \
						WHERE user_id = \'%s\' GROUP BY strftime(\'%s\', work_date) " % (group_time, user_id, group_time)) # todo: use email to identify
		else:
			cursor = conn.execute("SELECT user_id, SUM(work_time), strftime(\'%s\' , work_date) period from user_progress \
						GROUP BY strftime(\'%s\', work_date), user_id " % (group_time, group_time)) # todo: use email to identify
		data_progress = cursor.fetchall()

		# get offset hours 
		if not is_admin:
			cursor = conn.execute("SELECT username, offset from user WHERE username = \'%s\'" % (user_id)) # todo: use email to identify
		else:
			cursor = conn.execute("SELECT username, offset from user") # todo: use email to identify
		data = cursor.fetchall()

		conn.close()

		# parse progress data
		lists = []
		map_ = {}
		index = 0 
		# One day (It is an arbitrary number)
		target_hour = 3600 * 24

		for row in data_progress:
			m_name = row[0]
			offset = 0
			for r in data:
				if r[0] == m_name:
					offset = r[1]
					break

			if unit == 'W':
				work_hour = float(row[1])
				yw = row[2].split('-')
				p_start = datetime.strptime("%s-W%s-1" % (yw[0], yw[1]), "%Y-W%W-%w")
				p_end = datetime.strptime("%s-W%s-0" % (yw[0], yw[1]), "%Y-W%W-%w")
				period =  "%s ~ %s" % (p_start.date(), p_end.date())

			elif unit == 'm':
				work_hour = float(row[1])
				period = row[2]

			elif unit == 'all':
				work_hour = float(row[1]) + offset * 3600
				period = " ~ %s" % (datetime.now().date())

			work_hour = round(work_hour)
			m_task = {
                'percentage': "%.2f" % (min(work_hour/target_hour*100, 100)),
                'display': "%02d:%02d/%02d:%02d" % (int (work_hour/3600), int (work_hour/60) % 60, \
                    int (target_hour/3600), int (target_hour/60) % 60),
                'period': period
            } 
			
			if m_name in map_:
				lists[map_[m_name]]['progresslist'].append(m_task)
			else:
				task_info = {
					 'userid': m_name,
					 'progresslist': [],
				}

				task_info['progresslist'].append(m_task)
				lists.append(task_info)
				map_[m_name] = index
				index = len(lists)
		#--------------------------------------#
		
		
		
		tmpl = env.get_template('progress.html')
		print('Redirect...')
		return tmpl.render(user = user_id, progresses = lists, unit = unit)

	@cherrypy.expose
	def open(self):
		return """This page is open to everyone"""


	@cherrypy.expose
	@require()
	# --------------------------------------------------- 
	# Change the task status in the database
	# @param status          value of the selected dropdown list
	# @param task_id         task name
	# @param user_id         user account in current session
	# ---------------------------------------------------
	def change_status(self, status, task_id, user_id):
		index = 0
		if status == 'ongoing':
			index = 1
		elif status == 'finished':
			index = 2
		elif status == 'new':
			index = 0

		conn = sqlite3.connect('db/user_task.db')
		conn.execute("UPDATE user_task set status = %d WHERE user_id = \'%s\' AND task_id = \'%s\'" % (index, user_id, task_id))
		conn.commit()
		conn.close()

	@cherrypy.expose
	@require()
	# --------------------------------------------------- 
	# Change the status of the subtasks in the database
	# @param status          value of checkbox 
	# @param task_id         task name
	# @param subtask         index of the subtask 
	# ---------------------------------------------------
	def change_substatus(self, task_id, status, subtask ):
		print('Change status: ')
		print(task_id, status, subtask)

		conn = sqlite3.connect('db/user_task.db')
		conn.execute("UPDATE user_task set subtask%d = %d WHERE task_id = \'%s\'" % (int(subtask), int(status == 'true'), task_id))
		conn.commit()
		conn.close()


	@cherrypy.expose
	@require()
	# --------------------------------------------------- 
	# Load the annotation task
	# @param task_id         task name
	# @param user_id         user account in current session
	# @param curr_user       user account in edit session (userId != currUser for the admin mode) 
	# @param version_id      version of the annotation (*.xml) file 
	# ---------------------------------------------------
	def load_task(self, task_id, curr_user, editable, timer_offset, version_id=''):
		user_id = cherrypy.request.login

		is_admin = cherrypy.session['admin']
		if is_admin:
			user_id = curr_user
			
		sub_task = cherrypy.session['subtask']
		is_gt_task = 0
		
		# mode is always default to "normal"
		mode = cherrypy.session[MODE_KEY]

		is_editable = cherrypy.session[TASK_KEY]['%s_%s' % (task_id, user_id)]
		print('Editable mode = %s' % is_editable)

		tmpl = env.get_template('task_render.html')
		return tmpl.render(user = user_id, task = task_id, version = version_id, isadmin = is_admin, 
			timer = timer_offset, editable = is_editable, refinemode = mode, isgttask = is_gt_task)

	@cherrypy.expose
	# --------------------------------------------------- 
	# Delete the lock file when exit 
	# @param task_id         task name
	# ---------------------------------------------------
	def unlock(self, task_id):
		print('unlocking %s' % task_id)
		lockfile = 'public/lockfile/' + task_id + '.lock'
		if os.path.isfile(lockfile):
			os.remove(lockfile)



	# save the result xml
	@cherrypy.expose
	# --------------------------------------------------- 
	# Autmatically save the annotation result
	# @param data            annotation data
	# @param task_id         task name
	# @param time_stamp      time stamp 
	# @param user_id         user account in current session
	# @param backup          binary variable for backup
	# ---------------------------------------------------
	def send_xml_log(self, data, task_id, time_stamp, user_id, backup=0):
		mode = cherrypy.session[MODE_KEY]
		dst = 'public/backup/' + user_id + '/' + task_id;           
		if not os.path.exists(dst):
			print('XML destination = %s' % dst)
			os.makedirs(dst)
		if int(backup)==1:
			filename = dst + '/' + time_stamp + '.xml'
			f = open(filename, 'w')
			f.write(data)
			f.close()

		# Update lockfile
		lockfile = 'public/lockfile/' + task_id + '.lock'
		if os.path.isfile(lockfile):
			with open(lockfile, 'a') as f:
				f.write('%s\n' % ( time_stamp ))

		# Also write to result
		self.send_xml_data(data, task_id, user_id)


	@cherrypy.expose
	# --------------------------------------------------- 
	# Save the annotation result as the final result
	# @param data            annotation data
	# @param task_id         task name
	# @param time_stamp      time stamp 
	# @param user_id         user account in current session
	# ---------------------------------------------------
	def send_xml_data(self, data, task_id, user_id):
		print('Saving data to results.')
		mode = cherrypy.session[MODE_KEY]
		dst = 'public/results/' + user_id;
		if not os.path.exists(dst):
			os.makedirs(dst)

		filename = dst + '/' + task_id + '.xml'
		f = open(filename, 'w')
		f.write(data)
		f.close()

	@cherrypy.expose
	# --------------------------------------------------- 
	# Save the scribbling result as png (DEPRECATED)
	# @param data            annotation data
	# @param task_id         task name
	# @param time_stamp      time stamp 
	# @param user_id         user account in current session
	# @param frame           current frame 
	# ---------------------------------------------------
	def send_png_data(self, data, task_id, user_id, frame, mode):
		print('Saving scribble to results.')
		dst = 'public/results/' + user_id;
		if not os.path.exists(dst):
			os.makedirs(dst)

		# remove additional data generated from ajax POST
		data = data.replace('data:image/png;base64,','')
		# add "====" for solving incorrect padding error
		im = Image.open(BytesIO(base64.b64decode(data+"=====")))

		filename = dst + '/' + task_id + '_%010d_mode%d.png' % (int(frame), int(mode))
		# set alpha value to 255
		if (int(mode) == 2 or int(mode) == 3):
			im.putalpha(255)
		im.save(filename)

		# backup
		if (int(mode) == 2 or int(mode) == 3):
			dst = 'public/backup/' + user_id;
			filename = dst + '/' + task_id + '_%010d_mode%d_%d.png' % (int(frame), int(mode), int(time.time() / 300))
			if not os.path.isfile(filename):
				# set alpha value to 255
				if (int(mode) == 2 or int(mode) == 3):
					im.putalpha(255)
				im.save(filename)

	@cherrypy.expose
	# --------------------------------------------------- 
	# Save the instance and semantic colormap (DEPRECATED)
	# @param data            annotation data
	# @param task_id         task name
	# @param time_stamp      time stamp 
	# @param user_id         user account in current session
	# @param frame           current frame 
	# ---------------------------------------------------
	def send_colormap(self, data, task_id, user_id, frame, mode):
		print('Saving colormap to results.')
		dst = 'public/results/' + user_id;
		if not os.path.exists(dst):
			os.makedirs(dst)

		print('Annotation data = %s' % data)
		# change split method
		data = data.replace(',', '\n')

		filename = dst + '/' + task_id + '_%010d_cmap.txt' % (int(frame))
		print('colormap filename: %s' % filename)
		with open(filename, 'w') as f:
			f.write(data)


	def shutdown_server(self):
		cherrypy.engine.exit()

   # save the time interval
	@cherrypy.expose
	# --------------------------------------------------- 
	# Autmatically save the working time
	# @param task_id         task name
	# @param user_id         user account in current session
	# @param time_interval   working time to be added to the database
	# ---------------------------------------------------
	def send_work_time(self, task_id,  user_id, time_interval):

		now = datetime.now()
		date = "%d-%02d-%02d" % (now.year, now.month, now.day)
		
		conn = sqlite3.connect('db/user_task.db')
		cursor = conn.execute('SELECT task_id FROM user_progress WHERE task_id = \'%s\' AND user_id = \'%s\' AND work_date = \'%s\'' % (task_id, user_id, date))
		data_progress = cursor.fetchone()
		if data_progress is None:
			conn.execute('INSERT INTO user_progress (task_id, user_id, work_date, work_time) VALUES (\'%s\', \'%s\', \'%s\', %f)' \
			% (task_id, user_id, date, float(time_interval)) ) 
		else:
			conn.execute("UPDATE user_progress set work_time = work_time + %f WHERE user_id = \'%s\' AND task_id = \'%s\' AND work_date = \'%s\'" \
			% (float(time_interval), user_id, task_id, date))
	 
		conn.commit()
		conn.close()


def main(argv):
	if not argv:    
		configfile = 'server.conf'
	else:
		configfile = argv[0]
		if not os.path.exists(configfile):
			raise ValueError('Config file %s does not exist' % configfile)
	cherrypy.quickstart(Root(), '/', config=configfile)


if __name__ == '__main__':
	main(sys.argv[1:])
