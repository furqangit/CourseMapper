var mongoose = require('mongoose');
var appRoot = require('app-root-path');
var userHelper = require(appRoot + '/modules/accounts/user.helper.js');

var reviewCalibrationSchema = new mongoose.Schema({
    marksObtained: { type: Number },
    comments: { type: String },
    isAdminReview : { type: Boolean },
    rubricReview:   mongoose.Schema.Types.Mixed,
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
    calibrationId: { type: mongoose.Schema.Types.ObjectId, ref: 'calibration', required: true },
    peerReviewId: { type: mongoose.Schema.Types.ObjectId, ref: 'peerreviews', required: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'courses', required: true },
    dateAdded: { type: Date },
    dateUpdated: { type: Date }
});

reviewCalibrationSchema.pre('save', function(next){
    var now = new Date();

    if ( !this.dateAdded ) {
        this.dateAdded = now;
    }

    this.dateUpdated = now;

    next();
});

var ReviewCalibration = mongoose.model('reviewCalibration', reviewCalibrationSchema);

module.exports = ReviewCalibration;