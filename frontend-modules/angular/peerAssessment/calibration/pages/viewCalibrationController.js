app.controller('ViewCalibrationController', function ($scope, $location, $http, toastr, Upload, ActionBarService) {


    $scope.calibrationDocuments = false;
    $scope.progress = 0;
    $scope.calibrationId = null;
    $scope.peerReviewId = null;

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
                clickAction: $scope.reviewCalibration, 
                clickParams: {peerReviewId: $location.search().pRId, calibrationId: $location.search().cId},
                title: '<i class="ionicons ion-android-clipboard"></i> &nbsp; REVIEW CALIBRATION',
                aTitle: 'Review Calibration'
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

    $scope.initiateController = function() {
        $scope.calibrationId = $location.search().cId;
        $scope.peerReviewId = $location.search().pRId;
        if($scope.vName && $scope.calibrationId) {

            $scope.viewCalibrationObject = null;
            var url = '/api/peerassessment/' + $scope.course._id + '/peerreviews/' + $scope.peerReviewId + '/calibration/'+ $scope.calibrationId;
            $http.get(url).then(function (response) {
                var calibration = response.data.calibration;
                if (calibration.calibrationDocuments && calibration.calibrationDocuments.length > 0) {
                    calibration.displayCalibrationDocumentsList = [];
                    _.each(calibration.calibrationDocuments, function (docName) {
                        var temp = {};
                        temp.link = window.location.origin + docName;
                        var tempArr = docName.split('/');
                        temp.name = tempArr[tempArr.length - 1];
                        calibration.displayCalibrationDocumentsList.push(temp);
                    })
                }
                $scope.viewCalibrationObject = calibration;

            }, function (err) {
                // Check for proper error message later
                toastr.error('Internal Server Error. Please try again later.');
            });
        }
    }

    $scope.initiateController();
})