app.controller('AdminFeedbackController', function ($scope, $http, toastr, $window, $location, $sce, ActionBarService, Upload) {

    vId = $location.search().vId;
    if (!vId) {
        return
    }

    ActionBarService.extraActionsMenu = [];

    ActionBarService.extraActionsMenu.push({
        clickAction: $scope.goBack,
        title: '<i class="ionicons ion-arrow-return-left"></i> &nbsp; BACK',
        aTitle: 'Back'
    }, {
        separator: true
    }, {
        clickAction: $scope.redirectPRHome,
        title: '<i class="ionicons ion-home"></i> &nbsp; PEER REVIEWS HOME',
        aTitle: 'Peer Review Home'
    });

    var fetchSolution = function () {
        var url = '/api/peerassessment/' + $scope.course._id + '/solutions/' + vId;
        $http.get(url).then(function (response) {
            if (response.data.solution) {
                var solution = response.data.solution;
                if (solution.solutionDocuments && solution.solutionDocuments.length > 0) {
                    solution.displayDocumentsList = [];
                    _.each(solution.solutionDocuments, function (docName) {
                        var temp = {};
                        temp.link = window.location.origin + docName;
                        var tempArr = docName.split('/');
                        temp.name = tempArr[tempArr.length - 1];
                        solution.displayDocumentsList.push(temp);
                    })
                }
                $scope.solution = solution;
                console.log('Solution', solution)
                fetchPeerReviewsRating(); // Uncomment when needed
                fetchPeerReverseReviewsRating();


            }
        }, function (err) {
            // Check for proper error message later
            toastr.error('Internal Server Error. Please try again later.');
        })
    }

    var reviews;
    var fetchPeerReviews = function () {
        var url = '/api/peerassessment/' + $scope.course._id + '/reviews?rName=AFCFetchPeerReviews&solutionId=' + vId + '&isAdminReview=false&isSubmitted=true';
        $http.get(url).then(function (response) {
            console.log('Students', response)
            if (response.data.reviews) {
                reviews = response.data.reviews
                var oldReviewsID = []
                _.each(reviews, function (review) {
                    // handling removal of old reviews if there is a second loop review
                    if (review.oldReviewId) {
                        oldReviewsID.push(review.oldReviewId)
                    }
                });

                $scope.reviews = _.filter(reviews, function (review) {
                    if (_.indexOf(oldReviewsID, review._id) == -1 || review.isSecondLoop) {
                        return review
                    }
                })

                var userMarksToPlot = _.filter(reviews, function (review) {
                    if (_.indexOf(oldReviewsID, review._id) == -1 || review.isSecondLoop) {
                        return review
                    }
                })

                DrawBarChartObtainedMarks(userMarksToPlot);
                DrawMeanPieChart(userMarksToPlot);

            }
        }, function (err) {
            // Check for proper error message later
            toastr.error('Internal Server Error. Please try again later.');
        })
    }

    var reviews;
    var fetchPeerReviewsRating = function () {
        var url = '/api/peerassessment/' + $scope.course._id + '/reviewsRatings?rName=ReviewsRating&solutionId=' + vId + '&cUserId=' + $scope.solution.createdBy + '&isAdminReview=true';
        $http.get(url).then(function (response) {
            console.log('Students', response)
            if (response.data.reviews) {
                reviews = response.data.reviews
                var oldReviewsID = []
                _.each(reviews, function (review) {
                    // handling removal of old reviews if there is a second loop review
                    if (review.oldReviewId) {
                        oldReviewsID.push(review.oldReviewId)
                    }
                });

                var userRatingToPlot = _.filter(reviews, function (review) {
                    if (_.indexOf(oldReviewsID, review._id) == -1 || review.isSecondLoop) {
                        return review
                    }
                })
                DrawReviewRatingPieChart(userRatingToPlot);
            }
        }, function (err) {
            // Check for proper error message later
            toastr.error('Internal Server Error. Please try again later.');
        })
    }

    var userName;
    var newReviewRatingObj = {};
    var reviews;
    var userRatingToPlot;
    var fetchPeerReverseReviewsRating = function () {
        var url = '/api/peerassessment/' + $scope.course._id + '/reviewsRatings?rName=ReverseReviewsRating1&solutionId=' + vId + '&cUserId=' + $scope.solution.createdBy + '&isReverseReview=true';
        $http.get(url).then(function (response) {
            console.log('Students', response)
            if (response.data.reviews) {
                reviews = response.data.reviews
                var oldReviewsID = []
                _.each(reviews, function (review) {
                    // handling removal of old reviews if there is a second loop review
                    if (review.oldReviewId) {
                        oldReviewsID.push(review.oldReviewId)
                    }
                });
                userRatingToPlot = _.filter(reviews, function (review) {
                    if (_.indexOf(oldReviewsID, review._id) == -1 || review.isSecondLoop) {
                        return review
                    }
                })

                var tLoop = userRatingToPlot.length;
                var userRating = userRatingToPlot;

                var totalNum = 0;
                var ratingMean = 0;
                var totalPeerReviews = 0;
                console.log('userRating', userRating)
                for (var i = 0; i < tLoop; i++) {
                    var data = userRatingToPlot;
                    userName = data[i].assignedTo.displayName;
                    totalPeerReviews = data[i].peerReviewId.reviewSettings.rubrics.length

                    var PeerReviewsProp;

                    var check2 = (data[i].reviewRatings); //sometime there are no reverse review submited
                    if (check2 !== undefined) {
                        

                        var ratingArray = Object.entries(data[i].reviewRatings);
                        //totalNum = Object.size(data[i].reviewRatings); ///////////////////////////////
                        for (var j = 0; j < totalPeerReviews; j++) {
                            
                            PeerReviewsProp = data[j].peerReviewId.reviewSettings.rubrics[j]._id;
                            var ratingV = read_prop(data[i].reviewRatings, PeerReviewsProp); //to see which rubrics Admin Checked 
                            
                            ratingMean = ratingMean + +ratingV;
                            //ratingMean = ratingMean + +ratingArray[j][1];
                        }
                       
                        if(!isNaN(ratingMean / totalPeerReviews))
                        ratingMean = ratingMean / totalPeerReviews;
                                 else
                                 ratingMean = 0

                        
                    var finalValue = (ratingMean / 5) * 100; //because Maximum rating is 5, and converting it to %
                        newReviewRatingObj[userName] = finalValue.toFixed(0);
                        ratingMean = 0; 
                    }      
                }
                    // var url = '/api/peerassessment/' + $scope.course._id + '/reviewsRatings?rName=ReverseReviewsRating&solutionId=' + vId + '&cUserId=' + userRatingToPlot[i].assignedTo._id + '&peerReviewId=' + $scope.solution.peerReviewId._id; 
                    // $http.get(url).then(function (response) {
                    //     console.log('reviewsRatings', response)
                    //     console.log('userRating', userRating)
                    // if (response.data.reviews && response.data.reviews.length) {
                    //     var data = response.data.reviews;

                    //     var totalReviews = data.length;
                    //     var totalReviewsToDivide = data.length;
                    //         var check = (data[0].reviewRatings);
                    //         // if (check !== undefined) {
                    //         $scope.reviewsRatingNum = 1;
                    //         var totalNum = 0;
                    //         var ratingMean = 0;
                    //         var ratingMeanAll = 0;
                    //         for (var i = 0; i < totalReviews; i++) {
                    //             var check2 = (data[i].reviewRatings); //sometime there are reviews assigned but not submited by users
                    //             if (check2 !== undefined) {
                    //                 var ratingArray = Object.entries(data[i].reviewRatings);
                    //                 totalNum = Object.size(data[i].reviewRatings);
                    //                 for (var j = 0; j < totalNum; j++) {
                    //                     ratingMean = ratingMean + +ratingArray[j][1];
                    //                 }
                    //                 ratingMean = ratingMean / totalNum;
                    //                 ratingMeanAll = ratingMeanAll + +ratingMean;
                    //                 ratingMean = 0; 
                    //             } else {
                    //                 totalReviewsToDivide--;
                    //             }

                    //             userName = data[i].submittedBy.displayName;
                    //         }
                    //         if(!isNaN(ratingMeanAll / totalReviewsToDivide))
                    //             ratingMeanAll = ratingMeanAll / totalReviewsToDivide;
                    //         else
                    //         ratingMeanAll = 0

                    //         var finalValue = (ratingMeanAll / 5) * 100; //because Maximum rating is 5, and converting it to %
                    //         newReviewRatingObj[userName] = finalValue.toFixed(0); // this object is used in the bar chart below to show the % of reverse reviews
                    //         userName = "";
                    //}

                    // }, function (err) {
                    //     // Check for proper error message later
                    //     toastr.error('Internal Server Error. Please try again later.');
                    // })
                
            }
        }, function (err) {
            // Check for proper error message later
            toastr.error('Internal Server Error. Please try again later.');
        })
    }

    function read_prop(obj, prop) {
        return obj[prop];
    }

    var fetchAdminReview = function () {
        var url = '/api/peerassessment/' + $scope.course._id + '/reviews?rName=AFCFetchPeerReviews&solutionId=' + vId + '&isAdminReview=true';
        $http.get(url).then(function (response) {
            console.log('Admin', response)
            $scope.existingReview = false
            if (response.data.reviews && response.data.reviews.length) {
                var review = response.data.reviews[0]
                if (review.documents && review.documents.length > 0) {
                    review.displayDocumentsList = [];
                    _.each(review.documents, function (docName) {
                        console.log(docName)
                        var temp = {};
                        temp.link = window.location.origin + docName;
                        var tempArr = docName.split('/');
                        temp.name = tempArr[tempArr.length - 1];
                        review.displayDocumentsList.push(temp);
                    })
                }
                $scope.review = review
                $scope.existingReview = true
            }
        }, function (err) {
            // Check for proper error message later
            toastr.error('Internal Server Error. Please try again later.');
        })
    }

    //Fetcing Data like current PDF URL and retriving data from pdf
    var arrayToBeHighlight = [];
    var globalPDF_Data = "";
    var userPdfUrl = "",
        solutionPdfUrl = "";
    var userWordsArray = [],
        solutionWordsArray = [];
    var solWords,
        userWords;

    var fetchingCommonWordsPDFs = function () {
        var userPdfText = "",
            solutionPdfText = "";

        var url = '/api/peerassessment/' + $scope.course._id + '/solutions/' + vId;
        $http.get(url).then(function (response) {
            if (response.data.solution) {
                var solution = response.data.solution;
                if (solution.solutionDocuments && solution.solutionDocuments.length > 0) {
                    solutionPdfUrl = solution.peerReviewId.solutions[0];
                    userPdfUrl = solution.solutionDocuments[0];

                    globalPDF_Data = "";
                    PDF_Reader(solutionPdfUrl).then(function () {
                        solutionPdfText = globalPDF_Data;

                    }).then(function () {

                        globalPDF_Data = "";
                        PDF_Reader(userPdfUrl).then(function () {
                            userPdfText = globalPDF_Data;

                        }).then(function () {

                            var UserArray = RemoveUnnecessaryWord(userPdfText.replace(/(\b(\w{1,2})\b(\s|$))/g, '').split(" "));
                            var SolArray = RemoveUnnecessaryWord(solutionPdfText.replace(/(\b(\w{1,2})\b(\s|$))/g, '').split(" "));

                            arrayToBeHighlight = similarityComputation(SolArray, UserArray); //populating array for words to highlight

                            AnalyzingDataUsingStatisticalMethods(solutionPdfText.toLowerCase(), userPdfText.toLowerCase());
                            AnalyzingReviews();
                            fetchingDataForUserAndSolutionPdf();
                        });
                    });

                }
            }
        }, function (err) {
            // Check for proper error message later
            toastr.error('Internal Server Error. Please try again later.');
        })
    }

    var fetchingDataForUserAndSolutionPdf = function () {
        var url = '/api/peerassessment/' + $scope.course._id + '/solutions/' + vId;
        $http.get(url).then(function (response) {
            if (response.data.solution) {
                var solution = response.data.solution;
                if (solution.solutionDocuments && solution.solutionDocuments.length > 0) {
                    solutionPdfUrl = solution.peerReviewId.solutions[0];
                    userPdfUrl = solution.solutionDocuments[0];
                }

                PDF_Reader(userPdfUrl).then(function () {
                    var url = '/api/peerassessment/textextraction/' + globalPDF_Data
                        .replace(/ /g, "+") //replaces spaces with + to pass it to the server
                        .replace(/(\b(\w{1,2})\b(\s|$))/g, ''); //remove all charactors less then 2

                    $http.get(url).then(function (response) {
                        if (response.data.extratctedText) {
                            var extratctedText = response.data.extratctedText;
                            for (var str in extratctedText) {
                                userWordsArray.push([str, extratctedText[str]]);
                            }
                            loadUserCloud(userWordsArray);
                        }
                    }, function (err) {
                        // Check for proper error message later
                        toastr.error('Internal Server Error. Please try again later.');
                    })

                });

                //**************************************************/

                globalPDF_Data = "";
                PDF_Reader(solutionPdfUrl).then(function () {
                    var url = '/api/peerassessment/textextraction/' + globalPDF_Data
                        .replace(/ /g, "+") //replaces spaces with + to pass it to the server
                        .replace(/(\b(\w{1,2})\b(\s|$))/g, ''); //remove all charactors less then 2

                    $http.get(url).then(function (response) { //sending data to server
                        if (response.data.extratctedText) {
                            var extratctedText = response.data.extratctedText;

                            for (var str in extratctedText) {
                                solutionWordsArray.push([str, extratctedText[str]]);
                            }
                            loadSolutionCloud(solutionWordsArray);
                        }

                    }, function (err) {
                        // Check for proper error message later
                        toastr.error('Internal Server Error. Please try again later.');
                    })

                });

            }
        }, function (err) {
            // Check for proper error message later
            toastr.error('Internal Server Error. Please try again later.');
        })
    }

    var loadUserCloud = function (sortedWordsArray) {
        var width = 600,
            height = 320;

        var userWords = sortedWordsArray;
        userWords = userWords.map(function (d) {
            return {
                text: d[0],
                size: d[1]
            };
        });

        // min/max word size
        maxSize = d3.max(userWords, function (d) {
            return d.size;
        });
        minSize = d3.min(userWords, function (d) {
            return d.size;
        });

        var fontScale = d3.scale.linear() // scale algo which is used to map the domain to the range
            .domain([minSize, maxSize]) //set domain which will be mapped to the range values
            .range([10, 50]); // set min/max font size (so no matter what the size of the highest word it will be set to 40 in this case)

        var fill = d3.scale.category20();
        d3.layout.cloud().size([width, height])
            .words(userWords)
            .rotate(function () {
                return ~~(Math.random() * 2) * 90;
            })
            .font("Impact")
            .fontSize(function (d) {
                return fontScale(d.size)
            }) // the d3 scale function is used here
            .on("end", drawUserCloud)
            .start();

        function drawUserCloud(userWords) {
            var g = d3.select("#userWordCloud").append("svg")
                .attr("width", width)
                .attr("height", height)
                .append("g")
                .attr("transform", "translate(" + (width / 2) + "," + (height / 2) + ")");

            var texts = g.selectAll("text")
                .data(userWords)
                .enter().append("text")
                .style("font-size", function (d) {
                    return d.size + "px";
                })
                .style("font-family", "Impact")
                .style("fill", function (d, i) {
                    return fill(i);
                })
                .attr("text-anchor", "middle")
                .attr("transform", function (d) {
                    return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
                })
                .text(function (d) {
                    return d.text;
                });

            texts.filter(function (d) {
                    return arrayToBeHighlight.indexOf(d.text) != -1;
                })
                .each(function (d) {
                    var bbox = this.getBBox(),
                        trans = d3.select(this).attr('transform');
                    g.insert("rect", "text")
                        .attr("transform", trans)
                        .attr("x", -bbox.width / 2)
                        .attr("y", bbox.y)
                        .attr("width", bbox.width)
                        .attr("height", bbox.height)
                        .style("fill", "yellow");
                });
        }
    }

    var loadSolutionCloud = function (sortedWordsArray) {

        var width = 600,
            height = 320;

        var solWords = sortedWordsArray;
        solWords = solWords.map(function (d) {
            return {
                text: d[0],
                size: d[1]
            };
        });

        // min/max word size
        maxSize = d3.max(solWords, function (d) {
            return d.size + 2;
        });
        minSize = d3.min(solWords, function (d) {
            return d.size;
        });

        //console.log("before", solWords); 

        var fontScale = d3.scale.linear() // scale algo which is used to map the domain to the range
            .domain([minSize, maxSize]) //set domain which will be mapped to the range values
            .range([10, 50]); // set min/max font size (so no matter what the size of the highest word it will be set to 40 in this case)

        var fill = d3.scale.category20();
        d3.layout.cloud().size([width, height])
            .words(solWords)
            .rotate(function () {
                return ~~(Math.random() * 2) * 90;
            })
            .font("Impact")
            .fontSize(function (d) {
                return fontScale(d.size)
            }) // the d3 scale function is used here
            .on("end", drawSolCloud)
            .start();

        function drawSolCloud(solWords) {
            var g = d3.select("#solutionWordCloud").append("svg")
                .attr("width", width)
                .attr("height", height)
                .append("g")
                .attr("transform", "translate(" + (width / 2) + "," + (height / 2) + ")");

            var texts = g.selectAll("text")
                .data(solWords)
                .enter().append("text")
                .style("font-size", function (d) {
                    return d.size + "px";
                })
                .style("font-family", "Impact")
                .style("fill", function (d, i) {
                    return fill(i);
                })
                .attr("text-anchor", "middle")
                .attr("transform", function (d) {
                    return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
                })
                .text(function (d) {
                    return d.text;
                });

            texts.filter(function (d) {
                    return arrayToBeHighlight.indexOf(d.text) != -1;
                })
                .each(function (d) {
                    var bbox = this.getBBox(),
                        trans = d3.select(this).attr('transform');
                    g.insert("rect", "text")
                        .attr("transform", trans)
                        .attr("x", -bbox.width / 2)
                        .attr("y", bbox.y)
                        .attr("width", bbox.width)
                        .attr("height", bbox.height)
                        .style("fill", "yellow");
                });
        }
        AnalyzedReviewsToVisualize();
    }


    var AnalyzingReviews = function () {
        var url = '/api/peerassessment/' + $scope.course._id + '/analyzedReviews?rName=AFCFetchPeerReviews&solutionId=' + vId + '&isAdminReview=false&isSubmitted=true';
        $http.get(url).then(function (response) {
            if (response.data.AnalyzedRewiewData && Object.size(response.data.AnalyzedRewiewData)) {
                var obj = response.data.AnalyzedRewiewData;

                var reviewUserNameStrObj = {};
                var reviewHeaderStrObj = {};
                //just to remove the duplications of same heading names AS an object does not add same keys, when it has a same key it just replace the older one
                for (var key in obj) {
                    var arr1 = key.split("-");
                    reviewHeaderStrObj[arr1[0]] = 0;

                    var arr1User = key.split("*");
                    var arr2User = arr1User[1].split(":");
                    reviewUserNameStrObj[arr2User[0]] = 0;
                    reviewUserNameStrObj[arr2User[1]] = 0;
                }

                //same for rubrics
                var reviewRubricStrObj = {};
                for (var key in obj) {
                    var arr1 = key.split("-");
                    var arr2 = arr1[1].split(":");
                    reviewRubricStrObj[arr2[0]] = arr2[1];
                }


                // var userLegends = [];
                // for (var key in reviewUserNameStrObj) {
                //     userLegends.push(key);
                // }
                // $scope.userLegend = userLegends;
                // treeData += "[ ['Phrases', 'size', { role: 'style' }],";

                var LegendArr = [];
                for (var legend in reviewUserNameStrObj) {

                    var s1 = legend.replace("=", " = ");
                    LegendArr.push(s1);
                }

                var reviewArray = Object.entries(obj);
                var rubricArray = Object.entries(reviewRubricStrObj);

                // var reviewArraySorted = Object.entries(obj);
                // reviewArraySorted = reviewArraySorted.sort();

                var strTable = "";

                strTable = "<table style='width: 100%' class='table-hover'>";
                strTable += "<thead>";
                strTable += "<tr>";

                strTable += "<th style='text-align:center; width: 350px;'></th>";
                for (var keyHeader in reviewHeaderStrObj) { //fetching data from review Object
                    strTable += "<th style='width: 12%'>" + keyHeader + "</th>"; //width: 10%
                }
                strTable += "<th style='text-align:center; width: 200px'> Mean (%) </th>";

                strTable += "</tr>";
                strTable += "</thead>";
                strTable += "<tbody>";

                var loop = 0;
                var rubricSize = Object.size(reviewRubricStrObj);
                var userReviewHeaderSize = Object.size(reviewHeaderStrObj);


                for (var i = 0; i < rubricSize; i++) { //Object.size is a user defined function, can be found in the bottom of this page       
                    var mean = 0;
                    strTable += "<tr>";
                    strTable += "<td style='text-align:center; width: 350px'>" + rubricArray[i][1] + ":</td>"; //Rubric   (i+1)
                    for (var j = 0; j < userReviewHeaderSize; j++) {
                        strTable += "<td style='text-align:center; width: 12%'><div id='stackedChart" + loop + "'style='height: 40px; width: 80%'></div> </td>"; // + reviewArray[loop][1] +   width: 10%;   width: 80%;
                        mean = +(reviewArray[loop][1]) + +(mean);
                        loop++
                    }
                    strTable += "<td style='text-align:center; width: 200px'><b>" + (mean / userReviewHeaderSize).toFixed(2) + "</b></td>";
                    strTable += "</tr>";
                }
                strTable += "</tr>";
                strTable += "</tbody>";
                strTable += "</table>";

                $scope.legends = LegendArr;
                $scope.rTable = $sce.trustAsHtml(strTable);
                $scope.analyzedRewiewData = true;
                DrawReverseReviewsBarChart();
            } else {
                $scope.analyzedRewiewData = false;
            }
        }, function (err) {
            // Check for proper error message later
            toastr.error('Internal Server Error. Please try again later.');
        })
    }


    function DrawReverseReviewsBarChart() {


        var rReviewsArray = Object.entries(newReviewRatingObj);

        var barChart = c3.generate({
            bindto: '#ReverseReviewsBarChart',
            data: {
                columns: [

                ],
                type: 'bar',
                labels: true
            },
            legend: {
                position: 'right'
            },
            color: {
                pattern: ['#1f77b4', '#2ca02c', '#ff7f0e', '#9467bd', '#aec7e8', '#98df8a', '#bcbd22', '#ff7f0e', '#9467bd', '#e377c2', '#aec7e8', '#98df8a', '#d62728', '#ff9896', '#1f77b4', '#2ca02c', '#ff7f0e', '#9467bd', '#c5b0d5', '#8c564b', '#c49c94', '#e377c2', '#f7b6d2', '#7f7f7f', '#c7c7c7', '#bcbd22', '#dbdb8d', '#17becf', '#9edae5']
            },
            bar: {
                width: {
                    ratio: 0.6 // this makes bar width 50% of length between ticks
                }
            },
            axis: {
                rotated: true,
                x: {
                    type: 'categorized',
                    tick: {
                        format: function (x) {
                            return '';
                        }
                    }
                },
                y: {
                    type: 'categorized',
                    tick: {

                    }
                }
            }
        });

        for (var j = 0; j < rReviewsArray.length; j++) {
            callSetTimeOut(rReviewsArray, j); //
        }

        function callSetTimeOut(rReviewsArray, loop) {
            setTimeout(function () {
                barChart.load({
                    columns: [
                        [rReviewsArray[loop][0], rReviewsArray[loop][1]]
                    ]
                });
            }, (loop * 1000));
        }
    }

    //because after the Reviews table is created dynamically we need to Draw right Stacked Chart 
    var AnalyzedReviewsToVisualize = function () {
        var url = '/api/peerassessment/' + $scope.course._id + '/analyzedReviews?rName=AFCFetchPeerReviews&solutionId=' + vId + '&isAdminReview=false&isSubmitted=true';
        $http.get(url).then(function (response) {
            console.log('Students', response)
            if (response.data.AnalyzedRewiewData) {

                var obj = response.data.AnalyzedRewiewData;

                var reviewHeaderStrObj = {};
                //just to remove the duplications of same heading names AS an object does not add same keys, when it has a same key it just replace the older one
                for (var key in obj) {
                    var arr1 = key.split("-");
                    reviewHeaderStrObj[arr1[0]] = 0;
                }

                //same for rubrics
                var reviewRubricStrObj = {};
                for (var key in obj) {
                    var arr1 = key.split("-");
                    var arr2 = arr1[1].split(":");
                    reviewRubricStrObj[arr2[0]] = 0;
                }

                var reviewArray = Object.entries(obj);

                var rubricSize = Object.size(reviewRubricStrObj);
                var userReviewHeaderSize = Object.size(reviewHeaderStrObj);

                loop = 0;
                for (var i = 0; i < rubricSize; i++) { //Object.size is a user defined function, can be found in the bottom of this page       
                    for (var j = 0; j < userReviewHeaderSize; j++) {
                        DrawStackedChart(reviewArray[loop][1], loop);
                        loop++
                    }
                }

            }
        }, function (err) {
            // Check for proper error message later
            toastr.error('Internal Server Error. Please try again later.');
        })
    }


    function AnalyzingDataUsingStatisticalMethods(solutionData, userData) {

        var concatUserSolData = solutionData + ' ||| ' + userData; // Concatenating the text by |||, so that it can be separated on server-side and the whole process should be served in 1 call

        var url = '/api/peerassessment/textanalyzer/' + concatUserSolData.replace(/ /g, "+");

        $http.get(url).then(function (response) {
            if (response.data.AnalyzedData) {
                var analyzedRepertData = response.data.AnalyzedData;

                DrawDonutChart(analyzedRepertData.CosineSimilarity, "Cosine");
                DrawDonutChart(analyzedRepertData.DiceCoefficientSimilarity, "Dice");
                DrawDonutChart(analyzedRepertData.LevenshteinSimilarity, "Leven");
                DrawDonutChart(analyzedRepertData.JaccardSimilarity, "Jaccard");
                DrawDonutChart(analyzedRepertData.Mean, "Mean");

                $scope.analyzedRepertData_Obj = analyzedRepertData;
            }
        }, function (err) {
            // Check for proper error message later
            toastr.error('Internal Server Error. Please try again later.');
        })
    }

    function DrawDonutChart(matches, idStr) {
        var widthNum = 50;
        if (idStr == "Mean") {
            widthNum = 70;
        }
        var misMatches = 100 - matches;
        var chart = c3.generate({
            bindto: '#chart' + idStr,
            data: {
                columns: [
                    ["Mismatches", 100],
                    ["Matches", 0],
                ],
                type: 'donut',
                colors: {
                    Matches: '#1f77b4', //Blue
                    Mismatches: '#66c2ff' //Light Blue
                },
                color: function (color, d) {
                    return color;
                },
                order: null
            },
            donut: {
                label: {},
                title: idStr,
                width: widthNum
            }
        });
        setTimeout(function () {
            chart.load({
                columns: [
                    ["Matches", matches],
                    ["Mismatches", misMatches]
                ]
            });
        }, 2000);
    }

    function DrawStackedChart(matches, id) {
        var num = 100 - matches;
        var misMatches = num.toFixed(2);
        var chart = c3.generate({
            bindto: "#stackedChart" + id,
            data: {
                columns: [
                    ['Matches', 0],
                    ['Mismatches', 100]
                ],
                type: 'bar',
                groups: [
                    ['Matches', 'Mismatches']
                ],
                order: null,
                colors: {
                    Matches: '#1f77b4', //Blue
                    Mismatches: '#66c2ff' //Light Blue
                },
                color: function (color, d) {
                    return color;
                }
            },
            axis: {
                rotated: true,
                x: {
                    show: false
                },
                y: {
                    show: false
                }
            },
            legend: {
                show: false
            }
        });

        setTimeout(function () {
            chart.load({
                columns: [
                    ['Mismatches', misMatches],
                    ['Matches', matches]
                ]
            });
            chart.groups([
                ['Mismatches', 'Matches']
            ])
        }, 2000);
    }

    function DrawReviewRatingPieChart(data) {
        var totalReviews = data.length;
        var totalReviewsToDivide = data.length;
        if (totalReviews > 0) {
            var check = (data[0].reviewRatings);
            // if (check !== undefined) {
            $scope.reviewsRatingNum = 1;
            var totalNum = 0;
            var ratingMean = 0;
            var ratingMeanAll = 0;
            for (var i = 0; i < totalReviews; i++) {
                var check2 = (data[i].reviewRatings); //sometime there are reviews assigned but not submited
                if (check2 !== undefined) {
                    var ratingArray = Object.entries(data[i].reviewRatings);
                    totalNum = Object.size(data[i].reviewRatings);
                    for (var j = 0; j < totalNum; j++) {
                        ratingMean = ratingMean + +ratingArray[j][1];
                    }
                    ratingMean = ratingMean / totalNum;
                    ratingMeanAll = ratingMeanAll + +ratingMean;
                    ratingMean = 0;
                } else {
                    totalReviewsToDivide--;
                }
            }
            ratingMeanAll = ratingMeanAll / totalReviewsToDivide;
            var valueToPlot = (ratingMeanAll / 5) * 100; //because Maximum rating is 5, and converting it to %

            var widthNum = 70;
            var Negitive = 100 - valueToPlot;
            var chart = c3.generate({
                bindto: '#ratingPieChart',
                data: {
                    columns: [
                        ["Negitive", 100],
                        ["Positive", 0],
                    ],
                    type: 'donut',
                    colors: {
                        Positive: '#1f77b4', //blue
                        Negitive: '#66c2ff' //l.blue
                    },
                    color: function (color, d) {
                        return color;
                    },
                    order: null
                },
                donut: {
                    label: {},
                    title: "Rating: " + valueToPlot.toFixed(0) + "/100",
                    width: widthNum
                }
            });
            setTimeout(function () {
                chart.load({
                    columns: [
                        ["Positive", valueToPlot],
                        ["Negitive", Negitive]
                    ]
                });
                chart.legend.hide();
            }, 0);
            // } else {
            //     $scope.reviewsRatingNum = 0;
            // }
        }

    }

    function DrawBarChartObtainedMarks(data) {
        var totalReviews = data.length;
        if (totalReviews > 0) {

            var revObj = {};
            for (var i = 0; i < totalReviews; i++) {
                revObj[data[i].assignedTo.displayName] = data[i].marksObtained;
            }

            var sortedData = [];
            for (var str in revObj) {
                sortedData.push([str, revObj[str]]);
            }

            sortedData.sort(function (a, b) {
                return a[1] - b[1];
            });

            var barChart = c3.generate({
                bindto: '#marksObtainedBarChart',
                data: {
                    columns: [

                    ],
                    type: 'bar',
                    labels: true
                },
                color: {
                    pattern: ['#1f77b4', '#2ca02c', '#ff7f0e', '#9467bd', '#aec7e8', '#98df8a', '#d62728', '#ff9896', '#c5b0d5', '#8c564b', '#c49c94', '#e377c2', '#f7b6d2', '#7f7f7f', '#c7c7c7', '#bcbd22', '#dbdb8d', '#17becf', '#9edae5']
                },
                bar: {
                    width: {
                        ratio: 0.6 // this makes bar width 50% of length between ticks
                    }
                },
                axis: {

                    x: {
                        type: 'categorized',
                        tick: {
                            format: function (x) {
                                return '';
                            }
                        }
                    }
                }
            });

            for (var j = 0; j < sortedData.length; j++) {
                callSetTimeOut(sortedData, j); //
            }

            function callSetTimeOut(sortedData, loop) {
                setTimeout(function () {
                    barChart.load({
                        columns: [
                            [sortedData[loop][0], sortedData[loop][1]]
                        ]
                    });
                }, (loop * 1000));
            }
        }
    }

    function DrawMeanPieChart(data) {
        var totalReviews = data.length;
        if (totalReviews > 0) {

            var revObj = {};
            for (var i = 0; i < totalReviews; i++) {
                revObj[data[i].assignedTo.displayName] = data[i].marksObtained;
            }

            var reviewArray = Object.entries(revObj);

            var marksMeanValue = 0;
            for (var k = 0; k < reviewArray.length; k++) {
                marksMeanValue = +marksMeanValue + +reviewArray[k][1]
            }

            marksMeanValue = (marksMeanValue / reviewArray.length);

            var widthNum = 70;
            var subMarks = 100 - marksMeanValue;
            var chart = c3.generate({
                bindto: '#totalMarksMeanPieChart',
                data: {
                    columns: [
                        // ["Marks", marksMeanValue],
                        // ["subMarks", subMarks]
                        ["subMarks", 100],
                        ["Marks", 0],
                    ],
                    type: 'donut',
                    colors: {
                        Marks: '#1f77b4', //Green 059E00
                        subMarks: '#66c2ff' //Red ff8000 ff7f0e  EE0909
                    },
                    color: function (color, d) {
                        return color;
                    },
                    order: null
                },
                donut: {
                    label: {},
                    title: "Mean: " + marksMeanValue.toFixed(0),
                    width: widthNum
                }
            });
            setTimeout(function () {
                chart.load({
                    columns: [
                        ["Marks", marksMeanValue],
                        ["subMarks", subMarks]
                    ]
                });
                chart.legend.hide();
            }, 0);


        }
    }


    fetchPeerReviews();
    fetchAdminReview();
    fetchSolution();
    fetchingCommonWordsPDFs();
    //AnalyzedReviewsToVisualize();


    $scope.reviewDocuments = false;
    $scope.deleteUploadedFiles = function (fileName) {
        for (var i = 0; i < $scope.review.displayDocumentsList.length; i++) {
            if ($scope.review.displayDocumentsList[i].link == fileName) {
                if (!$scope.review.deletedUploadedFiles) {
                    $scope.review.deletedUploadedFiles = [];
                }
                $scope.review.deletedUploadedFiles.push($scope.review.documents[i]);
                $scope.review.documents.splice(i, 1);
                $scope.review.displayDocumentsList.splice(i, 1);
                break;
            }
        }
    }

    $scope.deleteSelectedFiles = function (fileName) {
        console.log('Review Docs Selected', $scope.reviewDocuments, fileName);
        for (var i = 0; i < $scope.reviewDocuments.length; i++) {
            if ($scope.reviewDocuments[i].name == fileName) {
                $scope.reviewDocuments.splice(i, 1);
                break;
            }
        }
    }

    $scope.isFormValid = function () {
        if ($scope.form.$error.min && $scope.form.$error.min.length) {
            return false
        } else if ($scope.form.$error.number && $scope.form.$error.number.length) {
            return false
        } else if ($scope.form.$error.required && $scope.form.$error.required.length) {
            return false
        } else if ($scope.form.$error.max && $scope.form.$error.max.length) {
            return false
        }
        return true
    }

    $scope.submitReview = function () {
        console.log($scope.review)
        $scope.isLoading = true;
        var uploadParams;
        if ($scope.existingReview) {
            uploadParams = {
                method: 'PUT',
                url: '/api/peerassessment/' + $scope.course._id + '/reviews/' + $scope.review._id,
                fields: $scope.review
            };
        } else {
            console.log(_.extend($scope.review, {
                solutionId: $scope.solution._id
            }))
            uploadParams = {
                method: 'POST',
                url: '/api/peerassessment/' + $scope.course._id + '/peerreviews/' + $scope.solution.peerReviewId._id + '/reviews/add',
                fields: _.extend($scope.review, {
                    solutionId: $scope.solution._id
                })
            };
        }
        uploadParams.file = [];
        if ($scope.reviewDocuments) {
            uploadParams.file.push({
                'reviewDocuments': $scope.reviewDocuments
            });
        }

        $scope.upload = Upload.upload(
                uploadParams
            )
            .progress(function (evt) {
                if (!evt.config.file)
                    return;

                $scope.progress = parseInt(100.0 * evt.loaded / evt.total);
                // console.log("Progress", $scope.progress);
            })
            .success(function (data) {
                $scope.progress = 0;
                if (data.result) {
                    toastr.success('Successfully Saved');
                } else {
                    toastr.error(data.errors[0] || 'Failed');
                }
                $scope.isLoading = false;
                window.location.reload();
            })
            .error(function (data) {
                toastr.error('Internal Server Error');
                $scope.errors = data.errors;
                $scope.progress = 0;
                $scope.isLoading = false;
            });
    }

    $scope.openReview = function (review) {
        populateRubrics(review)
        populateDisplayDocumentList(review)
        var test = populateDisplayDocumentList(review);
        $scope.peerReview = review

        if (review.isSecondLoop && review.oldReviewId) {
            reviews.every(function (r) {
                if (review.oldReviewId == r._id) {
                    populateRubrics(r)
                    populateDisplayDocumentList(r)
                    $scope.firstReview = r
                    return false
                }
                return true
            })
        }
        console.log(review);
        $('#viewReviewModal').modal('show');
    }

    populateRubrics = function (review) {
        if (review.peerReviewId.reviewSettings.rubrics && review.peerReviewId.reviewSettings.rubrics.length) {
            review.rubrics = review.peerReviewId.reviewSettings.rubrics
        }
    }


    function RemoveUnnecessaryWord(sentence) { // Remove all Unnecessary Words
        var commonWords = ["a", "-", "able", "about", "above", "according", "accordingly", "across", "actually", "after", "afterwards", "again", "against", "ain't", "all", "allow", "allows", "almost", "alone", "along", "already", "also", "although", "always", "am", "among", "amongst", "an", "and", "another", "any", "anybody", "anyhow", "anyone", "anything", "anyway", "anyways", "anywhere", "apart", "appear", "appreciate", "appropriate", "are", "aren't", "around", "as", "aside", "ask", "asking", "associated", "at", "available", "away", "awfully", "b", "be", "became", "because", "become", "becomes", "becoming", "been", "before", "beforehand", "behind", "being", "believe", "below", "beside", "besides", "best", "better", "between", "beyond", "both", "brief", "but", "by", "c", "c'mon", "c's", "came", "can", "can't", "cannot", "cant", "cause", "causes", "certain", "certainly", "changes", "clearly", "cm", "co", "com", "come", "comes", "concerning", "consequently", "consider", "considering", "contain", "containing", "contains", "corresponding", "could", "couldn't", "course", "currently", "d", "definitely", "described", "despite", "did", "didn't", "different", "do", "does", "doesn't", "doing", "don't", "done", "down", "downwards", "during", "e", "each", "edu", "eg", "eight", "either", "else", "elsewhere", "enough", "entirely", "especially", "et", "etc", "even", "ever", "every", "everybody", "everyone", "everything", "everywhere", "ex", "exactly", "example", "except", "f", "far", "few", "fifth", "first", "five", "followed", "following", "follows", "for", "former", "formerly", "forth", "four", "from", "further", "furthermore", "g", "get", "gets", "getting", "given", "gives", "go", "goes", "going", "gone", "got", "gotten", "greetings", "h", "had", "hadn't", "happens", "hardly", "has", "hasn't", "have", "haven't", "having", "he", "he's", "hello", "help", "hence", "her", "here", "here's", "hereafter", "hereby", "herein", "hereupon", "hers", "herself", "hi", "him", "himself", "his", "hither", "hopefully", "how", "howbeit", "however", "i", "i'd", "i'll", "i'm", "i've", "ie", "if", "ignored", "immediate", "in", "inasmuch", "inc", "indeed", "indicate", "indicated", "indicates", "inner", "insofar", "instead", "into", "inward", "is", "isn't", "it", "it'd", "it'll", "it's", "its", "itself", "j", "just", "k", "keep", "keeps", "kept", "know", "knows", "known", "kg", "l", "ln", "last", "lately", "later", "latter", "latterly", "least", "less", "lest", "let", "let's", "like", "liked", "likely", "little", "look", "looking", "looks", "ltd", "m", "mainly", "many", "may", "maybe", "me", "mean", "meanwhile", "merely", "might", "more", "moreover", "most", "mostly", "much", "must", "my", "myself", "n", "name", "namely", "nd", "near", "nearly", "necessary", "need", "needs", "neither", "never", "nevertheless", "new", "next", "nine", "no", "nobody", "non", "none", "noone", "nor", "normally", "not", "nothing", "novel", "now", "nowhere", "o", "obviously", "of", "off", "often", "oh", "ok", "okay", "old", "on", "once", "one", "ones", "only", "onto", "or", "other", "others", "otherwise", "ought", "our", "ours", "ourselves", "out", "outside", "over", "overall", "own", "p", "particular", "particularly", "per", "perhaps", "placed", "please", "plus", "possible", "presumably", "probably", "provides", "q", "que", "quite", "qv", "r", "rather", "rd", "re", "really", "reasonably", "regarding", "regardless", "regards", "relatively", "respectively", "right", "s", "said", "same", "saw", "say", "saying", "says", "second", "secondly", "see", "seeing", "seem", "seemed", "seeming", "seems", "seen", "self", "selves", "sensible", "sent", "serious", "seriously", "seven", "several", "shall", "she", "should", "shouldn't", "since", "six", "so", "some", "somebody", "somehow", "someone", "something", "sometime", "sometimes", "somewhat", "somewhere", "soon", "sorry", "specified", "specify", "specifying", "still", "sub", "such", "sup", "sure", "t", "t's", "take", "taken", "tell", "tends", "th", "than", "thank", "thanks", "thanx", "that", "that's", "thats", "the", "their", "theirs", "them", "themselves", "then", "thence", "there", "there's", "thereafter", "thereby", "therefore", "therein", "theres", "thereupon", "these", "they", "they'd", "they'll", "they're", "they've", "think", "third", "this", "thorough", "thoroughly", "those", "though", "three", "through", "throughout", "thru", "thus", "to", "together", "too", "took", "toward", "towards", "tried", "tries", "truly", "try", "trying", "twice", "two", "u", "un", "under", "unfortunately", "unless", "unlikely", "until", "unto", "up", "upon", "us", "use", "used", "useful", "uses", "using", "usually", "uucp", "v", "value", "various", "very", "via", "viz", "vs", "w", "want", "wants", "was", "wasn't", "way", "we", "we'd", "we'll", "we're", "we've", "welcome", "well", "went", "were", "weren't", "what", "what's", "whatever", "when", "whence", "whenever", "where", "where's", "whereafter", "whereas", "whereby", "wherein", "whereupon", "wherever", "whether", "which", "while", "whither", "who", "who's", "whoever", "whole", "whom", "whose", "why", "will", "willing", "wish", "with", "within", "without", "won't", "wonder", "would", "would", "wouldn't", "x", "y", "yes", "yet", "you", "you'd", "you'll", "you're", "you've", "your", "yours", "yourself", "yourselves", "z", "zero"];

        var wordArr = sentence,
            commonObj = {},
            uncommonArr = [],
            word, i;

        for (i = 0; i < commonWords.length; i++) {
            commonObj[commonWords[i].trim()] = true;
        }
        for (i = 0; i < wordArr.length; i++) {
            word = wordArr[i].trim().toLowerCase();
            if (!commonObj[word]) {
                uncommonArr.push(word);
            }
        }
        return uncommonArr;
    }

    function PDF_Reader(PDF_URL) {
        var pdf = PDFJS.getDocument(PDF_URL);
        return pdf.then(function (pdf) { // get all pages text
            var maxPages = pdf.pdfInfo.numPages;
            var countPromises = []; // collecting all page promises
            for (var j = 1; j <= maxPages; j++) {
                var page = pdf.getPage(j);
                var txt = "";
                countPromises.push(page.then(function (page) { // add page promise
                    var textContent = page.getTextContent();
                    return textContent.then(function (text) { // return content promise
                        return text.items.map(function (s) {
                            return s.str;
                        }).join(' '); // value page text 
                    });
                }));
            }

            // Wait for all pages and join text by new line
            return Promise.all(countPromises).then(function (texts) {
                return texts.join('\n');
            }).then(function (text) {

                //remove all special characters to lighten the doc 
                var linkedText = text
                    .replace(/[0-9]/g, "") //remove all Numbers
                    .replace(/[`~!@#$%^&*()_|+\=?;:'"‘’“”¤ˇ,.<>\{\}\[\]\\\/]/gi, '') //special characters
                    //.replace(/-|–/g, " ")
                    .replace(/–/g, " ")
                    //.replace(/(\b(\w{1,2})\b(\s|$))/g, '') //remove all charactors less then 2
                    .replace(/  +/g, ' ') // replace all multipule spaces with one
                //.replace(/ /g, "+"); //replaces spaces with + to pass it to the server

                globalPDF_Data = linkedText;

            }, function (reason) {
                console.error(reason);
            });
        });
    }

    function similarityComputation(solArray, userArray) {

        var ret = [];

        for (var i in solArray) { //to find same words
            if (userArray.indexOf(solArray[i]) > -1) {
                ret.push(solArray[i]);
            }
        }




        var uniqueList = ret.filter(function (allItems, i, a) //remove duplications
            {
                return i == a.indexOf(allItems);
            });




        var cleanUniqueArray = new Array();
        for (var i = 0; i < uniqueList.length; i++) { //cleaning array from empty elements
            if (uniqueList[i]) {
                cleanUniqueArray.push(uniqueList[i]);
            }
        }
        return cleanUniqueArray;
    };

    function objectToArray(obj) { //object To Array conversion
        var array = $.map(obj, function (value, index) {
            return [value];
        });
    }



    Object.size = function (object) {
        var size = 0,
            key;
        for (key in object) {
            if (object.hasOwnProperty(key)) size++;
        }
        return size;
    };

    populateDisplayDocumentList = function (review) {
        if (review.documents && review.documents.length > 0) {
            review.displayDocumentsList = [];
            _.each(review.documents, function (docName) {
                var temp = {};
                temp.link = window.location.origin + docName;
                var tempArr = docName.split('/');
                temp.name = tempArr[tempArr.length - 1];
                review.displayDocumentsList.push(temp);
            })
        }
    }
})