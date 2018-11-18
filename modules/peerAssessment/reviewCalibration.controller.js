var config = require('config');
var Calibration = require('./models/calibration.js');
var PeerReview = require('./models/peerReview.js');
var ReviewCalibration = require('./models/reviewCalibration.js')
var UserCourses = require('../catalogs/userCourses.js')
var appRoot = require('app-root-path');
var users = require('../accounts/users.js');
var mongoose = require('mongoose');
var debug = require('debug')('cm:server');
var appRoot = require('app-root-path');
var handleUpload = require(appRoot + '/libs/core/handleUpload.js');
var helper = require(appRoot + '/libs/core/generalLibs.js');
var userHelper = require(appRoot + '/modules/accounts/user.helper.js');
var async = require('asyncawait/async');
var await = require('asyncawait/await');
var _ = require('lodash');
var fs = require('fs-extra');

function reviewCalibration() {

}

reviewCalibration.prototype.getReviewCalibrations = function (error, params, success) {
    ReviewCalibration.find(params).populate({
        path: 'peerReviewId',
        model: 'peerreviews',
        populate: {
            path: 'reviewSettings.rubrics',
            model: 'rubrics'
        }
    }).populate('calibrationId submittedBy').lean().exec(function (err, docs) {
        if (err) {
            error(err)
        } else {
            success(docs)
        }
    })
}

reviewCalibration.prototype.getReviewCalibration = function (error, params, success) {
    ReviewCalibration.findOne(params)
        .populate({
            path: 'peerReviewId',
            model: 'peerreviews',
            select: 'totalMarks reviewSettings',
            populate: {
                path: 'reviewSettings.rubrics',
                model: 'rubrics'
            }
        }).populate({
            path: 'calibrationId',
            model: 'calibration',
            select: 'title calibrationDocuments teacherComments teacherName',
        }).lean().exec(function (err, doc) {
            if (err) {
                error(err)
            } else {
                // console.log(doc)
                success(doc)
            }
        })
}

reviewCalibration.prototype.getReviewCalibrationByUserId = function (error, params, success) {
    ReviewCalibration.findOne(params)
        .populate({
            path: 'peerReviewId',
            model: 'peerreviews',
            select: 'totalMarks reviewSettings',
            populate: {
                path: 'reviewSettings.rubrics',
                model: 'rubrics'
            }
        }).populate('calibrationId submittedBy').lean().exec(function (err, doc) {
            if (err) {
                error(err)
            } else {
                // console.log(doc)
                success(doc)
            }
        })
}

reviewCalibration.prototype.addReviewCalibration = function (error, params, success) {
    var self = this;
    if (!helper.checkRequiredParams(params, ['courseId', 'peerReviewId', 'userId', 'calibrationId'], error)) {
        return;
    }

    userHelper.isEnrolledAsync({ userId: params.userId, courseId: params.courseId }).then(function (isAuthorized) {
        if (!isAuthorized) {
            error(helper.createError401());
            return
        } else {
            Calibration.findOne({ _id: params.calibrationId }).exec().then(function(calibration){
                if (!calibration) {
                    error(new Error('Invalid Calibration'))
                }
    
                var reviewCalibration = new ReviewCalibration({
                    peerReviewId: params.peerReviewId,
                    courseId: params.courseId,
                    calibrationId: params.calibrationId,
                    isAdminReview: params.isAdminReview,
                    reviewedBy: params.userId,
                    submittedBy: calibration.createdBy,
                    comments: params.comments,
                    marksObtained: params.marksObtained,
                    rubricReview: params.rubricReview
                })
    
                reviewCalibration.save(function (err, res) {
                    if (err) {
                        debug('failed saving new reviewCalibration');
                        error(err);
                    }
                    else {
                        debug('calibration review saved successfully');
                        success();
                    }
                });
            })
        }
    })
}

reviewCalibration.prototype.editReviewCalibration = function (error, params, success) {
    var self = this;

    if (!helper.checkRequiredParams(params, ['courseId', 'reviewCalibrationId', 'userId'], error)) {
        return;
    }

    ReviewCalibration.findOne({
        _id: params.reviewCalibrationId
    }).populate('peerReviewId').exec(async(function (err, reviewCalibration) {

        var isAuthorized = await(userHelper.isEnrolledAsync({ userId: params.userId, courseId: params.courseId }))

        if ((reviewCalibration.reviewedBy.toString != params.userId.toString) && !isAuthorized) {
            debug("Unauthorized to perform this functionality");
            error(helper.createError401())
            return
            // Start working from here
            // Admin check should be added and review date as well
        }

        // if (isAuthorized) {
        //     var now = new Date();
        //     var reviewSettings = reviewCalibration.peerReviewId.reviewSettings;
        //     var isReviewTime = false
        //     if (now > reviewSettings.reviewStartDate && now < reviewSettings.reviewEndDate) {
        //         isReviewTime = true
        //     }
        //     if (!isReviewTime) {
        //         var err = new Error('Deadline has passed. Cannot submit review now')
        //         error(err)
        //         return
        //     }
        // }
        reviewCalibration.comments = params.comments
        reviewCalibration.marksObtained = params.marksObtained
        reviewCalibration.rubricReview = params.rubricReview

        reviewCalibration.save(function (err, res) {
            if (err) {
                debug('failed saving new review calibration');
                error(err);
            }
            else {
                debug('review calibration saved successfully');
                success(res._id);
            }
        });
    }))
}

reviewCalibration.prototype.deleteReviewCalibration = function (error, params, success) {
    if (!helper.checkRequiredParams(params, ['courseId', 'reviewCalibrationId', 'userId'], error)) {
        return;
    }
    userHelper.isAuthorized(error,
        {
            userId: params.userId,
            courseId: params.courseId
        },

        function (isAllowed) {
            if (isAllowed) {
                console.log('Deleting Review Calibration: ' + params.reviewCalibrationId)
                ReviewCalibration.findOne({
                    _id: params.reviewCalibrationId
                }).exec(function (err, reviewCalibration) {
                    debug('Review Calibration Id: ', reviewCalibration._id);

                    reviewCalibration.remove()
                })
                success()
            } else {
                error(helper.createError401());
            }
        }
    )
}

module.exports = reviewCalibration;