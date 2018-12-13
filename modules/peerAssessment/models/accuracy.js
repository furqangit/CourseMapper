var mongoose = require('mongoose');
var appRoot = require('app-root-path');
var userHelper = require(appRoot + '/modules/accounts/user.helper.js');

var accuracySchema = new mongoose.Schema({
    accuracy: { type: Number },
    solutionId: { type: mongoose.Schema.Types.ObjectId, ref: 'solutions', required: true },
    peerReviewId: { type: mongoose.Schema.Types.ObjectId, ref: 'peerreviews', required: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'courses', required: true },
    peerId: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
    dateAdded: { type: Date },
    dateUpdated: { type: Date }
},{ usePushEach: true });

accuracySchema.pre('save', function(next){
    var now = new Date();

    if ( !this.dateAdded ) {
        this.dateAdded = now;
    }

    this.dateUpdated = now;

    next();
});

var Accuracy = mongoose.model('accuracy', accuracySchema);

module.exports = Accuracy;