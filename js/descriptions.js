let written_tweets = [];

function getSentiment(text) {
    // Simple sentiment analysis using a hardcoded list of words
    const positiveWords = new Set(["love", "great", "good", "happy", "awesome", "fantastic", "amazing", "fun", "excited", "best", "proud", "nice", "wonderful", "beautiful", "excellent"]);
    const negativeWords = new Set(["bad", "hate", "terrible", "awful", "worst", "sad", "pain", "tired", "hurt", "difficult", "hard", "boring", "slow", "annoying", "sucks"]);

    const cleanText = text.toLowerCase();
    // Remove punctuation for better matching
    const words = cleanText.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"").split(/\s+/);

    let score = 0;
    words.forEach(word => {
        if (positiveWords.has(word)) {
            score++;
        } else if (negativeWords.has(word)) {
            score--;
        }
    });

    if (score > 0) {
        return "positive";
    } else if (score < 0) {
        return "negative";
    }
    return "neutral";
}

function parseTweets(runkeeper_tweets) {
	//Do not proceed if no tweets loaded
	if(runkeeper_tweets === undefined) {
		window.alert('No tweets returned');
		return;
	}
	
	tweet_array = runkeeper_tweets.map(function(tweet) {
		return new Tweet(tweet.text, tweet.created_at);
	});
    written_tweets = tweet_array.filter(t => t.written);

    // Inject Sentiment Header if not present
    const headerRow = document.querySelector('.table thead tr');
    if (headerRow && headerRow.children.length === 3) {
        const sentimentTh = document.createElement('th');
        sentimentTh.scope = "col";
        sentimentTh.innerText = "Sentiment";
        // Insert before the last column (Tweet)
        headerRow.insertBefore(sentimentTh, headerRow.lastElementChild);
    }
}

function addEventHandlerForSearch() {
	// Search the written tweets as text is entered into the search box, and add them to the table
    const searchInput = document.getElementById('textFilter');
    const searchCountSpan = document.getElementById('searchCount');
    const searchTextSpan = document.getElementById('searchText');
    const tweetTableBody = document.getElementById('tweetTable');

    searchInput.addEventListener('input', (event) => {
        const query = (event.target.value || "").toLowerCase();
        
        searchTextSpan.innerText = event.target.value;
        
        // Clear table and counts if empty
        if (query === "") {
            searchCountSpan.innerText = 0;
            tweetTableBody.innerHTML = "";
            return;
        }

        // Filter tweets
        const matchedTweets = written_tweets.filter(t => t.text.toLowerCase().includes(query));
        
        searchCountSpan.innerText = matchedTweets.length;
        
        // Populate Table
        let tableHTML = "";
        matchedTweets.forEach((t, index) => {
            const rawRow = t.getHTMLTableRow(index + 1);
            const sentiment = getSentiment(t.text);
            
            let sentimentColor = "black";
            if (sentiment === "positive") {
                sentimentColor = "green";
            } else if (sentiment === "negative") {
                sentimentColor = "red";
            }
            const sentimentCell = `<td style="color:${sentimentColor};">${sentiment}</td>`;
            
            // Insert sentiment cell before the last <td> (Tweet text)
            // Raw row is <tr><th>...</th><td>Type</td><td>Text</td></tr>
            // We want <tr><th>...</th><td>Type</td><td sent>...</td><td>Text</td></tr>
            
            // Replace the last <td> with sentiment cell + last <td>
            const lastTdIndex = rawRow.lastIndexOf("<td>");
            const newRow = rawRow.substring(0, lastTdIndex) + sentimentCell + rawRow.substring(lastTdIndex);
            
            tableHTML += newRow;
        });
        tweetTableBody.innerHTML = tableHTML;
    });
}

// Wait for the DOM to load
document.addEventListener('DOMContentLoaded', function (event) {
	addEventHandlerForSearch();
	loadSavedRunkeeperTweets().then(parseTweets);
});