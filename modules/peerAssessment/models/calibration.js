var mongoose = require('mongoose');
var appRoot = require('app-root-path');
var userHelper = require(appRoot + '/modules/accounts/user.helper.js');

var calibrationSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    calibrationDocuments: [{ type: String }],
    teacherComments: { type: String },
    teacherName: { type: String },
    peerReviewId: { type: mongoose.Schema.Types.ObjectId, ref: 'peerreviews', required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'courses', required: true },
    isSubmitted : { type: Boolean },
    dateAdded: { type: Date },
    dateUpdated: { type: Date }
},
{ usePushEach: true });

calibrationSchema.pre('save', function(next){
    var now = new Date();

    if ( !this.dateAdded ) {
        this.dateAdded = now;
    }

    this.dateUpdated = now;

    next();
});

var Calibration = mongoose.model('calibration', calibrationSchema);

module.exports = Calibration;