var config = require('config');
var Calibration = require('./models/calibration.js');
var PeerReview = require('./models/peerReview.js');
var Accuracy = require('./models/accuracy.js');
var Review = require('./models/review.js');
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

function accuracyMetric() {

}

accuracyMetric.prototype.getAccuracies = function (error, params, success) {
    console.log("PARAMS: ", params);
    Accuracy.find(params).exec(function (err, docs) {
        if (err) {
            error(err)
        } else {
            success(docs)
        }
    })
}

accuracyMetric.prototype.getAccuracy = function (error, params, success) {
    Accuracy.findOne(params).exec(function (err, doc) {
        if (err) {
            error(err)
        } else {
            success(doc)
        }
    })
}


accuracyMetric.prototype.addAccuracy = function (error, params, success) {
    console.log("Adding accuracy...");
    var self = this;
    if (!helper.checkRequiredParams(params, ['courseId', 'peerReviewId', 'peerId', 'solutionId'], error)) {
        return;
    }

    var accuracy = new Accuracy({
        accuracy: params.accuracy,
        peerId: params.peerId,
        solutionId: params.solutionId,
        peerReviewId: params.peerReviewId,
        courseId: params.courseId,
    })

    accuracy.save(function (err, res) {
        if (err) {
            debug('failed saving new accuracyMetric');
            error(err);
        }
        else {
            debug('Accuracy saved successfully');
            success();
        }
    });
}

accuracyMetric.prototype.editAccuracy = function (error, params, success) {
    console.log("Updating accuracy...");
    var self = this;

    if (!helper.checkRequiredParams(params, ['courseId', 'peerReviewId', 'peerId', 'solutionId'], error)) {
        return;
    }

    try {
        self.getAccuracy(error, { peerId: params.peerId, solutionId: params.solutionId }, function (accuracyObj) {
            if (accuracyObj) {
                console.log("Accuracy object retrieved to update...");
                accuracyObj.accuracy = params.accuracy;
                accuracyObj.save(function (err, doc) {
                    if (err) {
                        console.log('Failed updating Accuracy');
                        error(err);
                    }
                    else {
                        debug('Accuracy updated successfully');
                        success();
                    }
                });
            } else {
                console.log("Accuracy doesn't exist, now adding...");
                self.addAccuracy(error, params, function () {
                    success();
                });
            }
        })
    } catch (err) {
        console.log("Error in updating accuracy", err);
        error(err);
        return err;
    }
}

accuracyMetric.prototype.getAggregatedAccuracy = function (error, params, success) {
    try {
        var cursor = Accuracy.aggregate([
            {
                $match: {
                    peerId: params.peerId,
                }
            }
            ,
            {
                $group: {
                    _id: "$peerId",
                    overallAccuracy: {
                        $avg: "$accuracy"
                    }
                }
            }
        ]).cursor({ batchSize: 1000 }).exec();

        console.log("executed.....", cursor);
        cursor.on('data', function (doc) {

            console.log("result.....", doc);
            success(doc);
        });

    } catch (err) {
        console.log("Error in getting accuracies: ", err.message);
    }

}

module.exports = accuracyMetric;