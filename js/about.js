function parseTweets(runkeeper_tweets) {
	// Do not proceed if no tweets loaded
	// runkeeper_tweets is an array of raw JSON tweet objects
	if(runkeeper_tweets === undefined) {
		window.alert('No tweets returned');
		return;
	}

	// Create array of mapped runkeeper tweet objects of text and created_at 
	tweet_array = runkeeper_tweets.map(function(tweet) {
		return new Tweet(tweet.text, tweet.created_at);
	});
	
	// Sort tweets by time (ascending) to find earliest and latest
	tweet_array.sort((a, b) => a.time - b.time);
    
    // Tweet Dates
    if (tweet_array.length > 0) {
        const earliestTweet = tweet_array[0];
        const latestTweet = tweet_array[tweet_array.length - 1];
        
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        document.getElementById('firstDate').innerText = earliestTweet.time.toLocaleDateString('en-US', options);
        document.getElementById('lastDate').innerText = latestTweet.time.toLocaleDateString('en-US', options);
    }
    
	// Tweet Categories
    let completedCount = 0;
    let liveCount = 0;
    let achievementCount = 0;
    let miscCount = 0;
    let writtenCount = 0;
    
    tweet_array.forEach(tweet => {
        const source = tweet.source;
        if (source === 'completed_event') {
            completedCount++;
            if (tweet.written) {
                writtenCount++;
            }
        } else if (source === 'live_event') {
            liveCount++;
        } else if (source === 'achievement') {
            achievementCount++;
        } else {
            miscCount++;
        }
    });
    
    const totalTweets = tweet_array.length;
    
    // Update Counts
    document.querySelectorAll('.completedEvents').forEach(el => el.innerText = completedCount);
    document.querySelectorAll('.liveEvents').forEach(el => el.innerText = liveCount);
    document.querySelectorAll('.achievements').forEach(el => el.innerText = achievementCount);
    document.querySelectorAll('.miscellaneous').forEach(el => el.innerText = miscCount);
    document.querySelectorAll('.written').forEach(el => el.innerText = writtenCount);
    
    // Update Percentages
    function formatPct(count, total) {
        let pct = (count / total) * 100;
        return math.format(pct, {notation: 'fixed', precision: 2}) + '%';
    }
    
    document.querySelectorAll('.completedEventsPct').forEach(el => el.innerText = formatPct(completedCount, totalTweets));
    document.querySelectorAll('.liveEventsPct').forEach(el => el.innerText = formatPct(liveCount, totalTweets));
    document.querySelectorAll('.achievementsPct').forEach(el => el.innerText = formatPct(achievementCount, totalTweets));
    document.querySelectorAll('.miscellaneousPct').forEach(el => el.innerText = formatPct(miscCount, totalTweets));
    
    // Written percentage of completed events
    // "Of the [completed] of Tweets of completed events, [written] ([Pct]) included user-written text."
    // So percentage is written / completedCount, NOT totalTweets
    document.querySelectorAll('.writtenPct').forEach(el => {
        let pct = (writtenCount / completedCount) * 100;
        el.innerText = math.format(pct, {notation: 'fixed', precision: 2}) + '%';
    });
    
	// This line modifies the DOM, searching for the tag with the numberTweets ID and updating the text.
	document.getElementById('numberTweets').innerText = tweet_array.length;	
}

// Wait for the DOM to load
document.addEventListener('DOMContentLoaded', function (event) {
	loadSavedRunkeeperTweets().then(parseTweets);
});