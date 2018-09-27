app.controller('CalibrationController', function($scope, $location, $http, toastr, ActionBarService) {
    var calibrations = null;
    if($scope.vName) {
        ActionBarService.extraActionsMenu = [];
        ActionBarService.extraActionsMenu.push(
            {
                clickAction: $scope.goBack,
                title: '<i class="ionicons ion-arrow-return-left"></i> &nbsp; BACK',
                aTitle: 'Back'
            },
            {
                separator: true
            },
            {
                clickAction: $scope.redirectPRHome,
                title: '<i class="ionicons ion-home"></i> &nbsp; PEER REVIEWS HOME',
                aTitle: 'Peer Review Home'
            }
        );
    }

    $scope.requestData = function() {
        var url = '/api/peerassessment/' + $scope.course._id + '/peerreviews/'+$scope.peerReview._id+'/calibrations';
        $http.get(url).then( function(response) {
            console.log("_______________");
        }, function(err){
            // Check for proper error message later
            toastr.error('Internal Server Error. Please try again later.');
        });
    }

    $scope.filter = function() {
        console.log('FilteredSolutions: ', $scope.filterCondition)
        if($scope.filterCondition == '') {
            console.log('Null')
            SolutionFilterService.setPeerReview('')
            $scope.filteredSolutions = solutions
        } else {
            console.log('Not null')
            SolutionFilterService.setPeerReview($scope.filterCondition)
            $scope.filteredSolutions = _.filter(solutions, function(solution) {
                return solution.peerReviewId._id == $scope.filterCondition
            })
        }
    }

    $scope.deleteSolution = function() {
        var url = '/api/peerassessment/' + $scope.course._id + '/solutions/' + $scope.deleteSolutionId;
        $http.delete(url).then( function(response) {
            if(response && response.data.result) {
                if ($location.search().vId) {
                    window.document.location = '#/cid/' + $scope.course._id + '?tab=peerAssessment&vName=viewSolutionsList';
                    window.location.reload();
                    //$location.search('vName', 'viewSolutionsList');
                    //$location.search('vId', '');
                } else {
                    window.location.reload();
                }
            }
            // if you want to do it with ajax check the logic of deleting peer reviews in Peer Review controller
        }, function(err) {
            // Check for proper error message later
            toastr.error('Internal Server Error. Please try again later.');
        });

        $('#confirmDeleteAssignmentModal').modal('hide');
    }

    if($scope.course && $scope.course._id) {
        $scope.requestData();
    } else {
        console.log('Course not initialized');
    }
})