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

import cherrypy
import sqlite3
import hashlib

SESSION_KEY = '_cp_username'
MODE_KEY = '_cp_mode'


COOKIE_LIFE = 3600
USE_COOKIE = 1
# --------------------------------------------------- 
# Function to check user's credential
# @param username       user_name
# @param password       pass_word (not encrypted)
# @return               A message if the credential does not match
# --------------------------------------------------- 
def check_credentials(username, password):
	"""Verifies credentials for username and password.
	Returns None on success or a string describing the error on failure"""
	
	conn = sqlite3.connect('db/user_task.db')
	cursor = conn.execute("SELECT password from user WHERE username == \'%s\'" % (username))
	data = cursor.fetchall()
	conn.close()

	if len(data) == 0:
		return u"Incorrect username"

	for row in data:
		encoded_password = hashlib.sha1(password.encode('utf-8')).hexdigest()
		if row[0] == encoded_password:
			return None

	return u"Incorrect password"
	
	# An example implementation which uses an ORM could be:
	# u = User.get(username)
	# if u is None:
	#     return u"Username %s is unknown to me." % username
	# if u.password != md5.new(password).hexdigest():
	#     return u"Incorrect password"

# --------------------------------------------------- 
# Function to check user's authorization before log in
# --------------------------------------------------- 
def check_auth(*args, **kwargs):
	"""A tool that looks in config for 'auth.require'. If found and it
	is not None, a login is required and the entry is evaluated as a list of
	conditions that the user must fulfill"""
	conditions = cherrypy.request.config.get('auth.require', None)
	if conditions is not None:
		username = cherrypy.session.get(SESSION_KEY)
		if username:
			cherrypy.request.login = username
			for condition in conditions:
				# A condition is just a callable that returns true or false
				if not condition():
					raise cherrypy.HTTPRedirect("/auth/login")
		else:
			raise cherrypy.HTTPRedirect("/auth/login")
	
cherrypy.tools.auth = cherrypy.Tool('before_handler', check_auth)


def require(*conditions):
	"""A decorator that appends conditions to the auth.require config
	variable."""
	def decorate(f):
		if not hasattr(f, '_cp_config'):
			f._cp_config = dict()
		if 'auth.require' not in f._cp_config:
			f._cp_config['auth.require'] = []
		f._cp_config['auth.require'].extend(conditions)
		return f
	return decorate


# Conditions are callables that return True
# if the user fulfills the conditions they define, False otherwise
# They can access the current username as cherrypy.request.login.
# Define those at will however suits the application.
def member_of(groupname):
	def check():
		# replace with actual check if <username> is in <groupname>
		return groupname == 'admin'
	return check

def name_is(reqd_username):
	return lambda: reqd_username == cherrypy.request.login


# Controller to provide login and logout actions

class AuthController(object):

	remember_me = 0

	mode = "normal"
	
	def on_login(self, username):
		"""Called on successful login"""
	
	def on_logout(self, username):
		"""Called on logout"""
	
	def get_loginform(self, username, msg="Enter login information", from_page="/"):
		return open('views/login.html') 


	@cherrypy.expose
	def setCookie(self, username, password):
		cookie = cherrypy.response.cookie
		cookie['username'] = username
		cookie['username']['path'] = '/'
		cookie['username']['max-age'] = COOKIE_LIFE

		cookie['password'] = password
		cookie['password']['path'] = '/'
		cookie['password']['max-age'] = COOKIE_LIFE

	@cherrypy.expose
	def readCookie(self):
		cookie = cherrypy.request.cookie
		info = {
			'username': '',
			'password': ''
		}

		if 'username' in cookie.keys():
			info['username'] = cookie['username'].value

		if 'password' in cookie.keys():
			info['password'] = cookie['password'].value

		return info

	@cherrypy.expose
	def disableCookie(self):
		cookie = cherrypy.request.cookie
		if 'username' in cookie.keys():
			cherrypy.response.cookie['username'] = cookie['username'].value
			cherrypy.response.cookie['username']['path'] = '/'
			cherrypy.response.cookie['username']['max-age'] = 0

		if 'password' in cookie.keys():
			cherrypy.response.cookie['password']= cookie['password'].value
			cherrypy.response.cookie['password']['path'] = '/'
			cherrypy.response.cookie['password']['max-age'] = 0

	@cherrypy.expose
	def keepCookie(self, checked):
		self.remember_me = checked

	@cherrypy.expose
	def changeMode(self, mode):
		self.mode = mode 

	@cherrypy.expose
	def login(self, username=None, password=None, from_page="/"):
		
		if username is None or password is None:
			
			# check cookies here
			cookie_info = self.readCookie()
			print(cookie_info)

			if (cookie_info['username']) and (cookie_info['password']):
				error_msg = check_credentials(cookie_info['username'], cookie_info['password'])
				username = cookie_info['username']
				password = cookie_info['password']
			else:
				return self.get_loginform("", from_page=from_page)    
		
		else:
			error_msg = check_credentials(username, password)
		
		if error_msg:
			return self.get_loginform(username, error_msg, from_page)
		else:
			# set session
			cherrypy.session[SESSION_KEY] = cherrypy.request.login = username
			
			# set cookies
			if (self.remember_me and USE_COOKIE):
				self.setCookie(username, password)

			# set mode
			cherrypy.session[MODE_KEY] = self.mode
			
			self.on_login(username)
			raise cherrypy.HTTPRedirect(from_page or "/")
	
	@cherrypy.expose
	def logout(self, from_page="/"):
		sess = cherrypy.session
		username = sess.get(SESSION_KEY, None)
		
		# clear session
		for key, value in sess.items():
			sess[key] = None

		self.disableCookie()

		if username:
			cherrypy.request.login = None
			self.on_logout(username)

		raise cherrypy.HTTPRedirect(from_page or "/")
