var config = require('config');
var Calibration = require('./models/calibration.js');
var PeerReview = require('./models/peerReview.js');
var Accuracy = require('./models/accuracy.js');
var Review = require('./reviews.controller.js');
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
var DecisionTree = require('decision-tree');

function credibilityMetric() {

}

credibilityMetric.prototype.getAccuracy = function (error, params, success) {
    Accuracy.findOne(params).exec(function (err, doc) {
        if (err) {
            error(err)
        } else {
            success(doc)
        }
    })
}


credibilityMetric.prototype.addAccuracy = function (error, params, success) {
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
            debug('failed saving new credibilityMetric');
            error(err);
        }
        else {
            success();
        }
    });
}

credibilityMetric.prototype.editAccuracy = function (error, params, success) {
    var self = this;

    if (!helper.checkRequiredParams(params, ['courseId', 'peerReviewId', 'peerId', 'solutionId'], error)) {
        return;
    }

    try {
        self.getAccuracy(error, { peerId: params.peerId, solutionId: params.solutionId }, function (accuracyObj) {
            if (accuracyObj) {
                accuracyObj.accuracy = params.accuracy;
                accuracyObj.save(function (err, doc) {
                    if (err) {
                        console.log('Failed updating Accuracy:', err);
                        error(err);
                    }
                    else {
                        success();
                    }
                });
            } else {
                self.addAccuracy(error, params, function () {
                    if(error){
                        helper.createError404("Accuracy");
                    }
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

credibilityMetric.prototype.getAggregatedAccuracy = function (error, params, success) {
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
        cursor.on('data', function (doc) {
            success(doc);
        });

    } catch (err) {
        console.log("Error in getting accuracies: ", err.message);
    }

}

credibilityMetric.prototype.getAggregatedEfficiency = function (error, params, success) { 
    try {
        var r = new Review();
        var ratingCount = 0;
        var sum = 0;
        r.getReviewsForEfficiency(error, params, function (response) {

            var reviewRatings;
            response.forEach(review => {
                if (review.reviewRatings) {
                    reviewRatings = review.reviewRatings;
                    Object.keys(reviewRatings).forEach(function (rubric) {
                        ratingCount++;
                        sum += Number(reviewRatings[rubric]);
                    });
                }
            });
            var avg = sum / ratingCount;
            success(avg);
        })
    } catch (err) {
        console.log("Error in getting efficiencies: ", err.message);
    }

}

credibilityMetric.prototype.getStudentGrade = function (error, params, success) {
    try {
        var r = new Review();
        var grade = 0;
        var total = 0
        r.getReviewsForGrade(error, params, function (response) {

            response.forEach(review => {
                grade += review.marksObtained;
                total += review.peerReviewId.totalMarks;
            });
            success(grade / total * 100);

        })
    } catch (err) {
        console.log("Error in getting efficiencies: ", err.message);
    }

}

credibilityMetric.prototype.getDecisionTree = function(error, params, success){
    var training_data = [
        {"tg":80, "sg":"85"},
        {"tg":70, "sg":"73"},
        {"tg":60, "sg":"58"},
        {"tg":50, "sg":"56"},
        {"tg":90, "sg":"94"},
        {"tg":85, "sg":"84"},
        {"tg":75, "sg":"77"},
        {"tg":65, "sg":"65"},
        {"tg":55, "sg":"51"},
    ];

    var test_data = [
        {"tg":80, "sg":"95"}
    ];

    var class_name = "tg";

    var features = ["sg"];

    var dt = new DecisionTree(training_data, class_name, features);

    var predicted_class = dt.predict({
        sg: "95"
    });

    var accuracy = dt.evaluate(test_data);

    var treeModel = dt.toJSON();

    success({predicted_class: predicted_class, accuracy: accuracy, });
}
module.exports = credibilityMetric;