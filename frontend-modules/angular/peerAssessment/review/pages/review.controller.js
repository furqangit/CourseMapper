app.controller('ReviewController', function ($scope, $http, ActionBarService, toastr) {
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

    var requestData = function () {
        var url = '/api/peerassessment/' + $scope.course._id + '/reviews?rName=RCRequestData';
        $http.get(url).then(function (response) {
            var oldReviewsID = [];
            console.log('Reviews', response.data.reviews);
            _.each(response.data.reviews, function (review) {
                // handling removal of old reviews if there is a second loop review
                if (review.oldReviewId) {
                    oldReviewsID.push(review.oldReviewId)
                }
            });
            $scope.reviews = _.filter(response.data.reviews, function (review) {
                if (_.indexOf(oldReviewsID, review._id) == -1 || review.isSecondLoop) {
                    return review
                }
            })
            console.log('Reviews', $scope.reviews);

        }, function (err) {
            // Check for proper error message later
            toastr.error('Internal Server Error. Please try again later.');
        });
    }

    requestData();

    var openReviewCalibrationModal = function(review, calibrationId, event) {
        if (event) {
            event.stopPropagation();
        }

        var modal = $('#reviewCalibrationModal');
        modal.attr({ "peerReviewId": review.peerReviewId._id, "calibrationId": calibrationId,"event": event, "courseId": $scope.course._id });
        modal.modal('show');
    }

    $scope.proceedToCalibration = function () {
        var peerReviewId = $('#reviewCalibrationModal').attr('peerReviewId');
        var event = $('#reviewCalibrationModal').attr('event');
        var calibrationId = $('#reviewCalibrationModal').attr('calibrationId');
        var courseId = $('#reviewCalibrationModal').attr('courseId');
        $('#reviewCalibrationModal').modal('hide');
        window.document.location = '#/cid/' + courseId + '/?tab=peerAssessment&pRId=' + peerReviewId + '&vName=reviewCalibration&cId=' + calibrationId;

    }

    $scope.openReview = function (review, event) {
        if (event) {
            event.stopPropagation();
        }
        // first check if the Assignment has any calibration for review
        var calibrationURL = '/api/peerassessment/' + $scope.course._id + '/peerreviews/' + review.peerReviewId._id + '/calibrations';
        $http.get(calibrationURL).then(function (response) {
            console.log("RESPONSE: ", response);
            if (response.data.calibrations.length > 0) {
                var calibration = response.data.calibrations[0];
                //then check if user has graded the calibraiton if exists
                var url = '/api/peerassessment/' + $scope.course._id + '/calibration/' + calibration._id + '/review';
                $http.get(url).then(function (response) {

                    if (!response.data.reviewCalibration) {
                        console.log('Opening Calibration: ', calibration._id);
                        openReviewCalibrationModal(review, calibration._id, event);
                    } else {
                        console.log('Opening Review: ', review);
                        window.document.location = '#/cid/' + $scope.course._id + '?tab=peerAssessment&vName=reviewSubmission&vId=' + review._id;
                    }

                }, function (err) {
                    // Check for proper error message later
                    console.log('Internal Server Error. Please try again later.');
                    toastr.error('Internal Server Error. Please try again later.');
                });
            } else {
                console.log('Opening Review: ', review);
                window.document.location = '#/cid/' + $scope.course._id + '?tab=peerAssessment&vName=reviewSubmission&vId=' + review._id;
            }

        }, function (err) {
            toastr.error('Internal Server Error. Please try again later.');
        });

    }
})