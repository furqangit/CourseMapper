app.controller('EditCalibrationController', function ($scope, $location, $http, toastr, Upload, ActionBarService) {

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


    $scope.calibrationDocuments = [];
    $scope.progress = 0;
    $scope.calibrationId = null;
    $scope.peerReviewId = null;
    $scope.existingDocuments = [];

    $scope.initiateController = function () {
        $scope.calibrationId = $location.search().cId;
        $scope.peerReviewId = $location.search().pRId;
        if ($scope.vName && $scope.calibrationId) {

            $scope.newCalibrationObject = null;
            var url = '/api/peerassessment/' + $scope.course._id + '/peerreviews/' + $scope.peerReviewId + '/calibration/' + $scope.calibrationId;
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
                $scope.existingDocuments = calibration.displayCalibrationDocumentsList;
                $scope.newCalibrationObject = calibration;

            }, function (err) {
                // Check for proper error message later
                toastr.error('Internal Server Error. Please try again later.');
            });
        }
    }

    $scope.deleteUploadedCalibrationDocuments = function (fileName) {
        for (var i = 0; i < $scope.newCalibrationObject.displayCalibrationDocumentsList.length; i++) {
            if ($scope.newCalibrationObject.displayCalibrationDocumentsList[i].link == fileName) {
                if (!$scope.newCalibrationObject.deletedUploadedFiles) {
                    $scope.newCalibrationObject.deletedUploadedFiles = [];
                }
                $scope.newCalibrationObject.deletedUploadedFiles.push($scope.newCalibrationObject.calibrationDocuments[i]);
                $scope.newCalibrationObject.calibrationDocuments.splice(i, 1);
                $scope.newCalibrationObject.displayCalibrationDocumentsList.splice(i, 1);
                break;
            }
        }
        console.log('Check deleted Objects', $scope.newCalibrationObject.deletedUploadedFiles, $scope.newCalibrationObject.calibrationDocuments, $scope.newCalibrationObject.displayCalibrationDocumentsList);
    }

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
        if($scope.form.$error && $scope.calibrationDocuments.length == 0 && $scope.existingDocuments == 0){
            $scope.form.file.$invalid = true;
            $scope.form.file.$pristine = false;
            return false;
        }else{
            $scope.form.file.$invalid = false;
            $scope.form.file.$pristine = true;
        }
        if ($scope.form.$error.min && $scope.form.$error.min.length) {
            return false
        } else if ($scope.form.$error.number && $scope.form.$error.number.length) {
            return false
        } else if ($scope.form.$error.required && $scope.form.$error.required.length) {
            return false
        } else if ($scope.calibrationDocuments.length == 0) {
            return false;
        } else {
            for (var key in $scope.dateValidationObject) {
                if ($scope.dateValidationObject[key].valid == false) {
                    return false
                }
            }
        }
        return true
    }

    $scope.editCalibration = function () {
        console.log('Form Object', $scope.form)
        $scope.isLoading = true;
        var uploadParams = {
            method: 'PUT',
            url: '/api/peerassessment/' + $scope.$parent.course._id + '/peerreviews/' + $scope.peerReviewId + '/calibration/' + $scope.calibrationId,
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
            })
            .success(function (data) {

                $scope.progress = 0;
                if (data.result) {
                    toastr.success('Successfully Saved');
                } else {
                    toastr.error('Updating Calibration Failed');
                }
                $scope.isLoading = false;
                window.location.reload();
            })
            .error(function (data) {
                toastr.error('Updating Calibration Failed');
                $scope.errors = data.errors;
                $scope.progress = 0;
                $scope.isLoading = false;
            });
    }

    $scope.initiateController();
})