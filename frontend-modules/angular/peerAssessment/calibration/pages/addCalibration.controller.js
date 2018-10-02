app.controller('AddCalibrationController', function ($scope, $location, $http, toastr, Upload, ActionBarService) {
    $scope.calibrations = [];
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

    $scope.newCalibrationObject = {
        title: "",
        teacherName: "",
        teacherComments: ""
    }
    $scope.calibrationDocuments = false;

    $scope.deleteSelectedCalibrationDocuments = function (fileName) {
        console.log('Calibration Docs Selected', $scope.calibrationDocuments, fileName);
        for (var i = 0; i < $scope.calibrationDocuments.length; i++) {
            if ($scope.calibrationDocuments[i].name == fileName) {
                $scope.calibrationDocuments.splice(i, 1);
                break;
            }
        }
    }

    $scope.isFormValid = function () {
        if ($scope.form.$error.min && $scope.form.$error.min.length) {
            return false
        } else if ($scope.form.$error.number && $scope.form.$error.number.length) {
            return false
        } else if ($scope.form.$error.required && $scope.form.$error.required.length) {
            return false
        } else {
            for (var key in $scope.dateValidationObject) {
                if ($scope.dateValidationObject[key].valid == false) {
                    return false
                }
            }
        }
        return true
    }

    $scope.createCalibration = function () {
        var peerReviewId = $location.search().pRId;
        console.log('Form object', $scope.form)
        console.log('Date validation object', $scope.dateValidationObject)
        $scope.isLoading = true;
        if (!peerReviewId) {
            $scope.errors = data.errors;
            $scope.progress = 0;
            $scope.isLoading = false;
        }
        var uploadParams = {
            url: '/api/peerassessment/' + $scope.$parent.course._id + '/peerreviews/' + peerReviewId + '/calibration',
            fields: $scope.newCalibrationObject
        };
        uploadParams.file = [];
        if ($scope.calibrationDocuments) {
            uploadParams.file.push({ 'calibrationDocuments': $scope.calibrationDocuments });
        }

        $scope.upload = Upload.upload(
            uploadParams
        )
            .progress(function (evt) {
                if (!evt.config.file)
                    return;

                $scope.progress = parseInt(100.0 * evt.loaded / evt.total);
                // console.log("Progress", $scope.progress);
            })
            .success(function (data) {

                $scope.progress = 0;
                if (data.result) {
                    toastr.success('Successfully Saved');
                } else {
                    toastr.error('Error Creating Calibration');
                }
                $scope.isLoading = false;

                window.history.back();
            })
            .error(function (data) {
                $scope.errors = data.errors;
                $scope.progress = 0;
                $scope.isLoading = false;
            });
    }
})