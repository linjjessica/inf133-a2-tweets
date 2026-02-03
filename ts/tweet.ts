class Tweet {
	private text:string;
	time:Date;

	constructor(tweet_text:string, tweet_time:string) {
        this.text = tweet_text;
		this.time = new Date(tweet_time);//, "ddd MMM D HH:mm:ss Z YYYY"
	}

	// Returns either 'live_event', 'achievement', 'completed_event', or 'miscellaneous'
    get source():string {
        if (this.text.startsWith("Just completed") || this.text.startsWith("Just posted")) {
            return "completed_event";
        } else if (this.text.startsWith("Watch my run")) {
            return "live_event";
        } else if (this.text.startsWith("Achieved a new personal record")) {
            return "achievement";
        }
        return "miscellaneous";
    }

    // Returns a boolean, whether the text includes any content written by the person tweeting.
    get written():boolean {
        if (this.source != 'completed_event') {
            return false;
        }
        // Remove the standard prefixes
        let cleanText = this.text;
        if (cleanText.startsWith("Just completed")) {
             // "Just completed a [distance] [activity] - " or "Just completed a [distance] [activity] with @Runkeeper"

             // Returns true for the " - " pattern which typically indicates user added their own message
             if (cleanText.includes(" - ")) {
                 return true;
             }

             // Returns false if the tweet includes "with @Runkeeper. Check it out!" (default text)
             if (cleanText.includes("with @Runkeeper. Check it out!")) {
                 return false;
             }
             
             return false;

        } else if (cleanText.startsWith("Just posted")) {
            // "Just posted a 10.34 km run - New PB on this route \ud83d\ude42 https://t.co/7cGHlhEIlW #Runkeeper"
             if (cleanText.includes(" - ")) {
                 return true;
             }
             
             if (cleanText.includes("with @Runkeeper. Check it out!")) {
                 return false;
             }
        }
        
        return false;
    }

    get activityType():string {
        if (this.source != 'completed_event') {
            return "unknown";
        }
        // Parse the activity type from the text of the tweet
        // Example: "Just completed a 10.34 km run - ..."
        // Example: "Just posted a 10.34 km run - ..."
        
        // Remove the prefix
        let text = this.text;
        if (text.startsWith("Just completed a ")) {
            text = text.substring("Just completed a ".length);
        } else if (text.startsWith("Just posted a ")) {
            text = text.substring("Just posted a ".length);
        } else {
            return "unknown";
        }

        // The format is now "[distance] [unit] [activity] - ..." or "[distance] [unit] [activity] with ..."
        // Sometimes it might just be "[activity] - ..." for non-distance activities 

        const parts = text.split(" ");
        if (parts.length < 2) {
             return "unknown"; 
        }

        let activity = "";
        const unit = parts[1].toLowerCase();

        // If not km/mi, this is NOT in the "[distance] [unit] [activity]" format.
        // Return a reasonable activity type instead of misparsing.
        if (!(unit.startsWith("km") || unit.startsWith("mi"))) {
            // Handle cases like:
            // "stairmaster / stepwell workout in 30:00  - ..."
            // Take everything up to " workout in " or up to " - " as the activity type.

            const workoutIn = text.indexOf(" workout in ");
            const dash = text.indexOf(" - ");
            const withIdx = text.indexOf(" with @Runkeeper");

            const withRunkeeper = text.indexOf(" with Runkeeper");

            if (workoutIn !== -1) {
                activity = text.substring(0, workoutIn).trim();
            } else if (dash !== -1) {
                activity = text.substring(0, dash).trim();
            } else if (withIdx !== -1) {
                activity = text.substring(0, withIdx).trim();
            } else if (withRunkeeper !== -1) {
                activity = text.substring(0, withRunkeeper).trim();
            } else {
                activity = parts[0].trim();
            }
        } else {
            // parts[0] is distance, parts[1] is unit. 
            // parts[2] and onwards is activity until " - " or " with"
            
            // Find where the activity name ends.
            // It ends at " - " or " with @Runkeeper" or " with Runkeeper"
            
            // Reconstruct the string starting from parts[2]
            // Safe check for parts length
             if (parts.length >= 3) {
                let remaining = text.substring(parts[0].length + 1 + parts[1].length + 1);
                
                // Find potential end indices
                const dashIndex = remaining.indexOf(" - ");
                const withAtIndex = remaining.indexOf(" with @Runkeeper");
                const withRunkeeperIndex = remaining.indexOf(" with Runkeeper");
                
                let endIndex = -1;
                let indices = [dashIndex, withAtIndex, withRunkeeperIndex].filter(i => i !== -1);
                
                if (indices.length > 0) {
                    endIndex = Math.min(...indices);
                }

                if (endIndex !== -1) {
                    activity = remaining.substring(0, endIndex);
                } else {
                    // Fallback for when it's just the rest of the string
                    activity = remaining;
                }
             } else {
                 return "unknown";
             }
        }

        // Remove " in [digit]" (e.g. "run in 20:00")
        const inMatch = activity.search(/ in \d/);
        if (inMatch !== -1) {
            activity = activity.substring(0, inMatch);
        }
        
        return activity.trim();
    }

    get distance():number {
        if(this.source != 'completed_event') {
            return 0;
        }
        
        // Parse the distance from the text of the tweet
        let text = this.text;
        if (text.startsWith("Just completed a ")) {
            text = text.substring("Just completed a ".length);
        } else if (text.startsWith("Just posted a ")) {
             text = text.substring("Just posted a ".length);
        } else {
             return 0;
        }
        
        const parts = text.split(" ");
        if (parts.length < 2) {
            return 0;
        }
        
        const unit = parts[1].toLowerCase();

        // If it's not explicitly km/mi, it's not a distance-based tweet → distance = 0
        if (!(unit.startsWith("km") || unit.startsWith("mi"))) {
            return 0;
        }

        const distVal = parseFloat(parts[0]);
        if (isNaN(distVal)) {
            return 0;
        }

        if (unit.startsWith("km")) {
            return distVal / 1.609;
        } else if (unit.startsWith("mi")) {
            return distVal;
        }
        
        return 0;
    }



    getHTMLTableRow(rowNumber:number):string {
        // Return a table row which summarizes the tweet with a clickable link to the RunKeeper activity
        
        // Parse links in text
        // Regex to match URLs (simple version)
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        
        const linkedText = this.text.replace(urlRegex, (url) => {
            return `<a href="${url}">${url}</a>`;
        });

        return `<tr>
            <th scope="row">${rowNumber}</th>
            <td>${this.activityType}</td>
            <td>${linkedText}</td>
        </tr>`;
    }
}