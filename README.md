# TWILIO

Vreasy test using twilio angularjs mongodb nodejs express

### Technologies I used
- Twilio for handling messages
- AngularJs to create the frontend application
- NodeJs for the backend to create Rest APIs to consume task information
- MongoDB to store tasks.


### Frontend application
A live demo is located here:
http://twilio-nolazco.rhcloud.com/

Features:
- List of tasks
- New -> to create a new Task
- Dobleclick on the grid to see the details of the task and to assign the responsible of the task.
  *  In this Dialog you can see the track of the task (when it has been assigned, if it was accepted or rejected)
  *  Also you can see the list of messages sent throw twilio for this task.

### Requeriments
- nodejs npm
- mongodb

### Installation:

'''bach
git clone ssh://55c084480c1e66a73c000036@twilio-nolazco.rhcloud.com/~/git/twilio.git/

npm install

bower install
'''

### Starts application

Starts mongodb
then starts the server:
'''bach
node server.js
'''

Enter to the browser:
http://localhost:3000/

### TODO List:
- Use socket.io to refresh state of task in the website automatically when a confirmation or rejection of a task happens.
- Create test tasks (grunt)
- Organise the code (backend).

Thanks ;)
