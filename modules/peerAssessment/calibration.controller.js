var config = require('config');
var Calibration = require('./models/calibration.js');
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

function calibration() {

}

calibration.prototype.getCalibration = function (error, params, success) {
    Calibration.findOne(params)
        .exec(function (err, doc) {
            if (err) {
                error(err);
            } else {
                if (doc) {
                    success(doc);
                }
                else
                    error(helper.createError404('Calibration'));
            }
        });
};

calibration.prototype.getCalibrations = function (error, params, success) {
    Calibration.find(params).sort({ dateAdded: -1 }).populate('peerReviewId').exec(function (err, docs) {
        if (!err) {
            success(docs);
        } else {
            error(err);
        }
    })
}

//TODO delete calibration solution reviews too
calibration.prototype.deleteCalibration = function (error, params, success) {
    userHelper.isAuthorized(error,
        {
            userId: params.userId,
            courseId: params.courseId
        },

        async(function (isAllowed) {
            if (isAllowed) {
                console.log('Deleting Calibration: ' + params.cId)
                Calibration.findOne(
                    { _id: mongoose.Types.ObjectId(params.cId) }
                ).exec(function (err, doc) {
                    if (!err) {
                        var sr = new reviewCalibrations()
                        sr.getReviewCalibrations(
                            function (err) {
                                error(err)
                            },
                            {
                                calibrationId: mongoose.Types.ObjectId(doc._id)
                            }, function (docs) {
                                _.each(docs, function (doc) {
                                    sr.deleteReviewCalibration(
                                        function (err) {
                                            console.log("Error: ", err);
                                            error(err)
                                        },
                                        {
                                            userId: params.userId,
                                            courseId: params.courseId,
                                            reviewCalibrationId: mongoose.Types.ObjectId(doc._id)
                                        },
                                        function () {
                                            console.log("Review Calibration successfully deleted: " + doc._id)
                                        })
                                })
                            })
                        _.each(doc.calibrationDocuments, function (docPath) {
                            fs.unlink(appRoot + '/public/' + docPath, function (err) {
                                if (err) {
                                    debug(err);
                                }
                                debug("File deleted successfully");
                            });
                        })

                        Calibration.remove(
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

calibration.prototype.editCalibration = function (error, params, files, success) {
    var self = this;

    if (!helper.checkRequiredParams(params, ['courseId', 'peerReviewId', 'userId', 'calibrationId'], error)) {
        return;
    }

    self.getCalibration(error,
        { _id: params.calibrationId },
        function (calibrationObj) {
            calibrationObj.title = params.title;
            calibrationObj.teacherName = params.teacherName;
            calibrationObj.teacherComments = params.teacherComments;
            calibrationObj.calibrationDocuments = params.calibrationDocuments || [];

            if (files && files.file) {
                var calibrationDocuments = null;
                if (files.file[0] && files.file[0].calibrationDocuments) {
                    calibrationDocuments = files.file[0].calibrationDocuments
                }
                if (calibrationDocuments && calibrationDocuments.constructor == Array) {
                    for (var i in calibrationDocuments) {
                        var f = calibrationDocuments[i];
                        self.saveResourceFile(error,
                            f,
                            'calibrationDocuments',
                            calibrationObj,
                            function (fn) {
                                var duplicate = false;
                                _.each(calibrationObj.calibrationDocuments, function (doc) {
                                    if (fn == doc) {
                                        duplicate = true;
                                    }
                                })
                                if (!duplicate) {
                                    calibrationObj.calibrationDocuments.push(fn);
                                }
                            })
                    }
                }
            }

            // Files deletion should be performed here
            console.log('Deleting files', params.deletedUploadedFiles);
            _.each(params.deletedUploadedFiles, function (filePath) {
                fs.unlink(appRoot + '/public/' + filePath, function (err) {
                    if (err) {
                        debug(err);
                    }
                    debug("File deleted successfully");
                    console.log('File successfully deleted');
                });
            })

            console.log('Calibration', calibrationObj);
            calibrationObj.save(function (err, doc) {
                if (err) {
                    console.log('Failed updating calibration');
                    error(err);
                }
                else {
                    console.log('Calibration updated successfully');
                    success();
                }
            });
        })
}

calibration.prototype.addCalibration = function (error, params, files, success) {
    var self = this;
    if (!helper.checkRequiredParams(params, ['courseId', 'reviewId', 'userId'], error)) {
        return;
    }
    PeerReview.findOne({ _id: mongoose.Types.ObjectId(params.reviewId) }).exec(function (err, peerReview) {
        if (err) {
            console.log("Error fetching peer review: ", err);
            error(err);
            return;
        }
        if (!peerReview) {
            var err = new Error('No such Peer review exists');
            error(err);
            return;
        }

        var now = new Date()
        console.log(now, peerReview.dueDate)
        //TODO here dates checks
        if (now < peerReview.reviewSettings.reviewStartDate) {

            var calibration = new Calibration({
                title: params.title,
                createdBy: mongoose.Types.ObjectId(params.userId),
                courseId: mongoose.Types.ObjectId(params.courseId),
                peerReviewId: mongoose.Types.ObjectId(params.reviewId),
                teacherName: params.username,
                teacherComments: params.teacherComments
            });

            var f = null;
            if (files && files.file) {
                var calibrationDocuments = null;
                if (files.file[0] && files.file[0].calibrationDocuments) {
                    calibrationDocuments = files.file[0].calibrationDocuments;
                }
                //only taking first document (no multi documents)
                f = calibrationDocuments[0];
            } else {
                var err = new Error('Please upload a valid solution file.')
                error(err);
                return;
            }

            self.saveResourceFile(error,
                f,
                'calibrationDocuments',
                calibration,
                function (fn) {
                    var duplicate = false;
                    _.each(calibrationDocuments, function (doc) {
                        if (fn == doc) {
                            duplicate = true;
                        }
                    })
                    if (!duplicate) {
                        calibration.calibrationDocuments.push(fn);
                    }
                })

            calibration.save(function (err, doc) {
                if (err) {
                    console.log('err', err);
                    error(err);
                }
                else {
                    success(doc, peerReview.title);
                }
            });
        } else {
            var err = new Error('Reviews has been started. Cannot submit now')
            error(err)
            return
        }
    });
}

calibration.prototype.saveResourceFile = function (error, file, type, helper, success) {
    var fn = '/pa/' + helper.courseId + '/' + helper._id + '/' + type + '/' + file.name;
    var dest = appRoot + '/public/' + fn;
    try {
        handleUpload(file, dest, true);

    } catch (ex) {
        error(new Error("Failed uploading"));
        return;
    }

    if (success) {
        success(fn);
    }
    //}
}

module.exports = calibration;