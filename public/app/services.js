angular.module('twilioApp')
.factory('taskFactory',['$resource', function ($resource) {
  return $resource('/api/tasks', {}, {
            save: { method: 'POST'},
            update: { method: 'PUT' },
            remove: { method: 'DELETE'},
            query: {
                method: 'GET',
                isArray: true
            }
        });
}])
.factory('smsFactory', ['$resource', function ($resource) {
  return $resource('/sendsms', {}, {
            save: { method: 'POST'}
        });
}])
.factory('twilioMsgFactory', ['$resource',function ($resource) {
  return $resource('/api/messages', {}, {
            query: {
                method: 'GET',
                isArray: true
            }
        });
}])
.service('taskService',['taskFactory','smsFactory','twilioMsgFactory', function (taskFactory,smsFactory,twilioMsgFactory) {
  this.getTasks = function () {
    return taskFactory.query();
  };
  this.createTask = function(code, description){
    return taskFactory.save({code: code, description: description});
  };
  this.assignResponsible = function (code, description, responsible) {
    return smsFactory.save({code: code, description: description, responsible: responsible});
  };
  this.getMessages = function (code) {
    return twilioMsgFactory.query({code:code});
  }
}]);
