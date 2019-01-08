var config = require('config');
var CalibrationScore = require('./models/calibrationScore.js');
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
var moment = require('moment');
var PeerReview = require('./models/peerReview.js');
var reviewCalibrations = require('./reviewCalibration.controller.js');

function calibrationScore() {

}

calibrationScore.prototype.getCalibrationScore = function (error, params, success) {
    CalibrationScore.findOne(params)
        .exec(function (err, doc) {
            if (err) {
                error(err);
            } else {
                if (doc) {
                    success(doc);
                }
                else
                    error(helper.createError404('Calibration Score'));
            }
        });
};

calibrationScore.prototype.getCalibrationScores = function (error, params, success) {
    CalibrationScore.find(params).populate({
        path: 'reviewCalibrationId',
        model: 'reviewCalibration',
        populate: {
            path: 'reviewedBy',
            model: 'users'
        }
    }).lean().exec(function (err, docs) {
        if (!err) {
            success(docs);
        } else {
            error(err);
        }
    })
}

//TODO delete calibration solution reviews too
calibrationScore.prototype.deleteCalibrationScore = function (error, params, success) {
    userHelper.isAuthorized(error,
        {
            userId: params.userId,
            courseId: params.courseId
        },

        async(function (isAllowed) {
            if (isAllowed) {
                console.log('Deleting Calibration Score: ' + params.cSId)
                CalibrationScore.findOne(
                    { _id: mongoose.Types.ObjectId(params.cId) }
                ).exec(function (err, doc) {
                    if (!err) {
                        CalibrationScore.remove(
                            { _id: mongoose.Types.ObjectId(params.cId) }
                        ).exec(function (err, res) {
                            if (!err) {
                                success();
                            } else {
                                error(err);
                            }
                        })
                    } else {
                        error(err);
                    }
                })
            } else {
                error(helper.createError401());
            }
        }));
}

calibrationScore.prototype.addCalibrationScore = function (error, params, success) {
    var self = this;
    if (!helper.checkRequiredParams(params, ['courseId', 'peerReviewId', 'userId', 'calibrationId', 'reviewCalibrationId'], error)) {
        return;
    }
    var calibrationScore = new CalibrationScore({
        accuracy: params.accuracy,
        match: params.match,
        calibrationId: mongoose.Types.ObjectId(params.calibrationId),
        reviewCalibrationId: mongoose.Types.ObjectId(params.reviewCalibrationId),
        createdBy: mongoose.Types.ObjectId(params.userId),
        courseId: mongoose.Types.ObjectId(params.courseId),
        peerReviewId: mongoose.Types.ObjectId(params.peerReviewId),
    });

    calibrationScore.save(function (err, data) {
        if (err) {
            console.log('err', err);
            error(err);
        }
        else {
            success(data, "Calibration Score");
        }
    });

}


module.exports = calibrationScore;