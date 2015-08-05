angular.module('twilioApp')
.controller('taskCtrl',['$scope', 'taskService', '$modal', function ($scope, taskService, $modal) {
  var getData = function () {
    taskService.getTasks().$promise.then(function (data) {
      $scope.tasks = data;
    });
  };
  getData();
  //edit dialog:
  $scope.myAppScopeProvider = {
      showInfo : function(row) {
           var modalInstance = $modal.open({
               controller: function ($scope, $modalInstance, task, taskService) {
                  $scope.model = task;
                  $scope.showAssignedTo = (task.track.length === 0 || task.state === 'rejected');
                  $scope.track = task.track;
                  $scope.gridOptions = {
                    data: 'track',
                    multiSelect: false,
                    enableRowSelection: true,
                    enableSelectAll: false,
                    enableColumnResizing: true,
                    columnDefs: [
                      { field: 'state', displayName: 'State', width: '20%' },
                      { field: 'responsible', displayName: 'Responsible', width: '50%' },
                      { field: 'updated_at', displayName: 'State', width: '30%', cellFilter: 'date:"yyyy-MM-dd HH:mm"' }
                    ]
                  };
                  //MESSAGES LIST
                  $scope.messages = [];
                  taskService.getMessages(task.code).$promise.then(function (messages) {
                    $scope.messages = messages;
                  });
                  $scope.gridOptSms = {
                    data: 'messages',
                    multiSelect: false,
                    enableRowSelection: true,
                    enableSelectAll: false,
                    columnDefs: [
                      { field: 'from', displayName: 'From', width: 120},
                      { field: 'to', displayName: 'To', width: 120},
                      { field: 'body', displayName: 'Body', width: 200},
                      { field: 'dateSent', displayName: 'Sent', cellFilter: 'date:"yyyy-MM-dd HH:mm"', width: 130},
                      { field: 'status', displayName: 'Status', width: 100}
                    ]
                  };

                  $scope.ok = function () {
                     $modalInstance.close({
                       code: $scope.model.code,
                       description: $scope.model.description,
                       responsible: $scope.model.responsible
                     });
                  };
                  $scope.cancel = function () {
                    $modalInstance.dismiss('cancel');
                  };
                },
                templateUrl: 'editTask.html',
                resolve: {
                  task: function () {
                      return row.entity;
                  }
                }
           });

           modalInstance.result.then(function (taskEdited) {
             taskService.assignResponsible(taskEdited.code, taskEdited.description, taskEdited.responsible).$promise.then(function (success) {
               console.log('task edited successfully');
               getData();
             });

           }, function () {
             console.log('Modal dismissed at: ' + new Date());
           });
      }
  };
  //define grid
  $scope.gridOptions = {
    data: 'tasks',
    enableSorting: true,
    multiSelect: false,
    enableFiltering: true,
    enableRowSelection: true,
    enableSelectAll: false,
    enableRowHeaderSelection: false,
    onRegisterApi: function(gridApi){
      $scope.gridApi = gridApi;
    },
    appScopeProvider: $scope.myAppScopeProvider,
    rowTemplate: "<div ng-dblclick=\"grid.appScope.showInfo(row)\" ng-repeat=\"(colRenderIndex, col) in colContainer.renderedColumns track by col.colDef.name\" class=\"ui-grid-cell\" ng-class=\"{ 'ui-grid-row-header-cell': col.isRowHeader }\" ui-grid-cell></div>",
    columnDefs: [
      { field: 'code', displayName: 'Code', width: '10%' },
      { field: 'description', displayName: 'Description', width: '35%' },
      { field: 'state', displayName: 'State', width: '20%' },
      { field: 'created_at', displayName: 'Created', width: '30%', cellFilter: 'date:"yyyy-MM-dd HH:mm"'}
    ]
  };
  //new task
  $scope.new = function () {

    var modalInstance = $modal.open({
       templateUrl: 'newTask.html',
       controller: function ($scope, $modalInstance) {
          $scope.model = {};
          $scope.ok = function () {
           $modalInstance.close({
             code: $scope.model.code,
             description: $scope.model.description
           });
          };
          $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
          };
       },
       size: 'md'
     });
    modalInstance.result.then(function (newTask) {
      taskService.createTask(newTask.code, newTask.description).$promise.then(function (success) {
        console.log('success');
        getData();
      }, function (reason) {
        console.log('error: ' + reason);
      });
    });

  };
}]);
