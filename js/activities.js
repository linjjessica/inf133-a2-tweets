function parseTweets(runkeeper_tweets) {
	//Do not proceed if no tweets loaded
	if(runkeeper_tweets === undefined) {
		window.alert('No tweets returned');
		return;
	}
	
	tweet_array = runkeeper_tweets.map(function(tweet) {
		return new Tweet(tweet.text, tweet.created_at);
	});

	tweet_array = runkeeper_tweets.map(function(tweet) {
		return new Tweet(tweet.text, tweet.created_at);
	});

    // Count frequency of each activity type
    const activityCounts = {};
    tweet_array.forEach(t => {
        const type = t.activityType;
        if (type !== 'unknown' && type !== '') {
            activityCounts[type] = (activityCounts[type] || 0) + 1;
        }
    });

    // Convert to array for sorting
    const activities = Object.keys(activityCounts).map(type => {
        return {
            activityType: type,
            count: activityCounts[type]
        };
    });

    activities.sort((a, b) => b.count - a.count);

    const numActivities = activities.length;
    const top3 = activities.slice(0, 3).map(a => a.activityType);
    const firstMost = top3[0];
    const secondMost = top3[1];
    const thirdMost = top3[2];

    document.getElementById('numberActivities').innerText = numActivities;
    document.getElementById('firstMost').innerText = firstMost;
    document.getElementById('secondMost').innerText = secondMost;
    document.getElementById('thirdMost').innerText = thirdMost;


	activity_vis_spec = {
	  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
	  "description": "A graph of the number of Tweets containing each type of activity.",
	  "data": {
	    "values": activities
	  },
      "mark": "bar",
      "encoding": {
        "x": {"field": "activityType", "type": "nominal", "sort": "-y", "title": "Activity Type"},
        "y": {"field": "count", "type": "quantitative", "title": "Count"}
      }
	};
	vegaEmbed('#activityVis', activity_vis_spec, {actions:false});

    // Distances by day of the week for top 3 activities
    const top3Tweets = tweet_array.filter(t => top3.includes(t.activityType) && t.distance > 0);
    
    // Prepare data for plot 2 and 3
    // We need day of week. tweet.time.getDay() returns 0-6 (Sun-Sat).
    // Let's map to strings "Sun", "Mon", etc.
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    
    // Calculate average distance per activity
    const avgDistances = {};
    top3.forEach(type => {
        const tweetsOfType = top3Tweets.filter(t => t.activityType === type);
        const totalDist = tweetsOfType.reduce((sum, t) => sum + t.distance, 0);
        avgDistances[type] = totalDist / tweetsOfType.length;
    });
    
    // Identify longest and shortest (of the top 3? or of all? Prompt says "Of these three activities")
    // Prompt: "Of these three activities, people tended to ... the longest distance and ... the shortest."
    const sortedByDist = top3.slice().sort((a, b) => avgDistances[b] - avgDistances[a]);
    const longestActivity = sortedByDist[0];
    const shortestActivity = sortedByDist[2];

    document.getElementById('longestActivityType').innerText = longestActivity;
    document.getElementById('shortestActivityType').innerText = shortestActivity;

    // Weekday vs Weekend analysis for the longest activity
    const longestActivityTweets = top3Tweets.filter(t => t.activityType === longestActivity);
    const weekdayTweets = longestActivityTweets.filter(t => {
        const day = t.time.getDay();
        return day >= 1 && day <= 5;
    });
    const weekendTweets = longestActivityTweets.filter(t => {
        const day = t.time.getDay();
        return day === 0 || day === 6;
    });

    const avgWeekday = weekdayTweets.reduce((sum, t) => sum + t.distance, 0) / weekdayTweets.length;
    const avgWeekend = weekendTweets.reduce((sum, t) => sum + t.distance, 0) / weekendTweets.length;

    document.getElementById('weekdayOrWeekendLonger').innerText = avgWeekend > avgWeekday ? "weekends" : "weekdays";


    // Plot 2: Distances by day of week
    const plot2Data = top3Tweets.map(t => ({
        day: days[t.time.getDay()],
        res_day: t.time.getDay(), // for sorting
        distance: t.distance,
        activityType: t.activityType
    }));

    const distance_vis_spec = {
        "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
        "description": "Distances by day of the week for top 3 activities",
        "data": { "values": plot2Data },
        "mark": "point",
        "encoding": {
            "x": {"field": "day", "type": "nominal", "sort": ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], "title": "Day of the Week"},
            "y": {"field": "distance", "type": "quantitative", "title": "Distance (miles)"},
            "color": {"field": "activityType", "type": "nominal", "legend": {"title": "Activity Type"}}
        }
    };
    vegaEmbed('#distanceVis', distance_vis_spec, {actions:false});

    // Plot 3: Aggregated means
    // We want mean distance per (day, activityType)
    // Vega-Lite can do aggregation for us!
    const distance_vis_agg_spec = {
        "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
        "description": "Mean distances by day of the week for top 3 activities",
        "data": { "values": plot2Data },
        "mark": "point",
        "encoding": {
            "x": {"field": "day", "type": "nominal", "sort": ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], "title": "Day of the Week"},
            "y": {"field": "distance", "aggregate": "mean", "type": "quantitative", "title": "Mean Distance (miles)"},
            "color": {"field": "activityType", "type": "nominal", "legend": {"title": "Activity Type"}}
        }
    };
    vegaEmbed('#distanceVisAggregated', distance_vis_agg_spec, {actions:false});
    
    // Initially hide the aggregated plot
    document.getElementById('distanceVisAggregated').style.display = 'none';

    // Toggle button
    const aggBtn = document.getElementById('aggregate');
    let showingAgg = false;
    aggBtn.onclick = function() {
        showingAgg = !showingAgg;
        if (showingAgg) {
            document.getElementById('distanceVis').style.display = 'none';
            document.getElementById('distanceVisAggregated').style.display = 'block';
            aggBtn.innerText = "Show all";
        } else {
             document.getElementById('distanceVis').style.display = 'block';
             document.getElementById('distanceVisAggregated').style.display = 'none';
             aggBtn.innerText = "Show means";
        }
    };
}

// Wait for the DOM to load
document.addEventListener('DOMContentLoaded', function (event) {
	loadSavedRunkeeperTweets().then(parseTweets);
});