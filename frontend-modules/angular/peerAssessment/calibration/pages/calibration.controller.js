app.controller('CalibrationController', function ($scope, $location, $http, toastr, ActionBarService) {
    $scope.calibrations = [];
    var peerReviewId = $location.search().pRId;

    if ($scope.vName) {
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

    $scope.requestData = function () {
        var url = '/api/peerassessment/' + $scope.course._id + '/peerreviews/' + peerReviewId + '/calibrations';
        $http.get(url).then(function (response) {

            console.log("HERE are the calibrations: ", response.data.calibrations);
            $scope.calibrations = response.data.calibrations;
            if ($scope.calibrations.length == 0) {
                ActionBarService.extraActionsMenu.push(
                    {
                        separator: true
                    },
                    {
                        clickAction: $scope.addCalibration,
                        clickParams: peerReviewId,
                        title: '<i class="ionicons ion-android-add"></i> &nbsp; ADD CALIBRATION',
                        aTitle: 'Add Calibration'
                    }
                );
            }
            console.log("HERE are the calibrations: ", $scope.calibrations);
        }, function (err) {
            console.log("Error ", err);
            // Check for proper error message later
            toastr.error('Internal Server Error. Please try again later.');
        });
    }

    $scope.openDeleteCalibrationConfirmationModal = function (pRId, cId, event) {
        if (event) {
            event.stopPropagation();
        }
        $scope.deleteCalibrationId = cId;
        var modal = $('#confirmDeleteCalibrationModal');
        modal.attr("calibrationId", cId);
        modal.modal('show');
    }


    $scope.deleteCalibration = function () {
        var calibrationId = $('#confirmDeleteCalibrationModal').attr('calibrationId');
        var calibrationDeleteURL = '/api/peerassessment/' + $scope.course._id + '/calibrations/' + calibrationId;

        $http.delete(calibrationDeleteURL).then(function (response) {
            for (var i = 0; i < $scope.calibrations.length; i++) {
                if ($scope.calibrations[i]._id == calibrationId) {
                    break;
                }
            }
            $scope.calibrations.splice(i, 1);
            $scope.requestData();
        }, function (err) {
            // Check for proper error message later
            toastr.error('Internal Server Error. Please try again later.');
        });

        $('#confirmDeleteCalibrationModal').modal('hide');
    }

    if ($scope.course && $scope.course._id) {
        $scope.requestData();
    } else {
        console.log('Course not initialized');
    }
})