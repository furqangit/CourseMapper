app.controller('ReviewCalibrationController', function ($scope, $http, toastr, $window, $location, ActionBarService, Upload) {
    cId = $location.search().cId;
    pRId = $location.search().pRId
    if (!cId || !pRId) {
        return
    }

    $scope.reviewCalibration = [];
    $scope.peerReview = [];
    $scope.rubrics = [];
    operationCase = "";

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

    var requestData = function () {
        var url = '/api/peerassessment/' + $scope.course._id + '/calibration/' + cId + '/review';
        $http.get(url).then(function (response) {
            $scope.reviewCalibration = response.data.reviewCalibration;

            var url = '/api/peerassessment/' + $scope.course._id + '/peerreviews/' + pRId + '/rubrics';
            $http.get(url).then(function (peerReview) {
                $scope.peerReview = peerReview.data.peerReview;
                $scope.rubrics = $scope.peerReview.reviewSettings.rubrics;

                if ($scope.reviewCalibration) {
                    //Edit case
                    console.log("Edit Case");
                    operationCase = "edit";
                    $scope.reviewCalibrationId = $scope.reviewCalibration._id;
                    $scope.reviewCalibrationObject = $scope.reviewCalibration;
                } else {
                    //Add Case

                    console.log("Add Case");
                    operationCase = "add";
                    $scope.reviewCalibrationObject = {
                        marksObtained: 0,
                        comments: "",
                        isAdminReview: true,
                        rubricReview: {}
                    }

                }
            }, function (err) {
                console.log('Internal Server Error. Please try again later.');
                toastr.error('Internal Server Error. Please try again later.');
            })

        }, function (err) {
            // Check for proper error message later
            console.log('Internal Server Error. Please try again later.');
            toastr.error('Internal Server Error. Please try again later.');
        });
    }
    requestData();

    $scope.isFormValid = function () {
        if ($scope.form.$error.min && $scope.form.$error.min.length) {
            return false
        } else if ($scope.form.$error.number && $scope.form.$error.number.length) {
            return false
        } else if ($scope.form.$error.required && $scope.form.$error.required.length) {
            return false
        } else if ($scope.form.$error.max && $scope.form.$error.max.length) {
            return false
        }
        return true
    }

    $scope.submitReview = function () {
        console.log("________", $scope.reviewCalibrationObject)
        $scope.isLoading = true;
        var url = "";
        var method = "";
        if (operationCase == "add") {
            method = 'POST';
            url = '/api/peerassessment/' + $scope.course._id + '/peerreviews/' + pRId + '/calibration/' + cId + '/reviewCalibrations/add';
        }
        else if (operationCase == "edit") {
            method = 'PUT';
            url = '/api/peerassessment/' + $scope.course._id + '/reviewCalibration/' + $scope.reviewCalibrationId;
        }

        var uploadParams = {
            method: method,
            url: url,
            fields: $scope.reviewCalibrationObject
        };

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
                    toastr.error(data.errors[0] || 'Failed');
                }
                $scope.isLoading = false;
                // if (data.peer == cId) {
                //     window.location.reload();
                // } else {
                //     window.history.replaceState({}, "", '#/cid/' + $scope.course._id + '?tab=peerAssessment&vName=reviewSubmission&cId=' + data.reviewId)
                //     //window.document.location = '#/cid/' + $scope.course._id + '?tab=peerAssessment&vName=reviewSubmission&cId=' + data.reviewId;
                //     window.location.reload();
                // }
            })
            .error(function (data) {
                toastr.error('Internal Server Error');
                $scope.errors = data.errors;
                $scope.progress = 0;
                $scope.isLoading = false;
            });
    }
})