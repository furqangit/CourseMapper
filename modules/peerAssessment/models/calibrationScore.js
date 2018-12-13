var mongoose = require('mongoose');
var appRoot = require('app-root-path');
var userHelper = require(appRoot + '/modules/accounts/user.helper.js');

var calibrationScoreSchema = new mongoose.Schema({
    match: {type: Number},
    accuracy: {type: Number},
    reviewCalibrationId: { type: mongoose.Schema.Types.ObjectId, ref: 'reviewCalibration', required: true },
    calibrationId: { type: mongoose.Schema.Types.ObjectId, ref: 'calibration', required: true },
    peerReviewId: { type: mongoose.Schema.Types.ObjectId, ref: 'peerreviews', required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'courses', required: true },
    dateAdded: { type: Date },
    dateUpdated: { type: Date }
},
{ usePushEach: true });

calibrationScoreSchema.pre('save', function(next){
    var now = new Date();

    if ( !this.dateAdded ) {
        this.dateAdded = now;
    }

    this.dateUpdated = now;

    next();
});

var CalibrationScore = mongoose.model('calibrationScore', calibrationScoreSchema);

module.exports = CalibrationScore;